# RefactorScanner Executive Summary - src/actions

Date: 2026-05-10
Scope: src/actions

## Top Findings

1. Repeated auth + dashboard-user resolution
- Appears in 13 handlers across ai.ts, items.ts, and collections.ts.
- High duplication and high consistency risk.
- Extract to src/actions/_utils.ts as resolveDashboardActor().

2. Repeated AI action preamble
- Shared across all 4 AI handlers in ai.ts.
- Same sequence: auth, dashboard user, Pro gate, rate limit, AI client check.
- Extract to src/lib/ai/run-ai-action.ts as executeAiAction(...).

3. Repeated action result type unions
- Same success/error shapes repeated across many actions.
- Extract to src/types/actions.ts as ActionResult<T>.

4. Repeated nullableTrimmedString schema
- Duplicated in items.ts and collections.ts.
- Extract to src/lib/validation/schemas.ts.

5. Repeated toggle action flow
- Item favorite, item pin, and collection favorite share the same pattern.
- Extract to src/actions/_utils.ts as runToggleAction(...).

## Near-Duplicate Notes

- Validation fallback messages differ by context. Use a shared helper with fallback override.
- AI rate-limit rule name aiAutoTags is reused for all AI features. Confirm whether shared bucket is intentional.
- editor-preferences action auth flow differs intentionally; likely keep separate.

## Recommended Refactor Order

1. resolveDashboardActor() utility
2. ActionResult<T> shared type
3. executeAiAction() wrapper
4. nullableTrimmedString shared schema
5. runToggleAction() helper

## Why This Order

- First two changes remove the most boilerplate with low behavior risk.
- AI wrapper is high value but touches more behavior paths.
- Schema/toggle extractions are smaller and safe follow-ups.

## Quick Impact Estimate

- Auth resolver extraction: about 130 duplicated lines removed.
- AI preamble extraction: about 120 duplicated lines removed.
- Shared result types: removes repeated type declarations and improves consistency.
