export const menuState = $state({
	isSettingsMenuOpen: false,
	isSubsMenuOpen: false,
	isMenuHidden: false,
	isSubscriptionLoading: false,

	toggleSettings() {
		this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
	},

	toggleSubs() {
		this.isSubsMenuOpen = !this.isSubsMenuOpen;
	},

	closeAllMenus() {
		this.isSettingsMenuOpen = false;
		this.isSubsMenuOpen = false;
	}
});
