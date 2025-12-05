<script lang="ts">
	import Logo from '$lib/assets/logo.png';
	import MenuSettings from './MenuSettings.svelte';
	import MenuSubscriptions from './MenuSubscriptions.svelte';
	import {
		settings,
		toggleDarkMode,
		toggleFont,
		toggleScrollSnap,
		initializeSettings
	} from '$lib/stores/settings.svelte';

	let { onSubscribe } = $props();

	let isOpen = $state(false);
	let currentTime = $state(new Date());

	let buttonRef: HTMLButtonElement | undefined = $state();
	let dropdownRef: HTMLDivElement | undefined = $state();

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function formatDateTime(date: Date) {
		const year = date.getFullYear();
		const month = date.toLocaleDateString('en-US', { month: 'long' });
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return { year, month, hours, minutes };
	}

	function closeMenu() {
		isOpen = false;
	}

	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const isToastClick = target.closest('[data-toast]');

			if (
				isOpen &&
				buttonRef &&
				dropdownRef &&
				!buttonRef.contains(event.target as Node) &&
				!dropdownRef.contains(event.target as Node) &&
				!isToastClick
			) {
				closeMenu();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (isOpen && event.key === 'Escape') {
				closeMenu();
			}
		};

		const timer = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			clearInterval(timer);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	});

	let dateTime = $derived(formatDateTime(currentTime));

	$effect(() => {
		initializeSettings();
	});
</script>

<nav class="sticky top-0 right-0 left-0 z-50 border-b border-muted bg-surface shadow-sm">
	<div class="flex items-center justify-between px-4 py-3">
		<div class="hidden md:visible"></div>
		<div class="font-hepta md:text-normal flex items-center gap-2 text-sm text-content">
			<span class="hidden md:visible">{dateTime.month.toLowerCase()} {dateTime.year} </span>
			<span class="text-accent)] hidden md:visible">|</span>
			<span>{dateTime.hours}:{dateTime.minutes}</span>
		</div>
		<div class="flex items-center gap-4 select-none">
			<span class="font-hepta text-2xl font-normal text-content">neetlet</span>
			<button
				bind:this={buttonRef}
				class="h-10 w-10 cursor-pointer overflow-hidden rounded-full shadow-lg transition hover:opacity-90"
				onclick={toggleMenu}
				aria-label="Menu"
				aria-expanded={isOpen}
			>
				<img src={Logo} alt="Menu" class="h-full w-full bg-white object-cover" />
			</button>
		</div>
	</div>

	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="absolute top-full right-0 w-full border border-muted bg-surface px-4 py-8 shadow-lg transition
                   md:right-4 md:w-64"
			role="menu"
			aria-labelledby="menu-button"
		>
			<MenuSubscriptions {closeMenu} {onSubscribe}></MenuSubscriptions>
			<MenuSettings
				isDark={settings.isDark}
				isFontSerif={settings.isFontSerif}
				isSnapped={settings.isSnapped}
				{toggleDarkMode}
				{toggleFont}
				{toggleScrollSnap}
			></MenuSettings>
		</div>
	{/if}
</nav>
