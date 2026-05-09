# Homepage (App Implementation)

## Overview

Implement the real app homepage from the prototype in `prototypes/homepage/` using the project stack and patterns (Next.js App Router, Tailwind, shadcn/ui).

## Requirements

- Build homepage at `/` using the prototype visual/content direction from `prototypes/homepage/`
- Use Tailwind classes and shadcn/ui components (Button, Badge, etc.) instead of standalone prototype CSS where practical
- Keep code clean and DRY: extract reusable section/components and shared data arrays
- Preserve dark theme + item-type accent colors from the mockup
- Keep responsive behavior from mockup (mobile stacking, rotated hero arrow, single-column grids)
- Match section order/content:
  - Fixed top nav
  - Hero text + chaos-to-order visual
  - Features grid
  - AI/Pro section
  - Pricing (monthly/yearly toggle)
  - CTA
  - Footer

## Component Architecture

### Server Components (default)

- `src/app/page.tsx` should remain a server component
- Render mostly static sections in server components:
  - `HomepageNav` (layout shell + links)
  - `HomepageHero` (static copy + visual shell)
  - `HomepageFeatures`
  - `HomepageAISection`
  - `HomepagePricing` (static card content)
  - `HomepageCTA`
  - `HomepageFooter`

### Client Components (interactive only)

Create focused client components only where interactivity is needed:

- `ChaosAnimation` (`"use client"`)
  - requestAnimationFrame icon drift/bounce/repel behavior
- `PricingToggle` (`"use client"`)
  - monthly/yearly switch updating visible Pro price (`$8/mo` and `$72/yr`)
- `ScrollReveal` / section reveal wrapper (`"use client"`)
  - fade-in on viewport entry
- Optional: `NavScrollState` (`"use client"`)
  - increases navbar opacity on scroll

Keep all non-interactive markup in server components.

## Links and Navigation

Use real routes/targets (no dead links):

- Logo -> `/`
- Top nav "Features" -> `/#features`
- Top nav "Pricing" -> `/#pricing`
- "Sign In" -> `/sign-in`
- Primary CTA buttons (Get Started / Start for Free / Start Building Your Stash) -> `/register`
- Footer links:
  - Product links to homepage anchors
  - If route exists, use real route; otherwise use `#` placeholders only with TODO comment

## Styling Notes

- Use Tailwind tokens/utilities and existing design language from the app
- Keep accent mappings:
  - Snippet `#3b82f6`
  - Prompt `#f59e0b`
  - Command `#06b6d4`
  - Note `#22c55e`
  - File `#64748b`
  - Image `#ec4899`
  - URL `#6366f1`
- Prefer reusable class patterns/helpers over duplicated long class strings

## Implementation Notes

- Source of truth for structure/content: `prototypes/homepage/index.html`
- Source of truth for interactions: `prototypes/homepage/script.js`
- Translate prototype behavior into React-safe hooks/effects inside client components
- Avoid introducing duplicate static homepage in `public/index.html` for final app route behavior

## Acceptance Criteria

- Visiting `/` renders the new homepage (not 404, not old placeholder)
- Layout and content match the mockup intent across desktop/mobile
- Interactive elements work:
  - chaos animation
  - pricing toggle
  - scroll reveal
  - nav opacity on scroll
- Buttons/links route correctly
- Lint, typecheck, and tests pass
