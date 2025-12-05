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
