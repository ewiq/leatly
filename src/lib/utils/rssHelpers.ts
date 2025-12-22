import { htmlToText } from 'html-to-text';

export function extractText(value: any): string {
	if (!value) return '';
	if (typeof value === 'string') return value;
	if (value['#text']) return value['#text'];
	if (typeof value === 'object' && !Array.isArray(value)) {
		return Object.values(value).find((v) => typeof v === 'string') || '';
	}
	return String(value);
}

export function parseDateToNumber(value: any): number {
	const text = extractText(value);
	if (!text) return 0;

	const date = new Date(text);
	const time = date.getTime();

	// Return 0 if the date is invalid so logic in db.ts can handle fallbacks
	return isNaN(time) ? 0 : time;
}

export function extractLink(linkData: any): string {
	if (!linkData) return '';
	if (typeof linkData === 'string') return linkData;

	// Handle array (Atom/RSS)
	if (Array.isArray(linkData)) {
		for (const item of linkData) {
			if (typeof item === 'string') return item;
			if (item['@_href']) return item['@_href'];
			// Prefer alternate links for Atom/YouTube
			if (item['@_rel'] === 'alternate' && item['@_href']) return item['@_href'];
		}
		return '';
	}

	if (linkData['@_href']) return linkData['@_href'];
	return '';
}

export function extractDescription(item: any): string {
	let description = extractText(item.description);
	if (!description) description = extractText(item['content:encoded']);
	if (!description) description = extractText(item.summary);

	if (description) {
		const hasHtml = /<[a-z][\s\S]*>/i.test(description);
		if (hasHtml) {
			try {
				return htmlToText(description, {
					wordwrap: false,
					preserveNewlines: true,
					limits: { maxInputLength: 100000 }
				}).trim();
			} catch (error) {
				console.warn('Failed to convert HTML to text:', error);
			}
		}
	}
	return description || '';
}

export function extractCategories(item: any): string | string[] | undefined {
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
