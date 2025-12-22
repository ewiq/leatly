export interface YouTubeTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
	token_type: string;
}

export interface YouTubeThumbnail {
	url: string;
	width: number;
	height: number;
}

export interface YouTubeThumbnails {
	default: YouTubeThumbnail;
	medium: YouTubeThumbnail;
	high: YouTubeThumbnail;
	standard?: YouTubeThumbnail;
	maxres?: YouTubeThumbnail;
}

export interface YouTubeSubscriptionSnippet {
	publishedAt: string;
	title: string;
	description: string;
	resourceId: {
		kind: string;
		channelId: string;
	};
	channelId: string;
	thumbnails: YouTubeThumbnails;
}

export interface YouTubeSubscriptionContentDetails {
	totalItemCount: number;
	newItemCount: number;
	activityType: string;
}

export interface YouTubeSubscription {
	kind: string;
	etag: string;
	id: string;
	snippet: YouTubeSubscriptionSnippet;
	contentDetails?: YouTubeSubscriptionContentDetails;
}

export interface YouTubeSubscriptionsResponse {
	kind: string;
	etag: string;
	nextPageToken?: string;
	prevPageToken?: string;
	pageInfo: {
		totalResults: number;
		resultsPerPage: number;
	};
	items: YouTubeSubscription[];
}
