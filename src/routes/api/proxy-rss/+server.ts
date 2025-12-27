import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'RSS-Reader/1.0',
				Accept: 'application/rss+xml, application/xml, text/xml, */*'
			}
		});

		if (!response.ok) {
			return new Response(JSON.stringify({ error: 'Failed to fetch RSS' }), {
				status: response.status
			});
		}

		const xml = await response.text();
		console.log(xml);
		return new Response(JSON.stringify({ xml }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Fetch failed' }), { status: 500 });
	}
};
