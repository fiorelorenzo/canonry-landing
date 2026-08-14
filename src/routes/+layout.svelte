<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-panel"
>
	Skip to content
</a>

<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 pt-6">
	<a href={resolve('/')} class="text-sm font-semibold tracking-wide text-ink uppercase">Canonry</a>
	<nav class="flex items-center gap-4 text-sm">
		<a href={resolve('/pricing')} class="text-ink-2 hover:text-ink hover:underline">Pricing</a>
		<a href={resolve('/docs/export')} class="text-ink-2 hover:text-ink hover:underline">Export</a>
		<ThemeToggle preference={data.themePreference} />
	</nav>
</div>

{@render children()}
