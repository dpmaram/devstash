# RefactorScanner Report - src/actions

Date: 2026-05-10
Scope: src/actions/
Files scanned: ai.ts, items.ts, collections.ts, editor-preferences.ts, search.ts

## Duplicated Logic (Extract to Utility)

### 1) Auth + Dashboard User Resolution Block
The same auth/session/dashboard-user guard pattern appears in 13 handlers across 3 files.

Pattern:

```ts
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: "You must be signed in." };
}
const dashboardUser = await getDashboardUserForSession(session.user);
if (!dashboardUser) {
  return { success: false, error: "<context message>" };
}
```

Call sites:
- src/actions/ai.ts: 4 handlers
- src/actions/items.ts: 5 handlers
- src/actions/collections.ts: 4 handlers

Suggested extraction:
- src/actions/_utils.ts
- Function: resolveDashboardActor()

---

### 2) AI Action Preamble (auth + Pro check + rate limit + OpenAI client)
All 4 AI handlers in src/actions/ai.ts share nearly identical setup logic:
- auth/session guard
- dashboard user resolution
- billing Pro gate
- rate-limit gate
- AI client availability check

Suggested extraction:
- src/lib/ai/run-ai-action.ts
- Function: executeAiAction(deps, rateLimitRule, fn)

---

### 3) Toggle Action Pattern
Three toggle handlers are structurally identical:
- toggleItemFavoriteAction
- toggleItemPinAction
- toggleCollectionFavoriteAction

Suggested extraction:
- src/actions/_utils.ts
- Function: runToggleAction(id, entityLabel, toggleFn)

---

### 4) getValidationError Helper Defined Twice
Near-identical helper exists in both files:
- src/actions/items.ts
- src/actions/collections.ts

Suggested extraction:
- src/actions/_utils.ts
- Function: getFirstZodError(error, fallback?)

---

### 5) Rate Limit Rule String Repeated
"aiAutoTags" is hardcoded in all 4 AI handlers.

Suggested extraction:
- const AI_RATE_LIMIT_RULE = "aiAutoTags" as const

## Duplicated Types / Schemas (Extract to Shared Type File)

### 1) nullableTrimmedString Zod Schema (duplicated)
Defined identically in:
- src/actions/items.ts
- src/actions/collections.ts

Suggested extraction:
- src/lib/validation/schemas.ts
- Export: nullableTrimmedString

---

### 2) Inline auth return type repeated
Repeated in multiple Deps types across ai.ts, items.ts, and collections.ts.

Suggested extraction:
- src/types/actions.ts
- Type: AuthFn

---

### 3) Result union types repeated
Multiple action-specific result types repeat two union shapes:
- { success: true; data: T } | { success: false; error: string }
- { success: true } | { success: false; error: string }

Suggested extraction:
- src/types/actions.ts
- Type: ActionResult<T>

## Near-Duplicates (Review Before Extracting)

1. Validation fallback messages differ by context
- Keep shared helper but accept fallback parameter.

2. AI rate-limit bucket naming
- "aiAutoTags" used across all AI features may be intentional; verify whether a shared bucket is desired.

3. editor-preferences.ts auth flow differs intentionally
- Uses direct auth/session + prisma access; likely should remain separate from dashboard-user resolver.

4. Create-item vs create-collection billing/count gating
- Structurally similar but abstraction may not be worth added generic complexity.

## Priority Order (Highest ROI)

1. resolveDashboardActor() auth + dashboard-user utility (13 call sites)
2. executeAiAction() AI preamble wrapper (4 AI handlers)
3. ActionResult<T> generic result type (10 repeated type definitions)
4. Shared nullableTrimmedString schema
5. runToggleAction() for toggle handlers

## Recommended First Refactor
Start with resolveDashboardActor() and ActionResult<T>. These provide the largest consistency gain with the lowest behavioral risk.
