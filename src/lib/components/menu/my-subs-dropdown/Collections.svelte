<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidate } from '$app/navigation';
	import { menuState } from '$lib/stores/menu.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { Bookmark, ChevronDown, Folder, Plus, X, Check, Trash2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { createCollection, deleteCollection, getAllChannels } from '$lib/db/db';
	import type { DBChannel, DBCollection } from '$lib/types/rss';
	import ChannelList from './ChannelList.svelte';

	interface Props {
		collections: Array<{
			id: string;
			name: string;
			createdAt: number;
		}>;
	}

	let { collections = [] }: Props = $props();

	// Track which collection is open
	let openCollectionId = $state<string | null>(null);

	// Track new collection input state
	let showNewCollectionInput = $state(false);
	let newCollectionName = $state('');
	let collectionJustCreated = $state(false);

	// Store all channels to filter them by collection
	let allChannels = $state<DBChannel[]>([]);

	let sortedCollections = $derived.by(() =>
		[...collections].sort((a, b) => b.createdAt - a.createdAt)
	);

	// Fetch channels whenever collections update (e.g. after invalidate)
	$effect(() => {
		// We reference 'collections' here so this runs when parent data updates
		if (collections) {
			loadChannels();
		}
	});

	async function loadChannels() {
		allChannels = await getAllChannels();
	}

	function getCollectionChannels(collectionId: string) {
		return allChannels.filter((c) => c.collectionIds?.includes(collectionId));
	}

	function toggleCollection(collectionId: string) {
		openCollectionId = openCollectionId === collectionId ? null : collectionId;
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

	async function filterByCollection(collection: DBCollection) {
		const params = new URLSearchParams();
		params.set('collection', collection.id);

		await goto(`/?${params.toString()}`, {});
		window.scrollTo({ top: 0, behavior: 'smooth' });

		if (settings.isMobile) {
			menuState.isSubsMenuOpen = false;
		}
	}

	async function addCollection() {
		const trimmedName = newCollectionName.trim();
		if (!trimmedName) return;

		collectionJustCreated = true;

		try {
			await createCollection(trimmedName);
			newCollectionName = '';
			showNewCollectionInput = false;
			await invalidate('app:feed');
		} catch (error) {
			console.error('Failed to create collection:', error);
		}

		await tick();
		collectionJustCreated = false;
	}

	function cancelAddingCollection() {
		showNewCollectionInput = false;
		newCollectionName = '';
	}

	async function handleDeleteCollection(collectionId: string) {
		const confirmed = confirm(`Are you sure you want to delete this collection?`);
		if (!confirmed) return;

		try {
			await deleteCollection(collectionId);
			// Optimistic UI update
			collections = collections.filter((c) => c.id !== collectionId);

			if (openCollectionId === collectionId) {
				openCollectionId = null;
			}

			await invalidate('app:feed');
		} catch (error) {
			console.error('Failed to delete collection:', error);
		}
	}
</script>

<div class="border-t border-muted pt-1"></div>
<div class="mb-1 flex items-center justify-between pl-2">
	<h3 class="text-sm tracking-widest text-tertiary uppercase">Collections</h3>
	<button
		onclick={() => (showNewCollectionInput = true)}
		class="m-0.5 mr-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-1 text-accent transition hover:bg-secondary hover:text-tertiary"
		aria-label="Add collection"
	>
		<Plus size={20} strokeWidth="3" class="text-tertiary" />
	</button>
</div>

{#if showNewCollectionInput}
	<div
		class="group flex items-center gap-2 rounded-lg py-2 pr-1.5 pl-2 hover:bg-secondary"
		transition:slide={{ duration: collectionJustCreated ? 0 : 150 }}
	>
		<div class="flex h-5 w-5 shrink-0 items-center justify-center">
			<Folder size={20} />
		</div>
		<input
			type="text"
			bind:value={newCollectionName}
			onkeydown={(e) => {
				if (e.key === 'Enter') addCollection();
				if (e.key === 'Escape') cancelAddingCollection();
			}}
			placeholder="Collection name..."
			class="min-w-0 flex-1 bg-transparent text-sm text-content outline-none placeholder:text-tertiary"
		/>
		<button
			onclick={addCollection}
			class="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded transition hover:bg-primary/10"
			aria-label="Save collection"
		>
			<Check size={20} strokeWidth="3.5" class="text-primary" />
		</button>
		<button
			onclick={cancelAddingCollection}
			class="flex h-6 w-6 shrink-0 items-center justify-center rounded transition hover:bg-secondary"
			aria-label="Cancel"
		>
			<X size={20} class="text-base" />
		</button>
	</div>
{/if}

{#each sortedCollections as collection (collection.id)}
	{@const collectionChannels = getCollectionChannels(collection.id)}

	<div class="collection-item flex flex-col">
		<div class="group flex items-center rounded-lg py-2 pr-1.5 pl-2 hover:bg-secondary">
			<button
				onclick={() => filterByCollection(collection)}
				class=" mr-2 flex cursor-pointer items-center gap-2 text-left text-sm tracking-wide text-content"
			>
				<div class="flex h-5 w-5 shrink-0 items-center justify-center">
					<Folder size={20} class="hover:fill-primary hover:text-primary" />
				</div>
			</button>
			<button
				onclick={() => toggleCollection(collection.id)}
				class="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm tracking-wide text-content transition"
			>
				<span class="font-medium">{collection.name}</span>
				<span class="text-xs text-tertiary">({collectionChannels.length})</span>
			</button>

			<div class="flex items-center gap-1">
				{#if openCollectionId === collection.id}
					<button
						onclick={() => handleDeleteCollection(collection.id)}
						class="mr-2 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-tertiary transition hover:text-red-700"
						aria-label="Delete collection"
					>
						<Trash2 size={20} />
					</button>
				{/if}

				<button
					onclick={() => toggleCollection(collection.id)}
					class="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded transition hover:bg-primary/10"
					aria-label="Toggle collection"
				>
					<ChevronDown
						size={20}
						class="transition-transform duration-200 {openCollectionId === collection.id
							? 'rotate-180'
							: ''}"
					/>
				</button>
			</div>
		</div>

		{#if openCollectionId === collection.id}
			<div transition:slide={{ duration: 150 }}>
				{#if collectionChannels.length > 0}
					<div class="pl-3">
						<ChannelList
							channels={collectionChannels}
							settings={false}
							onChannelDeleted={loadChannels}
						/>
					</div>
				{:else}
					<div class="px-2 py-1 pl-9 text-xs text-tertiary italic">no channels here yet...</div>
				{/if}
			</div>
		{/if}
	</div>
{/each}

<div>
	<button
		onclick={filterByFavourite}
		class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 tracking-wide text-content transition hover:bg-secondary"
	>
		<Bookmark size={20} class="shrink-0 fill-current text-primary" />
		<span class="text-sm">Favourites</span>
	</button>
</div>
