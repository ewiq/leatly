<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/logo.png';
	import Toast from '$lib/components/menu/Toast.svelte';
	import { toastData } from '$lib/stores/toast.svelte';

	import { invalidate } from '$app/navigation';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { initializeSettings, trackDeviceState } from '$lib/stores/settings.svelte';

	async function handleNewSubscription() {
		// Invalidate the load function to refetch data
		await invalidate('app:feed');
	}

	let { children } = $props();

	$effect(() => {
		initializeSettings();
		const cleanup = trackDeviceState();
		return cleanup;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>leaklet</title>
</svelte:head>

<Menu onSubscribe={handleNewSubscription} />
<main class="min-h-screen bg-background">
	{@render children()}
</main>

<Toast message={toastData.message} type={toastData.type}></Toast>
