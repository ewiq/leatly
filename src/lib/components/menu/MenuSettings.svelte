<script lang="ts">
	import { Settings, Moon, Sun, MoveVertical, Magnet } from 'lucide-svelte';
	import ToggleButton from './ToggleButton.svelte';

	let { isDark, isFontSerif, isSnapped, toggleDarkMode, toggleFont, toggleScrollSnap } = $props();
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-sm font-semibold text-content">
		<Settings size={16} />
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
</div>
