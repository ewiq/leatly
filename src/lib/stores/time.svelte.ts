export const currentTime = $state({
	value: new Date(),

	startUpdating() {
		const timer = setInterval(() => {
			this.value = new Date();
		}, 1000);

		return () => clearInterval(timer);
	}
});
