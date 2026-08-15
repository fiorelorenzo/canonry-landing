<script lang="ts">
	/**
	 * Canonry's mark (canonry repository's docs/ux/h2-brand-and-logo.html, decision
	 * H2 = C, "the tie"): two entries and the link between them, drawn so the link is
	 * also the C. Renders with `currentColor` rather than a baked hex so it always
	 * inherits whatever ink the surrounding surface is using - never a hardcoded
	 * colour, and never the copilot's violet (C1 reserves that hue for the AI alone).
	 *
	 * Geometry is the locked inline weight (stroke-width 8): the favicon file and the
	 * small rasters carry heavier strokes of their own because a 16 pixel icon needs
	 * weight a display size does not, but nothing inline in a page should redraw that
	 * - this is the one geometry for Mark.svelte, the header lockup and the OG card.
	 *
	 * `ariaHidden` is for the common case: the mark sits next to the wordmark, and the
	 * wordmark's own text is what a screen reader should announce. Leave it `false`
	 * for a standalone mark with no adjacent text.
	 */
	let { size = 24, ariaHidden = false }: { size?: number; ariaHidden?: boolean } = $props();
</script>

<svg
	viewBox="0 0 64 64"
	width={size}
	height={size}
	aria-hidden={ariaHidden ? 'true' : undefined}
	role={ariaHidden ? undefined : 'img'}
	aria-label={ariaHidden ? undefined : 'Canonry'}
>
	<path
		d="M46 12a21 21 0 1 0 0 40"
		fill="none"
		stroke="currentColor"
		stroke-width="8"
		stroke-linecap="round"
	/>
	<circle cx="46" cy="12" r="7" fill="currentColor" />
	<circle cx="46" cy="52" r="7" fill="currentColor" />
</svg>
