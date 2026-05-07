---
description: "Use when writing tests, debugging test failures, or setting up test infrastructure. Covers Vitest patterns and server-side testing."
applyTo: ["**/*.test.ts", "vitest.config.ts"]
---

# Testing Guidelines

## Test Framework

- **Vitest** in Node mode for server-side tests
- No DOM or React component tests in this suite
- Tests co-located with source files

## Running Tests

```bash
npm test                        # Run all tests
npm test -- --grep "pattern"    # Filter by name
npm test -- src/actions/        # Filter by path
npm test -- --watch             # Watch mode
```

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('featureName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do expected behavior', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toEqual({ success: true, data: ... });
  });
});
```

## Mocking Patterns

### Mock Prisma

```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

### Mock Auth

```typescript
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'test-user' } })),
}));
```

### Mock Server Functions

```typescript
vi.mock('@/lib/db/items', () => ({
  getItemById: vi.fn(),
  createItem: vi.fn(),
}));
```

## Testing Server Actions

```typescript
import { createItem } from '@/actions/items';

it('should create item with valid input', async () => {
  vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });
  vi.mocked(createItemDb).mockResolvedValue({ id: 'item-1', ... });

  const result = await createItem({
    title: 'Test',
    typeSlug: 'snippet',
    content: 'code',
  });

  expect(result.success).toBe(true);
  expect(createItemDb).toHaveBeenCalledWith(expect.objectContaining({
    title: 'Test',
  }));
});
```

## Assertions

```typescript
expect(result).toBe(value);           // Strict equality
expect(result).toEqual(object);       // Deep equality
expect(result).toMatchObject(partial); // Partial match
expect(fn).toHaveBeenCalledWith(...); // Function calls
expect(fn).toHaveBeenCalledTimes(1);  // Call count
```

## Red-Green Pattern

1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
