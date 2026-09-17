/**
 * There is no payment provider yet. The API runs with `app.payments.enabled=false`,
 * which makes `GET /api/public/courses` serve free courses only and makes order
 * creation fail with a typed error. The public site mirrors that flag here so it
 * never offers a path to a checkout that cannot charge anyone.
 *
 * Bringing paid courses back is this constant plus `PAYMENTS_ENABLED=true` on the
 * API — nothing about the paid model was deleted. What returns with it:
 *   - the price window and the "Free only" chip in `components/FilterSidebar`;
 *   - the `free` / `priceMin` / `priceMax` params in `filters.ts`;
 *   - a paid call to action in `components/EnrollCta`, together with the
 *     `/checkout/{slug}` route that was removed along with the unusable flow.
 *
 * Annotated `boolean` instead of letting it narrow to the literal `false` so both
 * sides of every `PAYMENTS_ENABLED` branch stay type-checked while it is off.
 */
export const PAYMENTS_ENABLED: boolean = false;
