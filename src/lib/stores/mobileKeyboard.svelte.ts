// mobileKeyboard.svelte.ts
export const mobileKeyboard = $state({
	isKeyboardOpen: false,
	isSettled: false,
	preKeyboardScrollY: 0 // We will use this to "reset"
});

export function trackMobileKeyboard() {
	if (typeof window === 'undefined' || !window.visualViewport) return () => {};

	const vv = window.visualViewport;
	let baselineHeight = vv.height;
	let settleTimeout: number;

	// Internal tracker to detect transitions
	let wasKeyboardOpen = false;

	const onResize = () => {
		const heightDiff = baselineHeight - vv.height;
		const keyboardOpen = heightDiff > 100;

		if (keyboardOpen && !wasKeyboardOpen) {
			mobileKeyboard.preKeyboardScrollY = window.scrollY;
		}

		mobileKeyboard.isKeyboardOpen = keyboardOpen;
		mobileKeyboard.isSettled = false;

		clearTimeout(settleTimeout);

		if (keyboardOpen) {
			settleTimeout = window.setTimeout(() => {
				mobileKeyboard.isSettled = true;
			}, 100);
		} else {
			if (wasKeyboardOpen) {
				window.scrollTo({
					top: mobileKeyboard.preKeyboardScrollY,
					behavior: 'instant'
				});
			}

			baselineHeight = vv.height;
			mobileKeyboard.isSettled = false;
		}

		wasKeyboardOpen = keyboardOpen;
	};

	vv.addEventListener('resize', onResize);
	return () => {
		vv.removeEventListener('resize', onResize);
		clearTimeout(settleTimeout);
	};
}

export function scrollToView(node: HTMLElement) {
	$effect(() => {
		const { isKeyboardOpen, isSettled } = mobileKeyboard;

		if (isKeyboardOpen && isSettled && document.activeElement === node) {
			node.scrollIntoView({
				behavior: 'instant',
				block: 'center'
			});
		}
	});
}
