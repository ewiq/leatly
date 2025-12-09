export const searchbarState = $state({
	isSearchbarOpen: false,

	toggleSearchbar() {
		this.isSearchbarOpen = !this.isSearchbarOpen;
	},

	closeBar() {
		this.isSearchbarOpen = false;
	}
});
