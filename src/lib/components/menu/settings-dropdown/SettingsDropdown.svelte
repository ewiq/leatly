<script lang="ts">
	import {
		Settings,
		Moon,
		Sun,
		MoveVertical,
		Magnet,
		Hourglass,
		Shuffle,
		MailCheck,
		MailOpen
	} from 'lucide-svelte';
	import ToggleButton from './ToggleButton.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	let { isDark, isFontSerif, isSnapped } = $props();

	const settingsConfig = $derived([
		{
			id: 'theme',
			icon: isDark ? Moon : Sun,
			label: isDark ? 'Dark' : 'Light',
			isChecked: isDark,
			onToggle: () => settings.toggleDarkMode()
		},
		{
			id: 'font',
			icon: null, // Custom rendering
			label: isFontSerif ? 'Serif' : 'Sans serif',
			isChecked: isFontSerif,
			onToggle: () => settings.toggleFont(),
			customIcon: true
		},
		{
			id: 'scroll',
			icon: isSnapped ? Magnet : MoveVertical,
			label: isSnapped ? 'Snap scroll' : 'Free scroll',
			isChecked: isSnapped,
			onToggle: () => settings.toggleScrollSnap()
		},
		{
			id: 'shuffle',
			icon: settings.isShuffled ? Shuffle : Hourglass,
			label: settings.isShuffled ? 'Shuffle feed' : 'Chronological',
			isChecked: settings.isShuffled,
			onToggle: () => settings.toggleShuffle()
		},
		{
			id: 'read',
			icon: settings.isReadHidden ? MailOpen : MailCheck,
			label: settings.isReadHidden ? 'Hide read' : 'Show read',
			isChecked: settings.isReadHidden,
			onToggle: () => settings.toggleHideRead()
		}
	]);
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-base font-semibold text-content">
		<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-tertiary">
			<Settings size={20} class="text-primary" />
		</div>
		<span>Settings</span>
	</div>

	{#each settingsConfig as setting (setting.id)}
		<div
			class="flex w-full items-center justify-between rounded-lg px-3"
			class:mt-1={setting.id === 'font'}
		>
			<div class="flex items-center gap-2 text-sm text-content">
				{#if setting.customIcon}
					<span
						class="select-none {isFontSerif ? 'font-serif' : 'font-sans'} w-4 text-center text-sm"
						>A</span
					>
				{:else}
					<setting.icon size={16} />
				{/if}
				<span>{setting.label}</span>
			</div>

			<ToggleButton isChecked={setting.isChecked} onToggle={setting.onToggle}></ToggleButton>
		</div>
	{/each}
</div>
