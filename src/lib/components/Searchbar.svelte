<script lang="ts">
	import { Search, X, Command } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	let {
		value = $bindable(),
		onSearch,
		onClear
	} = $props<{
		value: string;
		onSearch?: () => void;
		onClear?: () => void;
	}>();

	let isExpanded = $state(false);
	let inputRef: HTMLInputElement | undefined = $state();

	const isAppleDevice = $derived(
		typeof window !== 'undefined' &&
			/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent)
	);

	function toggleSearch() {
		isExpanded = !isExpanded;
		if (isExpanded) {
			// Wait for DOM update then focus
			setTimeout(() => inputRef?.focus(), 50);
		}
	}

	function handleClear() {
		value = '';
		if (isExpanded) {
			inputRef?.focus();
		}
	}

	function closeBar() {
		isExpanded = false;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSearch?.();
		setTimeout(() => inputRef?.blur(), 100);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeBar();
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			toggleSearch();
			return;
		}

		if (isExpanded) {
			handleKeydown(e);
		}
	}}
/>

{#if !isExpanded}
	<div class="fixed right-4 bottom-4 z-50" in:fade={{ duration: 150 }}>
		<button
			onclick={toggleSearch}
			class="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-muted bg-surface text-content shadow-lg transition hover:bg-secondary md:w-auto md:min-w-10 md:space-x-2 md:px-3"
			aria-label="Open Search"
		>
			<Search class="h-5 w-5" />
			<span class="hidden items-center gap-1 text-xs text-tertiary md:flex">
				{#if isAppleDevice}
					<Command class="h-3 w-3" />
				{:else}
					<span class="font-medium">Ctrl</span>
				{/if}
				<span>K</span>
			</span>
		</button>
	</div>
{/if}

{#if isExpanded}
	<div
		class="fixed right-0 bottom-0 left-0 z-50 border-t border-muted bg-surface/90 px-4 py-2 shadow-2xl backdrop-blur-md"
		transition:fly={{ x: 1000, duration: 150 }}
	>
		<div class="mx-auto flex max-w-2xl items-center gap-3 px-4">
			<form onsubmit={handleSubmit} class="relative flex-1">
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<Search class="h-4 w-4 text-tertiary" />
					</div>

					<input
						bind:this={inputRef}
						type="text"
						bind:value
						placeholder="Search stories..."
						class="w-full rounded-lg border border-muted bg-background py-2 pr-10
                               pl-10 text-content transition-all
                               placeholder:text-tertiary focus:ring-2
                               focus:ring-primary focus:outline-none"
					/>

					{#if value}
						<button
							type="button"
							onclick={() => {
								handleClear();
							}}
							class="absolute inset-y-0 right-0 my-1 flex items-center rounded-full p-2 text-tertiary hover:text-content"
							aria-label="Clear search"
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</form>

			<button
				onclick={closeBar}
				class="cursor-pointer rounded-full p-2 text-tertiary transition-colors hover:text-content"
				aria-label="Close search"
			>
				<X class="h-5 w-5 " />
			</button>
		</div>
	</div>
{/if}
