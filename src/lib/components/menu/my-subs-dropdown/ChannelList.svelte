<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { deleteChannel, getAllCollections, toggleChannelCollection } from '$lib/db/db';
	import { toastData } from '$lib/stores/toast.svelte';
	import type { DBChannel, DBCollection } from '$lib/types/rss';
	import { filterByChannel } from '$lib/utils/filterByChannel';
	import { Ellipsis, HashIcon, Copy, Folder, Check } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let {
		channels,
		settings = false,
		onChannelDeleted
	}: {
		channels: DBChannel[];
		indent?: Boolean;
		settings?: Boolean;
		onChannelDeleted?: () => Promise<void>;
	} = $props();

	let isDeleting = $state(false);
	let openDropdownId = $state<string | null>(null);
	let dropdownButton: HTMLButtonElement | null = $state(null);
	let copiedChannelId = $state<string | null>(null);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	// Collection State
	let showCollectionMenu = $state(false);
	let availableCollections = $state<DBCollection[]>([]);

	async function handleUnsubscribe(channelId: string, event: Event) {
		event.stopPropagation();
		if (!confirm('Are you sure you want to remove this channel?')) return;
		isDeleting = true;
		try {
			await deleteChannel(channelId);
			await invalidate('app:feed');
			if (onChannelDeleted) {
				await onChannelDeleted();
			}
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

	function handleDropdownToggle(channelId: string, event: Event, button: HTMLButtonElement) {
		event.stopPropagation();
		// Reset sub-menu state when toggling main menu
		showCollectionMenu = false;

		if (openDropdownId === channelId) {
			openDropdownId = null;
			dropdownButton = null;
		} else {
			openDropdownId = channelId;
			dropdownButton = button;
		}
	}

	async function handleToggleCollectionMenu(event: Event) {
		event.stopPropagation();
		// Toggle the menu visibility
		showCollectionMenu = !showCollectionMenu;

		// If opening, fetch the collections
		if (showCollectionMenu) {
			availableCollections = await getAllCollections();
		}
	}

	async function handleCollectionClick(channel: DBChannel, collectionId: string, event: Event) {
		event.stopPropagation();

		const isAlreadyInCollection = channel.collectionIds?.includes(collectionId) ?? false;
		const action = !isAlreadyInCollection; // If in, remove (false); if not, add (true)

		try {
			// Using the toggle function from your DB, passing 'true' to add, 'false' to remove
			// Or relying on logic if your db function handles toggle automatically.
			// Based on your DB code: toggleChannelCollection(id, colId, boolean)
			await toggleChannelCollection(channel.link, collectionId, action);

			await invalidate('app:feed'); // Refresh data to update UI
			toastData.message = action ? 'Added to collection' : 'Removed from collection';
			toastData.type = 'success';

			// Optional: Close dropdown after selection
			// openDropdownId = null;
			// dropdownButton = null;
		} catch (error) {
			console.error('Failed to update collection', error);
			toastData.message = 'Failed to update collection';
			toastData.type = 'error';
		}
	}

	async function handleCopyUrl(channelLink: string, event: Event) {
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(channelLink);
			copiedChannelId = channelLink;

			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}

			copyTimeout = setTimeout(() => {
				copiedChannelId = null;
				copyTimeout = null;
			}, 4000);
		} catch (error) {
			console.error('Failed to copy URL', error);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-dropdown-container]')) {
			openDropdownId = null;
			dropdownButton = null;
			showCollectionMenu = false;
		}
	}

	$effect(() => {
		if (openDropdownId) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="flex w-full flex-col">
	{#each channels as channel (channel.title)}
		<div class=" flex items-center" transition:slide={{ duration: 200 }}>
			<button
				onclick={() => filterByChannel(channel)}
				class="m-0.5 flex min-w-0 grow cursor-pointer items-center gap-2 rounded-md py-1 pr-1.5 pl-0.5 text-left text-sm text-accent transition-colors hover:bg-secondary"
			>
				<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-tertiary">
					{#if channel.image}
						<img
							src={channel.image}
							alt={channel.title}
							class="h-full w-full rounded object-cover"
						/>
					{:else}
						<HashIcon size={16} />
					{/if}
				</div>
				<span class="block min-w-0 truncate">
					{channel.title}
				</span>
			</button>

			{#if settings}
				<div class="relative" data-dropdown-container>
					<button
						bind:this={dropdownButton}
						onclick={(e) => handleDropdownToggle(channel.link, e, e.currentTarget)}
						data-ellipsis
						class="m-0.5 mr-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-1 text-accent transition hover:bg-secondary hover:text-tertiary"
						aria-label="Channel options"
					>
						<Ellipsis size={20} />
					</button>

					{#if openDropdownId === channel.link}
						<div
							class="font-hepta fixed z-50 min-w-[180px] rounded-lg border border-muted bg-background text-xs shadow-lg"
							style="top: {dropdownButton
								? dropdownButton.getBoundingClientRect().bottom + 4
								: 0}px; left: {dropdownButton
								? dropdownButton.getBoundingClientRect().right - 180
								: 0}px;"
						>
							<div class="flex flex-col">
								<button
									onclick={(e) => e.stopPropagation()}
									class="w-full cursor-pointer px-4 py-2 text-right text-accent transition-colors hover:bg-secondary hover:text-content"
								>
									Rename
								</button>

								<button
									onclick={handleToggleCollectionMenu}
									class="flex w-full cursor-pointer items-center justify-end gap-2 px-4 py-2 text-right text-accent transition-colors hover:bg-secondary hover:text-content {showCollectionMenu
										? 'bg-secondary text-content'
										: ''}"
								>
									<span>Add to Collection</span>
								</button>

								{#if showCollectionMenu}
									<div class="w-full bg-secondary/30" transition:slide={{ duration: 150 }}>
										{#if availableCollections.length === 0}
											<div class="px-4 py-2 text-center text-xs text-tertiary">
												No collections yet
											</div>
										{:else}
											{#each availableCollections as collection}
												{@const isSelected = channel.collectionIds?.includes(collection.id)}
												<button
													onclick={(e) => handleCollectionClick(channel, collection.id, e)}
													class="flex w-full cursor-pointer items-center justify-between px-4 py-0.5 text-right text-accent transition-colors hover:bg-secondary hover:text-content"
												>
													<span class="w-4 text-primary">
														{#if isSelected}
															<Check size={14} />
														{/if}
													</span>

													<div class="flex items-center gap-2">
														<span>{collection.name}</span>
														<Folder size={12} class="text-tertiary" />
													</div>
												</button>
											{/each}
										{/if}
									</div>
								{/if}

								<button
									onclick={(e) => e.stopPropagation()}
									class="w-full cursor-pointer px-4 py-2 text-right text-accent transition-colors hover:bg-secondary hover:text-content"
								>
									Hide from my feed
								</button>
								<button
									onclick={(e) => handleCopyUrl(channel.feedUrl, e)}
									class="relative w-full cursor-pointer px-4 py-2 text-right text-accent transition-colors hover:bg-secondary hover:text-content"
								>
									<span class="flex items-center justify-end gap-2">
										{#if copiedChannelId === channel.feedUrl}
											<span class=" text-primary">
												<Copy size={16} />
											</span>
										{/if}
										Cop{copiedChannelId ? 'ied' : 'y'} URL
									</span>
								</button>

								<button
									onclick={(e) => handleUnsubscribe(channel.link, e)}
									disabled={isDeleting}
									class="w-full cursor-pointer px-4 py-2 text-right text-accent transition-colors hover:bg-secondary hover:text-content disabled:opacity-50"
								>
									{isDeleting ? 'Deleting...' : 'Delete'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
