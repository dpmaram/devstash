# DevStash Item Types

DevStash ships with 7 system item types used to categorize saved developer knowledge: snippets, prompts, commands, notes, files, images, and links. The canonical seed definitions live in `prisma/seed-data.ts`, while persistence is modeled by `ItemType`, `Item`, and `ItemContentType` in `prisma/schema.prisma`.

## Source Notes

- `context/research/item-types-research.md` listed `src/lib/constants.tsx` as a source, but that file does not exist in the current codebase.
- Current item type display logic is split across `src/lib/db/item-shaping.ts`, `src/components/dashboard/dashboard-icons.ts`, and `src/components/dashboard/sidebar-pro-badge.ts`.

## Item Type Reference

| Type | Stored Icon | Hex Color | Content Type | Primary Storage |
| --- | --- | --- | --- | --- |
| `snippet` | `Code` | `#3b82f6` | `TEXT` | `Item.content` |
| `prompt` | `Sparkles` | `#8b5cf6` | `TEXT` | `Item.content` |
| `command` | `Terminal` | `#f97316` | `TEXT` | `Item.content` |
| `note` | `StickyNote` | `#fde047` | `TEXT` | `Item.content` |
| `file` | `File` | `#6b7280` | `FILE` | `Item.fileUrl`, `Item.fileName`, `Item.fileSize` |
| `image` | `Image` | `#ec4899` | `FILE` | `Item.fileUrl`, `Item.fileName`, `Item.fileSize` |
| `link` | `Link` | `#10b981` | `URL` | `Item.url` |

## Types

### Snippet

- **Name:** `snippet`
- **Icon:** `Code`
- **Color:** `#3b82f6`
- **Purpose:** Store reusable code blocks, functions, hooks, patterns, and boilerplate.
- **Key fields:** `contentType = TEXT`, `content`, `language`, `description`, `tags`, `collections`.

Snippets are text-backed items. The optional `language` field is especially relevant for syntax highlighting or language-specific display.

### Prompt

- **Name:** `prompt`
- **Icon:** `Sparkles`
- **Color:** `#8b5cf6`
- **Purpose:** Store AI prompts, system messages, workflow instructions, and reusable prompt templates.
- **Key fields:** `contentType = TEXT`, `content`, `description`, `tags`, `collections`.

Prompts use the same text storage path as snippets and notes, but the type communicates that the saved content is intended for AI-assisted workflows.

### Command

- **Name:** `command`
- **Icon:** `Terminal`
- **Color:** `#f97316`
- **Purpose:** Store shell commands, CLI recipes, maintenance commands, and repeatable terminal workflows.
- **Key fields:** `contentType = TEXT`, `content`, `language`, `description`, `tags`, `collections`.

Commands are text-backed. The `language` field can describe the shell or command format when needed.

### Note

- **Name:** `note`
- **Icon:** `StickyNote`
- **Color:** `#fde047`
- **Purpose:** Store general Markdown notes, explanations, reminders, and project reference material.
- **Key fields:** `contentType = TEXT`, `content`, `description`, `tags`, `collections`.

Notes are the general-purpose text type for content that is not specifically a snippet, prompt, or command.

### File

- **Name:** `file`
- **Icon:** `File`
- **Color:** `#6b7280`
- **Purpose:** Store uploaded documents, configuration files, archives, or other non-image file assets.
- **Key fields:** `contentType = FILE`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`, `collections`.

Files are upload-backed items. The project plan treats file uploads as a Pro feature, and the dashboard sidebar currently shows a `PRO` badge for the `file` type.

### Image

- **Name:** `image`
- **Icon:** `Image`
- **Color:** `#ec4899`
- **Purpose:** Store screenshots, diagrams, visual references, and image assets.
- **Key fields:** `contentType = FILE`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`, `collections`.

Images share the file storage model with files but have a distinct item type so the UI can group and present them separately. The dashboard sidebar currently shows a `PRO` badge for the `image` type.

### Link

- **Name:** `link`
- **Icon:** `Link`
- **Color:** `#10b981`
- **Purpose:** Store external URLs such as documentation, dashboards, tools, references, articles, and bookmarks.
- **Key fields:** `contentType = URL`, `url`, `description`, `tags`, `collections`.

Links are URL-backed items. The seed runner requires a URL for link items before writing them to the database.

## Content Classification

DevStash uses the Prisma enum `ItemContentType` to decide which storage fields carry the item body:

| Classification | Item Types | Required Storage Pattern |
| --- | --- | --- |
| `TEXT` | `snippet`, `prompt`, `command`, `note` | Store body text in `Item.content`. |
| `FILE` | `file`, `image` | Store upload metadata in `Item.fileUrl`, `Item.fileName`, and `Item.fileSize`. |
| `URL` | `link` | Store the external destination in `Item.url`. |

The seed script maps item type slug to content type with this order:

```ts
{
  snippet: ItemContentType.TEXT,
  prompt: ItemContentType.TEXT,
  command: ItemContentType.TEXT,
  note: ItemContentType.TEXT,
  file: ItemContentType.FILE,
  image: ItemContentType.FILE,
  link: ItemContentType.URL,
}
```

## Shared Properties

All saved items use the `Item` model and share these fields:

| Field | Purpose |
| --- | --- |
| `id` | Unique item id. |
| `userId` | Owner id; cascades when the user is deleted. |
| `itemTypeId` | Reference to the item type record. |
| `title` | Main display title. |
| `description` | Optional summary or explanation. |
| `contentType` | `TEXT`, `URL`, or `FILE`. |
| `content` | Text body for text-backed items. |
| `url` | External URL for links. |
| `fileUrl` | Stored file URL for files and images. |
| `fileName` | Original or display file name for files and images. |
| `fileSize` | File size in bytes for files and images. |
| `language` | Optional language metadata, mainly useful for snippets and commands. |
| `isFavorite` | User favorite flag. |
| `isPinned` | User pinned flag. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |
| `tags` | Many-to-many tag relationships through `ItemTag`. |
| `collections` | Many-to-many collection relationships through `ItemCollection`. |

Item type records also share:

| Field | Purpose |
| --- | --- |
| `id` | Unique item type id, such as `type_snippet`. |
| `userId` | Optional owner id for future custom types; system types use `null`. |
| `name` | Lowercase type name, such as `snippet`. |
| `slug` | URL/display slug; unique with `userId`. |
| `icon` | Stored icon name. |
| `color` | Hex accent color. |
| `isSystem` | Marks built-in types. Seeded types are `true`. |

## Display Behavior

- Dashboard type order is `snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`.
- Dashboard labels are generated by pluralizing and capitalizing the slug, producing `Snippets`, `Prompts`, `Commands`, `Notes`, `Files`, `Images`, and `Links`.
- Dashboard type navigation routes are generated as `/items/<plural-slug>`, for example `/items/snippets` and `/items/images`.
- Dashboard cards use each item type color as an accent border through `accentColor`.
- Item type badges use the item type color as the badge border color and display the capitalized item type name.
- Known dashboard icon rendering uses Lucide icons from `src/components/dashboard/dashboard-icons.ts`: `Code2`, `Sparkles`, `Terminal`, `NotebookText`, `File`, `ImageIcon`, and `LinkIcon`.
- Sidebar icon text colors are mapped separately with Tailwind classes such as `text-blue-400`, `text-violet-400`, and `text-emerald-400`.
- Unknown item type slugs fall back to a neutral `Circle` icon and `text-zinc-400`.
- The sidebar shows a `PRO` badge for `file` and `image`.
- Collections display the icons and colors for the item types they contain, and collection cards use the collection accent color on the left border.

## Current Seeded System Types

The current seed data defines these system item type records:

| Id | Name | Slug | Icon | Color |
| --- | --- | --- | --- | --- |
| `type_snippet` | `snippet` | `snippet` | `Code` | `#3b82f6` |
| `type_prompt` | `prompt` | `prompt` | `Sparkles` | `#8b5cf6` |
| `type_command` | `command` | `command` | `Terminal` | `#f97316` |
| `type_note` | `note` | `note` | `StickyNote` | `#fde047` |
| `type_file` | `file` | `file` | `File` | `#6b7280` |
| `type_image` | `image` | `image` | `Image` | `#ec4899` |
| `type_link` | `link` | `link` | `Link` | `#10b981` |

## Implementation Pointers

- `prisma/schema.prisma` defines `ItemContentType`, `ItemType`, `Item`, `Collection`, `Tag`, and join tables.
- `prisma/seed-data.ts` defines the seven seed item types and demo data.
- `prisma/seed.ts` maps item type slugs to `ItemContentType` and upserts system item types.
- `src/lib/db/items.ts` loads system item types, user item counts, pinned items, and recent items for the dashboard.
- `src/lib/db/item-shaping.ts` sorts, labels, routes, and shapes item type and item records for dashboard display.
- `src/components/dashboard/dashboard-icons.ts` maps known type slugs to Lucide icon components and Tailwind icon colors.
- `src/components/dashboard/sidebar-pro-badge.ts` defines which sidebar type links receive the `PRO` badge.
