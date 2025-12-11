import { parse } from 'node-html-parser';

export async function fetchWebpageIcon(websiteUrl: string): Promise<string | undefined> {
	if (!websiteUrl) return undefined;

	try {
		// Ensure the URL is properly formatted
		const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			},
			redirect: 'follow' // Follow redirects
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.warn(`HTTP ${response.status} for ${url}`);
			return undefined;
		}

		const html = await response.text();
		const root = parse(html);

		// Priority order for icon selection
		const selectors = [
			{ selector: 'link[rel="apple-touch-icon"]', attr: 'href' },
			{ selector: 'link[rel="icon"][type="image/svg+xml"]', attr: 'href' },
			{ selector: 'link[rel="icon"]', attr: 'href' },
			{ selector: 'link[rel="shortcut icon"]', attr: 'href' },
			{ selector: 'meta[property="og:image"]', attr: 'content' }
		];

		let icon: string | undefined;

		for (const { selector, attr } of selectors) {
			const element = root.querySelector(selector);
			const value = element?.getAttribute(attr);
			if (value) {
				icon = value;
				break;
			}
		}

		if (icon) {
			if (icon.startsWith('http')) return icon;

			if (icon.startsWith('//')) return `https:${icon}`;

			try {
				const baseUrl = new URL(url);

				if (icon.startsWith('/')) {
					return `${baseUrl.origin}${icon}`;
				} else {
					// Handle relative paths from current directory
					const basePath = baseUrl.pathname.endsWith('/')
						? baseUrl.pathname
						: baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
					return `${baseUrl.origin}${basePath}${icon}`;
				}
			} catch (e) {
				console.warn(`Failed to construct URL from icon: ${icon}`, e);
				return undefined;
			}
		}

		// Last resort: try favicon.ico at root
		const baseUrl = new URL(url);
		return `${baseUrl.origin}/favicon.ico`;
	} catch (error) {
		console.warn(`Failed to fetch icon for ${websiteUrl}:`, error);
		return undefined;
	}
}
