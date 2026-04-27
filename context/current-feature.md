# Current Feature: Auth UI - Sign In, Register & Sign Out

<!-- Feature Name -->

Auth UI - Sign In, Register & Sign Out

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Replace NextAuth default pages with custom sign-in and registration UI.
- Create `/sign-in` with email/password fields, GitHub sign-in, register link, validation, and error display.
- Create `/register` with name, email, password, confirm password fields, validation, `/api/auth/register` submission, and successful redirect to sign-in.
- Update the dashboard sidebar user area to show avatar, user name, and email.
- Add avatar click behavior with profile navigation and a sign-out dropdown/action.
- Create a reusable avatar component that uses GitHub images when available and initials fallback otherwise.

## Notes

<!-- Any extra notes -->

- Spec source: `context/features/auth-phase-3-spec.md`.
- Avatar fallback should generate initials from the user's name, for example `Brad Traversy` to `BT`.
- Manual checks from the spec include custom sign-in rendering, GitHub sign-in, email/password sign-in, avatar display, sign-out behavior, and registration redirect.

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
- 2026-04-27 18:28 EDT - Completed Auth Credentials - Email/Password Provider, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 18:30 EDT - Loaded Auth UI - Sign In, Register & Sign Out spec from `context/features/auth-phase-3-spec.md` and set status to Not Started.
- 2026-04-27 18:31 EDT - Started Auth UI - Sign In, Register & Sign Out on branch `feature/auth-ui-sign-in-register-sign-out`.
- 2026-04-27 18:42 EDT - Implemented custom sign-in and register pages, auth form validation, custom Auth.js sign-in routing, session-backed dashboard user display, avatar initials/image fallback, protected profile page, avatar profile link, and sign-out menu. Verified full local tests, TypeScript, lint, production build, database smoke test, credentials sign-in to `/dashboard`, avatar navigation to `/profile`, sidebar sign-out to `/sign-in`, and registration redirect to `/sign-in`.
- 2026-04-27 18:48 EDT - Verified the sidebar user block with a newly registered credentials account; the dashboard showed that account's name, email, and initials instead of the seeded demo user.
- 2026-04-27 18:51 EDT - Replaced the post-registration inline success message with a toast notification that says `Account created. You can now log in.` Verified the registration redirect toast in-browser, full local tests, TypeScript, lint, and production build.
