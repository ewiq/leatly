<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/logo.png';
	import Toast from '$lib/components/menu/Toast.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { invalidate } from '$app/navigation';
	import { settings } from '$lib/stores/settings.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { lockScroll, trackDeviceState, unlockScroll } from '$lib/utils/uiUtils';
	import { searchbarState } from '$lib/stores/searchbar.svelte';

	let { children } = $props();

	let lastScrollY = 0;

	function handleScroll() {
		const currentScrollY = window.scrollY;

		// Ignore invalid scroll values
		if (currentScrollY < 0) return;

		// Mobile
		if (settings.isMobile) {
			if (currentScrollY <= 50) {
				menuState.isMenuHidden = false;
			} else {
				menuState.isMenuHidden = true;
				menuState.isSettingsMenuOpen = false;
			}
			lastScrollY = currentScrollY;
			return;
		}

		// Desktop
		const scrollDelta = currentScrollY - lastScrollY;

		if (Math.abs(scrollDelta) > 10) {
			if (scrollDelta > 0) {
				if (currentScrollY > 50) {
					menuState.isMenuHidden = true;
					menuState.isSettingsMenuOpen = false;
				}
			} else {
				menuState.isMenuHidden = false;
			}
		}

		if (currentScrollY <= 50) {
			menuState.isMenuHidden = false;
		}

		lastScrollY = currentScrollY;
	}

	function handleKeydown(e: KeyboardEvent) {
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
		// Initialize device tracking
		const cleanup = trackDeviceState();

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			cleanup();
			window.removeEventListener('scroll', handleScroll);
		};
	});

	$effect(() => {
		if (settings.isMobile && menuState.isSubsMenuOpen) {
			lockScroll();

			menuState.isMenuHidden = false;
		} else {
			unlockScroll();
		}

		return () => {
			unlockScroll();
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>leaklet</title>
</svelte:head>

<main class="h-100dvh border-0 bg-background">
	<Menu {handleNewSubscription} />
	{@render children()}
</main>

<Toast message={toastData.message} type={toastData.type} />
