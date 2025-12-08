<script lang="ts">
	import Logo from '$lib/assets/logo.png';
	import MenuSettings from './MenuSettings.svelte';
	import MenuSubscriptions from './MenuSubscriptions.svelte';
	import { ChevronDown } from 'lucide-svelte'; // Removed LoaderCircle (unused)
	import { getAllChannels } from '$lib/db/db';
	import {
		settings,
		toggleDarkMode,
		toggleFont,
		toggleScrollSnap,
		initializeSettings
	} from '$lib/stores/settings.svelte';
	import type { DBChannel } from '$lib/types/rss';

	let { onSubscribe } = $props();

	let isMenuOpen = $state(false);
	let currentTime = $state(new Date());

	let buttonRef: HTMLButtonElement | undefined = $state();
	let dropdownRef: HTMLDivElement | undefined = $state();

	let isSubsOpen = $state(false);
	let channels: DBChannel[] = $state([]);
	let isLoadingChannels = $state(false);
	let subsButtonRef: HTMLButtonElement | undefined = $state();
	let subsDropdownRef: HTMLDivElement | undefined = $state();

	let lastScrollY = 0;

	function handleScroll() {
		const currentScrollY = window.scrollY;

		if (currentScrollY < 0) return;

		if (Math.abs(currentScrollY - lastScrollY) > 10) {
			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				settings.isMenuHidden = true;
				isMenuOpen = false;
				isSubsOpen = false;
			} else {
				settings.isMenuHidden = false;
			}
			lastScrollY = currentScrollY;
		}
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	async function fetchChannels() {
		isLoadingChannels = true;
		try {
			const data = await getAllChannels();
			channels = data.sort((a, b) => b.savedAt - a.savedAt);
		} catch (e) {
			console.error('Failed to load channels', e);
		} finally {
			isLoadingChannels = false;
		}
	}

	function formatDateTime(date: Date) {
		const year = date.getFullYear();
		const month = date.toLocaleDateString('en-US', { month: 'long' });
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return { year, month, hours, minutes };
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function closeAllMenus() {
		isMenuOpen = false;
		isSubsOpen = false;
	}

	async function toggleSubs() {
		isSubsOpen = !isSubsOpen;
		if (isSubsOpen) {
			isMenuOpen = false;
			if (channels.length === 0) {
				await fetchChannels();
			}
		}
	}

	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const isToastClick = (target as HTMLElement).closest('[data-toast]');

			if (
				isMenuOpen &&
				buttonRef &&
				dropdownRef &&
				!buttonRef.contains(target) &&
				!dropdownRef.contains(target) &&
				!isToastClick
			) {
				isMenuOpen = false;
			}

			if (
				isSubsOpen &&
				subsButtonRef &&
				subsDropdownRef &&
				!subsButtonRef.contains(target) &&
				!subsDropdownRef.contains(target) &&
				!isToastClick
			) {
				isSubsOpen = false;
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if ((isMenuOpen || isSubsOpen) && event.key === 'Escape') {
				closeAllMenus();
			}
		};

		const timer = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			clearInterval(timer);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	let dateTime = $derived(formatDateTime(currentTime));

	$effect(() => {
		initializeSettings();
	});
</script>

<nav
	class="sticky top-0 right-0 left-0 z-50 border-b border-muted bg-surface shadow-sm transition-transform duration-300 ease-in-out {settings.isMenuHidden
		? '-translate-y-full'
		: 'translate-y-0'}"
>
	<div class="flex items-center justify-between p-4">
		<div class="w-1/2 md:w-1/3">
			<button
				bind:this={subsButtonRef}
				onclick={toggleSubs}
				class="font-hepta flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-content transition hover:bg-secondary"
				aria-label="Subscriptions"
				aria-expanded={isSubsOpen}
			>
				My subs
				<ChevronDown
					class="h-5 w-5 transition-transform duration-200 {isSubsOpen ? 'rotate-180' : ''}"
				/>
			</button>
		</div>
		<div
			class="font-hepta md:text-normal hidden w-0 items-center justify-start gap-2 text-sm text-content md:visible md:flex md:w-1/3 md:justify-center"
		>
			<span class="">{dateTime.month.toLowerCase()} {dateTime.year} </span>
			<span class="text-accent)">|</span>
			<span>{dateTime.hours}:{dateTime.minutes}</span>
		</div>
		<div class="flex w-1/2 items-center justify-end gap-4 select-none md:w-1/3">
			<span class="font-hepta text-2xl font-normal text-content">leaklet</span>
			<button
				bind:this={buttonRef}
				class="h-10 w-10 cursor-pointer overflow-hidden rounded-full border border-muted shadow-lg transition hover:opacity-70"
				onclick={toggleMenu}
				aria-label="Menu"
				aria-expanded={isMenuOpen}
			>
				<img src={Logo} alt="Menu" class="h-full w-full bg-white object-cover" />
			</button>
		</div>
	</div>

	{#if isMenuOpen}
		<div
			bind:this={dropdownRef}
			class="absolute top-full right-0 w-full bg-surface px-4 py-8 shadow-lg transition
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
