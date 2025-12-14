<script lang="ts">
	import { goto } from '$app/navigation';
	import { menuState } from '$lib/stores/menu.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { filterByChannel } from '$lib/utils/filterByChannel';
	import { Bookmark, ChevronDown, Folder, Hash } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	// Track which collection is open (only one at a time)
	let openCollectionId = $state<string | null>(null);

	// Dummy data for collections
	const collections = [
		{
			id: 'politics',
			name: 'Politics',
			icon: null,
			channels: [
				{ id: '1', name: 'CNN Politics', image: null },
				{ id: '2', name: 'BBC News Politics', image: null },
				{ id: '3', name: 'The Guardian Politics', image: null }
			]
		},
		{
			id: 'youtube',
			name: 'Youtube',
			icon: 'youtube',
			channels: [
				{ id: '4', name: 'Veritasium', image: null },
				{ id: '5', name: 'Kurzgesagt', image: null },
				{ id: '6', name: 'Fireship', image: null },
				{ id: '7', name: 'MKBHD', image: null }
			]
		}
	];

	function toggleCollection(collectionId: string) {
		if (openCollectionId === collectionId) {
			openCollectionId = null;
		} else {
			openCollectionId = collectionId;
		}
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

<div class="border-t border-muted pt-1"></div>

<div class="px-2 py-1">
	<h3 class="text-sm tracking-wider text-tertiary uppercase">Collections</h3>
</div>

<div class="mb-1">
	{#each collections as collection (collection.id)}
		<div class="collection-item">
			<button
				onclick={() => toggleCollection(collection.id)}
				class="flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-sm tracking-wide text-content transition hover:bg-secondary"
			>
				<div class="flex w-full items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex h-5 w-5 shrink-0 items-center justify-center">
							{#if collection.icon === 'youtube'}
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
							{:else}
								<Folder size={20} class="" />
							{/if}
						</div>
						<span class="font-medium">{collection.name}</span>
						<span class="text-xs text-tertiary">({collection.channels.length})</span>
					</div>

					<div
						class="transition-transform duration-200"
						style="transform: rotate({openCollectionId === collection.id ? '180deg' : '0deg'})"
					>
						<ChevronDown class="h-4 w-4" />
					</div>
				</div>
			</button>

			{#if openCollectionId === collection.id}
				<div transition:slide={{ duration: 150 }} class="space-y-0.5 px-2 pb-1">
					{#each collection.channels as channel (channel.id)}
						<button
							onclick={() => filterByChannel(channel.name)}
							class="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-secondary"
						>
							<div
								class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-tertiary group-hover:bg-background"
							>
								{#if channel.image}
									<img
										src={channel.image}
										alt={channel.name}
										class="h-full w-full rounded-full object-cover"
									/>
								{:else}
									<Hash size={14} />
								{/if}
							</div>
							<span class="truncate text-left text-content">
								{channel.name}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>

<div class="border-t border-muted pt-1"></div>

<div>
	<button
		onclick={filterByFavourite}
		class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm tracking-wide text-content transition hover:bg-secondary"
	>
		<Bookmark size={20} class="shrink-0 fill-current text-primary" />
		<span class="font-medium">Favourites</span>
	</button>
</div>
