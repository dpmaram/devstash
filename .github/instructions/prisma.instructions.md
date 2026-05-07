---
description: "Use when working with Prisma schema, migrations, database queries, or data layer code. Covers schema design, migration safety, and query patterns."
applyTo: ["prisma/**", "src/lib/db/**", "src/lib/prisma.ts"]
---

# Prisma & Database Guidelines

## Schema Changes

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name descriptive_name`
3. Never use `prisma db push` - always use migrations

## Migration Safety

- Always create reversible migrations when possible
- Test migrations locally before committing
- Check for data loss implications before dropping columns
- Use `@default()` for new required fields on existing tables

## Query Patterns

### Ownership Filtering

Always filter by `userId` for user-owned resources:

```typescript
const items = await prisma.item.findMany({
  where: { userId },
  // ...
});
```

### Select Shape

Use explicit `select` for dashboard queries to minimize data transfer:

```typescript
const DASHBOARD_ITEM_SELECT = {
  id: true,
  title: true,
  type: { select: { slug: true, name: true } },
  // Only what's needed for the view
} satisfies Prisma.ItemSelect;
```

### Relations

Use `include` sparingly - prefer `select` with nested selects for performance.

## Seed Data

- Seed file: `prisma/seed-data.ts`
- Seed runner: `prisma/seed.ts`
- Run: `npm run db:seed`
- Demo user password is hashed with bcrypt

## Common Patterns

### Find or Create

```typescript
const result = await prisma.collection.upsert({
  where: { slug_userId: { slug, userId } },
  create: { slug, name, userId },
  update: {},
});
```

### Soft Relationships (Tags)

```typescript
await prisma.item.update({
  where: { id },
  data: {
    tags: {
      set: [], // Clear existing
      connectOrCreate: tags.map(name => ({
        where: { name_userId: { name, userId } },
        create: { name, userId },
      })),
    },
  },
});
```
