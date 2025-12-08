<script lang="ts">
	import Menu from '$lib/components/menu/Menu.svelte';
	import FeedCard from '$lib/components/feed/FeedCard.svelte';
	import Searchbar from '$lib/components/Searchbar.svelte';
	import { getAllItems } from '$lib/db/db';
	import { LoaderCircle, Search } from 'lucide-svelte';
	import type { DBItem } from '$lib/types/rss';
	import { searchItem } from '$lib/utils/searchUtils';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';

	let allItems: DBItem[] = $state([]);
	let visibleItems: DBItem[] = $state([]);
	let isLoading = $state(true);

	let searchInput = $state('');
	let activeSearchQuery = $state('');

	let itemsPerPage = 10;
	let observer: IntersectionObserver;
	let loadTrigger: HTMLElement | undefined = $state();

	// Get search query from URL
	const urlParams = $page.url.searchParams;
	const urlSearchQuery = urlParams.get('q') || '';

	$effect(() => {
		// Initialize search from URL if present
		if (urlSearchQuery) {
			searchInput = urlSearchQuery;
			activeSearchQuery = urlSearchQuery;
		}
	});

	let filteredItems = $derived.by(() => {
		if (!activeSearchQuery.trim()) return allItems;
		return allItems.filter((item) => searchItem(item, activeSearchQuery));
	});

	async function loadFeed() {
		isLoading = true;
		try {
			const items = await getAllItems();
			allItems = items.sort((a, b) => {
				const dateA = a.pubDate ? new Date(a.pubDate).getTime() : a.savedAt;
				const dateB = b.pubDate ? new Date(b.pubDate).getTime() : b.savedAt;
				return dateB - dateA;
			});

			resetPagination();
		} finally {
			isLoading = false;
		}
	}

	function resetPagination() {
		visibleItems = filteredItems.slice(0, itemsPerPage);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function loadMore() {
		if (visibleItems.length >= filteredItems.length) return;
		const nextBatch = filteredItems.slice(visibleItems.length, visibleItems.length + itemsPerPage);
		visibleItems = [...visibleItems, ...nextBatch];
	}

	async function handleSearch() {
		activeSearchQuery = searchInput;

		// Update URL with search query
		const params = new URLSearchParams();
		if (searchInput.trim()) {
			params.set('q', searchInput.trim());
		}

		await goto(`?${params.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});

		resetPagination();
	}

	async function clearSearch() {
		searchInput = '';
		activeSearchQuery = '';

		// Clear search from URL
		await goto('?', {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});

		resetPagination();
	}

	$effect(() => {
		loadFeed();

		if (loadTrigger) {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						loadMore();
					}
				},
				{ rootMargin: '200px' }
			);
			observer.observe(loadTrigger);
		}

		return () => {
			if (observer) observer.disconnect();
		};
	});

	$effect(() => {
		if (visibleItems.length === 0 && filteredItems.length > 0) {
			resetPagination();
		}
	});

	function handleNewSubscription() {
		loadFeed();
	}
</script>

<Menu onSubscribe={handleNewSubscription} />

<main class="mx-auto max-w-2xl px-4 py-8 pb-32">
	{#if isLoading && visibleItems.length === 0}
		<div class="flex justify-center py-20">
			<LoaderCircle class="h-10 w-10 animate-spin text-primary" />
		</div>
	{:else if allItems.length === 0}
		<div class="rounded-xl border border-dashed border-tertiary p-10 text-center">
			<p class="text-lg text-content">No stories yet.</p>
			<p class="text-tertiary">Subscribe to an RSS channel.</p>
		</div>
	{:else}
		{#if activeSearchQuery}
			<div class="snap-start scroll-mt-32">
				<div
					transition:slide={{ duration: 200 }}
					class="mb-4 flex items-center justify-between px-2"
				>
					<p class="text-sm text-tertiary">
						<span class="text-primary">{filteredItems.length}</span> Search results for "<span
							class="font-medium text-content">{activeSearchQuery}</span
						>"
					</p>
					{#if filteredItems.length !== 0}
						<button
							onclick={clearSearch}
							class="cursor-pointer text-sm text-primary hover:underline"
						>
							Clear search
						</button>
					{/if}
				</div>
			</div>

			{#if filteredItems.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-center">
					<Search class="mb-4 h-12 w-12 text-tertiary/50" />
					<p class="text-lg text-content">No results found for "{activeSearchQuery}"</p>
					<button onclick={clearSearch} class="mt-2 cursor-pointer text-primary hover:underline">
						Clear search
					</button>
				</div>
			{/if}
		{/if}

		<div class="flex flex-col gap-4">
			{#each visibleItems as item (item.id)}
				<FeedCard {item} />
			{/each}
		</div>

		<div bind:this={loadTrigger} class="flex h-20 items-center justify-center py-8">
			{#if visibleItems.length < filteredItems.length}
				<!-- <LoaderCircle class="h-6 w-6 animate-spin text-tertiary" /> -->
			{:else if visibleItems.length > 0}
				<span class="text-sm text-tertiary">
					{activeSearchQuery ? '' : "You're all caught up!"}
				</span>
			{/if}
		</div>
	{/if}
</main>

<Searchbar bind:value={searchInput} onSearch={handleSearch} onClear={clearSearch} />
