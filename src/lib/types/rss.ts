import type { DBSchema } from 'idb';

export interface NormalizedRSSChannel {
	title: string;
	description: string;
	link: string;
	language?: string;
	pubDate?: string;
	lastBuildDate?: string;
	image?: string;
}

export interface NormalizedRSSItem {
	title: string;
	description: string;
	link: string;
	pubDate: string;
	author?: string;
	category?: string | string[];
	image?: string;
	guid?: string;
}

export interface NormalizedRSSFeed {
	data: NormalizedRSSChannel;
	items: NormalizedRSSItem[];
}

// API Response types
export interface RSSFeedSuccessResponse {
	success: true;
	data: NormalizedRSSFeed;
}

export interface RSSFeedErrorResponse {
	success: false;
	error: string;
}

export type RSSFeedResponse = RSSFeedSuccessResponse | RSSFeedErrorResponse;

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

export interface RSSDatabase extends DBSchema {
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
