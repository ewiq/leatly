<script lang="ts">
	import { Settings, Moon, Sun, MoveVertical, Magnet, Hourglass, Shuffle } from 'lucide-svelte';
	import ToggleButton from './ToggleButton.svelte';

	let { isDark, isFontSerif, isSnapped, toggleDarkMode, toggleFont, toggleScrollSnap } = $props();

	//Dummy for the moment
	let isChronolicalSorting = $state(false);

	function toggleSorting() {
		isChronolicalSorting = !isChronolicalSorting;
	}
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-base font-semibold text-content">
		<Settings size={16} class="text-primary" />
		<span>Settings</span>
	</div>
	<!-- LIGHT-DARK TOGGLE -->
	<div class="flex w-full items-center justify-between rounded-lg px-3">
		<div class="flex items-center gap-2 text-content">
			{#if isDark}
				<Moon size={16} />
				<span>Dark</span>
			{:else}
				<Sun size={16} />
				<span>Light</span>
			{/if}
		</div>

		<ToggleButton isChecked={isDark} onToggle={toggleDarkMode}></ToggleButton>
	</div>
	<!-- FONT TOGGLE -->
	<div class="mt-1 flex w-full items-center justify-between rounded-lg px-3">
		<div class="flex items-center gap-2 text-content">
			<span class="select-none {isFontSerif ? 'font-serif' : 'font-sans'} text-lg">A</span>
			<span>{isFontSerif ? 'Serif' : 'Sans serif'}</span>
		</div>

		<ToggleButton isChecked={isFontSerif} onToggle={toggleFont}></ToggleButton>
	</div>
	<!-- SCROLL SNAP TOGGLE -->
	<div class="flex w-full items-center justify-between rounded-lg px-3">
		<div class="flex items-center gap-2 text-content">
			{#if isSnapped}
				<Magnet size={16} />
				<span>Snap scroll</span>
			{:else}
				<MoveVertical size={16} />
				<span>Free scroll</span>
			{/if}
		</div>

		<ToggleButton isChecked={isSnapped} onToggle={toggleScrollSnap}></ToggleButton>
	</div>
	<!-- FEED SORTING TOGGLE -->
	<div class="flex w-full items-center justify-between rounded-lg px-3">
		<div class="flex items-center gap-2 text-content">
			{#if isChronolicalSorting}
				<Hourglass size={16} />
				<span>Chronological</span>
			{:else}
				<Shuffle size={16} />
				<span>Shuffle feed</span>
			{/if}
		</div>

		<ToggleButton isChecked={isChronolicalSorting} onToggle={toggleSorting}></ToggleButton>
	</div>
</div>
