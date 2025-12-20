<script lang="ts">
	import type { DBChannel } from '$lib/types/rss';
	import ChannelItem from './ChannelItem.svelte';

	let {
		channels,
		settings = false,
		onChannelDeleted
	}: {
		channels: DBChannel[];
		settings?: Boolean;
		onChannelDeleted?: () => Promise<void>;
	} = $props();

	let activeEditingId = $state<string | null>(null);
	let activeDropdownId = $state<string | null>(null);

	function handleSetEditingId(id: string | null) {
		activeEditingId = id;
	}

	function handleSetDropdownId(id: string | null) {
		activeDropdownId = id;
	}
</script>

<div class="flex w-full flex-col gap-0.5">
	{#each channels as channel (channel.feedUrl)}
		<ChannelItem
			{channel}
			{settings}
			{onChannelDeleted}
			isEditing={activeEditingId === channel.feedUrl}
			isDropdownOpen={activeDropdownId === channel.feedUrl}
			onSetEditingId={handleSetEditingId}
			onSetDropdownId={handleSetDropdownId}
		/>
	{/each}
</div>
