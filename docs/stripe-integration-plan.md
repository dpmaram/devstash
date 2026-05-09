# Stripe Integration Plan for DevStash Pro

## Scope and Target

Implement Stripe subscriptions for DevStash Pro with:
- Monthly: $8
- Annual: $72

This plan is based on repository evidence and follows existing project patterns.

## Current State Analysis

### User model and billing fields

Evidence:
- prisma/schema.prisma
- context/project-overview.md

Current schema already includes billing-ready fields:
- planTier (FREE | PRO)
- isPro (boolean)
- stripeCustomerId (unique nullable)
- stripeSubscriptionId (unique nullable)

This means Stripe can be integrated without a breaking model redesign.

### NextAuth/session handling

Evidence:
- src/auth.ts
- src/auth.config.ts
- src/lib/auth/session.ts
- src/app/api/auth/[...nextauth]/route.ts

Current behavior:
- Auth.js uses JWT session strategy.
- callbacks come from authCallbacks in src/lib/auth/session.ts.
- authCallbacks currently sets session.user.id and redirect behavior.
- There is no JWT callback that syncs isPro or planTier from DB.

Impact:
- If Stripe webhooks update isPro, clients may not reflect it immediately without adding a DB-syncing JWT callback.

### User data access patterns in server actions/components

Evidence:
- src/actions/items.ts
- src/actions/collections.ts
- src/lib/db/dashboard-user.ts
- src/app/settings/page.tsx

Common pattern:
1. Validate input with zod.
2. Resolve session via auth().
3. Resolve ownership-safe user via getDashboardUserForSession.
4. Return structured action result with success/error/data.

This is the correct place to enforce subscription gates for create/update operations.

### Existing subscription/payment code

Evidence:
- repository-wide search for stripe/subscription/isPro

Current state:
- No Stripe SDK usage in source.
- No billing API routes.
- No webhook handler.
- No billing UI in settings.
- "PRO" indicator currently exists only as UI badge for file/image item types:
  - src/components/dashboard/sidebar-pro-badge.ts

Conclusion:
- Schema is prepared, but integration is not yet implemented.

## Feature Gating Analysis

### Free-tier limits and Pro scope

Evidence:
- context/project-overview.md
- src/components/homepage/Homepage.tsx
- context/features/item-types.md

Defined product limits:
- Free: 50 items, 3 collections, no uploads, no AI features
- Pro: unlimited items/collections, uploads, AI features, export tools

Current implementation status:
- Pricing copy exists on homepage.
- Pro indicator exists for file/image types.
- Enforcement for item/collection counts and uploads by subscription is not implemented.

### Where counts are checked now (or where to hook)

Evidence:
- src/lib/db/items.ts
- src/lib/db/collections.ts
- src/app/items/[type]/page.tsx
- src/app/collections/page.tsx

Existing count APIs:
- getDashboardCollectionCount (total collections)
- getDashboardItemCountByTypeSlug
- getDashboardItemCountByCollectionSlug

Gap:
- No existing total item count helper for plan gating.

Recommended insertion points:
- src/actions/items.ts handleCreateItem
- src/actions/collections.ts handleCreateCollection
- src/app/api/uploads/route-handler.ts handleUploadFile

### Pro-only features to gate

Based on project docs and current code:
- File/image uploads: gate in upload route + item create validation path.
- AI features: gate at each AI server action/route when introduced.
- Custom types: currently not a full user-facing flow in code; gate at creation action when implemented.
- Export tools: add gating when export endpoints/actions are added.

### Settings page structure

Evidence:
- src/app/settings/page.tsx
- src/components/profile/ProfileActions.tsx

Current settings sections:
- Account actions
- Editor preferences

Recommended billing placement:
- Add a Billing section on settings page with:
  - Current plan/status
  - Upgrade button (Free -> Pro)
  - Manage billing portal button (Pro users)

## API and Webhook Pattern Analysis

### API route structure

Evidence:
- src/app/api/**/route.ts and route-handler.ts files

Pattern in this codebase:
- route.ts is a thin entrypoint and delegates to route-handler.ts.
- Many handlers set runtime = "nodejs".
- route-handler.ts returns Response.json with stable success/error payloads and explicit status codes.

### Server action error handling

Evidence:
- src/actions/items.ts
- src/actions/collections.ts

Pattern:
- Result shape:
  - success: true with data or
  - success: false with error
- Auth and ownership validated before DB writes.
- zod validation errors mapped to user-facing messages.

### Environment variable patterns

Evidence:
- src/lib/storage/s3.ts
- src/lib/auth/registration.ts
- src/lib/email/resend.ts
- src/lib/db/dashboard-user.ts
- README.md

Pattern:
- process.env access is wrapped in helper functions where possible.
- Defaults/fallbacks exist for local development.
- No secrets are embedded in code.

## Implementation Deliverable

## 1) Files to create (with code examples)

### A. Stripe config and clients

1. src/lib/stripe/config.ts
- Centralize required env access and price IDs.

Example:

```ts
export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
  monthlyPriceId: string;
  annualPriceId: string;
  appUrl: string;
};

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function getStripeConfig(env: NodeJS.ProcessEnv = process.env): StripeConfig {
  return {
    secretKey: required("STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET),
    monthlyPriceId: required("STRIPE_PRICE_PRO_MONTHLY", env.STRIPE_PRICE_PRO_MONTHLY),
    annualPriceId: required("STRIPE_PRICE_PRO_ANNUAL", env.STRIPE_PRICE_PRO_ANNUAL),
    appUrl: env.APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}
```

2. src/lib/stripe/server.ts
- Stripe SDK singleton.

```ts
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/stripe/config";

let stripe: Stripe | null = null;

export function getStripeServerClient() {
  if (!stripe) {
    stripe = new Stripe(getStripeConfig().secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripe;
}
```

### B. Billing data layer

3. src/lib/db/billing.ts
- DB helpers for plan + stripe IDs.

Suggested functions:
- getUserBillingState(userId)
- setStripeCustomerId(userId, stripeCustomerId)
- setSubscriptionActive(userId, { stripeSubscriptionId, planTier })
- setSubscriptionInactive(userId)

### C. Stripe routes

4. src/app/api/stripe/checkout/route.ts
5. src/app/api/stripe/checkout/route-handler.ts
- Create Checkout session for authenticated user.

6. src/app/api/stripe/portal/route.ts
7. src/app/api/stripe/portal/route-handler.ts
- Create Billing Portal session for authenticated user.

8. src/app/api/stripe/webhook/route.ts
9. src/app/api/stripe/webhook/route-handler.ts
- Verify webhook signature and update user plan state.

Webhook handler must process at least:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted

### D. Plan-gating utility

10. src/lib/billing/gates.ts
- Reusable gating logic used by actions/routes.

Suggested functions:
- assertCanCreateItem(userId)
- assertCanCreateCollection(userId)
- assertCanUseUploads(userId)
- assertCanUseAiFeatures(userId)

### E. Settings billing UI

11. src/components/settings/BillingPanel.tsx
- Display plan, renewal status, upgrade/manage buttons.

12. src/actions/billing.ts
- Server actions for checkout/portal URL retrieval if you prefer action-first UI wiring.

## 2) Files to modify (specific changes)

### Auth/session sync for webhook-driven upgrades

1. src/lib/auth/session.ts
- Add jwt callback to sync isPro/planTier from DB on session validation.
- Keep existing session and redirect callbacks.

Recommended direction:
- Always sync from DB when token.sub exists (per your research note).
- Add token.isPro and token.planTier.
- Attach these to session.user in session callback.

2. src/auth.ts
- Keep callbacks wired through authCallbacks (already done); no major change if session.ts is updated.

### Enforce free-tier limits and pro-gates

3. src/actions/items.ts
- In handleCreateItem, check gate before createItem call:
  - item count < 50 for free
  - uploads blocked for free

4. src/actions/collections.ts
- In handleCreateCollection, gate collection count < 3 for free.

5. src/app/api/uploads/route-handler.ts
- Add plan gate before S3 upload.

6. src/lib/db/items.ts
- Add getDashboardItemCount (total items for user) helper.

### UI/UX integration

7. src/app/settings/page.tsx
- Add Billing section and render BillingPanel.

8. src/components/homepage/PricingToggle.tsx and/or src/components/homepage/Homepage.tsx
- Wire CTA buttons to Stripe checkout endpoint or billing action for monthly/annual.

9. src/components/dashboard/NewItemDialog.tsx
- Show upgrade messaging for upload item types when non-Pro.

10. src/components/dashboard/DashboardChrome.tsx and/or sidebar item components
- Keep PRO badge but add gated click behavior/tooltips for free users.

### API route protection and conventions

11. src/app/api/auth/[...nextauth]/route.ts
- No structural change required; keep style parity with new stripe routes.

### Env documentation

12. README.md
- Add Stripe env setup section and local webhook workflow.

## 3) Stripe Dashboard setup steps

1. Create product:
- Product name: DevStash Pro

2. Create prices:
- Monthly recurring price: $8, interval month
- Annual recurring price: $72, interval year

3. Copy IDs into env:
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_ANNUAL

4. Configure checkout behavior:
- Success URL: <APP_URL>/settings?billing=success
- Cancel URL: <APP_URL>/settings?billing=cancel

5. Configure Billing Portal:
- Enable plan management, payment method updates, and cancellations.

6. Configure webhook endpoint:
- URL: <APP_URL>/api/stripe/webhook
- Events:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted

7. Store webhook signing secret:
- STRIPE_WEBHOOK_SECRET

8. Local webhook testing:
- Use Stripe CLI forwarding to local /api/stripe/webhook.

## 4) Testing checklist

### Unit tests

- Billing env/config parsing:
  - missing env throws
  - valid env returns config

- Billing DB helpers:
  - active/inactive transitions set isPro/planTier correctly
  - stripe customer/subscription IDs persisted

- Gating helpers:
  - Free user blocked at 50 items and 3 collections
  - Free user blocked from uploads
  - Pro user allowed

- Auth callbacks:
  - jwt callback syncs isPro from DB
  - session callback exposes updated plan state

### Route-handler tests

- /api/stripe/checkout
  - unauthorized -> 401
  - invalid plan -> 400
  - valid plan -> returns checkout URL

- /api/stripe/portal
  - unauthorized -> 401
  - no customer id -> graceful fallback/error
  - success -> portal URL

- /api/stripe/webhook
  - invalid signature -> 400
  - checkout.session.completed updates user plan
  - subscription.updated and subscription.deleted update plan state

### Integration checks

- Free user flow:
  - can create up to limits
  - blocked beyond limits with clear message
  - upload attempt blocked

- Upgrade flow:
  - checkout completes
  - webhook flips isPro to true
  - session reflects upgrade after reload

- Downgrade/cancel flow:
  - webhook flips isPro false and plan FREE
  - gates enforce free limits again

- Existing tests:
  - run npm test, npm run lint, npx tsc --noEmit

## 5) Implementation order

1. Add Stripe config/client utilities.
2. Add billing DB layer and plan state transitions.
3. Add webhook route-handler and event processing (most critical correctness step).
4. Add checkout and billing portal routes.
5. Add gating helpers.
6. Add item/collection/upload enforcement in actions/routes.
7. Add auth jwt sync for isPro/planTier session consistency.
8. Add settings billing panel and homepage pricing CTA wiring.
9. Add tests (unit + route-handler + integration-style).
10. Run full validation and document env/setup steps.

## Practical notes for this repository

- Keep API style consistent with existing route.ts -> route-handler.ts split and runtime = nodejs where needed.
- Keep server action responses in the existing success/error/data shape.
- Keep ownership safety via getDashboardUserForSession before applying billing checks.
- Do not hard-code limits in UI-only code; enforce on server paths as the source of truth.
- Billing and limits are explicitly intended as feature gates per context/project-overview.md.
