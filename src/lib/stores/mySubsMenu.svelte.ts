export type Section = 'add' | 'subs' | 'collections' | null;

export const mySubsMenu = $state({
	expandedSection: 'add' as Section,

	toggleSection(section: 'add' | 'subs' | 'collections') {
		this.expandedSection = this.expandedSection === section ? null : section;
		persistMySubsMenu();
	},

	setExpandedSection(section: Section) {
		this.expandedSection = section;
		persistMySubsMenu();
	}
});

export function initializeMySubsMenu() {
	const savedSection = localStorage.getItem('mySubsMenuExpandedSection');

	if (savedSection !== null) {
		const parsed = JSON.parse(savedSection);

		if (parsed === null || ['add', 'subs', 'collections'].includes(parsed)) {
			mySubsMenu.expandedSection = parsed;
		} else {
			mySubsMenu.expandedSection = 'add';
			persistMySubsMenu();
		}
	} else {
		mySubsMenu.expandedSection = 'add';
		persistMySubsMenu();
	}
}

function persistMySubsMenu() {
	localStorage.setItem('mySubsMenuExpandedSection', JSON.stringify(mySubsMenu.expandedSection));
}
