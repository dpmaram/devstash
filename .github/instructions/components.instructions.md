---
description: "Use when creating or modifying React components. Covers server/client patterns, shadcn conventions, and component organization."
applyTo: ["src/components/**", "src/app/**/*.tsx"]
---

# React Component Guidelines

## Server vs Client

### Server Components (Default)

```typescript
// No directive needed - server by default
import { prisma } from '@/lib/prisma';

export async function ItemList({ userId }: { userId: string }) {
  const items = await prisma.item.findMany({ where: { userId } });
  return <ul>{items.map(item => <li key={item.id}>{item.title}</li>)}</ul>;
}
```

### Client Components

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## Component Organization

```
src/components/
├── ui/           # shadcn primitives (Button, Dialog, Sheet, etc.)
├── dashboard/    # Feature components (ItemCards, ItemDrawer, etc.)
├── auth/         # Auth forms and providers
└── profile/      # Profile page components
```

## shadcn/ui Patterns

### Using Primitives

```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export function CreateItemDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Item</Button>
      </DialogTrigger>
      <DialogContent>
        {/* Content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Adding New Components

```bash
npx shadcn@latest add dialog
```

## Props Patterns

### TypeScript Interface

```typescript
interface ItemCardProps {
  item: DashboardItem;
  onSelect?: (id: string) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  // ...
}
```

### With Children

```typescript
interface ShellProps {
  children: React.ReactNode;
  title?: string;
}
```

## Event Handling

### Server Action in Client Component

```typescript
'use client';

import { createItem } from '@/actions/items';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CreateForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await createItem({
      title: formData.get('title') as string,
    });

    if (result.success) {
      toast.success('Item created');
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

## Styling

- Use Tailwind utility classes
- Use `cn()` helper for conditional classes
- Follow design tokens in `globals.css`

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary bg-primary/10'
)} />
```
