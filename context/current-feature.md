# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Install NextAuth v5 beta and the Auth.js Prisma adapter.
- Set up the split auth config pattern for edge compatibility.
- Add GitHub OAuth authentication.
- Add Auth.js route handlers under the Next.js app router.
- Protect `/dashboard/*` routes using Next.js 16 `src/proxy.ts`.
- Redirect unauthenticated dashboard users to the default NextAuth sign-in page.
- Extend the NextAuth session type so `session.user.id` is available.
- Verify dashboard redirect, GitHub sign-in, and post-auth redirect back to `/dashboard`.

## Notes

<!-- Any extra notes -->

- Spec source: `context/features/auth-phase-1-spec.md`
- Use current Auth.js/NextAuth v5 documentation to confirm the newest config and conventions before implementation.
- Use `next-auth@beta`, not `@latest`.
- Keep `src/auth.config.ts` edge-compatible with providers only and no Prisma adapter.
- Put the full Prisma adapter/JWT strategy config in `src/auth.ts`.
- Use `src/proxy.ts` at the same level as `src/app/`, exporting `proxy` as a named export from `auth(...)`.
- Do not set a custom `pages.signIn`; use the default NextAuth sign-in page for testing.
- Required environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial setup of Next.js and Tailwind CSS
- Dashboard UI mockup with responsive layout and dummy data
- Dashboard UI Phase 1 route, shadcn setup, and layout placeholders
- Dashboard UI Phase 2 responsive collapsible sidebar with mock data navigation
- Dashboard UI Phase 3 stats, recent collections, pinned items, and recent items
- Prisma + Neon PostgreSQL setup with local Postgres migration and seed support
- Current feature set to seed development/demo data
- Implemented seed development/demo data with hashed demo credentials, system item types, collections, and sample items
- Updated database test script to fetch, validate, and display seeded demo data
- Completed seed development data feature and cleared current feature details
- Current feature set to Dashboard Collections and marked In Progress
- Implemented dashboard collection data fetching with Prisma-backed cards, type icons, accent colors, and stats
- Completed Dashboard Collections feature
- Cleared Dashboard Collections current feature details after completion
- Current feature set to Dashboard Items and marked In Progress
- Implemented dashboard item data fetching with Prisma-backed pinned and recent items, type badges, type-colored borders, and item previews
- Completed Dashboard Items feature
- Cleared Dashboard Items current feature details after completion
- Current feature set to Stats & Sidebar and marked In Progress
- Implemented database-backed dashboard stats and sidebar data with system item types, collection links, and recent collection accent dots
- Completed Stats & Sidebar feature
- Cleared Stats & Sidebar current feature details after completion
- Current feature reset to Dashboard Items and marked In Progress
- Verified Dashboard Items implementation against current spec with Prisma-backed item data already in place
- Completed Dashboard Items feature
- Cleared Dashboard Items current feature details after completion
- Reordered dashboard sidebar item types to snippets, prompts, commands, notes, files, images, and links
- Completed sidebar item type ordering update and cleared current feature details
- 2026-04-26 10:47 EDT - Loaded Add Pro Badge to Sidebar spec from `context/features/add-pro-badge-sidebar-spec.md` and set status to Not Started. User requested `add-prod-badge-sidebar-spec.md`; resolved to existing `add-pro-badge-sidebar-spec.md`.
- 2026-04-26 10:50 EDT - Started Add Pro Badge to Sidebar on branch `feature/add-pro-badge-sidebar`.
- 2026-04-26 10:53 EDT - Implemented subtle uppercase `PRO` sidebar badges for Files and Images using the shadcn/ui Badge component. Verified targeted tests, dashboard shaping tests, lint, and production build.
- 2026-04-26 11:03 EDT - Completed Add Pro Badge to Sidebar feature and cleared current feature details.
- 2026-04-27 00:01 EDT - Loaded Optimize Dashboard Data Loading as a quick-win performance feature from the code-scanner findings, focused on dashboard query efficiency and excluding authentication work.
- 2026-04-27 00:02 EDT - Started Optimize Dashboard Data Loading on branch `feature/optimize-dashboard-data-loading`.
- 2026-04-27 00:10 EDT - Implemented Optimize Dashboard Data Loading with shared dashboard user resolution, slim dashboard item selects, batched collection type summaries, and collection shaping from count/type summaries. Verified local tests, lint, and production build; `npm run db:test` was blocked by database connection refusal.
- 2026-04-27 00:15 EDT - Completed Optimize Dashboard Data Loading, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 09:14 EDT - Loaded Auth Setup - NextAuth + GitHub Provider spec from `context/features/auth-phase-1-spec.md` and set status to Not Started.
- 2026-04-27 09:15 EDT - Started Auth Setup - NextAuth + GitHub Provider on branch `feature/auth-setup-nextauth-github-provider`.
- 2026-04-27 09:31 EDT - Implemented Auth Setup - NextAuth + GitHub Provider with NextAuth v5 beta, Auth.js Prisma adapter, edge-safe split config, GitHub OAuth provider, route handlers, dashboard proxy protection, session user id mapping, and automated auth tests. Verified full Node test suite, TypeScript, lint, and production build.
- 2026-04-27 09:47 EDT - Fixed local GitHub OAuth callback errors by correcting the `.env` GitHub secret key, starting local Postgres on port 5433, and allowing GitHub email account linking only in development for existing local users. Verified Playwright GitHub login reaches `/dashboard`, full Node tests, TypeScript, lint, and production build.
