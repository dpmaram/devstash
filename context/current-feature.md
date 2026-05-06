# Current Feature

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->


## Notes

<!-- Any extra notes -->


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
- 2026-04-27 18:54 EDT - Completed Auth UI - Sign In, Register & Sign Out, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 19:03 EDT - Loaded Setup Email Verification on Register from inline user request. Feature will require registered email/password users to click a Resend email verification link before sign-in.
- 2026-04-27 19:06 EDT - Started Setup Email Verification on Register.
- 2026-04-27 19:14 EDT - Implemented email verification on registration with hashed single-use tokens, Resend transactional email delivery, verification redirect handling, blocked credentials sign-in until `emailVerified` is set, updated auth toast messaging, and placeholder email env docs. Verified focused auth/email tests, full local tests, TypeScript, lint, production build, database smoke test, and Prisma migration status.
- 2026-04-27 19:15 EDT - Added clean registration failure handling for Resend send errors so users are not created when verification email delivery fails. Re-ran full tests, TypeScript, lint, production build, database smoke test, and Prisma migration status.
- 2026-04-27 19:35 EDT - Completed Setup Email Verification on Register, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 19:38 EDT - Loaded Add Email Verification Toggle from inline user request. Feature will add a simple flag, likely env-backed, to disable email verification while Resend domain setup is incomplete.
- 2026-04-27 19:40 EDT - Started Add Email Verification Toggle on branch `feature/add-email-verification-toggle`.
- 2026-04-27 23:03 EDT - Implemented the email verification toggle with `EMAIL_VERIFICATION_ENABLED`, disabled local verification in `.env`, skipped Resend/token creation when disabled, kept enabled behavior unchanged, and updated registration success messaging. Verified focused auth tests, full local tests, TypeScript, lint, and production build.
- 2026-04-27 23:08 EDT - Extended the toggle to credentials sign-in so existing unverified email/password users can sign in when email verification is disabled. Verified focused auth tests, full local tests, TypeScript, lint, and production build.
- 2026-04-27 23:11 EDT - Completed Add Email Verification Toggle, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 23:12 EDT - Loaded Forgot Password from inline user request. Feature will add forgot-password and reset-password flows using the existing `VerificationToken` model for password reset tokens.
- 2026-04-27 23:13 EDT - Started Forgot Password on branch `feature/forgot-password`.
- 2026-04-27 23:20 EDT - Implemented Forgot Password with sign-in recovery link, forgot/reset password pages, API routes, namespaced hashed password reset tokens in `VerificationToken`, Resend reset email delivery, generic request responses, reset-password updates, and invalid/expired link handling. Verified focused password-reset tests, full local tests, TypeScript, lint, and production build.
- 2026-04-27 23:35 EDT - Completed Forgot Password, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-27 23:37 EDT - Loaded Profile Page spec from `context/features/profile-spec.md` and set status to Not Started.
- 2026-04-27 23:39 EDT - Started Profile Page on branch `feature/profile-page`.
- 2026-04-27 23:48 EDT - Implemented Profile Page with signed-in profile data, account creation/auth method display, usage stats by item type, credentials-only password changes, delete-account confirmation, and profile API routes. Verified focused tests, full local tests, TypeScript, lint, production build, and local `/profile` auth redirect.
- 2026-04-27 23:53 EDT - Completed Profile Page, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-28 00:27 EDT - Loaded Rate Limiting for Auth spec from `context/features/rate-limiting-spec.md` and set status to Not Started.
- 2026-04-28 00:28 EDT - Started Rate Limiting for Auth on branch `feature/rate-limiting-for-auth`.
- 2026-04-28 00:40 EDT - Implemented Rate Limiting for Auth with Upstash-backed sliding-window limits, reusable rate-limit utilities, 429 `Retry-After` responses, credentials sign-in throttling, resend-verification endpoint throttling, and profile password-change throttling. Verified focused auth tests, full local tests, TypeScript, lint, and production build.
- 2026-04-28 00:49 EDT - Fixed credentials login rate-limit messaging so the Auth.js redirect carries retry seconds and the sign-in page displays `Too many attempts. Please try again in X minutes.` Verified focused credentials/form tests, full local tests, TypeScript, lint, and production build.
- 2026-04-28 00:55 EDT - Completed Rate Limiting for Auth, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-28 10:06 EDT - Loaded Item Types Documentation spec from `context/features/item-types.md` and set status to Not Started.
- 2026-04-28 10:08 EDT - Started Item Types Documentation on branch `feature/item-types-documentation`.
- 2026-04-28 10:12 EDT - Completed Item Types Documentation with current item type docs, CRUD architecture research docs, research skill support, and dashboard item accent-border alignment; merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-28 10:28 EDT - Loaded Three Column Item Listing from inline user request and set status to Not Started.
- 2026-04-28 10:29 EDT - Started Three Column Item Listing on branch `feature/three-column-item-listing`.
- 2026-04-28 10:30 EDT - Updated the item listing grid to render one column on mobile, two columns on medium screens, and three columns on larger screens while preserving existing item card styling.
- 2026-04-28 10:32 EDT - Verified the layout update with `npm test`, `npm run lint`, and `npx tsc --noEmit`.
- 2026-04-28 10:33 EDT - Ran the feature test step. No new unit tests were added because the feature changed responsive component markup only, with no new or modified server actions/utilities; `npm test` passed.
- 2026-04-28 15:04 EDT - Re-verified before completion with `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- 2026-04-28 17:28 EDT - Completed Three Column Item Listing, merged it into `main`, deleted the local feature branch, cleared current feature details, and re-ran `npm test` on `main`.
- 2026-04-28 17:47 EDT - Loaded Item Drawer spec from `context/features/item-drawer-spec.md` and set status to Not Started.
- 2026-04-28 17:48 EDT - Started Item Drawer on branch `feature/item-drawer`.
- 2026-04-28 17:57 EDT - Implemented the Item Drawer start scope with authenticated `/api/items/[id]` detail fetching, item detail shaping/query support, protected `/items` routes, reusable Sheet drawer UI, dashboard card click-to-open behavior, and typed item listing pages that reuse the drawer.
- 2026-04-28 17:57 EDT - Verified Item Drawer with focused Vitest tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 17:59 EDT - Ran the feature test step. Existing Item Drawer server/data tests cover item detail shaping, full-detail select shape, item route auth/not-found/success responses, item type route slug normalization, and `/items` proxy protection; `npm test` passed.
- 2026-04-28 18:01 EDT - Re-verified before completion with `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 18:03 EDT - Completed Item Drawer, merged it into `main`, deleted the local feature branch, cleared current feature details, and re-ran `npm test` on `main`.
- 2026-04-28 18:05 EDT - Loaded Item Drawer Edit Mode spec from `context/features/item-drawer-edit-spec.md` and set status to Not Started.
- 2026-04-28 18:07 EDT - Started Item Drawer Edit Mode on branch `feature/item-drawer-edit-mode`.
- 2026-04-28 18:19 EDT - Implemented Item Drawer Edit Mode with a Zod-validated `updateItem` server action, ownership-safe item update data layer, tag normalization/replacement, inline drawer edit fields, Save/Cancel mode, toast notifications, and router refresh after save.
- 2026-04-28 18:19 EDT - Verified Item Drawer Edit Mode with focused action/data tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 18:26 EDT - Fixed drawer `Item not found` errors for signed-in non-demo users by loading dashboard/list item data for the authenticated session user instead of the demo fallback user. Verified focused regression tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- 2026-04-28 18:29 EDT - Restored demo dashboard fallback for signed-in users with no items, and updated item detail lookup to use the same resolved dashboard-data user as the cards. Verified focused regression tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 18:32 EDT - Fixed edit save `Item not found` errors by resolving the save action through the same dashboard-data user as the drawer/card data before updating. Verified focused regression tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 18:34 EDT - Completed Item Drawer Edit Mode after browser confirmation that drawer edit/save works correctly.
- 2026-04-28 18:36 EDT - Completed Item Drawer Edit Mode, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-28 19:16 EDT - Loaded Delete Item Functionality from inline user request and set status to Not Started.
- 2026-04-28 19:17 EDT - Started Delete Item Functionality on branch `feature/delete-item-functionality`.
- 2026-04-28 19:20 EDT - Implemented Delete Item Functionality with an ownership-safe `deleteItem` data function, server action, shadcn/Base UI style confirmation dialog in the drawer, success/error toasts, drawer close, and router refresh after delete.
- 2026-04-28 19:20 EDT - Verified Delete Item Functionality with focused action/data tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 19:24 EDT - Completed Delete Item Functionality.
- 2026-04-28 19:26 EDT - Completed Delete Item Functionality, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-04-28 19:30 EDT - Loaded Item Create spec from `context/features/item-create-spec.md` and set status to Not Started.
- 2026-04-28 19:30 EDT - Started Item Create on branch `feature/item-create`.
- 2026-04-28 19:35 EDT - Implemented Item Create with a Zod-validated `createItem` server action, item data-layer creation with system type lookup and tag connection, and a top-bar shadcn/Base UI style modal for type-specific item creation.
- 2026-04-28 19:35 EDT - Verified Item Create with focused action/data tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 19:41 EDT - Fixed dashboard counts dropping to zero after creating the first signed-in user item by keeping dashboard data on the resolved fallback/dashboard user and creating new items through that same dashboard-data user. Verified focused regression tests, full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- 2026-04-28 19:43 EDT - Completed Item Create.
- 2026-04-28 19:45 EDT - Completed Item Create, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-05-04 08:22 EDT - Loaded Code Editor spec from `context/features/code-editor-spec.md` and set status to Not Started.
- 2026-05-04 08:22 EDT - Started Code Editor on branch `feature/code-editor`.
- 2026-05-04 08:39 EDT - Implemented Code Editor with Monaco-backed snippet/command view, edit, and create surfaces; kept textarea behavior for notes, prompts, and other non-code types; added editor language normalization tests, themed editor chrome, copy action, and max-height scrolling. Verified focused code-editor tests, full local tests, TypeScript, lint, production build, git diff whitespace check, and browser smoke tests for drawer/create behavior.
- 2026-05-04 08:46 EDT - Switched Monaco to browser-only local package loading with explicit worker mapping to avoid runtime CDN loading and main-thread worker fallback. Re-verified focused code-editor tests, full local tests, TypeScript, lint, production build, git diff whitespace check, and a dev-server dashboard smoke request.
- 2026-05-04 08:51 EDT - Added type-specific New Item buttons on supported item type pages with dialog preselection for the active type. Verified create-type helper tests, full local tests, TypeScript, lint, production build, and git diff whitespace check; browser smoke was not run because dev-server approval was rejected.
- 2026-05-04 08:57 EDT - Completed Code Editor, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-05-04 09:00 EDT - Loaded Markdown Editor spec from `context/features/markdown-editor-spec.md`, resolved from requested `marketdown-editor-spec.md`, and started Markdown Editor.
- 2026-05-04 09:12 EDT - Implemented Markdown Editor with GFM preview, dark markdown styling, edit/readonly modes, copy action, note/prompt create and drawer integration, and focused markdown editor helper tests. Verified full local tests, TypeScript, lint, production build, and git diff whitespace check.
- 2026-05-04 09:23 EDT - Investigated Markdown Editor rendering and confirmed `react-markdown` emits formatted HTML without needing Tailwind Typography. Increased the default markdown editor height to 320px while preserving the 400px cap, re-verified tests, TypeScript, lint, production build, whitespace, and restarted the dev server.
- 2026-05-04 09:28 EDT - Completed Markdown Editor, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-05-05 08:26 EDT - Loaded File Upload with Cloudflare R2 spec from `context/features/file-image-spec.md` and set status to Not Started.
- 2026-05-05 08:27 EDT - Started File Upload with Cloudflare R2.
- 2026-05-05 08:42 EDT - Implemented File Upload with Cloudflare R2 with upload validation, R2 storage helpers, authenticated upload and download proxy routes, file/image create flow, drawer image preview/download controls, and R2 cleanup on item delete. Verified focused upload/data/action tests, full local tests, TypeScript, lint, production build, and git diff whitespace check.
- 2026-05-05 09:29 EDT - Fixed type-page top-bar New Item behavior so file and image pages preselect their upload type from every add entry point. Verified full local tests, TypeScript, lint, production build, git diff whitespace check, and browser behavior on `/items/files`.
- 2026-05-05 09:29 EDT - Completed File Upload with Cloudflare R2, merged it into `main`, deleted the local feature branch, and cleared current feature details.
- 2026-05-05 23:25 EDT - Loaded Image Gallery View spec from `context/features/image-display-spec.md` and set status to Not Started.
- 2026-05-05 23:27 EDT - Started Image Gallery View on branch `feature/image-gallery-view`.
- 2026-05-05 23:32 EDT - Implemented Image Gallery View with image-specific thumbnail gallery cards, authenticated inline thumbnail URLs, 16:9 object-cover thumbnails, and subtle hover zoom. Verified full local tests, TypeScript, lint, production build, git diff whitespace check, and browser grid mode on `/items/images`.
- 2026-05-05 23:37 EDT - Completed Image Gallery View, merged it into `main`, deleted the local feature branch, and cleared current feature details.
