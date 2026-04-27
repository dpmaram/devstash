# Current Feature: Auth Credentials - Email/Password Provider

<!-- Feature Name -->

Auth Credentials - Email/Password Provider

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Add Credentials provider support for email/password authentication with registration.
- Use bcryptjs to hash new passwords and validate credential sign-ins.
- Add the User password field through a Prisma migration if it is not already present.
- Update the Auth.js split configuration with a Credentials placeholder in `auth.config.ts` and bcrypt validation in `auth.ts`.
- Create `POST /api/auth/register` to validate registration input, reject existing users, hash passwords, create users, and return success/error responses.
- Verify email/password sign-in redirects to `/dashboard` and GitHub OAuth still works.

## Notes

<!-- Any extra notes -->

- Spec source: `context/features/auth-phase-2-spec.md`.
- This follows the completed Auth Phase 1 NextAuth + GitHub provider setup.
- Do not use `prisma db push`; schema changes must go through Prisma Migrate.
- Manual checks from the spec include registration via curl, `/api/auth/signin`, dashboard redirect, and a GitHub OAuth regression check.

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
- 2026-04-27 09:55 EDT - Completed Auth Setup - NextAuth + GitHub Provider, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 09:57 EDT - Loaded Auth Credentials - Email/Password Provider spec from `context/features/auth-phase-2-spec.md` and set status to Not Started.
- 2026-04-27 09:58 EDT - Started Auth Credentials - Email/Password Provider on branch `feature/auth-credentials-email-password-provider`.
- 2026-04-27 10:42 EDT - Implemented Auth Credentials - Email/Password Provider with Auth.js Credentials support, bcrypt-backed password verification, registration API route, default sign-in redirect to `/dashboard`, and automated auth tests. Verified full local tests, TypeScript, lint, production build, database smoke test, browser credentials sign-in to `/dashboard`, and GitHub OAuth initiation.
