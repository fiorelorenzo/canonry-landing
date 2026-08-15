/**
 * This repository's own tiny locale seam (issue #129, SPEC.md §17 read from the outside).
 *
 * Deliberately not an import of `@canonry/lang`: this repository's whole reason to exist
 * separately from the product (see `$lib/theme.ts`'s own doc comment on the same point,
 * one paragraph up in that file) is that it carries no `@canonry/*` dependency at all, and
 * a locale helper this small - two locales, no negotiation - costs far less to duplicate
 * than a cross-repository package would to add.
 *
 * And it genuinely is a different problem from the product's: `negotiateLocale` picks a
 * language per *visitor*, from an account preference, a cookie, or `Accept-Language`, so
 * the same URL can render two different ways. A marketing page on `/it` has to do the
 * opposite - the same URL renders the same language for every visitor and every crawler,
 * every time, which is the entire point of putting Italian on its own path (#129's body:
 * "discoverable by search engines rather than hidden behind a cookie"). So there is no
 * negotiation function here, only a path lookup.
 */

export type Locale = 'en' | 'it';

export const LOCALES: readonly Locale[] = ['en', 'it'];

export const DEFAULT_LOCALE: Locale = 'en';

/** Endonyms, for the language link each of `/` and `/it` offers to the other - a language
 * picker that names Italian "Italian" to someone who only reads Italian has failed. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', it: 'Italiano' };

/** `og:locale`'s value: Facebook's own underscore-region form, not a BCP-47 tag. */
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', it: 'it_IT' };

/** The only two locales this decides between (#129): everything under `/it` is Italian,
 * whatever page follows, and everything else is English. No prefix matching beyond that
 * exact segment - `/italy` is not Italian. */
export function localeFromPathname(pathname: string): Locale {
	return pathname === '/it' || pathname.startsWith('/it/') ? 'it' : 'en';
}
