export const settings = $state({
	isDark: false,
	isFontSerif: false,
	isSnapped: false,
	isLoading: false
});

export function toggleDarkMode() {
	settings.isDark = !settings.isDark;
	persistSettings();
}

export function toggleFont() {
	settings.isFontSerif = !settings.isFontSerif;
	persistSettings();
}

export function toggleScrollSnap() {
	settings.isSnapped = !settings.isSnapped;
	persistSettings();
}

export function initializeSettings() {
	const savedTheme = localStorage.getItem('theme');
	const savedFont = localStorage.getItem('font');
	const savedScrollSnap = localStorage.getItem('scrollSnap');

	if (savedTheme === 'dark') {
		settings.isDark = true;
	}

	if (savedFont === 'serif') {
		settings.isFontSerif = true;
	}

	if (savedScrollSnap === 'true') {
		settings.isSnapped = true;
	}

	applySettings();
}

function applySettings() {
	// Apply theme
	if (settings.isDark) {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
	// Apply font
	if (settings.isFontSerif) {
		document.documentElement.classList.add('font-serif');
		document.documentElement.classList.remove('font-sans');
	} else {
		document.documentElement.classList.add('font-sans');
		document.documentElement.classList.remove('font-serif');
	}
	// Apply scroll snap
	if (settings.isSnapped) {
		document.documentElement.classList.add('snap-y', 'snap-mandatory');
		document.documentElement.style.scrollBehavior = 'smooth';
	} else {
		document.documentElement.classList.remove('snap-y', 'snap-mandatory');
		document.documentElement.style.scrollBehavior = 'auto';
	}
}

function persistSettings() {
	localStorage.setItem('theme', settings.isDark ? 'dark' : 'light');
	localStorage.setItem('font', settings.isFontSerif ? 'serif' : 'sans');
	localStorage.setItem('scrollSnap', settings.isSnapped ? 'true' : 'false');
	applySettings();
}
