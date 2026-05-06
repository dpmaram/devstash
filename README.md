# DevStash

DevStash is a developer knowledge hub for snippets, commands, prompts, notes, files, images, links, and custom types.

## Stack

- Next.js 16 with React 19 and TypeScript
- Tailwind CSS v4 and shadcn/ui-style components
- Prisma ORM with PostgreSQL
- Auth.js data model support
- AWS S3 uploads and OpenAI-powered assistive features

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` for the main page or `http://localhost:3000/dashboard` for the database-backed dashboard.

## Database

Set the required variables in `.env`:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run reviewed development migrations:

```bash
npm run prisma:migrate
```

Seed demo data:

```bash
npm run db:seed
```

Do not use `prisma db push` in this project. Schema changes should go through Prisma Migrate.

## Useful Commands

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run db:test
```

`npm test` runs Vitest in Node mode for server actions and utilities. Component-rendering and DOM tests are intentionally outside this unit test suite.

## Project Context

Start with these files before feature work:

- `context/project-overview.md`
- `context/code-structure.md`
- `context/ai-integration.md`
- `context/current-feature.md`
- `context/coding-standards.md`
- `context/ai-interaction.md`
