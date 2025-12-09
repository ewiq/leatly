<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/logo.png';
	import Toast from '$lib/components/menu/Toast.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { toastData } from '$lib/stores/toast.svelte';
	import { invalidate } from '$app/navigation';
	import { settings } from '$lib/stores/settings.svelte';
	import { menuState } from '$lib/stores/menu.svelte';
	import { trackDeviceState } from '$lib/utils/uiUtils';
	import { handleKeydown, handleScroll } from '$lib/utils/domUtils';

	async function handleNewSubscription() {
		await invalidate('app:feed');
	}

	let { children } = $props();

	$effect(() => {
		// Initialize device tracking
		const cleanup = trackDeviceState();

		window.addEventListener('scroll', handleScroll, { passive: true });

		// Handle escape key
		const handleEscape = (event: KeyboardEvent) => {
			if ((menuState.isSettingsMenuOpen || menuState.isSubsMenuOpen) && event.key === 'Escape') {
				menuState.closeAllMenus();
			}
		};

		document.addEventListener('keydown', handleEscape);

		return () => {
			cleanup();
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	// No scroll while subs menu is open
	$effect(() => {
		if (settings.isMobile && menuState.isSubsMenuOpen) {
			document.body.style.overflow = 'hidden';
			document.body.style.touchAction = 'none';
			menuState.isMenuHidden = false;
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

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>leaklet</title>
</svelte:head>

<main class="h-100dvh bg-background">
	<Menu {handleNewSubscription} />
	{@render children()}
</main>

<Toast message={toastData.message} type={toastData.type} />
