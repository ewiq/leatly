<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	let { error, status } = $props();

	function goHome() {
		goto('/');
	}
</script>

<main class="mx-auto max-w-2xl p-4 pb-32">
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<Search class="mb-4 h-12 w-12 text-tertiary/50" />

		{#if status}
			<p class="mb-1 text-sm text-tertiary">
				{status}
			</p>
		{/if}

		<p class="text-lg text-content">
			{error?.message ?? 'Something went wrong'}
		</p>

		<div class="mt-2 flex gap-4">
			<button onclick={goHome} class="cursor-pointer text-primary hover:underline">
				Go home
			</button>
		</div>
	</div>
</main>
