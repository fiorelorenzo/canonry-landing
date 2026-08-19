/**
 * `app.canonry.io` is the product itself, a different origin from this marketing site
 * (`canonry.io`), so its routes are absolute URLs rather than something `resolve()`
 * (rooted at *this* origin, `$app/paths`) could ever produce.
 *
 * M1 (docs/ux/DECISIONS.md, product repository, round eight): the sign-up call to
 * action can point here now that both things gating it have shipped in `v0.8.0` -
 * password recovery (canonry#151) and account deletion (canonry#154). Before that
 * shipped, a stranger who forgot a password or wanted to leave had no door back out,
 * which is why the same decision held the call to action back until both existed.
 */
export const APP_SIGN_UP_URL = 'https://app.canonry.io/auth/sign-up';

/** Issue #11: this site's own `/privacy` covers only what this property collects (a
 * newsletter signup). Everything about the product itself, accounts, campaign
 * content, the AI providers behind it, lives on the product's own fuller page, so
 * this points there instead of duplicating it. */
export const APP_PRIVACY_URL = 'https://app.canonry.io/privacy';

/**
 * The published players' wiki of Valdoria Reach, which is **our own world**, not a
 * customer's: canonry#251 publishes a fifteen-entry slice of it on the prod stack, owned by
 * an account of ours, and the copy that links here says so on purpose.
 *
 * M1 named this as the stronger of the two things a door can point at, and #13 refused to
 * link it while it answered 404. `scripts/check-external-links.mjs`, which CI runs, is what
 * keeps that refusal from having to be repeated by hand: if this ever 404s again, the build
 * says so instead of a reader finding out.
 */
export const APP_SAMPLE_WORLD_URL = 'https://app.canonry.io/p/valdoria-reach';
