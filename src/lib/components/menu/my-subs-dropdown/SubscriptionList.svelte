<script lang="ts">
	import { getAllChannels } from '$lib/db/db';
	import { menuState } from '$lib/stores/menu.svelte';
	import type { DBChannel } from '$lib/types/rss';
	import { normalizeText } from '$lib/utils/searchUtils';
	import { ArrowDownAZ, ArrowDownZA, ClockArrowDown, Search, X } from 'lucide-svelte';
	import ChannelList from './ChannelList.svelte';

	let isDeleting = $state(false);
	let filterText = $state('');

	let sortMode = $state<'a_z' | 'z_a' | 'date'>(
		typeof localStorage !== 'undefined'
			? (localStorage.getItem('subSortMode') as 'a_z' | 'z_a' | 'date') || 'a_z'
			: 'a_z'
	);

	let subscribedChannels: DBChannel[] = $state([]);

	let menuJustOpened = $state(false);

	let filteredChannels = $derived.by(() => {
		let list = [...subscribedChannels];

		list = list.filter((c) =>
			normalizeText(c.title)?.toLowerCase().includes(normalizeText(filterText).toLowerCase())
		);

		if (sortMode === 'a_z') {
			list.sort((a, b) => a.title.localeCompare(b.title));
		} else if (sortMode === 'z_a') {
			list.sort((a, b) => b.title.localeCompare(a.title));
		} else if (sortMode === 'date') {
			list.sort((a, b) => b.savedAt - a.savedAt);
		}
		return list;
	});

	$effect(() => {
		if (menuState.isSubsMenuOpen) {
			menuJustOpened = true;
			setTimeout(() => {
				menuJustOpened = false;
			}, 50);
		}
	});

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('subSortMode', sortMode);
		}
	});

	async function loadChannels() {
		subscribedChannels = await getAllChannels();
	}

	$effect(() => {
		subscribedChannels;
		loadChannels();
		filterText;
	});
</script>

<div class="flex h-full flex-col">
	<div class="border-t border-muted pt-1"></div>

	<div class="px-2 py-1">
		<h3 class="text-sm tracking-widest text-tertiary uppercase">All subs</h3>
	</div>

	<div class="space-between mb-2 flex items-center text-base font-semibold text-content">
		<div class="relative flex-1 flex-row">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
				<Search class="h-4 w-4 text-tertiary" />
			</div>

			<input
				type="text"
				bind:value={filterText}
				class="m-0.5 w-full rounded-lg border border-muted bg-background py-1.5 pr-7.5 pl-7.5
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

		<button
			onclick={() => {
				if (sortMode === 'a_z') {
					sortMode = 'z_a';
				} else if (sortMode === 'z_a') {
					sortMode = 'date';
				} else {
					sortMode = 'a_z';
				}
			}}
			class="m-1 flex cursor-pointer items-center rounded-full p-1 text-content transition hover:text-tertiary"
			title="Sort"
		>
			{#if sortMode === 'a_z'}
				<ArrowDownAZ size={20} />
			{:else if sortMode === 'z_a'}
				<ArrowDownZA size={20} />
			{:else if sortMode === 'date'}
				<ClockArrowDown size={20} />
			{/if}
		</button>
	</div>

	<div class="border-t border-muted"></div>

	<div class="flex flex-col overflow-y-auto">
		<ChannelList
			channels={filteredChannels}
			settings={true}
			onChannelDeleted={async () => {
				await loadChannels();
			}}
		/>
	</div>
</div>
