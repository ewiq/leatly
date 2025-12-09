import { menuState } from '$lib/stores/menu.svelte';
import { searchbarState } from '$lib/stores/searchbar.svelte';

export function createClickOutsideHandler(
	elements: Array<HTMLElement | undefined>,
	callback: () => void,
	exceptions: Array<HTMLElement | null> = []
) {
	const handleClick = (event: MouseEvent) => {
		const target = event.target as Node;
		const isToastClick = (target as HTMLElement).closest('[data-toast]');

		if (isToastClick) return;

		// Check if click is outside all specified elements
		const isOutside = elements.every((element) => element && !element.contains(target));

		// Check if click is not on exception elements
		const isException = exceptions.some((element) => element && element.contains(target));

		if (isOutside && !isException) {
			callback();
		}
	};

	return {
		handleClick,
		attach: () => document.addEventListener('click', handleClick),
		detach: () => document.removeEventListener('click', handleClick)
	};
}

export function handleScroll() {
	const currentScrollY = window.scrollY;
	if (currentScrollY > 0 && currentScrollY > 50) {
		menuState.isMenuHidden = true;
		menuState.isSettingsMenuOpen = false;
	} else {
		menuState.isMenuHidden = false;
	}
}

export function handleKeydown(e: KeyboardEvent) {
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
