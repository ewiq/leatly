<script lang="ts">
	import SubscriptionList from './SubscriptionList.svelte';
	import AddNewSub from './AddNewSub.svelte';
	import Collections from './Collections.svelte';
	let { onSubscribe } = $props();
</script>

<div class="flex h-full flex-col">
	<AddNewSub {onSubscribe}></AddNewSub>
	<div class="min-h-0 grow overflow-auto">
		<SubscriptionList></SubscriptionList>
	</div>
	<Collections></Collections>
</div>
