# AI Integration

## Current State

DevStash has AI capabilities defined in the product plan, but there is no runtime OpenAI integration in the application code yet. The current codebase focuses on the dashboard, Prisma-backed data, seed data, and UI structure.

## Planned Capabilities

The planned AI features are:

- AI auto-tagging for saved items.
- Summaries for notes, files, and longer developer content.
- Code explanation for snippets.
- Prompt optimization for stored prompts.

## Model Direction

The project overview currently targets OpenAI `gpt-5-nano` for AI features. Keep model selection configurable through environment variables when implementation starts.

## Implementation Guardrails

- AI features should be assistive and should not block saving or editing items.
- Generated outputs should be stored separately from original user content.
- Pro feature gates should control access, but development can keep Pro capabilities available to all users.
- Token usage should be logged so billing and usage limits can be added later.
- Do not send file or image contents to an AI provider until upload, storage, and user consent behavior are explicit.

## Related Context

- `context/project-overview.md` describes the product-level AI roadmap.
- `context/ai-interaction.md` describes how AI coding agents should work in this repo.
