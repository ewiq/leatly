<script lang="ts">
	import { ChevronDown, LoaderCircle, Plus, Share2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { getAllChannels, saveFeedToDB } from '$lib/db/db';
	import type { RSSFeedResponse } from '$lib/types/rss';

	let { onSubscribe } = $props();
	let subscriptionUrl = $state('');
	let isFormExpanded = $state(false);

	async function subscribe(event: Event) {
		event.preventDefault();
		if (!subscriptionUrl.trim()) return;
		menuState.isSubscriptionLoading = true;
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
				const existingChannels = await getAllChannels();
				const isDuplicate = existingChannels.some(
					(channel) => channel.link === result.data.data.link
				);
				if (isDuplicate) {
					toastData.message = 'You are already subscribed to this channel!';
					toastData.type = 'info';
					subscriptionUrl = '';
					return;
				}
				try {
					await saveFeedToDB(result.data, result.feedUrl);
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
			menuState.isSubscriptionLoading = false;
		}
	}

	function toggleForm() {
		isFormExpanded = !isFormExpanded;
	}
</script>

<div class="mb-1 flex flex-col space-y-2">
	<div class="flex flex-row items-center justify-between gap-2">
		<button
			onclick={toggleForm}
			class="font-hepta flex h-10 w-30 cursor-pointer items-center justify-between rounded-full border border-muted px-3 text-sm text-content shadow transition hover:bg-secondary md:border-0 md:shadow-none"
		>
			<div class=" w-full text-center">add new</div>

			{#if isFormExpanded}
				<ChevronDown
					size={20}
					class="h-5 w-5 transition-transform duration-200 {isFormExpanded
						? 'rotate-180'
						: 'rotate-0'}"
				/>
			{:else}
				<Plus
					size={20}
					class="h-5 w-5 text-content/60 transition-transform duration-200 {isFormExpanded
						? 'rotate-180'
						: 'rotate-0'}"
				/>
			{/if}
		</button>

		<!-- TODO generate link to share custom leatly -->
		<button
			onclick={() => {}}
			class="font-hepta flex h-10 min-w-24 cursor-pointer items-center justify-around rounded-full border border-muted bg-accent-button px-3 py-1.5 text-[13px] text-surface transition hover:bg-content disabled:opacity-50"
		>
			share
			<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded">
				<Share2 size={16} />
			</div>
		</button>
	</div>

	{#if isFormExpanded}
		<form onsubmit={(e) => subscribe(e)} transition:slide={{ duration: 150 }}>
			<div class="relative flex items-center">
				<input
					id="subscriptionUrl"
					type="text"
					placeholder="https://example.com/rss"
					bind:value={subscriptionUrl}
					class="w-full rounded-lg border border-muted bg-background px-3 py-2 text-sm text-content placeholder:text-tertiary focus:ring-2 focus:ring-primary focus:outline-none"
				/>
			</div>
			<button
				disabled={menuState.isSubscriptionLoading}
				class="mt-2 flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-accent-button py-2 text-sm font-medium text-surface transition hover:bg-content disabled:opacity-50"
			>
				{#if menuState.isSubscriptionLoading}
					<LoaderCircle class="h-5 w-5 animate-spin" />
				{:else}
					Subscribe
				{/if}
			</button>
		</form>
	{/if}
</div>
