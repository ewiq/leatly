import { CLIENT_ID, REDIRECT_URI, SCOPE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'code',
		scope: SCOPE,
		access_type: 'offline',
		prompt: 'consent'
	});

	throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
