<script lang="ts">
	/**
	 * Issue #11: this site collects one thing, an email address for the newsletter
	 * signup, and until now never said what happened to it. Every claim below is
	 * checked against this repository's own schema and code, not written from a
	 * template: `migrations/0001_waitlist_signup.sql` and
	 * `migrations/0002_waitlist_consent.sql` for what a row actually holds,
	 * `$lib/consent.ts` and `$lib/server/waitlist.ts` for what happens to it after.
	 * It deliberately does not repeat what the product's own `/privacy`
	 * (`$lib/app.ts`'s `APP_PRIVACY_URL`) says about accounts, campaign content or AI
	 * providers - two copies of a privacy statement is how one of them goes stale, so
	 * this page states only what this property collects and links to that one for
	 * everything else.
	 *
	 * M1 (docs/ux/DECISIONS.md, round eight, canonry-landing#13): this used to be a
	 * launch waiting list; it is now an explicitly named newsletter, and addresses
	 * collected under the old promise were not quietly reinterpreted into this one -
	 * see "What it is for" below, which states that distinction rather than flattening
	 * it away.
	 */
	import { resolve } from '$app/paths';
	import { APP_PRIVACY_URL } from '$lib/app';
	import { OG_LOCALE } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Privacy: Canonry';
	const description = 'What we store when you subscribe, who sees it, and how to be removed.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129's pattern: `/privacy` is this page's English path, `/it/privacy` its
	     Italian counterpart on the same page. `x-default` matches the home page's own
	     choice of English. -->
	<link rel="alternate" hreflang="en" href={`${data.origin}/privacy`} />
	<link rel="alternate" hreflang="it" href={`${data.origin}/it/privacy`} />
	<link rel="alternate" hreflang="x-default" href={`${data.origin}/privacy`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/privacy`} />
	<meta property="og:image" content={`${data.origin}/og.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={OG_LOCALE.en} />
	<meta property="og:locale:alternate" content={OG_LOCALE.it} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={`${data.origin}/og.png`} />
</svelte:head>

<main id="main" class="mx-auto max-w-2xl px-6 pt-6 pb-16">
	<p class="text-sm text-ink-2">
		<a href={resolve('/')} class="text-accent hover:underline">&larr; Back</a>
	</p>
	<h1 class="mt-2 text-2xl font-semibold text-ink">Privacy</h1>

	<p class="mt-4 max-w-measure text-sm leading-relaxed text-ink-2">
		This page collects one thing: the email address you give the newsletter signup. Here is exactly
		what happens to it.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">What we store</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Your address, plus four things about the moment you gave it, in the same database row:
	</p>
	<ul class="mt-2 max-w-measure list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-2">
		<li>the exact sentence you saw next to the button, in whichever language you saw it</li>
		<li>which of the two languages that was</li>
		<li>what you opted into, at the moment you told us</li>
		<li>the moment you clicked the confirmation link, blank until you do</li>
	</ul>

	<h2 class="mt-8 text-lg font-semibold text-ink">Who sees it</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Your signup and its confirmation link both go out through Resend, on our own verified
		<code>canonry.io</code> domain, using a sending key that belongs to this site alone, not to the product.
		Resend is the only third party that ever sees your address.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">What it is for</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Occasional email about new Canonry features - that is the whole promise next to the button
		today, and it is what we record as the scope you agreed to.
	</p>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		This form used to promise something narrower: one email, when Canonry launched. If you signed up
		before it changed, your row was not quietly rewritten to say you agreed to more - it still
		records that original, narrower promise. What changes what your row says is you signing up again
		yourself, at which point you see this page's current copy before you do.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">How to be removed</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Email <a href="mailto:privacy@canonry.io" class="text-accent hover:underline"
			>privacy@canonry.io</a
		> with the address you signed up with and we delete the row. There is no self-service unsubscribe
		link on this site yet - a request by email is the whole process, and it removes the address, the consent
		record and the confirmation state together, since they are one row.
	</p>

	<p class="mt-8 max-w-measure text-sm leading-relaxed text-ink-2">
		That is the whole of what this page collects. For how the product itself, accounts, campaign
		content, the AI providers behind it, handles data, see Canonry's own fuller privacy page:
		<a href={APP_PRIVACY_URL} rel="external" class="text-accent hover:underline"
			>app.canonry.io/privacy</a
		>. It covers a different thing - what happens once you have an account, not what happens when
		you type an email address in here.
	</p>

	<p class="mt-8 text-xs text-muted">
		This describes the newsletter exactly as `migrations/0001_waitlist_signup.sql`,
		`migrations/0002_waitlist_consent.sql`, `$lib/consent.ts` and `$lib/server/waitlist.ts` define
		it today. If that changes, this page changes with it.
	</p>
</main>
