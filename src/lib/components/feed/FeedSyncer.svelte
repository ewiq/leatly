<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { syncAllFeeds } from '$lib/services/feedSync';
	import { sync } from '$lib/stores/sync.svelte';

	const REFRESH_INTERVAL = 15 * 60 * 1000;
	const INITIAL_SYNC_COOLDOWN = 5 * 60 * 1000;
	const SYNC_KEY = 'lastSync';

	async function performSync() {
		if (sync.isSyncing) return;
		sync.isSyncing = true;
		try {
			await syncAllFeeds();
			localStorage.setItem(SYNC_KEY, Date.now().toString());
			await invalidate('app:feed');
		} catch (error) {
			console.error('Auto-sync failed:', error);
		} finally {
			sync.isSyncing = false;
		}
	}

	$effect(() => {
		const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0');
		const timeSinceLast = Date.now() - lastSync;

		if (timeSinceLast > INITIAL_SYNC_COOLDOWN) {
			performSync();
		}

		const intervalId = setInterval(performSync, REFRESH_INTERVAL);
		return () => clearInterval(intervalId);
	});
</script>
