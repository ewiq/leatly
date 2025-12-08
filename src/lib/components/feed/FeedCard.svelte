<script lang="ts">
	import type { DBItem } from '$lib/types/rss';
	import { settings } from '$lib/stores/settings.svelte';
	import { Clock, Bookmark, X } from 'lucide-svelte';

	let { item }: { item: DBItem } = $props();

	function timeAgo(dateString: string | undefined) {
		if (!dateString) return '';
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return date.toLocaleDateString();
	}

	let cleanDescription = $derived.by(() => {
		const doc = new DOMParser().parseFromString(item.description, 'text/html');
		return doc.body.textContent || '';
	});
</script>

<article
	class="mb-6 snap-start overflow-hidden rounded-xl border border-muted bg-surface shadow-sm
                transition hover:shadow-md {settings.isMenuHidden ? 'scroll-mt-8' : 'scroll-mt-24'}"
>
	{#if item.image}
		<div class="w-full overflow-hidden bg-muted/50 md:h-114">
			<img
				src={item.image}
				alt={item.title}
				class="h-full w-full object-cover transition duration-500 hover:scale-105"
				loading="lazy"
			/>
		</div>
	{/if}

	<div class="p-5">
		<div
			class="mb-3 flex items-center justify-between text-xs font-medium tracking-wider text-tertiary"
		>
			<span class="truncate pr-4">{item.author}</span>
			<div class="flex items-center gap-1">
				<span>{timeAgo(item.pubDate)}</span>
			</div>
		</div>

		<a href={item.link} target="_blank" rel="noopener noreferrer" class="group block">
			<h2 class="mb-2 text-xl font-bold text-content transition-colors group-hover:text-primary">
				{item.title}
			</h2>
		</a>

		<p class="mb-4 line-clamp-3 text-sm leading-relaxed text-tertiary">
			{cleanDescription}
		</p>

		<div class="mt-4 flex items-center justify-between border-t border-muted pt-4">
			<div class="flex gap-2">
				<button
					class="rounded-full p-2 text-tertiary transition hover:bg-muted hover:text-primary"
					title="Save to Favorites"
				>
					<Bookmark class="h-6 w-6" />
				</button>
			</div>

			<a
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1 rounded-full bg-secondary/50 p-3 text-sm font-medium text-content transition hover:bg-secondary"
			>
				<X class="h-4 w-4" />
			</a>
		</div>
	</div>
</article>
