<script lang="ts">
	import { ChevronDown, LoaderCircle, Plus } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { getAllChannels, saveFeedToDB } from '$lib/db/db';
	import type { RSSFeedResponse } from '$lib/types/rss';

	let { onSubscribe, isExpanded = false, onToggle } = $props();

	let subscriptionUrl = $state('');
	let isAuthenticating = $state(false);
	let authWindow: Window | null = $state(null);

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
					(channel) => channel.feedUrl === result.data.data.feedUrl
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
					toastData.message = 'Failed to save to DB:';
					console.error(dbError);
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

	function importYouTube() {
		isAuthenticating = true;

		// Open popup window
		const width = 600;
		const height = 700;
		const left = window.screen.width / 2 - width / 2;
		const top = window.screen.height / 2 - height / 2;

		authWindow = window.open(
			'/youtube/auth',
			'YouTube Authentication',
			`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
		);

		// Listen for messages from popup
		window.addEventListener('message', handleAuthMessage);

		// Check if popup was closed
		const checkClosed = setInterval(() => {
			if (authWindow?.closed) {
				clearInterval(checkClosed);
				isAuthenticating = false;
				window.removeEventListener('message', handleAuthMessage);
			}
		}, 1000);
	}

	function handleAuthMessage(event: MessageEvent) {
		// Verify origin for security
		if (event.origin !== window.location.origin) {
			return;
		}

		if (event.data.type === 'youtube-auth-success') {
			console.log('YouTube auth successful!');
			console.log('Subscriptions:', event.data.subscriptions);

			// Close popup
			authWindow?.close();
			isAuthenticating = false;
			window.removeEventListener('message', handleAuthMessage);

			// TODO: Update your UI with the subscriptions
			// event.data.subscriptions contains the array of subscriptions
		} else if (event.data.type === 'youtube-auth-error') {
			console.error('YouTube auth failed:', event.data.error);
			authWindow?.close();
			isAuthenticating = false;
			window.removeEventListener('message', handleAuthMessage);
		}
	}
</script>

<div class="border-b border-muted">
	<button
		onclick={onToggle}
		class="flex w-full cursor-pointer items-center justify-between bg-surface px-4 py-3 transition hover:bg-secondary/50"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="rounded-full bg-secondary/50 p-2 text-sm font-medium text-content transition hover:bg-secondary"
			>
				<Plus size={18} class="text-primary" strokeWidth={2.5} />
			</div>
			<h3 class="text-base font-medium tracking-wider text-content">add new</h3>
		</div>
		<ChevronDown
			size={20}
			class="text-tertiary transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
		/>
	</button>

	{#if isExpanded}
		<div class="mt-2 px-4 pb-2" transition:slide={{ duration: 150 }}>
			<form onsubmit={subscribe} class="space-y-3">
				<div class="relative flex items-center">
					<input
						id="subscriptionUrl"
						type="text"
						placeholder="https://example.com/rss"
						bind:value={subscriptionUrl}
						class="w-full rounded-lg border border-muted bg-background px-3 py-2.5 text-sm text-content placeholder:text-tertiary focus:ring-1 focus:ring-primary focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={menuState.isSubscriptionLoading}
					class="flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-accent-button py-2.5 text-sm font-medium text-surface transition hover:bg-content disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if menuState.isSubscriptionLoading}
						<LoaderCircle class="h-5 w-5 animate-spin" />
					{:else}
						Subscribe
					{/if}
				</button>
			</form>

			<button
				onclick={importYouTube}
				disabled={isAuthenticating}
				class="flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-red-700 py-2.5 text-sm font-medium text-surface transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isAuthenticating}
					<LoaderCircle class="h-5 w-5 animate-spin"></LoaderCircle>
				{:else}
					Import my YouTube channels
				{/if}
			</button>
		</div>
	{/if}
</div>
