<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { deleteChannel, getAllChannels } from '$lib/db/db';
	import { menuState } from '$lib/stores/menu.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import type { DBChannel } from '$lib/types/rss';
	import { normalizeText } from '$lib/utils/searchUtils';
	import { handleBlur, handleFocus } from '$lib/utils/uiUtils';
	import { HashIcon, Rss, Search, X } from 'lucide-svelte';

	let isDeleting = $state(false);
	let filterText = $state('');

	let subscribedChannels: DBChannel[] = $state([]);

	let filteredChannels = $derived(
		subscribedChannels.filter((c) =>
			normalizeText(c.title)?.toLowerCase().includes(normalizeText(filterText).toLowerCase())
		)
	);

	async function loadChannels() {
		subscribedChannels = await getAllChannels();
	}

	async function filterByChannel(channel: DBChannel) {
		if (!channel.title) return;

		const params = new URLSearchParams();
		params.set('feed', channel.title);

		await goto(`?${params.toString()}`, {
			noScroll: true
		});

		window.scrollTo({ top: 0, behavior: 'smooth' });

		if (settings.isMobile) {
			menuState.isSubsMenuOpen = false;
		}
	}

	async function handleUnsubscribe(channelId: string, event: Event) {
		// Prevent clicking the parent button
		event.stopPropagation();

		if (!confirm('Are you sure you want to remove this channel?')) return;

		isDeleting = true;
		try {
			await deleteChannel(channelId);
			await loadChannels();
			await invalidate('app:feed');
			toastData.message = 'Channel removed';
			toastData.type = 'success';
		} catch (error) {
			console.error('Failed to delete channel', error);
			toastData.message = 'Failed to remove channel';
			toastData.type = 'error';
		} finally {
			isDeleting = false;
		}
	}

	$effect(() => {
		subscribedChannels;
		loadChannels();
		filterText;
	});
</script>

<div class="flex h-full grow-0 flex-col">
	<div class="space-between mb-1 flex items-center gap-2 text-base font-semibold text-content">
		<div class="flex shrink-0 items-center gap-2">
			<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-tertiary">
				<Rss size={20} class="text-primary" />
			</div>
			<span>My subscriptions</span>
		</div>

		<div class="relative ml-2 flex-1">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Search class="h-4 w-4 text-tertiary" />
			</div>

			<input
				type="text"
				bind:value={filterText}
				onfocus={handleFocus}
				onblur={handleBlur}
				class="p w-full rounded-lg border border-muted bg-background py-2 pr-8 pl-8
                   text-sm font-light text-content placeholder:text-tertiary
                   focus:ring-2 focus:ring-primary focus:outline-none"
			/>

			{#if filterText}
				<button
					type="button"
					onclick={() => (filterText = '')}
					class="absolute inset-y-0 right-0 my-1 flex items-center rounded-full p-2 text-tertiary hover:text-content"
					aria-label="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>
	<div class="border-t border-muted"></div>
	<div class="flex max-h-60 flex-col overflow-y-auto">
		{#each filteredChannels as channel}
			<div class="group flex items-center">
				<button
					onclick={() => filterByChannel(channel)}
					class="flex min-w-0 grow items-center gap-2 rounded-md py-0.5 text-left text-sm text-content transition-colors group-hover:text-tertiary hover:bg-secondary hover:text-content"
				>
					<div
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-tertiary/20 text-tertiary"
					>
						{#if channel.image}
							<img
								src={channel.image}
								alt={channel.title}
								class="h-full w-full rounded object-cover"
							/>
						{:else}
							<HashIcon size={14} />
						{/if}
					</div>

					<span class="block min-w-0 truncate">
						{channel.title || 'Untitled channel'}
					</span>
				</button>

				<button
					onclick={(e) => handleUnsubscribe(channel.link, e)}
					disabled={isDeleting}
					class=" ml-1 flex shrink-0 items-center justify-center rounded p-1.5 text-accent transition hover:text-tertiary"
					aria-label="Unsubscribe"
				>
					<X size={20} />
				</button>
			</div>
		{/each}
	</div>
</div>
