# AI Integration Plan for DevStash (Next.js + OpenAI `gpt-5-nano`)

## Objective
Integrate AI-powered capabilities into DevStash for:
- Auto-tagging content
- AI-generated summaries
- Code explanation
- Prompt optimization

This plan is based on:
- Existing DevStash server-action and billing patterns
- Current OpenAI API guidance (Responses API, streaming, safety, rate limits)
- Next.js App Router guidance for `use server` and route handlers

## Executive Summary
Use a server-only OpenAI client and expose AI features through typed server actions that follow DevStash's existing `{ success, error?, data? }` response shape. Gate AI usage by Pro status using the existing `canUseAiFeatures` helper. Start with non-streaming for auto-tagging/summaries/prompt optimization, and add streaming for code explanation in a route handler for better UX. Implement strict input validation, schema-constrained outputs, retry/backoff for rate limits, and token/cost caps per request.

---

## Current DevStash Patterns to Reuse

### 1. Server action conventions
Observed in `src/actions/items.ts`, `src/actions/collections.ts`, `src/actions/editor-preferences.ts`:
- `"use server"` at file top
- Zod validation before mutation/business logic
- Session resolution via `auth()`
- User normalization via `getDashboardUserForSession(...)`
- Consistent result shape:
  - success: `{ success: true, data: ... }`
  - failure: `{ success: false, error: string }`

### 2. Pro gating already exists for AI
Observed in `src/lib/billing/usage-limits.ts`:
- `canUseAiFeatures(planTier)` returns allowed/reason
- Existing FREE vs PRO normalization and decision utilities can be reused directly

### 3. Existing premium upgrade UX
Observed in `src/app/items/[type]/page.tsx`, `src/components/billing/UpgradePage.tsx`, `src/components/settings/BillingPanel.tsx`:
- Free users are redirected to `/upgrade` for premium-only features
- Upgrade entry points are centralized and already polished

### 4. Existing API error style
Observed in `src/app/api/stripe/checkout/route-handler.ts`:
- Route handlers return explicit status codes + JSON body with `{ success, error }`
- Friendly message mapping from raw errors (`getCheckoutErrorMessage` pattern)

---

## Recommended Architecture

### A. Server-only OpenAI client wrapper
Create a single OpenAI client module (server-only):
- Reads `OPENAI_API_KEY` from environment
- Exposes helper methods for each AI task
- Centralizes timeout, retry policy, and model selection defaults

Suggested location:
- `src/lib/ai/openai-client.ts`
- `src/lib/ai/tasks.ts` (task-specific orchestration)
- `src/lib/ai/schemas.ts` (Zod schemas for outputs)

### B. Feature-level server actions
Create dedicated actions (or one file with multiple exports) for AI features:
- `autoTagItemAction(input)`
- `summarizeItemAction(input)`
- `explainCodeAction(input)`
- `optimizePromptAction(input)`

Each action should:
1. Validate input with Zod
2. Authenticate user and resolve dashboard user
3. Check `canUseAiFeatures(planTier)`
4. Enforce per-request limits (chars/tokens/rate)
5. Call OpenAI via the shared client wrapper
6. Return typed result in DevStash action format

### C. Streaming path for long responses
Use a route handler for streaming where needed (best for code explanation):
- `src/app/api/ai/explain/route.ts`
- Emit SSE stream to client
- Support aborts and error events

Keep non-streaming for short structured tasks (tags/summary classification style).

---

## OpenAI SDK Setup and Configuration

### Install and configure
- Install official SDK: `npm install openai`
- Keep API key in server env only: `OPENAI_API_KEY`
- Instantiate client server-side only

### Model choice (`gpt-5-nano`)
Use `gpt-5-nano` as baseline for low-latency, low-cost transformations:
- Auto-tagging: great fit
- Short summaries: great fit
- Prompt optimization rewrite pass: great fit
- Code explanation:
  - Use nano for quick explanation
  - Optionally route to higher-tier model for complex code blocks

### API style
Prefer Responses API for new text-generation workloads and consistency with current OpenAI guidance.

---

## Server Action Patterns for AI Calls

Follow this canonical flow (matching current project style):

1. `"use server"`
2. Parse input with Zod
3. `auth()` and `getDashboardUserForSession(...)`
4. Load billing state and call `canUseAiFeatures(planTier)`
5. Execute AI request with guarded options
6. Validate model output (prefer structured schema)
7. Return `{ success, data }` or `{ success, error }`

Additional recommendation:
- Avoid throwing to UI for expected business failures (auth, plan gate, validation)
- Throw/log only unexpected infra faults and map them to user-safe errors

---

## Streaming vs Non-Streaming

### Use non-streaming for:
- Auto-tagging
- Summaries under short target length
- Prompt optimization suggestions that are short and structured

Why:
- Simpler implementation
- Easier moderation and validation
- Better deterministic UX for accept/reject flows

### Use streaming for:
- Code explanation for long snippets
- Multi-step educational output where progressive rendering helps

Why:
- Better perceived latency
- Faster first token

Caveat:
- Streaming is harder to moderate because partial output arrives before full evaluation

---

## Error Handling and Rate Limiting

### Error taxonomy
Define user-safe categories:
- `UNAUTHORIZED`
- `PLAN_RESTRICTED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `UPSTREAM_ERROR`
- `TIMEOUT`

### API and action response mapping
- Actions: always return `{ success: false, error: "..." }`
- Route handlers: status codes + JSON body
  - 401 auth
  - 403 plan gate
  - 429 rate limit
  - 500/502 upstream failures

### Retry strategy
For transient failures and 429s:
- Exponential backoff with jitter
- Small retry count (e.g., 2-3)
- Hard timeout per request
- Do not retry validation or policy failures

### Application-level limits (recommended)
In addition to provider limits, enforce app limits per user:
- Requests per minute/day for AI actions
- Max input length per feature
- Max output tokens by feature

This aligns with OpenAI guidance on abuse prevention and cost control.

---

## Pro User Gating Pattern

Use existing helper:
- `canUseAiFeatures(planTier)` from `src/lib/billing/usage-limits.ts`

Recommended behavior for free users:
- Return `PLAN_RESTRICTED` in action/route
- Client surfaces in-context notice + CTA to `/upgrade`
- Reuse existing upgrade page and button patterns

Optional enhancement:
- Add limited free AI trial quota (e.g., 3 calls/day) behind feature flag

---

## Cost Optimization Strategy

### 1. Right-size model and tokens
- Default to `gpt-5-nano`
- Keep `max_output_tokens` tight by feature
  - tags: very low
  - summary: moderate and bounded
  - explanation: variable, but capped

### 2. Structured outputs to reduce retries
Use schema-constrained outputs (Zod-backed) for:
- tags arrays
- summary objects
- optimization suggestions

This lowers parse failures and re-run cost.

### 3. Prompt caching and stable prefixes
Keep static instruction blocks consistent and at the start of prompts to maximize caching opportunities and reduce repeated token costs.

### 4. Batch when asynchronous work is acceptable
For non-interactive backfills (e.g., generating tags for existing items), process in offline jobs and batch where suitable.

### 5. Track token/cost metrics
Store per-call telemetry:
- feature type
- model
- input/output tokens
- latency
- success/failure
- user tier

Use this for budget alerts and model tuning.

---

## UI Patterns for AI Features

### Common interaction contract
For each AI feature panel/dialog:
- Idle state
- Loading state (skeleton/spinner + disabled action)
- Result preview
- Accept / Reject buttons
- Error state with retry option

### Feature-specific UX

#### Auto-tagging
- Trigger: button in item drawer/editor
- Output: suggested tag chips
- Action: accept all, remove individual, reject all

#### Summaries
- Trigger: "Generate summary"
- Output: preview text area
- Action: replace existing description/content or copy

#### Code explanation
- Trigger near snippet/code content
- Streaming preferred for long output
- Include "stop" and "regenerate" controls

#### Prompt optimization
- Show original vs optimized side-by-side
- Explain key changes in bullet diff
- One-click apply

### Messaging for gated users
For AI buttons shown to free users:
- Disable + tooltip "Pro feature"
- Clicking can open upgrade modal/route to `/upgrade`

---

## Security Considerations

### API key handling
- Never expose `OPENAI_API_KEY` to client
- Keep all model calls server-side
- Avoid logging secrets or raw request bodies containing sensitive data

### Input sanitization and validation
- Validate all user inputs with Zod
- Bound max content length by feature
- Strip or normalize unsafe/control characters where needed

### Prompt injection resistance
- Treat user content as untrusted data, not instructions
- Keep fixed developer instructions separate and explicit
- Avoid blindly executing model-produced instructions

### Content safety
- Consider moderation checks for user input and/or model output on high-risk surfaces
- Include user reporting entry point for harmful outputs

### Data minimization
- Send only required fields to AI calls
- Avoid shipping full item history/context unless needed
- For PII-heavy content, add redaction layer before request

---

## Proposed Implementation Phases

### Phase 1: Foundation
- Add OpenAI client wrapper and env validation
- Add shared AI schemas and prompt templates
- Add base AI telemetry interface

### Phase 2: First feature set (non-streaming)
- Auto-tagging action + UI
- Summary action + UI
- Prompt optimization action + UI
- Pro gating and upgrade CTA integration

### Phase 3: Streaming feature
- Code explanation route handler with SSE streaming
- Client streaming renderer + abort support

### Phase 4: Hardening
- Rate limiter + retries/backoff
- Moderation and abuse checks where needed
- Metrics dashboard + cost guardrails

---

## Suggested Prompt/Output Contracts

### Auto-tagging output schema
- `tags: string[]` (bounded length, deduplicated)
- optional `rationale?: string`

### Summary output schema
- `summary: string`
- `keyPoints: string[]` (optional)
- `confidence?: "low" | "medium" | "high"`

### Code explanation output schema
- `overview: string`
- `steps: { title: string; detail: string }[]`
- `warnings: string[]`

### Prompt optimization output schema
- `optimizedPrompt: string`
- `changes: string[]`
- `whyItHelps: string`

---

## Risks and Mitigations

1. Cost spikes from unbounded prompts
- Mitigation: strict length caps, token caps, quotas, telemetry alerts

2. Inconsistent output formatting
- Mitigation: structured outputs + schema validation + fallback retries

3. Slow UX on long explanations
- Mitigation: streaming endpoint + cancel controls + progressive render

4. Abuse/misuse
- Mitigation: auth requirements, per-user limits, moderation checks, safety identifiers

5. Model drift over time
- Mitigation: pin model snapshots where practical and run evals before switching

---

## Source Notes

### Repository evidence
- `src/actions/items.ts`
- `src/actions/collections.ts`
- `src/actions/editor-preferences.ts`
- `src/lib/billing/usage-limits.ts`
- `src/app/items/[type]/page.tsx`
- `src/components/billing/UpgradePage.tsx`
- `src/components/settings/BillingPanel.tsx`
- `src/app/api/stripe/checkout/route-handler.ts`

### External references
- OpenAI Quickstart: https://developers.openai.com/api/docs/quickstart
- OpenAI SDKs and CLI: https://developers.openai.com/api/docs/libraries
- OpenAI Text generation: https://developers.openai.com/api/docs/guides/text
- OpenAI Streaming responses: https://developers.openai.com/api/docs/guides/streaming-responses
- OpenAI Rate limits: https://developers.openai.com/api/docs/guides/rate-limits
- OpenAI Safety best practices: https://developers.openai.com/api/docs/guides/safety-best-practices
- OpenAI Prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI Structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Next.js `use server`: https://nextjs.org/docs/app/api-reference/directives/use-server
- Next.js Route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route

---

## Recommendation
Proceed with Phase 1 and Phase 2 first (non-streaming AI features), because they are the highest value-to-complexity ratio and fit DevStash's existing server-action architecture. Add streaming code explanation in Phase 3 after telemetry and limits are in place.