<script lang="ts">
	import Logo from '$lib/assets/logo.png';
	import MenuSettings from './MenuSettings.svelte';
	import MenuSubscriptions from './MenuSubscriptions.svelte';
	import { ChevronDown } from 'lucide-svelte';
	import {
		settings,
		toggleDarkMode,
		toggleFont,
		toggleScrollSnap,
		initializeSettings,
		trackDeviceState
	} from '$lib/stores/settings.svelte';
	import SearchButton from '../searchbar/SearchButton.svelte';
	import { slide } from 'svelte/transition';

	let { onSubscribe } = $props();

	// State
	let currentTime = $state(new Date());
	let lastScrollY = 0;

	// Refs
	let settingsBtnRef: HTMLButtonElement | undefined = $state();
	let settingsDropdownRef: HTMLDivElement | undefined = $state();
	let subsBtnRef: HTMLButtonElement | undefined = $state();
	let subsDropdownRef: HTMLDivElement | undefined = $state();
	let searchInputRef: HTMLInputElement | undefined = $state();

	let dateTime = $derived(formatDateTime(currentTime));

	function handleScroll() {
		const currentScrollY = window.scrollY;
		if (currentScrollY < 0) return;

		if (Math.abs(currentScrollY - lastScrollY) > 10) {
			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				settings.isMenuHidden = true;
				settings.isSettingsMenuOpen = false;

				// if (settings.isMobile) {
				// 	settings.isSubsMenuOpen = false;
				// }
			} else {
				settings.isMenuHidden = false;
			}
			lastScrollY = currentScrollY;
		}
	}

	function toggleSettings() {
		settings.isSettingsMenuOpen = !settings.isSettingsMenuOpen;
	}

	function toggleSubs() {
		settings.isSubsMenuOpen = !settings.isSubsMenuOpen;
	}

	function closeAllMenus() {
		settings.isSettingsMenuOpen = false;
		settings.isSubsMenuOpen = false;
	}

	function formatDateTime(date: Date) {
		const year = date.getFullYear();
		const month = date.toLocaleDateString('en-US', { month: 'long' });
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return { year, month, hours, minutes };
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		const isToastClick = (target as HTMLElement).closest('[data-toast]');

		if (isToastClick) return;

		// Handle Settings Menu
		if (
			settings.isSettingsMenuOpen &&
			settingsBtnRef &&
			settingsDropdownRef &&
			!settingsBtnRef.contains(target) &&
			!settingsDropdownRef.contains(target)
		) {
			settings.isSettingsMenuOpen = false;
		}

		// No close for subs Menu
	}

	function handleEscape(event: KeyboardEvent) {
		if ((settings.isSettingsMenuOpen || settings.isSubsMenuOpen) && event.key === 'Escape') {
			closeAllMenus();
		}
	}

	$effect(() => {
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

	$effect(() => {
		if (settings.isMobile && settings.isSubsMenuOpen) {
			document.body.style.overflow = 'hidden';
			document.body.style.touchAction = 'none';
			// Make sure menu remains opens
			settings.isMenuHidden = false;
		} else {
			document.body.style.overflow = '';
			document.body.style.touchAction = '';
		}

		return () => {
			document.body.style.overflow = '';
			document.body.style.touchAction = '';
		};
	});
</script>

<nav
	class="sticky top-0 right-0 left-0 z-200 h-18 border-b border-muted bg-surface shadow-sm transition-transform duration-300 ease-in-out {settings.isMenuHidden
		? '-translate-y-full'
		: 'translate-y-0'}"
>
	<div class="relative flex items-center justify-between p-4">
		<div class="relative flex grow-2 justify-start">
			<button
				bind:this={subsBtnRef}
				onclick={toggleSubs}
				class="font-hepta flex h-10 cursor-pointer items-center gap-1 rounded-full border border-muted px-3 text-sm font-medium text-content shadow transition hover:bg-secondary md:border-0 md:shadow-none"
				aria-label="Subscriptions"
				aria-expanded={settings.isSubsMenuOpen}
			>
				My subs
				<ChevronDown
					class="h-5 w-5 transition-transform duration-200 {settings.isSubsMenuOpen
						? 'rotate-180'
						: ''}"
				/>
			</button>

			{#if settings.isSubsMenuOpen}
				<div
					bind:this={subsDropdownRef}
					transition:slide={{ duration: 300 }}
					class="absolute top-full -left-4 z-60 mt-4 {settings.isMenuHidden
						? 'h-[calc(100dvh)]'
						: 'h-[calc(100dvh-4.5rem)]'} w-screen overflow-y-auto bg-surface px-4 py-2 shadow-lg transition-[height] duration-300 md:-left-8 md:w-[35vw] md:pl-8 xl:w-2/3"
					role="menu"
				>
					<MenuSubscriptions
						{onSubscribe}
						onChannelSelect={() => {
							if (settings.isMobile) {
								settings.isSubsMenuOpen = false;
							}
						}}
					/>
				</div>
			{/if}
		</div>

		<div
			class="font-hepta md:text-normal hidden grow items-center justify-center gap-2 text-sm text-content md:visible md:flex"
		>
			<span class="">{dateTime.month.toLowerCase()} {dateTime.year} </span>
			<span class="text-accent">|</span>
			<span>{dateTime.hours}:{dateTime.minutes}</span>
		</div>

		<div
			class="font-hepta md:text-normal visible flex grow items-center justify-end gap-2 text-sm text-content md:hidden md:justify-center"
		>
			{#if !settings.isSearchbarExtended}
				<SearchButton bind:inputRef={searchInputRef}></SearchButton>
			{/if}
		</div>

		<div class="relative flex grow-2 items-center justify-end gap-2 select-none md:gap-4">
			<span class="font-hepta text-2xl font-normal text-content">leaklet</span>
			<button
				bind:this={settingsBtnRef}
				class="w-10 cursor-pointer overflow-hidden rounded-full border border-muted bg-white shadow transition hover:opacity-70"
				onclick={toggleSettings}
				aria-label="Settings Menu"
				aria-expanded={settings.isSettingsMenuOpen}
			>
				<img src={Logo} alt="Menu" class="h-full w-full scale-75 bg-white object-cover" />
			</button>

			{#if settings.isSettingsMenuOpen}
				<div
					bind:this={settingsDropdownRef}
					class="absolute top-full -right-4 z-210 mt-4 w-screen border-t border-muted bg-surface px-4 py-4 shadow-lg transition md:right-0 md:w-64"
					role="menu"
				>
					<MenuSettings
						isDark={settings.isDark}
						isFontSerif={settings.isFontSerif}
						isSnapped={settings.isSnapped}
						{toggleDarkMode}
						{toggleFont}
						{toggleScrollSnap}
					/>
				</div>
			{/if}
		</div>
	</div>
</nav>
