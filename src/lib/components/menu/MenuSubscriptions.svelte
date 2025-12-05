<script lang="ts">
	import { LoaderCircle } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import type { RSSFeedResponse } from '$lib/types/rss';
	import { saveFeedToDB } from '$lib/db/db';

	let { onSubscribe, closeMenu } = $props();

	let subscriptionUrl = $state('');

	async function subscribe() {
		if (!subscriptionUrl.trim()) return;

		settings.isLoading = true;
		toastData.message = '';
		await tick();

		try {
			const response = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: subscriptionUrl })
			});

			const result = (await response.json()) as RSSFeedResponse;

			if (result.success) {
				try {
					await saveFeedToDB(result.data);
					console.log('Feed saved to IDB');
				} catch (dbError) {
					((toastData.message = 'Failed to save to DB:'), dbError);
				}
				toastData.message = 'Successfully subscribed to RSS feed!';
				toastData.type = 'success';
				onSubscribe?.(result.data);
				subscriptionUrl = '';
			} else {
				toastData.message = result.error || 'Failed to subscribe. Please try again.';
				toastData.type = 'error';
			}
		} catch (error) {
			console.error('Error subscribing:', error);
			toastData.message = 'An error occurred. Please try again.';
			toastData.type = 'error';
		} finally {
			settings.isLoading = false;
		}
	}
</script>

<div class="mb-4">
	<label class="mb-1 block text-sm font-medium text-content">Add new RSS channel</label>
	<input
		type="text"
		placeholder="https://example.com/rss"
		bind:value={subscriptionUrl}
		class="w-full rounded-lg border border-muted bg-background px-3
                           py-2 text-content placeholder:text-tertiary
                           focus:ring-2 focus:ring-primary
                           focus:outline-none"
	/>
	<button
		onclick={subscribe}
		disabled={settings.isLoading}
		class="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg
                           bg-accent py-2 text-surface transition hover:bg-content disabled:hover:bg-accent"
	>
		{#if settings.isLoading}
			<LoaderCircle class="h-6 w-6 animate-spin text-secondary"></LoaderCircle>
		{:else}
			Subscribe
		{/if}
	</button>
</div>

<a
	href="/"
	class="block w-full rounded-lg px-3 py-2 text-left text-content
                       transition hover:bg-secondary"
	onclick={closeMenu}
>
	See all my subscriptions →
</a>
<div class="my-3 border-t border-muted"></div>
