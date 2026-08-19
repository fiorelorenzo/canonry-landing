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
