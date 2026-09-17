# Payments

There is no payment provider. Nothing in the platform can charge a card, and nothing
ever moves an order from `PENDING` to `PAID`. The checkout that used to live on this
site was removed for that reason — it is documented here so it can be brought back
deliberately rather than rediscovered.

The API ships the same decision behind `app.payments.enabled` (env `PAYMENTS_ENABLED`,
default `false`). While that flag is off the public catalog serves free courses only and
`POST /api/portal/orders` is refused with a typed error. The site mirrors the flag in
[`src/features/course/payments.ts`](../src/features/course/payments.ts) as
`PAYMENTS_ENABLED`, which is what the catalog filters and the course call to action read.

---

## What was removed

| Removed | What it did |
| --- | --- |
| `app/[lang]/checkout/[slug]/page.tsx` | Auth-gated checkout page; 302'd free courses back to the course page |
| `app/[lang]/checkout/success/page.tsx` | "Order placed" confirmation with a "Go learning" link |
| `app/[lang]/checkout/layout.tsx` | Header + muted background shell for the two pages above |
| `src/features/payment/components/CheckoutClient.tsx` | Order summary and the "Confirm and pay" button |
| `src/features/payment/hooks.ts` | `useCreateOrder` — mutation wrapper that invalidated the orders and enrollments keys |
| `src/features/payment/api.ts` | `paymentApi.createOrder` → `POST /api/portal/orders` |
| `src/features/payment/types.ts` | `Order`, `OrderItem`, `OrderStatus`, `OrderItemType`, `OrderCreateInput` |

## Why

The flow told students a lie. `POST /api/portal/orders` creates a `PENDING` order and
stops there — no provider is called, no webhook exists, and no code path anywhere in the
backend writes `status = PAID` or creates an enrollment from an order. The success page
nevertheless said "Your order was created. You can now access the course." and offered a
link into `/learn/{slug}`, which checks enrollment and bounces the student straight back
to the course page. A student could "buy" a course, be congratulated, and receive nothing.

Removing the route is the honest state of the system, not a feature rollback: the paid
model (courses carry `price`/`currency`, orders and order items are persisted, `/orders`
still lists them) is intact on both sides.

---

## What a real integration needs

Restoring the pages is the small half. In rough dependency order:

1. **Provider charge.** Pick the provider first — an Azerbaijani acquirer's hosted
   payment page redirects rather than taking card details in our UI, which changes the
   checkout page from a form into a "continue to bank" handoff. Card data must never
   reach this app or the API.
2. **A `PAID` transition.** `OrderStatus.PAID` exists and is never written. The
   transition belongs in the API, keyed by the provider's reference, and must be
   idempotent — providers retry.
3. **A webhook.** `POST /api/public/payments/{provider}/callback`, signature-verified,
   anonymous, idempotent per provider reference. It is the only trustworthy source of
   "this was paid"; a browser redirect back from the bank is not, so the success page has
   to poll or subscribe rather than assume.
4. **Enrollment on payment.** The `PAID` transition creates the enrollment for every
   `COURSE` item on the order. Until that exists, a paid order grants nothing, which is
   the exact bug this removal closes.
5. **Failure and refund paths.** `FAILED`, `CANCELLED` and `REFUNDED` are modelled and
   unreachable. Refund must reverse the enrollment.
6. **Flip `app.payments.enabled=true`** on the API and `PAYMENTS_ENABLED` in
   `src/features/course/payments.ts`. That re-exposes paid courses in the catalog, the
   price window and "Free only" chip in the filter sidebar, and the paid call to action
   in `src/features/course/components/EnrollCta.tsx`.

### Frontend pieces to rebuild

- Route `app/[lang]/checkout/[slug]` — auth-gated, redirect free courses to the course
  page, redirect to the provider instead of calling `createOrder` and declaring success.
- Return route for the provider redirect, which resolves the order's real status before
  it claims anything.
- `src/features/payment/` — `createOrder` against `endpoints.portal.orders`, plus the
  order types. `OrderDto` on the API is
  `{ id, userId, orderNumber, status, subtotal, tax, discount, total, currency, placedAt, paidAt, items[] }`.
- `checkout.*` keys in `messages/az.json` and `messages/en.json` are still present and
  cover the old flow; the success copy ("Your order was created. You can now access the
  course.") is what made the flow dishonest and should not be reused verbatim.
- `/checkout` is still listed in `PROTECTED_PREFIXES` in `proxy.ts` and in the disallow
  list in `app/robots.ts`, so a restored route is auth-gated and kept out of the index
  without further changes.
