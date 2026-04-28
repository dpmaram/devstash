# Item CRUD Architecture

This document proposes a unified CRUD architecture for all 7 DevStash item types: `snippet`, `prompt`, `command`, `note`, `file`, `image`, and `link`.

The goal is one route family, one mutation surface, and shared components that adapt to the selected item type. Type-specific behavior should live in UI/form configuration and display components, not in separate action files.

## Source Notes

- `context/research/item-crud-research.md` lists `docs/content-types.md` and `src/lib/constants.tsx`, but neither file exists in the current codebase.
- The closest current documentation source is `docs/item-types.md`.
- Current read-side item code lives in `src/lib/db/items.ts`, `src/lib/db/item-shaping.ts`, and `src/lib/db/dashboard-query-shapes.ts`.
- Current route links already point to plural item type paths such as `/items/snippets`, `/items/prompts`, and `/items/images`.
- There are no current `/items/[type]` pages or item mutation actions; this is a target architecture.

## Target File Structure

```text
src/app/items/
  actions.ts
  [type]/
    page.tsx
    loading.tsx
    not-found.tsx

src/components/items/
  ItemTypePage.tsx
  ItemList.tsx
  ItemListRow.tsx
  ItemEditorDrawer.tsx
  ItemDeleteDialog.tsx
  ItemTypeEmptyState.tsx
  fields/
    TextContentFields.tsx
    UrlContentFields.tsx
    FileContentFields.tsx

src/lib/db/
  items.ts
  item-shaping.ts
  dashboard-query-shapes.ts

src/lib/items/
  item-route.ts
  item-form-config.ts
  item-validation.ts
  item-mutations.ts
```

## Route Model

Use one dynamic route for item lists:

```text
/items/[type]
```

The `[type]` segment should use plural public route names because existing dashboard links generate paths such as `/items/snippets`.

| Route | Resolved Slug | Content Type |
| --- | --- | --- |
| `/items/snippets` | `snippet` | `TEXT` |
| `/items/prompts` | `prompt` | `TEXT` |
| `/items/commands` | `command` | `TEXT` |
| `/items/notes` | `note` | `TEXT` |
| `/items/files` | `file` | `FILE` |
| `/items/images` | `image` | `FILE` |
| `/items/links` | `link` | `URL` |

`src/lib/items/item-route.ts` should own route parsing:

- Convert plural route params to canonical item type slugs.
- Reject unknown route params with `notFound()`.
- Build hrefs from canonical slugs so links stay consistent.
- Keep route naming separate from database writes.

Example responsibilities:

```ts
export function parseItemTypeRouteParam(type: string): ItemTypeSlug | null;
export function getItemTypeHref(slug: ItemTypeSlug): string;
```

## Server Page Flow

`src/app/items/[type]/page.tsx` should be a server component:

1. Read `params.type`.
2. Resolve the canonical item type slug through `item-route.ts`.
3. Require an authenticated user through `auth()`.
4. Fetch the page data directly from `src/lib/db/items.ts`.
5. Render `ItemTypePage` with data and type metadata.

The page should be dynamic because it depends on session state and user-owned data.

```ts
export const dynamic = "force-dynamic";
```

The page should not perform mutations. It only coordinates auth, route parsing, data fetching, and rendering.

## Data Fetching

Keep query functions in `src/lib/db/items.ts`, following the existing dashboard pattern where server components call `lib/db` directly.

Recommended read functions:

| Function | Purpose |
| --- | --- |
| `getItemTypeBySlug(slug)` | Load the selected system item type. |
| `getItemsByType({ userId, typeSlug })` | Load a user's items for one item type. |
| `getItemEditorOptions(userId)` | Load collections and tags needed by the create/edit drawer. |
| `getItemByIdForUser({ userId, itemId })` | Load one item for edit/delete validation. |
| `getItemTypeNavigation(userId)` | Load item type counts for sidebar/page navigation. |

Query functions should:

- Always scope user-owned items by `userId`.
- Select only the fields needed by the page or component.
- Include item type, tags, and collections where the UI needs them.
- Reuse shared shaping helpers from `item-shaping.ts`.
- Preserve indexes already present on `Item`: `userId, updatedAt`, `userId, isFavorite`, `userId, isPinned`, and `itemTypeId`.

## Mutation Surface

Use one action file:

```text
src/app/items/actions.ts
```

Recommended server actions:

```ts
export async function createItemAction(input: CreateItemInput): Promise<ItemActionResult>;
export async function updateItemAction(input: UpdateItemInput): Promise<ItemActionResult>;
export async function deleteItemAction(input: DeleteItemInput): Promise<ItemActionResult>;
```

The action file should:

- Start with `"use server"`.
- Require an authenticated session for every mutation.
- Call shared validation helpers from `src/lib/items/item-validation.ts`.
- Call data mutation helpers from `src/lib/items/item-mutations.ts`.
- Revalidate the relevant item type route after success.
- Return typed success/error payloads that client components can render.

The action file should not:

- Contain separate branches for every visual item type.
- Know how the drawer lays out fields.
- Render labels, icons, hints, previews, or type-specific UI.
- Duplicate query shaping already handled by `lib/db`.

## Mutation Rules

All item mutations write the same Prisma `Item` model. The selected `ItemType` determines which content fields are valid.

### Create

Required base fields:

- `title`
- `itemTypeId` or canonical `typeSlug`
- `contentType`

Optional shared fields:

- `description`
- `language`
- `isFavorite`
- `isPinned`
- `tagIds` or tag names
- `collectionIds`

Content-type-specific fields:

| Content Type | Allowed Fields | Clear These Fields |
| --- | --- | --- |
| `TEXT` | `content`, optional `language` | `url`, `fileUrl`, `fileName`, `fileSize` |
| `URL` | `url` | `content`, `fileUrl`, `fileName`, `fileSize`, usually `language` |
| `FILE` | `fileUrl`, `fileName`, `fileSize` | `content`, `url`, usually `language` |

### Update

Update should:

- Verify the item belongs to the signed-in user.
- Resolve the existing item type before applying content validation.
- Allow editing shared fields and the valid content fields for the item's type.
- Replace tag and collection relationships transactionally.
- Avoid changing `userId`.

Changing an item's type can be deferred. If supported later, it should use the same content field normalization rules as create.

### Delete

Delete should:

- Verify ownership with `userId`.
- Delete the item by id.
- Rely on Prisma cascade behavior for `ItemTag` and `ItemCollection`.
- Revalidate the current `/items/[type]` route and dashboard paths that show recent/pinned items.

## Type-Specific Logic Boundary

Type-specific behavior should live in component and form config layers, not action files.

Good places for type-specific logic:

- `src/lib/items/item-form-config.ts`
- `src/components/items/fields/TextContentFields.tsx`
- `src/components/items/fields/UrlContentFields.tsx`
- `src/components/items/fields/FileContentFields.tsx`
- `src/components/items/ItemListRow.tsx`
- `src/components/dashboard/dashboard-icons.ts`
- `src/components/dashboard/sidebar-pro-badge.ts`

Avoid creating separate mutation files such as:

- `snippet-actions.ts`
- `prompt-actions.ts`
- `link-actions.ts`
- `file-actions.ts`

The action layer should care about storage class (`TEXT`, `URL`, `FILE`) and ownership. The component layer should care about labels, placeholders, field visibility, previews, icons, and user interaction.

## Component Responsibilities

### `ItemTypePage`

Server-rendered page shell for one item type.

- Receives selected type metadata, items, tags, and collections.
- Renders page title, count, toolbar, empty state, list, and editor entry point.
- Passes item type metadata into client components.

### `ItemList`

Shared list component for all item types.

- Renders list rows or cards.
- Handles sorting/filter UI if local to the page.
- Does not fetch data.

### `ItemListRow`

Shared item summary display.

- Shows title, description, tags, collections, pinned/favorite state, and updated date.
- Uses item type metadata for color and icon.
- Uses content type to choose preview text: `content`, `url`, `fileName`, or `fileUrl`.

### `ItemEditorDrawer`

Client component for create and edit.

- Opens from the page toolbar or row edit action.
- Owns form state and pending state.
- Selects the right field component from item form config.
- Calls `createItemAction` or `updateItemAction`.
- Displays action result errors.

### Field Components

Field components adapt the form body by content type:

- `TextContentFields`: markdown/code/prompt/note text, optional language field.
- `UrlContentFields`: URL input and optional metadata preview.
- `FileContentFields`: upload metadata, future R2 upload integration, file name/size display.

### `ItemDeleteDialog`

Client component for destructive confirmation.

- Shows item title and type.
- Calls `deleteItemAction`.
- Keeps deletion UX consistent across all item types.

### `ItemTypeEmptyState`

Shared empty state with type-specific copy from `item-form-config.ts`.

## Suggested Form Config

Use one config object keyed by canonical item type slug:

```ts
export const itemFormConfig = {
  snippet: {
    label: "Snippet",
    contentType: "TEXT",
    contentLabel: "Code",
    languageEnabled: true,
  },
  prompt: {
    label: "Prompt",
    contentType: "TEXT",
    contentLabel: "Prompt",
    languageEnabled: false,
  },
  command: {
    label: "Command",
    contentType: "TEXT",
    contentLabel: "Command",
    languageEnabled: true,
  },
  note: {
    label: "Note",
    contentType: "TEXT",
    contentLabel: "Note",
    languageEnabled: false,
  },
  file: {
    label: "File",
    contentType: "FILE",
  },
  image: {
    label: "Image",
    contentType: "FILE",
  },
  link: {
    label: "Link",
    contentType: "URL",
  },
} as const;
```

This keeps the UI expressive without splitting the mutation path.

## Relationship Handling

Tags and collections are shared across item types.

For create/update:

- Normalize tag names to slugs.
- Upsert tags by `userId_slug`.
- Replace `ItemTag` rows when editing tags.
- Replace `ItemCollection` rows when editing collection membership.
- Validate that selected collections belong to the signed-in user.

Use a Prisma transaction when writing the item plus relationship rows so the item does not save with partial tag or collection state.

## Revalidation

After successful mutation, revalidate:

- The current item type route: `/items/<plural-type>`.
- `/dashboard`, because recent and pinned items can change.
- `/profile`, because item counts can change.
- Any affected collection routes when collection membership changes.

The route helper should generate the plural item type path so actions do not hard-code route strings.

## Implementation Order

1. Add `src/lib/items/item-route.ts` with plural route parsing and href generation.
2. Extend `src/lib/db/items.ts` with item list, item detail, item type, tag, and collection option queries.
3. Add `src/lib/items/item-validation.ts` for shared create/update/delete input validation and field normalization.
4. Add `src/lib/items/item-mutations.ts` for Prisma writes and relationship transactions.
5. Add `src/app/items/actions.ts` as the single public mutation surface.
6. Add `src/app/items/[type]/page.tsx` as the dynamic server route.
7. Add shared item components under `src/components/items/`.
8. Add focused tests for route parsing, validation, mutation helpers, and query shaping.

## Test Coverage

Recommended tests:

- Route parsing accepts all 7 plural routes and rejects unknown values.
- Create validation enforces `content` for `TEXT`, `url` for `URL`, and file metadata for `FILE`.
- Create clears irrelevant storage fields by content type.
- Update rejects items owned by another user.
- Delete rejects items owned by another user.
- Tag and collection relationships are replaced transactionally on update.
- `/items/[type]` page calls `notFound()` for unknown types.
- `ItemEditorDrawer` renders the right field component for each content type.

## Summary

The unified CRUD system should use `/items/[type]` for routing, `src/lib/db/items.ts` for server-side reads, and `src/app/items/actions.ts` for all create/update/delete mutations. The database model already supports all item types through shared `Item`, `ItemType`, `ItemTag`, and `ItemCollection` records. The clean boundary is storage logic in validation/mutations, and type-specific user experience in shared components plus form configuration.
