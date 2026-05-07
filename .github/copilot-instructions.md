# DevStash - Copilot Instructions

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Quick Context

Read these files when you need deeper understanding:

- [Project Overview](../context/project-overview.md) - Product vision and scope
- [Code Structure](../context/code-structure.md) - File organization
- [Current Feature](../context/current-feature.md) - Active development work

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL on Neon, Prisma ORM
- **Auth**: NextAuth v5 (Auth.js) with Credentials + GitHub providers
- **UI**: shadcn/ui components, Tailwind CSS v4
- **Storage**: AWS S3 for file/image uploads
- **Testing**: Vitest (Node mode, server-side only)

## Code Conventions

### Server Actions

- Located in `src/actions/` with `.ts` extension
- Use `"use server"` directive at top of file
- Validate input with Zod schemas
- Resolve dashboard user before database operations
- Return `{ success, error?, data? }` response shape

### Data Layer

- Query functions in `src/lib/db/` (e.g., `items.ts`, `collections.ts`)
- Shaping functions in `*-shaping.ts` files transform Prisma results to view models
- Always filter by `userId` for ownership safety

### Components

- Server components by default in `src/app/`
- Client components use `"use client"` directive
- UI primitives in `src/components/ui/` (shadcn style)
- Feature components in `src/components/dashboard/`

### Testing

- Test files co-located with source: `*.test.ts`
- Run tests: `npm test`
- Focus tests: `npm test -- --grep "pattern"`
- No DOM/React component tests in the unit suite

## Commands

```bash
npm run dev          # Start dev server
npm test             # Run Vitest tests
npm run lint         # ESLint check
npm run build        # Production build
npx tsc --noEmit     # TypeScript check
npm run db:seed      # Seed demo data
npm run db:test      # Test database connectivity
```

## Neon Database Safety

- Always use the `development` branch for local work
- Never target production/main branch without explicit approval
- Pass explicit `projectId` and `branchId` to Neon MCP tools
