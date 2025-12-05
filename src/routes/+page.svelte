<script lang="ts">
	import Menu from '$lib/components/menu/Menu.svelte';
	import FeedCard from '$lib/components/feed/FeedCard.svelte';
	import { getAllItems, type DBItem } from '$lib/db/db';
	import { LoaderCircle } from 'lucide-svelte';

	let allItems: DBItem[] = $state([]);
	let visibleItems: DBItem[] = $state([]);
	let isLoading = $state(true);

	let itemsPerPage = 10;
	let observer: IntersectionObserver;
	let loadTrigger: HTMLElement | undefined = $state();

	async function loadFeed() {
		isLoading = true;
		try {
			const items = await getAllItems();
			allItems = items.sort((a, b) => {
				const dateA = a.pubDate ? new Date(a.pubDate).getTime() : a.savedAt;
				const dateB = b.pubDate ? new Date(b.pubDate).getTime() : b.savedAt;
				return dateB - dateA;
			});

			visibleItems = allItems.slice(0, itemsPerPage);
		} finally {
			isLoading = false;
		}
	}

	function loadMore() {
		if (visibleItems.length >= allItems.length) return;

		const nextBatch = allItems.slice(visibleItems.length, visibleItems.length + itemsPerPage);
		visibleItems = [...visibleItems, ...nextBatch];
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

	// 4. Handle New Subscriptions
	// We re-load the whole feed to mix in the new items in correct date order
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
		<div class="flex flex-col gap-4">
			{#each visibleItems as item (item.id)}
				<FeedCard {item} />
			{/each}
		</div>

		<div bind:this={loadTrigger} class="flex h-20 items-center justify-center py-8">
			{#if visibleItems.length < allItems.length}
				<LoaderCircle class="h-6 w-6 animate-spin text-tertiary" />
			{:else if visibleItems.length > 0}
				<span class="text-sm text-tertiary">You're all caught up!</span>
			{/if}
		</div>
	{/if}
</main>
