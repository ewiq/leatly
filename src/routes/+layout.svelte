<script lang="ts">
	import './layout.css';
	import Toast from '$lib/components/toast/Toast.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import FeedSyncer from '$lib/components/feed/FeedSyncer.svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { invalidate } from '$app/navigation';
	import { initializeSettings, settings } from '$lib/stores/settings.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { lockScroll, trackDeviceState, unlockScroll } from '$lib/utils/uiUtils';
	import { searchbarState } from '$lib/stores/searchbar.svelte';
	import { currentTime } from '$lib/stores/time.svelte';
	import { initializeMySubsMenu } from '$lib/stores/mySubsMenu.svelte.js';
	import { trackMobileKeyboard } from '$lib/stores/mobileKeyboard.svelte.js';

	let { children, data } = $props();

	let lastScrollY = 0;

	// Scroll handling for Menu visibility
	function handleScroll() {
		if (menuState.isSubsMenuOpen) return;
		const currentScrollY = window.scrollY;

		if (currentScrollY < 0) return;

		const scrollDelta = currentScrollY - lastScrollY;

		// Always show menu at very top
		if (currentScrollY < 150) {
			menuState.isMenuHidden = false;
			lastScrollY = currentScrollY;
			return;
		}

		// Toggle menu based on scroll direction
		if (Math.abs(scrollDelta) > 10) {
			menuState.isMenuHidden = scrollDelta > 0;
			if (menuState.isMenuHidden) menuState.isSettingsMenuOpen = false;
			lastScrollY = currentScrollY;
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		// Ctrl + K for search
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			searchbarState.toggleSearchbar();
			return;
		}
		if (e.key === 'Escape') {
			menuState.closeAllMenus();
			searchbarState.closeBar();
		}
	}

	async function handleNewSubscription() {
		await invalidate('app:feed');
	}

	$effect(() => {
		const stopTime = currentTime.startUpdating();
		initializeSettings();
		initializeMySubsMenu();

		const stopDevice = trackDeviceState();
		const stopKeyboard = trackMobileKeyboard();

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			stopDevice();
			stopTime();
			stopKeyboard();

			window.removeEventListener('scroll', handleScroll);
		};
	});

	// Mobile Scroll Lock on MySubsMenu
	$effect(() => {
		if (settings.isMobile && menuState.isSubsMenuOpen) {
			lockScroll();
			menuState.isMenuHidden = false;
		} else {
			unlockScroll();
		}

		return () => unlockScroll();
	});
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<link rel="icon" href="/assets/logo.png" />
	<title>leatly</title>
</svelte:head>

<FeedSyncer channel={data.channels} />

<main class="m-0 min-h-dvh border-0 bg-background p-0">
	<Menu {data} {handleNewSubscription} />
	{@render children()}
</main>

<Toast message={toastData.message} type={toastData.type} />
