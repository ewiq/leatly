import { getAllItems, getAllChannels } from '$lib/db/db';
import type { PageLoad } from './$types';
import type { UIItem } from '$lib/types/rss';

export const ssr = false;

export const load: PageLoad = async ({ url, depends }) => {
	depends('app:feed');

	const searchQuery = url.searchParams.get('q') || '';

	const [items, channels] = await Promise.all([getAllItems(), getAllChannels()]);

	const channelMap = new Map(channels.map((c) => [c.link, c]));

	const nonClosedItems = items.filter((item) => !item.closed);

	// Add channel title and channel img to items
	const enrichedItems: UIItem[] = nonClosedItems.map((item) => {
		const channel = channelMap.get(item.channelId);
		return {
			...item,
			channelTitle: channel ? channel.title : 'Unknown Feed',
			channelImage: channel ? channel.image : undefined
		};
	});

	const sortedItems = enrichedItems.sort((a, b) => {
		const dateA = a.pubDate ? new Date(a.pubDate).getTime() : a.savedAt;
		const dateB = b.pubDate ? new Date(b.pubDate).getTime() : b.savedAt;
		return dateB - dateA;
	});

	return {
		items: sortedItems,
		searchQuery
	};
};
