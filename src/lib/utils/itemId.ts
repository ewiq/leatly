// Using cyrb53 hash
export function generateItemId(
	link: string,
	title: string,
	channelId: string,
	pubDate?: string
): string {
	const normalizedLink = link.trim().toLowerCase();
	const normalizedTitle = title.trim().toLowerCase();
	const normalizedChannel = channelId.trim().toLowerCase();

	const dataString = `${normalizedLink}|${normalizedChannel}|${normalizedTitle}|${pubDate || ''}`;

	let h1 = 0xdeadbeef,
		h2 = 0x41c6ce57;
	for (let i = 0, ch; i < dataString.length; i++) {
		ch = dataString.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	const hex1 = (h2 >>> 0).toString(16).padStart(8, '0');
	const hex2 = (h1 >>> 0).toString(16).padStart(8, '0');

	return `${hex1}-${hex2.slice(0, 4)}-${hex2.slice(4)}-${hex1.slice(0, 4)}-${hex1}${hex2}`;
}
