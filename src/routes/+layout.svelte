<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/logo.png';
	import Toast from '$lib/components/menu/Toast.svelte';
	import { toastData } from '$lib/stores/toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>leaklet</title>
</svelte:head>

<main class="min-h-screen bg-background">
	{@render children()}
</main>

<Toast message={toastData.message} type={toastData.type}></Toast>
