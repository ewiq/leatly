<script lang="ts">
	import { Search, X, ChevronRight } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { settings } from '$lib/stores/settings.svelte';
	import SearchButton from './SearchButton.svelte';

	let { value = $bindable(), onSearch } = $props<{
		value: string;
		onSearch?: () => void;
	}>();

	let inputRef: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (!settings.isMobile && settings.isSearchbarExtended && inputRef) {
			setTimeout(() => inputRef?.focus(), 0);
		}
	});

	function handleClear() {
		value = '';
		if (settings.isSearchbarExtended) {
			inputRef?.focus();
		}
	}

	function closeBar() {
		settings.isSearchbarExtended = false;
	}

	function toggleSearch() {
		settings.isSearchbarExtended = !settings.isSearchbarExtended;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSearch?.();
		setTimeout(() => inputRef?.blur(), 100);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			toggleSearch();
			return;
		}

		// Handle Escape for closing
		if (e.key === 'Escape' && settings.isSearchbarExtended) {
			closeBar();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !settings.isSearchbarExtended}
	<SearchButton bind:inputRef></SearchButton>
{/if}

{#if settings.isSearchbarExtended}
	<div
		class="fixed right-0 bottom-0 left-0 {settings.isMobile
			? 'z-300'
			: 'z-50'} border-t border-muted bg-surface/90 py-2 shadow-2xl backdrop-blur-md md:px-4"
		transition:fly={{ x: 1000, duration: 150 }}
	>
		<div class="mx-auto flex max-w-2xl items-center gap-3 px-4">
			<button
				onclick={closeBar}
				class="cursor-pointer rounded-full p-2 text-accent transition-colors hover:text-tertiary"
				aria-label="Close search"
			>
				<X class="h-5 w-5 " />
			</button>
			<form onsubmit={handleSubmit} class="relative flex-1">
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<Search class="h-4 w-4 text-tertiary" />
					</div>
					<input
						bind:this={inputRef}
						type="text"
						bind:value
						placeholder="Search..."
						class="w-full rounded-lg border border-muted bg-background py-2 pr-10
                               pl-10 text-content transition-all
                               placeholder:text-tertiary focus:ring-2
                               focus:ring-primary focus:outline-none"
					/>
					{#if value}
						<button
							type="button"
							onclick={handleClear}
							class="absolute inset-y-0 right-0 my-1 flex items-center rounded-full p-2 text-tertiary hover:text-content"
							aria-label="Clear search"
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</form>
			<button
				onclick={handleSubmit}
				class="cursor-pointer rounded-full p-2 text-accent transition-colors hover:text-tertiary"
				aria-label="Close search"
			>
				<ChevronRight class="h-5 w-5 " />
			</button>
		</div>
	</div>
{/if}
