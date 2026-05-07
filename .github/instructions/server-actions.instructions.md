---
description: "Use when creating or modifying server actions. Covers validation, auth, error handling, and response patterns."
applyTo: "src/actions/**"
---

# Server Actions Guidelines

## File Structure

```typescript
'use server';

import { auth } from '@/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema
const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  typeSlug: z.string(),
});

// Action
export async function createItem(input: z.infer<typeof CreateItemSchema>) {
  // 1. Validate input
  const parsed = CreateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  // 2. Check auth
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Resolve dashboard user (for demo fallback)
  const userId = await resolveDashboardUserId(session.user.id);

  try {
    // 4. Database operation
    const item = await createItemDb({ ...parsed.data, userId });

    // 5. Revalidate cache
    revalidatePath('/dashboard');

    return { success: true, data: item };
  } catch (error) {
    console.error('createItem error:', error);
    return { success: false, error: 'Failed to create item' };
  }
}
```

## Response Shape

Always return consistent shape:

```typescript
type ActionResult<T = unknown> = 
  | { success: true; data?: T }
  | { success: false; error: string };
```

## Dashboard User Resolution

For demo mode support, resolve the effective user:

```typescript
import { resolveDashboardUserId } from '@/lib/db/dashboard-user';

const userId = await resolveDashboardUserId(session.user.id);
```

## Validation Patterns

### Required Fields

```typescript
const schema = z.object({
  title: z.string().min(1, 'Title is required'),
});
```

### Optional with Transform

```typescript
const schema = z.object({
  tags: z.string()
    .optional()
    .transform(v => v?.split(',').map(t => t.trim()).filter(Boolean) ?? []),
});
```

### Type-Specific Validation

```typescript
const schema = z.discriminatedUnion('typeSlug', [
  z.object({ typeSlug: z.literal('snippet'), content: z.string().min(1) }),
  z.object({ typeSlug: z.literal('link'), url: z.string().url() }),
]);
```

## Error Handling

- Log errors server-side with `console.error`
- Return generic messages to client
- Never expose internal error details

## Cache Invalidation

```typescript
revalidatePath('/dashboard');           // Specific path
revalidatePath('/items/[slug]', 'page'); // Dynamic route
revalidatePath('/', 'layout');           // Full layout tree
```
