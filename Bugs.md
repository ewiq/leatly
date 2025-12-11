### 1.

- +page.svelte has a big bug, probably because of filteredItems and visibleItems and their respective itemId conflicting somewhere when visibleItems is being updated with the next batch. This causes a crash in the app with this error when closing a FeedCard towards the end of the feed:

Uncaught Svelte error: each_key_duplicate
Keyed each block has duplicate key `fbecbfb7-5031-7fde-fbec-fbecbfb750317fde` at indexes 18 and 19
https://svelte.dev/e/each_key_duplicate

in <unknown>
in +page.svelte
in +layout.svelte
in root.svelte
each_key_duplicate errors.js:138
validate_each_keys validate.js:35
update_reaction runtime.js:264
update_effect runtime.js:439
#traverse_effect_tree batch.js:245
process batch.js:175
flush_effects batch.js:647
flush batch.js:347
ensure batch.js:528
run_all utils.js:45
run_micro_tasks task.js:10
queue_micro_task task.js:28
queue_micro_task task.js:19
enqueue batch.js:538
ensure batch.js:522
internal_set sources.js:187
set sources.js:166
observer +page.svelte:83
setTimeout handler*\_page/</observer< +page.svelte:64
\_page +page.svelte:61
update_reaction runtime.js:264
update_effect runtime.js:439
flush_queued_effects batch.js:704
process batch.js:198
flush_effects batch.js:647
flush batch.js:347
ensure batch.js:528
run_all utils.js:45
run_micro_tasks task.js:10
flush_tasks task.js:40
flushSync batch.js:584
Svelte4Component legacy-client.js:127
<anonymous> legacy-client.js:54
initialize client.js:587
navigate client.js:1747
start client.js:363
async* (index):23
promise callback\*

2. Ctrl + K and K

Ctrl + serves to open the searchbar, while K is used to navigate between posts. These two are conflicting. Solution: Disable K event when Ctrl is pressed?

3. Handle items with invalid date and no pubDate whatsoever in source xml

4. Navigation correction: ensure scroll: top beforenavigate also works on main feed
