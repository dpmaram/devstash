export type SeedItemTypeSlug =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "link";

export type SeedItemType = {
  id: string;
  name: SeedItemTypeSlug;
  slug: SeedItemTypeSlug;
  icon: string;
  color: string;
};

export type SeedUser = {
  email: string;
  name: string;
  password: string;
  isPro: boolean;
};

export type SeedItem = {
  id: string;
  title: string;
  description: string;
  typeSlug: SeedItemTypeSlug;
  tags: string[];
  content?: string;
  url?: string;
  language?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
};

export type SeedCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  defaultTypeSlug: SeedItemTypeSlug;
  isFavorite: boolean;
  items: SeedItem[];
};

export const seedUser: SeedUser = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
  isPro: false,
};

export const seedItemTypes: SeedItemType[] = [
  { id: "type_snippet", name: "snippet", slug: "snippet", icon: "Code", color: "#3b82f6" },
  { id: "type_prompt", name: "prompt", slug: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "type_command", name: "command", slug: "command", icon: "Terminal", color: "#f97316" },
  { id: "type_note", name: "note", slug: "note", icon: "StickyNote", color: "#fde047" },
  { id: "type_file", name: "file", slug: "file", icon: "File", color: "#6b7280" },
  { id: "type_image", name: "image", slug: "image", icon: "Image", color: "#ec4899" },
  { id: "type_link", name: "link", slug: "link", icon: "Link", color: "#10b981" },
];

export const seedCollections: SeedCollection[] = [
  {
    id: "collection_react_patterns",
    name: "React Patterns",
    slug: "react-patterns",
    description: "Reusable React patterns and hooks",
    defaultTypeSlug: "snippet",
    isFavorite: true,
    items: [
      {
        id: "item_react_use_debounce",
        title: "useDebounce Hook",
        description: "Delay expensive reactions until a value has stopped changing.",
        typeSlug: "snippet",
        language: "TypeScript",
        tags: ["react", "hooks", "performance"],
        isPinned: true,
        isFavorite: true,
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}`,
      },
      {
        id: "item_react_compound_components",
        title: "Compound Component Context Pattern",
        description: "Share component state through context while keeping a small public API.",
        typeSlug: "snippet",
        language: "TypeScript",
        tags: ["react", "context", "components"],
        isPinned: true,
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("useTabs must be used inside Tabs");
  }

  return context;
}`,
      },
      {
        id: "item_react_typed_record_helper",
        title: "Typed Record Helper",
        description: "Create strongly typed lookup maps without losing literal keys.",
        typeSlug: "snippet",
        language: "TypeScript",
        tags: ["typescript", "utilities", "patterns"],
        content: `export function createRecord<const T extends readonly string[], TValue>(
  keys: T,
  getValue: (key: T[number]) => TValue,
): Record<T[number], TValue> {
  return Object.fromEntries(keys.map((key) => [key, getValue(key)])) as Record<T[number], TValue>;
}`,
      },
    ],
  },
  {
    id: "collection_ai_workflows",
    name: "AI Workflows",
    slug: "ai-workflows",
    description: "AI prompts and workflow automations",
    defaultTypeSlug: "prompt",
    isFavorite: true,
    items: [
      {
        id: "item_prompt_code_review",
        title: "Focused Code Review Prompt",
        description: "Ask for a risk-first review of a patch before merging.",
        typeSlug: "prompt",
        tags: ["ai", "review", "quality"],
        isPinned: true,
        isFavorite: true,
        content: `Review this change as a senior engineer. Focus on correctness, security, edge cases, and missing tests. Lead with concrete findings ordered by severity, cite file and line references when possible, and keep style suggestions secondary.`,
      },
      {
        id: "item_prompt_docs_generation",
        title: "Documentation Generation Prompt",
        description: "Turn implementation details into concise maintainer-facing docs.",
        typeSlug: "prompt",
        tags: ["ai", "documentation", "handoff"],
        content: `Create clear documentation for this feature. Include what problem it solves, how the main flow works, important configuration, operational caveats, and a short example. Avoid restating obvious code and call out decisions future maintainers should preserve.`,
      },
      {
        id: "item_prompt_refactor_assistance",
        title: "Refactoring Assistance Prompt",
        description: "Find small refactors that lower complexity without expanding scope.",
        typeSlug: "prompt",
        tags: ["ai", "refactor", "maintainability"],
        content: `Analyze this code for targeted refactoring opportunities. Prioritize changes that reduce duplication, clarify boundaries, or simplify branching while preserving behavior. For each suggestion, explain the risk, expected benefit, and the smallest safe implementation path.`,
      },
    ],
  },
  {
    id: "collection_devops",
    name: "DevOps",
    slug: "devops",
    description: "Infrastructure and deployment resources",
    defaultTypeSlug: "snippet",
    isFavorite: false,
    items: [
      {
        id: "item_devops_nextjs_dockerfile",
        title: "Next.js Production Dockerfile",
        description: "Multi-stage Dockerfile pattern for a standalone Next.js build.",
        typeSlug: "snippet",
        language: "Dockerfile",
        tags: ["docker", "nextjs", "deploy"],
        content: `FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]`,
      },
      {
        id: "item_devops_deploy_command",
        title: "Build and Deploy Migrations",
        description: "Run Prisma migrations before starting a production build.",
        typeSlug: "command",
        tags: ["deployment", "prisma", "release"],
        content: "npm run build && npm run prisma:deploy && npm run start",
      },
      {
        id: "item_devops_docker_docs",
        title: "Docker Get Started Docs",
        description: "Official Docker guide for building and running containers.",
        typeSlug: "link",
        tags: ["docker", "docs", "containers"],
        url: "https://docs.docker.com/get-started/",
      },
      {
        id: "item_devops_github_actions_docs",
        title: "GitHub Actions Docs",
        description: "Official documentation for CI/CD workflows on GitHub.",
        typeSlug: "link",
        tags: ["github", "ci", "deployment"],
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
];
