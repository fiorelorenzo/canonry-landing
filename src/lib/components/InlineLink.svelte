<script lang="ts">
	/**
	 * Issue #20, mirroring the product repository's own
	 * `lib/components/ui/link/inline-link.svelte` (canonry #551) rather than inventing a
	 * second shape for the same problem: this site hand-copies the product's design
	 * layer, and the drift #18 closed started exactly by writing the same three classes
	 * one file at a time. Same classes, same rule, same exceptions.
	 *
	 * The underline is always on, never hover-only. Colour alone is not a second cue:
	 * `--color-accent` sits at 1.31:1 against the surrounding `--color-ink-2` in light
	 * and 1.19:1 in dark, which is what axe reports as `link-in-text-block` at serious.
	 * The accent stays for hue, because that is the visual language of the reading room;
	 * the underline is what carries the information.
	 *
	 * For a link inside running text: a sentence, a list row's inline mention, a
	 * one-line call to action. Not for the header lockup, the nav row, the footer row,
	 * the standalone back link or the door's button, which are unmistakably controls
	 * already and would only get noisier with an underline.
	 */
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAnchorAttributes, 'href'> & { href: string };

	let { href, class: className, children, ...rest }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- generic: `href` is whatever a
     caller passed, and every call site resolves its own path. -->
<a
	data-slot="inline-link"
	{href}
	class={[
		'text-accent-ink underline decoration-line-2 underline-offset-2 hover:bg-accent-bg',
		className
	]}
	{...rest}
>
	{@render children?.()}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
