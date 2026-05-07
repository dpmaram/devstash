---
description: "Use when creating or modifying API routes. Covers authentication, error handling, and response patterns."
applyTo: "src/app/api/**"
---

# API Route Guidelines

## Route Handler Structure

```typescript
// src/app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Check auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get params
  const { id } = await params;

  try {
    // 3. Fetch data
    const item = await getItemById(id, session.user.id);
    
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Common Patterns

### File Upload

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate and upload...
}
```

### File Download Proxy

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Verify ownership, get S3 key...
  const stream = await downloadFromS3(key);

  return new NextResponse(stream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

### Rate Limiting

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, retryAfter } = await rateLimit(ip, 'auth', 5, 60);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // Continue...
}
```

## Response Patterns

### Success

```typescript
return NextResponse.json({ data: result });
return NextResponse.json(result, { status: 201 }); // Created
return new NextResponse(null, { status: 204 });    // No content
```

### Errors

```typescript
return NextResponse.json({ error: 'Message' }, { status: 400 }); // Bad request
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Internal error' }, { status: 500 });
```

## Route Segments

- `route.ts` - API handler
- `[param]` - Dynamic segment
- `[[...slug]]` - Catch-all segment
