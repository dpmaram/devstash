export type ItemTypeSlug =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "link";

export type ItemType = {
  id: string;
  slug: ItemTypeSlug;
  name: string;
  singularName: string;
  storageMode: "text" | "url" | "file";
  icon: string;
  color: string;
  itemCount: number;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  itemTypeSlugs: ItemTypeSlug[];
  isFavorite: boolean;
  accentColor: string;
  updatedAt: string;
};

export type DashboardItem = {
  id: string;
  title: string;
  description: string;
  typeSlug: ItemTypeSlug;
  collectionSlugs: string[];
  tags: string[];
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  language?: string;
  preview?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  planTier: "free" | "pro";
};

export const currentUser: CurrentUser = {
  id: "user_john_doe",
  name: "John Doe",
  email: "durga.maram@gmail.com",
  avatarUrl: null,
  planTier: "pro",
};

export const itemTypes: ItemType[] = [
  {
    id: "type_snippet",
    slug: "snippet",
    name: "Snippets",
    singularName: "Snippet",
    storageMode: "text",
    icon: "Code",
    color: "#3b82f6",
    itemCount: 24,
  },
  {
    id: "type_prompt",
    slug: "prompt",
    name: "Prompts",
    singularName: "Prompt",
    storageMode: "text",
    icon: "Sparkles",
    color: "#8b5cf6",
    itemCount: 18,
  },
  {
    id: "type_command",
    slug: "command",
    name: "Commands",
    singularName: "Command",
    storageMode: "text",
    icon: "Terminal",
    color: "#f97316",
    itemCount: 15,
  },
  {
    id: "type_note",
    slug: "note",
    name: "Notes",
    singularName: "Note",
    storageMode: "text",
    icon: "StickyNote",
    color: "#fde047",
    itemCount: 12,
  },
  {
    id: "type_file",
    slug: "file",
    name: "Files",
    singularName: "File",
    storageMode: "file",
    icon: "File",
    color: "#6b7280",
    itemCount: 5,
  },
  {
    id: "type_image",
    slug: "image",
    name: "Images",
    singularName: "Image",
    storageMode: "file",
    icon: "Image",
    color: "#ec4899",
    itemCount: 3,
  },
  {
    id: "type_link",
    slug: "link",
    name: "Links",
    singularName: "Link",
    storageMode: "url",
    icon: "Link",
    color: "#10b981",
    itemCount: 8,
  },
];

export const collections: Collection[] = [
  {
    id: "collection_react_patterns",
    name: "React Patterns",
    slug: "react-patterns",
    description: "Common React patterns and hooks",
    itemCount: 12,
    itemTypeSlugs: ["snippet", "note", "link"],
    isFavorite: true,
    accentColor: "#3b82f6",
    updatedAt: "Jan 15",
  },
  {
    id: "collection_python_snippets",
    name: "Python Snippets",
    slug: "python-snippets",
    description: "Useful Python code snippets",
    itemCount: 8,
    itemTypeSlugs: ["snippet", "note"],
    isFavorite: false,
    accentColor: "#3b82f6",
    updatedAt: "Jan 14",
  },
  {
    id: "collection_context_files",
    name: "Context Files",
    slug: "context-files",
    description: "AI context files for projects",
    itemCount: 5,
    itemTypeSlugs: ["file", "note"],
    isFavorite: true,
    accentColor: "#6b7280",
    updatedAt: "Jan 13",
  },
  {
    id: "collection_interview_prep",
    name: "Interview Prep",
    slug: "interview-prep",
    description: "Technical interview preparation",
    itemCount: 24,
    itemTypeSlugs: ["note", "snippet", "link", "prompt"],
    isFavorite: false,
    accentColor: "#fde047",
    updatedAt: "Jan 12",
  },
  {
    id: "collection_git_commands",
    name: "Git Commands",
    slug: "git-commands",
    description: "Frequently used git commands",
    itemCount: 15,
    itemTypeSlugs: ["command", "note"],
    isFavorite: true,
    accentColor: "#f97316",
    updatedAt: "Jan 11",
  },
  {
    id: "collection_ai_prompts",
    name: "AI Prompts",
    slug: "ai-prompts",
    description: "Curated AI prompts for coding",
    itemCount: 18,
    itemTypeSlugs: ["prompt", "snippet", "note"],
    isFavorite: false,
    accentColor: "#8b5cf6",
    updatedAt: "Jan 10",
  },
];

export const items: DashboardItem[] = [
  {
    id: "item_use_auth_hook",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    typeSlug: "snippet",
    collectionSlugs: ["react-patterns"],
    tags: ["react", "auth", "hooks"],
    updatedAt: "Jan 15",
    isPinned: true,
    isFavorite: true,
    language: "TypeScript",
    preview: "const { user, signIn, signOut } = useAuth();",
  },
  {
    id: "item_api_error_handling_pattern",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    typeSlug: "snippet",
    collectionSlugs: ["react-patterns"],
    tags: ["api", "fetch", "retry"],
    updatedAt: "Jan 12",
    isPinned: true,
    isFavorite: false,
    language: "TypeScript",
    preview: "await fetchWithRetry('/api/items', { retries: 3 });",
  },
  {
    id: "item_git_undo_last_commit",
    title: "Undo Last Git Commit",
    description: "Keep local changes while backing out the latest commit",
    typeSlug: "command",
    collectionSlugs: ["git-commands"],
    tags: ["git", "undo", "commit"],
    updatedAt: "Jan 11",
    isPinned: true,
    isFavorite: true,
    preview: "git reset --soft HEAD~1",
  },
  {
    id: "item_component_context_template",
    title: "Component Context Template",
    description: "Project context file for reusable UI component work",
    typeSlug: "file",
    collectionSlugs: ["context-files"],
    tags: ["context", "components", "ai"],
    updatedAt: "Jan 9",
    isPinned: false,
    isFavorite: true,
    preview: "component-context.md",
  },
  {
    id: "item_refactor_prompt",
    title: "Refactor Review Prompt",
    description: "Prompt for finding safe simplifications in existing code",
    typeSlug: "prompt",
    collectionSlugs: ["ai-prompts"],
    tags: ["prompting", "review", "refactor"],
    updatedAt: "Jan 8",
    isPinned: false,
    isFavorite: false,
    preview: "Review this code for the smallest useful refactor...",
  },
  {
    id: "item_python_dict_merge",
    title: "Python Dict Merge",
    description: "Common patterns for combining dictionaries in Python",
    typeSlug: "snippet",
    collectionSlugs: ["python-snippets"],
    tags: ["python", "dict", "patterns"],
    updatedAt: "Jan 7",
    isPinned: false,
    isFavorite: false,
    language: "Python",
    preview: "merged = {**defaults, **overrides}",
  },
  {
    id: "item_frontend_interview_notes",
    title: "Frontend Interview Notes",
    description: "Short answers for rendering, state, and accessibility topics",
    typeSlug: "note",
    collectionSlugs: ["interview-prep"],
    tags: ["frontend", "interview", "react"],
    updatedAt: "Jan 6",
    isPinned: false,
    isFavorite: false,
    preview: "Reconciliation, controlled inputs, focus management...",
  },
  {
    id: "item_tailwind_docs",
    title: "Tailwind Theme Docs",
    description: "CSS-first theme variable reference for Tailwind v4",
    typeSlug: "link",
    collectionSlugs: ["react-patterns"],
    tags: ["tailwind", "css", "docs"],
    updatedAt: "Jan 5",
    isPinned: false,
    isFavorite: false,
    preview: "https://tailwindcss.com/docs/theme",
  },
  {
    id: "item_zod_schema_pattern",
    title: "Zod Schema Pattern",
    description: "Validation schema structure for form and API inputs",
    typeSlug: "snippet",
    collectionSlugs: ["react-patterns"],
    tags: ["zod", "validation", "forms"],
    updatedAt: "Jan 4",
    isPinned: false,
    isFavorite: true,
    language: "TypeScript",
    preview: "const schema = z.object({ email: z.string().email() });",
  },
  {
    id: "item_docker_cleanup_command",
    title: "Docker Cleanup Command",
    description: "Remove unused containers, networks, images, and build cache",
    typeSlug: "command",
    collectionSlugs: ["git-commands"],
    tags: ["docker", "cleanup", "local"],
    updatedAt: "Jan 3",
    isPinned: false,
    isFavorite: false,
    preview: "docker system prune --all --volumes",
  },
];

export const mockDashboardData = {
  currentUser,
  itemTypes,
  collections,
  items,
};
