import { openDB, type IDBPDatabase } from 'idb';
import type {
	DBChannel,
	DBCollection,
	DBItem,
	NormalizedRSSFeed,
	RSSDatabase
} from '$lib/types/rss';
import { generateItemId } from '$lib/utils/itemId';
import { normalizeText } from '$lib/utils/searchUtils';

const DB_NAME = 'rss-reader-db';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<RSSDatabase>> {
	return openDB<RSSDatabase>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			// Create Channels Store
			if (!db.objectStoreNames.contains('channels')) {
				db.createObjectStore('channels', { keyPath: 'link' });
			}

			// Create Items Store
			if (!db.objectStoreNames.contains('items')) {
				const itemStore = db.createObjectStore('items', { keyPath: 'id' });
				itemStore.createIndex('by-channel', 'channelId');
			}

			// Create Collections Store
			if (!db.objectStoreNames.contains('collections')) {
				db.createObjectStore('collections', { keyPath: 'id' });
			}
		}
	});
}

export async function saveFeedToDB(feed: NormalizedRSSFeed, sourceUrl: string) {
	const db = await getDB();
	const tx = db.transaction(['channels', 'items'], 'readwrite');
	const channelStore = tx.objectStore('channels');
	const itemStore = tx.objectStore('items');

	const timestamp = Date.now();
	const channelId = feed.data.link;

	const existingChannel = await channelStore.get(channelId);

	// Preserve user settings
	const updatedChannel: DBChannel = {
		...feed.data,
		savedAt: timestamp,
		feedUrl: sourceUrl,
		collectionIds: existingChannel?.collectionIds ?? [],
		hideOnMainFeed: existingChannel?.hideOnMainFeed ?? false,
		customTitle: existingChannel?.customTitle
	};

	// Save Channel
	await channelStore.put(updatedChannel);

	// --- Save Items (Upsert Strategy)---
	const operations = feed.items.map(async (item) => {
		const itemId = generateItemId(item, channelId);
		const existingItem = await itemStore.get(itemId);
		const searchTokens = createSearchTokens(item);

		if (!existingItem) {
			const newItem: DBItem = {
				...item,
				id: itemId,
				channelId: channelId,
				savedAt: timestamp,
				read: false,
				closed: false,
				favourite: false,
				_searchTokens: searchTokens
			};
			return itemStore.put(newItem);
		} else {
			// Update if existing but content has changed
			const hasContentChanged =
				existingItem.title !== item.title ||
				existingItem.description !== item.description ||
				existingItem.image !== item.image;

			if (hasContentChanged) {
				const updatedItem: DBItem = {
					...existingItem,
					title: item.title,
					description: item.description,
					link: item.link,
					pubDate: item.pubDate,
					author: item.author,
					category: item.category,
					image: item.image,
					_searchTokens: searchTokens
				};
				return itemStore.put(updatedItem);
			}

			return Promise.resolve();
		}
	});

	await Promise.all(operations);
	await tx.done;
}

export async function getAllItems(): Promise<DBItem[]> {
	const db = await getDB();
	return db.getAll('items');
}

export async function getAllChannels(): Promise<DBChannel[]> {
	const db = await getDB();
	return db.getAll('channels');
}

export async function deleteChannel(channelId: string) {
	const db = await getDB();
	const tx = db.transaction(['channels', 'items'], 'readwrite');
	const channelStore = tx.objectStore('channels');
	const itemStore = tx.objectStore('items');

	await channelStore.delete(channelId);

	const index = itemStore.index('by-channel');
	let cursor = await index.openCursor(IDBKeyRange.only(channelId));

	while (cursor) {
		await cursor.delete();
		cursor = await cursor.continue();
	}

	await tx.done;
}

export async function updateItem(itemId: string, updates: Partial<DBItem>) {
	const db = await getDB();
	const tx = db.transaction('items', 'readwrite');
	const store = tx.objectStore('items');

	const item = await store.get(itemId);
	if (item) {
		const updatedItem = { ...item, ...updates };
		await store.put(updatedItem);
	}
	await tx.done;
}

// --- Collection Management ---
export async function getAllCollections(): Promise<DBCollection[]> {
	const db = await getDB();
	return db.getAll('collections');
}

export async function createCollection(name: string) {
	const db = await getDB();
	const newCollection: DBCollection = {
		id: crypto.randomUUID(),
		name,
		createdAt: Date.now()
	};
	await db.put('collections', newCollection);
}

export async function deleteCollection(collectionId: string) {
	const db = await getDB();
	const tx = db.transaction(['collections', 'channels'], 'readwrite');

	await tx.objectStore('collections').delete(collectionId);

	const channelStore = tx.objectStore('channels');
	let cursor = await channelStore.openCursor();

	while (cursor) {
		const channel = cursor.value;
		if (channel.collectionIds && channel.collectionIds.includes(collectionId)) {
			const updatedChannel = {
				...channel,
				collectionIds: channel.collectionIds.filter((id) => id !== collectionId)
			};
			await cursor.update(updatedChannel);
		}
		cursor = await cursor.continue();
	}

	await tx.done;
}

// --- Channel Metadata Management ---
export async function updateChannelSettings(
	channelId: string,
	updates: {
		customTitle?: string;
		hideOnMainFeed?: boolean;
		collectionIds?: string[];
	}
) {
	const db = await getDB();
	const tx = db.transaction('channels', 'readwrite');
	const store = tx.objectStore('channels');

	const channel = await store.get(channelId);
	if (channel) {
		// Apply updates, fallback to existing if undefined
		const updatedChannel: DBChannel = {
			...channel,
			customTitle: updates.customTitle !== undefined ? updates.customTitle : channel.customTitle,
			hideOnMainFeed:
				updates.hideOnMainFeed !== undefined ? updates.hideOnMainFeed : channel.hideOnMainFeed,
			collectionIds:
				updates.collectionIds !== undefined ? updates.collectionIds : channel.collectionIds || []
		};

		await store.put(updatedChannel);
	}
	await tx.done;
}

export async function toggleChannelCollection(
	channelId: string,
	collectionId: string,
	addToCollection: boolean
) {
	const db = await getDB();
	const channel = await db.get('channels', channelId);

	if (channel) {
		const currentCollections = new Set(channel.collectionIds || []);
		if (addToCollection) {
			currentCollections.add(collectionId);
		} else {
			currentCollections.delete(collectionId);
		}

		await updateChannelSettings(channelId, { collectionIds: Array.from(currentCollections) });
	}
}

function createSearchTokens(item: any): string {
	return normalizeText(
		[
			item.title,
			item.description,
			item.author,
			Array.isArray(item.category) ? item.category.join(' ') : item.category
		].join(' ')
	);
}
