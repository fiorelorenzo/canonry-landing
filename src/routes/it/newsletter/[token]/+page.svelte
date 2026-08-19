<script lang="ts">
	import OptInResult from '$lib/components/OptInResult.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<OptInResult ok={data.ok} locale="it" />
