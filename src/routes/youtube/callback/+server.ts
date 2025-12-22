import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from '$env/static/private';
import type { YouTubeTokenResponse, YouTubeSubscriptionsResponse } from '$lib/types/youtube';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');

	if (!code) {
		return new Response(
			`<script>
                window.opener.postMessage({ type: 'youtube-auth-error', error: 'No code provided' }, window.location.origin);
                window.close();
            </script>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	}

	try {
		// 1. Exchange code for tokens
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			body: new URLSearchParams({
				code,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				redirect_uri: REDIRECT_URI,
				grant_type: 'authorization_code'
			})
		});

		// Cast the token response
		const tokens = (await tokenResponse.json()) as YouTubeTokenResponse;

		// 2. Fetch Subscriptions
		const subsResponse = await fetch(
			'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
			{ headers: { Authorization: `Bearer ${tokens.access_token}` } }
		);

		// Cast the subscriptions response
		const data = (await subsResponse.json()) as YouTubeSubscriptionsResponse;

		// 3. Send data back to the parent window
		return new Response(
			`<script>
                window.opener.postMessage({ 
                    type: 'youtube-auth-success', 
                    subscriptions: ${JSON.stringify(data.items)} 
                }, window.location.origin);
            </script>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	} catch (err) {
		console.error('YouTube Auth Callback Error:', err);
		return new Response(`<script>window.close();</script>`, {
			headers: { 'Content-Type': 'text/html' }
		});
	}
};
