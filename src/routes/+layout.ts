import { getAllItems, getAllChannels, getAllCollections } from '$lib/db/db';
import type { LayoutLoad } from './$types';
import type { UIItem, DBChannel } from '$lib/types/rss';

export const ssr = false;

export const load: LayoutLoad = async ({ url, depends }) => {
	depends('app:feed');

	const searchQuery = url.searchParams.get('q') || '';
	const feedFilter = url.searchParams.get('feed');
	const collectionFilter = url.searchParams.get('collection');
	const favFilter = url.searchParams.get('favs');

	const [items, channels, collections] = await Promise.all([
		getAllItems(),
		getAllChannels(),
		getAllCollections()
	]);

	const channelMap = new Map<string, DBChannel>(channels.map((c) => [c.link, c]));
	const nonClosedItems = items.filter((item) => !item.closed);

	// Enrich items: Add channel title and channel img to items
	const enrichedItems: UIItem[] = nonClosedItems.map((item) => {
		const channel = channelMap.get(item.channelId);
		return {
			...item,
			channelTitle: channel ? channel.customTitle || channel.title : 'Unknown Feed',
			channelImage: channel ? channel.image : undefined
		};
	});

	// Initial Filtering (Search, Feed, Collection)
	let filteredItems = enrichedItems;

	if (feedFilter) {
		// TODO (later): FILTER ITEMS HERE??
		// filteredItems = filteredItems.filter((item) => item.channelId === feedFilter);
	} else if (collectionFilter) {
		// TODO (later): FILTER ITEMS HERE??
		// filteredItems = filteredItems.filter((item) => {
		// 	const channel = channelMap.get(item.channelId);
		// 	return channel?.collectionIds?.includes(collectionFilter);
		// });
	}

	// Deduplicate items & main feed visibility rules
	// Only apply deduplication and 'hideOnMainFeed' logic if we are viewing the aggregated Main Feed.
	const isAggregatedView = !feedFilter && !collectionFilter && !favFilter;

	let processedItems = filteredItems;

	if (isAggregatedView) {
		const itemsByLink = new Map<string, UIItem[]>();

		filteredItems.forEach((item) => {
			const channel = channelMap.get(item.channelId);

			// Skip items if the channel is hidden from main view
			if (channel?.hideOnMainFeed) {
				return;
			}

			const key = item.link;
			if (!itemsByLink.has(key)) {
				itemsByLink.set(key, []);
			}
			itemsByLink.get(key)!.push(item);
		});

		processedItems = Array.from(itemsByLink.values()).map((duplicates) => {
			if (duplicates.length === 1) {
				return duplicates[0];
			}
			return duplicates.sort((a, b) => b.savedAt - a.savedAt)[0];
		});
	}

	// Filter by favourites
	if (favFilter) {
		processedItems = processedItems.filter((item) => item.favourite);
	}

	// Search filtering
	if (searchQuery) {
		// TODO (later): FILTER ITEMS HERE??
	}

	// Sort by publication date
	const sortedItems = processedItems.sort((a, b) => {
		const dateA = a.pubDate ? new Date(a.pubDate).getTime() : a.savedAt;
		const dateB = b.pubDate ? new Date(b.pubDate).getTime() : b.savedAt;
		return dateB - dateA;
	});

	return {
		items: sortedItems,
		channels,
		collections,
		searchQuery,
		activeCollection: collectionFilter,
		activeFeed: feedFilter
	};
};
