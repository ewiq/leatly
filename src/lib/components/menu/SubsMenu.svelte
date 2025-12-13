<script lang="ts">
	import { Bookmark, ChevronDown, LoaderCircle, Plus } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { toastData } from '$lib/stores/toast.svelte';
	import type { RSSFeedResponse } from '$lib/types/rss';
	import { getAllChannels, saveFeedToDB } from '$lib/db/db';
	import { menuState } from '$lib/stores/menu.svelte';
	import SubscriptionList from './SubscriptionList.svelte';
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings.svelte';

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

	async function filterByFavourite() {
		const params = new URLSearchParams();
		params.set('favs', '1');

		await goto(`/?${params.toString()}`, {});
		window.scrollTo({ top: 0, behavior: 'smooth' });

		if (settings.isMobile) {
			menuState.isSubsMenuOpen = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="min-h-0 grow overflow-auto">
		<SubscriptionList></SubscriptionList>
	</div>

	<div class="COLLECTIONS">
		<button
			class="flex w-full cursor-pointer items-center rounded-lg p-2 text-sm tracking-wide text-content uppercase transition hover:bg-secondary"
		>
			<div class="my-auto flex w-full items-center justify-between">
				<div class="flex flex-row">
					<div class="flex w-5 shrink-0 items-center justify-center rounded text-tertiary"></div>
					<span class="ml-2">Politics </span>
				</div>

				<ChevronDown class="mr-2 h-5 w-5"></ChevronDown>
			</div>
		</button>
		<button
			class="flex w-full cursor-pointer items-center rounded-lg p-2 text-sm tracking-wide text-content uppercase transition hover:bg-secondary"
		>
			<div class="flex w-full items-center justify-between">
				<div class="flex flex-row">
					<div class="flex shrink-0 items-center justify-center rounded text-tertiary">
						<svg
							width={20}
							height={20}
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect x="1" y="4" width="22" height="16" rx="4" fill="#FF0000" />

							<path d="M10 9L16 12L10 15V9Z" fill="white" />
						</svg>
					</div>
					<span class="ml-2">Youtube </span>
				</div>

				<ChevronDown class="mr-2 h-5 w-5"></ChevronDown>
			</div>
		</button>
	</div>

	<div class="COLLECTIONS mb-1">
		<button
			onclick={filterByFavourite}
			class="flex w-full cursor-pointer items-center rounded-lg p-2 text-sm tracking-wide text-content uppercase transition hover:bg-secondary"
		>
			<div class="flexshrink-0 items-center justify-center rounded text-tertiary">
				<Bookmark size={20} class="fill-current text-primary " />
			</div>
			<span class="ml-2">Favourites </span>
		</button>
	</div>
	<div class="flex flex-col space-y-2">
		<div class="border-t border-muted"></div>
		<button
			onclick={toggleForm}
			class="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-muted bg-background text-base text-content transition hover:bg-secondary"
		>
			<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded pl-2 text-tertiary">
				<Plus size={20} class="text-primary" />
			</div>
			<span>Add new </span>
		</button>

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
					class="mt-2 flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-accent py-2 text-sm font-medium text-surface transition hover:bg-content disabled:opacity-50"
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
</div>
