# Stripe Integration - Phase 2 (Integration and UI)

## Overview

Implement end-to-end Stripe subscription integration and product-facing billing UX. This phase introduces checkout, webhook processing, server-side feature gating, and billing UI components.

Reference: `docs/stripe-integration-plan.md`

## Prerequisite

Phase 1 must be completed first:
- Stripe config/client infrastructure
- billing DB helper layer
- usage-limits module with unit tests
- auth session sync for billing state

## Scope

- Stripe Checkout endpoint integration
- Stripe Billing Portal endpoint integration
- Stripe webhook ingestion and signature verification
- Feature-gating enforcement in write paths and upload path
- Settings billing UI and homepage pricing CTA wiring
- Stripe CLI-based verification workflow for local testing

## Out of Scope

- New product tiers beyond Free/Pro
- Tax/VAT customization beyond Stripe defaults
- Enterprise invoicing features
- Non-Stripe payment providers

## Requirements

- Add authenticated API routes for checkout and billing portal creation.
- Add webhook route-handler with signature verification and event handling for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Enforce usage and entitlement gates in server-side mutation paths:
  - item creation
  - collection creation
  - file/image upload
- Add settings billing panel with plan status and actions:
  - Upgrade to Pro
  - Manage Billing (portal)
- Wire homepage pricing CTAs to checkout initiation for monthly/annual plans.
- Ensure session reflects billing updates after webhook changes.

## Files to Create

1. `src/app/api/stripe/checkout/route.ts`
2. `src/app/api/stripe/checkout/route-handler.ts`
3. `src/app/api/stripe/portal/route.ts`
4. `src/app/api/stripe/portal/route-handler.ts`
5. `src/app/api/stripe/webhook/route.ts`
6. `src/app/api/stripe/webhook/route-handler.ts`
7. `src/components/settings/BillingPanel.tsx`
8. `src/actions/billing.ts` (if server-action-driven UI flows are used)

## Files to Modify

1. `src/actions/items.ts`
   - gate item creation by plan and item limits

2. `src/actions/collections.ts`
   - gate collection creation by plan and collection limits

3. `src/app/api/uploads/route-handler.ts`
   - gate uploads for Free users

4. `src/lib/db/items.ts`
   - add total item count helper used by gating

5. `src/app/settings/page.tsx`
   - add billing section and render `BillingPanel`

6. `src/components/homepage/Homepage.tsx`
   - wire pricing CTA buttons to checkout initiation (monthly/annual)

7. `README.md`
   - document Stripe setup and local webhook/CLI usage

## API and Error Handling Conventions

- Keep `route.ts` as thin delegator to `route-handler.ts`.
- Use `runtime = "nodejs"` for Stripe server operations.
- Return consistent JSON result envelopes with explicit status codes.
- Validate auth and ownership context before sensitive operations.

## Feature Gating Rules

- Free plan:
  - max 50 items
  - max 3 collections
  - uploads disallowed
  - AI features disallowed
- Pro plan:
  - unlimited items and collections
  - uploads allowed
  - AI features allowed

Gates must be enforced server-side, not UI-only.

## Stripe Dashboard Setup Checklist

1. Create product: DevStash Pro
2. Create recurring prices:
   - $8 monthly
   - $72 annual
3. Configure success/cancel URLs for checkout.
4. Enable Billing Portal features for plan/payment management.
5. Register webhook endpoint URL.
6. Subscribe required events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. Store webhook signing secret in env.

## Testing Requirements

### Required Stripe CLI Flow (Local)

Use Stripe CLI to validate webhook lifecycle handling locally.

Minimum verification scenarios:

1. Checkout completion triggers `checkout.session.completed` and upgrades user to Pro.
2. Subscription update event keeps plan state synchronized.
3. Subscription deletion event downgrades user to Free.
4. Invalid webhook signature is rejected with expected status.

### Application Verification

1. Free user is blocked at item/collection limits.
2. Free user cannot upload file/image content.
3. Pro user can use uploads and bypass free limits.
4. Settings billing panel displays accurate plan status.
5. Homepage pricing actions launch correct checkout flow.
6. Session state reflects webhook updates after reload.

### Regression Suite

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`

## Acceptance Criteria

- Checkout, portal, and webhook routes are functional and secure.
- Billing state transitions persist in DB and are reflected in user session.
- Feature gating is enforced server-side for all required paths.
- Billing UI is available and actionable from settings.
- Pricing CTAs invoke Stripe checkout correctly.
- Stripe CLI webhook tests are documented and reproducible.

## Implementation Order

1. Build checkout and portal routes.
2. Implement webhook route-handler and billing state transitions.
3. Add server-side gating enforcement in actions/routes.
4. Add settings BillingPanel and homepage CTA wiring.
5. Run Stripe CLI webhook scenarios and full regression checks.
