<script lang="ts">
	import { LoaderCircle, Plus, Share } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { getAllChannels, saveFeedToDB } from '$lib/db/db';
	import type { RSSFeedResponse } from '$lib/types/rss';

	let { onSubscribe } = $props();
	let subscriptionUrl = $state('');
	let isFormExpanded = $state(sessionStorage.getItem('isSubButtonExpanded') === 'true');

	async function subscribe() {
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
				isFormExpanded = false;
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
		sessionStorage.setItem('isSubButtonExpanded', `${isFormExpanded}`);
	}
</script>

<div class="mb-2 flex flex-col space-y-2">
	<div class="flex flex-row items-center justify-between gap-2">
		<button
			onclick={toggleForm}
			class="flex cursor-pointer items-center rounded-lg border border-muted bg-background py-1 text-base text-content transition hover:bg-secondary"
		>
			<div class="flex flex-row items-center gap-1 pr-3 pl-1.5 text-sm">
				<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-tertiary">
					<Plus size={20} class="text-primary" />
				</div>
				<span>Add new </span>
			</div>
		</button>

		<!-- TODO generate link to share custom leatly -->
		<button
			onclick={() => {}}
			class="flex cursor-pointer items-center justify-center rounded-lg bg-accent-button py-1 text-surface transition hover:bg-content disabled:opacity-50"
		>
			<div class="flex flex-row items-center gap-1 pr-1.5 pl-3 text-sm">
				<span>Share my leatly</span>
				<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded">
					<Share size={20} />
				</div>
			</div>
		</button>
	</div>

	{#if isFormExpanded}
		<form onsubmit={subscribe} transition:slide={{ duration: 150 }}>
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
				onclick={subscribe}
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
