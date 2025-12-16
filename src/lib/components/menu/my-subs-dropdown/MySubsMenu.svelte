<script lang="ts">
	import SubscriptionList from './SubscriptionList.svelte';
	import AddNewSub from './AddNewSub.svelte';
	import Collections from './Collections.svelte';
	import { mySubsMenu } from '$lib/stores/mySubsMenu.svelte';

	let { onSubscribe, data } = $props();
</script>

<div class="flex h-full flex-col">
	<AddNewSub
		{onSubscribe}
		isExpanded={mySubsMenu.expandedSection === 'add'}
		onToggle={() => mySubsMenu.toggleSection('add')}
	/>

	<div class="min-h-0 grow overflow-auto">
		<SubscriptionList
			isExpanded={mySubsMenu.expandedSection === 'subs'}
			onToggle={() => mySubsMenu.toggleSection('subs')}
		/>
	</div>

	<Collections
		collections={data.collections}
		isExpanded={mySubsMenu.expandedSection === 'collections'}
		onToggle={() => mySubsMenu.toggleSection('collections')}
	/>
</div>
