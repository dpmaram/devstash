# Stripe Integration - Phase 1 (Core Infrastructure)

## Overview

Build the billing foundation for DevStash Pro subscriptions without exposing end-user billing UI yet. This phase establishes Stripe configuration, server-side billing primitives, and testable plan/usage limit logic.

Reference: `docs/stripe-integration-plan.md`

## Scope

- Core Stripe server configuration and SDK wiring
- Billing persistence helpers in the data layer
- Usage-limits module for Free vs Pro enforcement decisions
- Auth session synchronization strategy for `isPro` / `planTier`
- Unit tests for usage-limits module

## Out of Scope

- Stripe Checkout and Billing Portal endpoints
- Webhook route handling
- Feature-gating enforcement in item/collection/upload actions
- Settings billing UI and homepage pricing CTA wiring
- End-to-end Stripe CLI flow testing

## Requirements

- Use existing Prisma fields on `User`:
  - `planTier`
  - `isPro`
  - `stripeCustomerId`
  - `stripeSubscriptionId`
- Add reusable billing configuration accessors for env variables.
- Create a Stripe server client singleton.
- Add a billing data module for reading/updating Stripe-linked user plan state.
- Add a usage-limits module that returns deterministic gating decisions for:
  - max item count (Free: 50)
  - max collection count (Free: 3)
  - uploads allowed (Free: no)
  - AI features allowed (Free: no)
- Update auth session callbacks to keep session plan state in sync with DB values.
- Follow existing server patterns and avoid embedding secrets in code.

## Files to Create

1. `src/lib/stripe/config.ts`
   - typed env reader for Stripe keys and price IDs
   - required variable validation helper

2. `src/lib/stripe/server.ts`
   - Stripe SDK singleton creator

3. `src/lib/db/billing.ts`
   - DB helpers for user billing state and Stripe IDs
   - helper methods for activating/deactivating Pro state

4. `src/lib/billing/usage-limits.ts`
   - constants and decision functions for Free/Pro limits
   - pure functions where possible for unit-testability

5. `src/lib/billing/usage-limits.test.ts`
   - unit tests covering all usage-limit and eligibility branches

## Files to Modify

1. `src/lib/auth/session.ts`
   - add JWT callback logic to sync `isPro` and `planTier` from database
   - expose these values on session user payload
   - preserve existing redirect and user id behavior

2. `src/auth.ts`
   - ensure callback wiring remains valid after `authCallbacks` expansion

## Design Notes

- Keep usage-limits logic independent from route handlers and server actions.
- Usage-limits module should not directly depend on Stripe SDK.
- DB helper functions should be small and focused to keep webhook/action consumers simple.
- Session synchronization should favor correctness after asynchronous billing updates.

## Unit Test Requirements (Usage-Limits Module)

The test suite in `src/lib/billing/usage-limits.test.ts` must validate:

1. Free plan allows item creation up to limit and blocks at/above limit.
2. Free plan allows collection creation up to limit and blocks at/above limit.
3. Pro plan allows unlimited item and collection creation decisions.
4. Upload eligibility is false for Free and true for Pro.
5. AI feature eligibility is false for Free and true for Pro.
6. Plan normalization behavior (if implemented) handles unexpected values safely.
7. Error messaging/decision reasons (if returned) are stable and explicit.

## Acceptance Criteria

- Stripe core modules compile and are lint-clean.
- Usage-limits module is fully unit tested and passing.
- Auth session includes current plan status sourced from DB-backed values.
- No checkout, webhook, or billing UI features are introduced in this phase.
- Existing app behavior outside billing internals remains unchanged.

## Validation Checklist

- `npm test -- src/lib/billing/usage-limits.test.ts`
- `npm test`
- `npm run lint`
- `npx tsc --noEmit`

## Dependencies for Phase 2

Phase 2 may assume these are complete:

- Stripe config + server client
- Billing DB helper module
- Usage-limits decision module + tests
- Session sync support for billing state
