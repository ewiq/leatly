<script lang="ts">
	import { X, CircleCheck, CircleX, Info } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let { message, type } = $props();

	let visible = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (message) {
			visible = true;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				close();
			}, 3000);
		}

		return () => {
			clearTimeout(timeoutId);
		};
	});

	function close() {
		visible = false;
		setTimeout(() => {
			message = '';
		}, 300);
	}
</script>

{#if visible && message}
	<div
		data-toast
		transition:fly={{ duration: 400, y: 150, easing: cubicInOut }}
		class="fixed right-4 bottom-4 z-1000 flex min-h-[60px] max-w-md min-w-[320px] items-center gap-3 rounded-lg border bg-background px-4 py-3.5 shadow-lg select-none"
		class:border-green-600={type === 'success'}
		class:border-red-600={type === 'error'}
		class:border-primary={type === 'info'}
	>
		{#if type === 'success'}
			<CircleCheck class="h-5 w-5 shrink-0 text-green-600" strokeWidth={2} />
		{:else if type === 'info'}
			<Info class="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
		{:else}
			<CircleX class="h-5 w-5 shrink-0 text-red-600" strokeWidth={2} />
		{/if}

		<p class="flex-1 text-sm leading-relaxed text-content">{message}</p>

		<button
			onclick={close}
			class="shrink-0 cursor-pointer rounded-lg p-3 opacity-70 transition-all hover:bg-secondary hover:opacity-100"
			aria-label="Close notification"
		>
			<X class="h-4 w-4 text-content" />
		</button>
	</div>
{/if}
