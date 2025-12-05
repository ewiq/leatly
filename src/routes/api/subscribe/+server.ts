import type { NormalizedRSSFeed } from '$lib/types/rss';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { XMLParser } from 'fast-xml-parser';
import { htmlToText } from 'html-to-text';

// Validation helper functions
function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function isValidXML(xmlText: string): boolean {
	if (!xmlText.trim().startsWith('<')) {
		return false;
	}

	const hasXmlDeclaration = xmlText.includes('<?xml');
	const hasRssTag =
		xmlText.includes('<rss') || xmlText.includes('<feed') || xmlText.includes('<rdf:RDF');

	return hasXmlDeclaration || hasRssTag;
}

function isValidRSSStructure(parsedData: any): { valid: boolean; error?: string } {
	if (parsedData.rss) {
		if (!parsedData.rss.channel) {
			return { valid: false, error: 'RSS feed missing required <channel> element' };
		}
		const channel = parsedData.rss.channel;
		if (!channel.title || !channel.link) {
			return { valid: false, error: 'RSS channel missing required title or link' };
		}
		return { valid: true };
	}

	if (parsedData.feed) {
		if (!parsedData.feed.title) {
			return { valid: false, error: 'Atom feed missing required <title> element' };
		}
		return { valid: true };
	}

	if (parsedData['rdf:RDF']) {
		const rdf = parsedData['rdf:RDF'];
		if (!rdf.channel) {
			return { valid: false, error: 'RDF feed missing required <channel> element' };
		}
		return { valid: true };
	}

	return { valid: false, error: 'Unrecognized feed format. Must be RSS 2.0, Atom, or RDF' };
}

function validateContentType(contentType: string | null): { valid: boolean; error?: string } {
	if (!contentType) {
		return { valid: true };
	}

	const validTypes = [
		'application/rss+xml',
		'application/xml',
		'text/xml',
		'application/atom+xml',
		'application/rdf+xml',
		'text/plain'
	];

	const lowerContentType = contentType.toLowerCase();
	const isValid = validTypes.some((type) => lowerContentType.includes(type));

	if (!isValid) {
		return {
			valid: false,
			error: `Invalid content type: ${contentType}. Expected RSS/XML content.`
		};
	}

	return { valid: true };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		if (!url) {
			return json({ success: false, error: 'URL is required' }, { status: 400 });
		}

		if (!isValidUrl(url)) {
			return json(
				{ success: false, error: 'Invalid URL format. Must be a valid HTTP or HTTPS URL.' },
				{ status: 400 }
			);
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		let response: Response;
		try {
			response = await fetch(url, {
				signal: controller.signal,
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)'
				}
			});
		} catch (fetchError: any) {
			clearTimeout(timeoutId);
			if (fetchError.name === 'AbortError') {
				return json(
					{ success: false, error: 'Request timeout. The RSS feed took too long to respond.' },
					{ status: 504 }
				);
			}
			return json(
				{ success: false, error: `Failed to fetch URL: ${fetchError.message}` },
				{ status: 502 }
			);
		}
		clearTimeout(timeoutId);

		if (!response.ok) {
			return json(
				{
					success: false,
					error: `Failed to fetch RSS feed: ${response.status} ${response.statusText}`
				},
				{ status: response.status }
			);
		}

		const contentType = response.headers.get('content-type');
		const contentTypeValidation = validateContentType(contentType);
		if (!contentTypeValidation.valid) {
			return json({ success: false, error: contentTypeValidation.error }, { status: 400 });
		}

		const xmlText = await response.text();

		if (!xmlText || xmlText.trim().length === 0) {
			return json({ success: false, error: 'RSS feed returned empty content' }, { status: 400 });
		}

		if (!isValidXML(xmlText)) {
			return json(
				{ success: false, error: 'Invalid XML format. Content does not appear to be XML.' },
				{ status: 400 }
			);
		}

		// Modified parser options - DON'T transform tag names to preserve case
		const options = {
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
			allowBooleanAttributes: true,
			parseTagValue: true,
			parseAttributeValue: true,
			trimValues: true,
			ignoreDeclaration: true,
			ignorePiTags: true,
			processEntities: true,
			htmlEntities: true,
			stopNodes: [],
			alwaysCreateTextNode: false,
			isArray: (name: string, jpath: string) => {
				const arrayPaths = [
					'rss.channel.item',
					'rss.channel.item.category',
					'rdf:RDF.item',
					'rdf:RDF.item.category',
					'feed.entry',
					'feed.entry.category'
				];
				return arrayPaths.includes(jpath);
			}
			// Removed transformTagName and transformAttributeName to preserve original case
		};

		const parser = new XMLParser(options);
		let parsedResult: any;

		try {
			parsedResult = parser.parse(xmlText);
		} catch (parseError: any) {
			return json(
				{
					success: false,
					error: `XML parsing failed: ${parseError.message || 'Invalid XML structure'}`
				},
				{ status: 400 }
			);
		}

		const structureValidation = isValidRSSStructure(parsedResult);
		if (!structureValidation.valid) {
			return json({ success: false, error: structureValidation.error }, { status: 400 });
		}

		const normalizedFeed = normalizeRSSFeed(parsedResult);

		if (!normalizedFeed.data.title && !normalizedFeed.data.link) {
			return json(
				{
					success: false,
					error: 'RSS feed does not contain minimum required data (title or link)'
				},
				{ status: 400 }
			);
		}

		return json({
			success: true,
			data: normalizedFeed
		});
	} catch (error) {
		console.error('Error processing RSS feed:', error);
		return json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : 'Unknown error occurred while processing feed'
			},
			{ status: 500 }
		);
	}
};

// Helper to extract text from potentially complex structures
function extractText(value: any): string {
	if (!value) return '';
	if (typeof value === 'string') return value;
	if (value['#text']) return value['#text'];
	if (typeof value === 'object' && !Array.isArray(value)) {
		return Object.values(value).find((v) => typeof v === 'string') || '';
	}
	return String(value);
}

// Helper to extract link from various formats
function extractLink(linkData: any): string {
	if (!linkData) return '';

	// If it's a string, return it
	if (typeof linkData === 'string') return linkData;

	// If it's an array, find the first valid link
	if (Array.isArray(linkData)) {
		for (const item of linkData) {
			if (typeof item === 'string') return item;
			if (item['@_href']) return item['@_href'];
		}
		return '';
	}

	// If it's an object with href attribute
	if (linkData['@_href']) return linkData['@_href'];

	return '';
}

// Helper to extract image URL
function extractImageUrl(imageData: any): string | undefined {
	if (!imageData) return undefined;

	if (typeof imageData === 'string') return imageData;
	if (imageData.url) return imageData.url;
	if (imageData['@_href']) return imageData['@_href'];

	return undefined;
}

// Helper function to extract image from various sources
function extractImageFromItem(item: any): string | undefined {
	// Try media:content first (NYTimes, media RSS)
	if (item['media:content']) {
		const mediaContent = item['media:content'];
		if (mediaContent['@_url']) return mediaContent['@_url'];
		if (Array.isArray(mediaContent)) {
			const imageMedia = mediaContent.find((m: any) => m['@_medium'] === 'image' || m['@_url']);
			if (imageMedia?.['@_url']) return imageMedia['@_url'];
		}
	}

	// Try enclosure (common for podcasts and media)
	if (item.enclosure && item.enclosure['@_type']?.startsWith('image/')) {
		return item.enclosure['@_url'];
	}

	// Try media:thumbnail
	if (item['media:thumbnail']?.['@_url']) {
		return item['media:thumbnail']['@_url'];
	}

	// Try itunes:image (podcasts)
	if (item['itunes:image']?.['@_href']) {
		return item['itunes:image']['@_href'];
	}

	// Extract image from description HTML before it gets converted to text
	if (item.description) {
		const desc = extractText(item.description);
		const imgRegex = /<img[^>]+src="([^">]+)"/i;
		const match = imgRegex.exec(desc);
		if (match?.[1]) {
			return match[1];
		}
	}

	return undefined;
}

function extractCategories(item: any): string | string[] | undefined {
	if (!item.category) return undefined;

	if (Array.isArray(item.category)) {
		return item.category.map((cat: any) => {
			if (typeof cat === 'string') return cat;
			if (cat['#text']) return cat['#text'];
			if (cat['@_term']) return cat['@_term'];
			return String(cat);
		});
	} else if (typeof item.category === 'object') {
		if (item.category['#text']) return item.category['#text'];
		if (item.category['@_term']) return item.category['@_term'];
	}

	return String(item.category);
}

// Helper to extract description without media descriptions
function extractDescription(item: any): string {
	// First try regular description
	let description = extractText(item.description);

	// If no description, try content:encoded
	if (!description) {
		description = extractText(item['content:encoded']);
	}

	// If still no description, try summary
	if (!description) {
		description = extractText(item.summary);
	}

	// Convert HTML to text only if it contains HTML tags
	if (description) {
		// Simple check for HTML tags
		const hasHtml = /<[a-z][\s\S]*>/i.test(description);
		if (hasHtml) {
			try {
				return htmlToText(description, {
					wordwrap: false,
					preserveNewlines: true,
					limits: {
						maxInputLength: 100000 // Increase limit for long descriptions
					}
				}).trim();
			} catch (error) {
				// If html-to-text fails, fall back to original description
				console.warn('Failed to convert HTML to text:', error);
			}
		}
	}

	return description || '';
}

function normalizeRSSFeed(parsedData: any): NormalizedRSSFeed {
	// Handle RSS 2.0 format
	if (parsedData.rss?.channel) {
		const data = parsedData.rss.channel;
		const items = Array.isArray(data.item) ? data.item : data.item ? [data.item] : [];

		return {
			data: {
				title: extractText(data.title),
				description: extractText(data.description || data['content:encoded']),
				link: extractLink(data.link),
				language: extractText(data.language),
				pubDate: extractText(data.pubDate), // Changed from data.pubDate
				lastBuildDate: extractText(data.lastBuildDate), // Changed from data.lastBuildDate
				image: extractImageUrl(data.image)
			},
			items: items.map((item: any) => ({
				title: extractText(item.title),
				description: extractDescription(item),
				link: extractLink(item.link || item['@_about']),
				pubDate: extractText(item.pubDate || item['dc:date'] || item.published || item.updated),
				author: extractText(item.author || item['dc:creator'] || item['itunes:author']),
				category: extractCategories(item),
				image: extractImageFromItem(item),
				guid: extractText(item.guid) || extractText(item.id)
			}))
		};
	}

	// Handle Atom format
	if (parsedData.feed) {
		const feed = parsedData.feed;

		return {
			data: {
				title: extractText(feed.title),
				description: extractText(feed.subtitle || feed.description),
				link: extractLink(feed.link),
				language: extractText(feed.language),
				pubDate: extractText(feed.published || feed.updated),
				lastBuildDate: extractText(feed.updated),
				image: extractImageUrl(feed.icon || feed.logo)
			},
			items: (Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : []).map(
				(entry: any) => ({
					title: extractText(entry.title),
					description: extractDescription(entry),
					link: extractLink(entry.link),
					pubDate: extractText(entry.published || entry.updated),
					author: Array.isArray(entry.author)
						? entry.author.map((a: any) => extractText(a.name)).join(', ')
						: extractText(entry.author?.name),
					category: extractCategories(entry),
					image: extractImageFromItem(entry),
					guid: extractText(entry.id)
				})
			)
		};
	}

	// Handle RDF format
	if (parsedData['rdf:RDF']) {
		const rdf = parsedData['rdf:RDF'];
		const channel = rdf.channel;
		const items = Array.isArray(rdf.item) ? rdf.item : rdf.item ? [rdf.item] : [];

		return {
			data: {
				title: extractText(channel?.title),
				description: extractText(channel?.description),
				link: extractLink(channel?.link),
				language: extractText(channel?.['dc:language']),
				pubDate: extractText(channel?.['dc:date']),
				image: extractImageUrl(channel?.image)
			},
			items: items.map((item: any) => ({
				title: extractText(item.title),
				description: extractDescription(item),
				link: extractLink(item.link || item['@_about']),
				pubDate: extractText(item['dc:date']),
				author: extractText(item['dc:creator']),
				category: extractCategories(item),
				image: extractImageFromItem(item),
				guid: extractText(item['@_about'])
			}))
		};
	}

	return {
		data: {
			title: '',
			description: '',
			link: ''
		},
		items: []
	};
}
