import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { NormalizedRSSFeed, NormalizedRSSItem, NormalizedRSSChannel } from '$lib/types/rss';

export interface DBChannel extends NormalizedRSSChannel {
	savedAt: number;
}

export interface DBItem extends NormalizedRSSItem {
	id: string;
	channelId: string;
	savedAt: number;
	read: boolean;
	closed: boolean;
	favourite: boolean;
}

interface RSSDatabase extends DBSchema {
	channels: {
		key: string;
		value: DBChannel;
	};
	items: {
		key: string;
		value: DBItem;
		indexes: { 'by-channel': string };
	};
}

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
		}
	});
}

export async function saveFeedToDB(feed: NormalizedRSSFeed) {
	const db = await getDB();
	const tx = db.transaction(['channels', 'items'], 'readwrite');
	const channelStore = tx.objectStore('channels');
	const itemStore = tx.objectStore('items');

	const timestamp = Date.now();

	// --- Save Channel ---
	const channelData: DBChannel = {
		...feed.data,
		savedAt: timestamp
	};

	await channelStore.put(channelData);

	// --- Save Items ---
	const operations = feed.items.map(async (item) => {
		const itemId = item.guid || item.link;
		const channelId = feed.data.link;

		const existingItem = await itemStore.get(itemId);

		if (!existingItem) {
			const newItem: DBItem = {
				...item,
				id: itemId,
				channelId: channelId,
				savedAt: timestamp,
				read: false,
				closed: false,
				favourite: false
			};
			return itemStore.add(newItem);
		} else {
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
