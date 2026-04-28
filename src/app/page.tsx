import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";

type ItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "link"
  | "file"
  | "image";

type Collection = {
  name: string;
  description: string;
  count: number;
  updated: string;
  accent: string;
  types: ItemKind[];
};

type StashItem = {
  title: string;
  description: string;
  kind: ItemKind;
  collection: string;
  tags: string[];
  updated: string;
  language?: string;
  preview: string;
  pinned?: boolean;
};

type Activity = {
  action: string;
  target: string;
  time: string;
  kind: ItemKind;
};

const typeMeta = {
  snippet: {
    label: "Snippet",
    icon: "</>",
    accentColor: "#3b82f6",
    badge: "border-blue-400/25 bg-blue-500/15 text-blue-200",
    dot: "bg-blue-400",
    soft: "bg-blue-500/10 text-blue-200",
  },
  prompt: {
    label: "Prompt",
    icon: "AI",
    accentColor: "#8b5cf6",
    badge: "border-violet-400/25 bg-violet-500/15 text-violet-200",
    dot: "bg-violet-400",
    soft: "bg-violet-500/10 text-violet-200",
  },
  note: {
    label: "Note",
    icon: "NT",
    accentColor: "#fde047",
    badge: "border-yellow-300/25 bg-yellow-300/15 text-yellow-100",
    dot: "bg-yellow-300",
    soft: "bg-yellow-300/10 text-yellow-100",
  },
  command: {
    label: "Command",
    icon: "$_",
    accentColor: "#f97316",
    badge: "border-orange-400/25 bg-orange-500/15 text-orange-200",
    dot: "bg-orange-400",
    soft: "bg-orange-500/10 text-orange-200",
  },
  link: {
    label: "Link",
    icon: "URL",
    accentColor: "#10b981",
    badge: "border-emerald-400/25 bg-emerald-500/15 text-emerald-200",
    dot: "bg-emerald-400",
    soft: "bg-emerald-500/10 text-emerald-200",
  },
  file: {
    label: "File",
    icon: "DOC",
    accentColor: "#6b7280",
    badge: "border-zinc-400/25 bg-zinc-500/15 text-zinc-200",
    dot: "bg-zinc-400",
    soft: "bg-zinc-500/10 text-zinc-200",
  },
  image: {
    label: "Image",
    icon: "IMG",
    accentColor: "#ec4899",
    badge: "border-pink-400/25 bg-pink-500/15 text-pink-200",
    dot: "bg-pink-400",
    soft: "bg-pink-500/10 text-pink-200",
  },
} satisfies Record<
  ItemKind,
  {
    label: string;
    icon: string;
    accentColor: string;
    badge: string;
    dot: string;
    soft: string;
  }
>;

const navigation = [
  { label: "Dashboard", icon: "DB", active: true },
  { label: "All Items", icon: "IT", active: false },
  { label: "Favorites", icon: "**", active: false },
  { label: "Recent", icon: "RC", active: false },
  { label: "Exports", icon: "EX", active: false },
];

const itemTypes: ItemKind[] = [
  "snippet",
  "prompt",
  "note",
  "command",
  "link",
  "file",
  "image",
];

const collections: Collection[] = [
  {
    name: "Launch Recipes",
    description: "Deploy flows, checklists, and release commands.",
    count: 24,
    updated: "12 min ago",
    accent: "from-emerald-400/30 to-blue-400/20",
    types: ["snippet", "command", "note"],
  },
  {
    name: "AI Prompt Lab",
    description: "Reusable prompts, system messages, and eval notes.",
    count: 18,
    updated: "1 hr ago",
    accent: "from-violet-400/30 to-pink-400/20",
    types: ["prompt", "note", "file"],
  },
  {
    name: "Frontend Patterns",
    description: "Components, Tailwind recipes, and UI references.",
    count: 31,
    updated: "Yesterday",
    accent: "from-blue-400/30 to-yellow-300/20",
    types: ["snippet", "image", "link"],
  },
  {
    name: "Ops Runbook",
    description: "Shell commands, incident notes, and useful dashboards.",
    count: 15,
    updated: "Apr 22",
    accent: "from-orange-400/30 to-emerald-400/20",
    types: ["command", "link", "file"],
  },
];

const items: StashItem[] = [
  {
    title: "Next.js route handler auth guard",
    description: "Server-side guard pattern for protected API routes.",
    kind: "snippet",
    collection: "Launch Recipes",
    tags: ["nextjs", "auth", "server"],
    updated: "8 min ago",
    language: "TypeScript",
    preview: "const session = await auth();\nif (!session?.user) return unauthorized();",
    pinned: true,
  },
  {
    title: "Prompt optimizer system draft",
    description: "Base instructions for improving prompt clarity.",
    kind: "prompt",
    collection: "AI Prompt Lab",
    tags: ["prompting", "ai", "draft"],
    updated: "34 min ago",
    preview: "Rewrite the prompt for specificity, testability, and concise constraints.",
  },
  {
    title: "Neon migration checklist",
    description: "Pre-deploy checks for Prisma migrations and rollback notes.",
    kind: "note",
    collection: "Launch Recipes",
    tags: ["database", "prisma", "deploy"],
    updated: "1 hr ago",
    preview: "Verify migrate status, backup branch, deploy, then confirm indexes.",
  },
  {
    title: "Inspect port usage",
    description: "Find and stop local processes bound to a dev port.",
    kind: "command",
    collection: "Ops Runbook",
    tags: ["shell", "debug", "local"],
    updated: "2 hrs ago",
    preview: "lsof -i :3000\nkill -TERM <pid>",
  },
  {
    title: "Tailwind v4 theme tokens",
    description: "Reference for CSS-first theme configuration.",
    kind: "link",
    collection: "Frontend Patterns",
    tags: ["tailwind", "css", "docs"],
    updated: "Yesterday",
    preview: "tailwindcss.com/docs/theme",
  },
  {
    title: "Dashboard empty state sketches",
    description: "Image notes for onboarding and collection screens.",
    kind: "image",
    collection: "Frontend Patterns",
    tags: ["ui", "mockup", "empty-state"],
    updated: "Apr 21",
    preview: "PNG - 1.8 MB",
  },
];

const activities: Activity[] = [
  {
    action: "Pinned",
    target: "Next.js route handler auth guard",
    time: "8 min ago",
    kind: "snippet",
  },
  {
    action: "Updated",
    target: "Prompt optimizer system draft",
    time: "34 min ago",
    kind: "prompt",
  },
  {
    action: "Added",
    target: "Neon migration checklist",
    time: "1 hr ago",
    kind: "note",
  },
  {
    action: "Imported",
    target: "Dashboard empty state sketches",
    time: "Apr 21",
    kind: "image",
  },
];

const stats = [
  { label: "Items", value: "147", detail: "+12 this week" },
  { label: "Collections", value: "11", detail: "4 favorites" },
  { label: "Pinned", value: "9", detail: "Top shelf" },
  { label: "AI drafts", value: "23", detail: "Ready to review" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileHeader />
          <div className="mx-auto grid w-full max-w-[1680px] gap-6 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              <DashboardHeader />
              <StatsGrid />
              <CollectionsGrid />
              <ItemsPanel />
            </div>
            <ItemDrawer />
          </div>
        </div>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-[#0d0f12] md:flex md:w-20 xl:w-72">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-sm font-semibold text-emerald-100">
          DS
        </div>
        <div className="hidden min-w-0 xl:block">
          <p className="truncate text-sm font-semibold text-white">DevStash</p>
          <p className="truncate text-xs text-zinc-500">Developer knowledge hub</p>
        </div>
        <button
          aria-label="Collapse sidebar"
          className="ml-auto hidden size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 xl:flex"
          type="button"
        >
          &lt;
        </button>
      </div>

      <div className="hidden px-4 py-4 xl:block">
        <label className="sr-only" htmlFor="sidebar-search">
          Search
        </label>
        <div className="flex h-10 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-500">
          <span className="text-zinc-400">/</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-500"
            id="sidebar-search"
            placeholder="Search stash"
            readOnly
            value=""
          />
        </div>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-4 xl:px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition ${
                item.active
                  ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
              key={item.label}
              type="button"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-semibold">
                {item.icon}
              </span>
              <span className="hidden truncate xl:block">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="hidden px-3 text-xs font-medium uppercase text-zinc-600 xl:block">
            Item types
          </p>
          <div className="space-y-1">
            {itemTypes.map((kind) => (
              <button
                className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                key={kind}
                type="button"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${typeMeta[kind].dot}`}
                />
                <span className="hidden truncate xl:block">
                  {typeMeta[kind].label}s
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden space-y-2 xl:block">
          <p className="px-3 text-xs font-medium uppercase text-zinc-600">
            Collections
          </p>
          <div className="space-y-1">
            {collections.slice(0, 4).map((collection) => (
              <button
                className="flex h-9 w-full items-center justify-between gap-3 rounded-md px-3 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                key={collection.name}
                type="button"
              >
                <span className="truncate">{collection.name}</span>
                <span className="text-xs text-zinc-600">{collection.count}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3 xl:p-4">
        <div className="hidden rounded-lg border border-white/10 bg-white/[0.03] p-4 xl:block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">Pro workspace</p>
              <p className="mt-1 text-xs text-zinc-500">147 items saved</p>
            </div>
            <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
              Pro
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-2/3 rounded-full bg-emerald-300" />
          </div>
        </div>
        <button
          aria-label="New item"
          className="flex size-10 w-full items-center justify-center rounded-md bg-emerald-300 text-lg font-semibold text-zinc-950 xl:hidden"
          type="button"
        >
          +
        </button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0d0f12]/95 px-4 md:hidden">
      <button
        aria-label="Open sidebar drawer"
        className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-200"
        type="button"
      >
        =
      </button>
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-xs font-semibold text-emerald-100">
          DS
        </div>
        <span className="text-sm font-semibold text-white">DevStash</span>
      </div>
      <button
        aria-label="New item"
        className="flex size-10 items-center justify-center rounded-md bg-emerald-300 text-lg font-semibold text-zinc-950"
        type="button"
      >
        +
      </button>
    </header>
  );
}

function DashboardHeader() {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span>Workspace</span>
          <span>/</span>
          <span className="text-zinc-300">Dashboard</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Developer stash
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Snippets, prompts, commands, files, links, and notes organized into a
          fast daily workspace.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="global-search">
          Search
        </label>
        <div className="flex h-11 min-w-0 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-500 sm:w-72">
          <span className="text-zinc-400">/</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-500"
            id="global-search"
            placeholder="Search items"
            readOnly
            value=""
          />
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-zinc-950 shadow-[0_16px_40px_rgba(16,185,129,0.18)]"
          type="button"
        >
          <span className="text-base">+</span>
          New item
        </button>
      </div>
    </section>
  );
}

function StatsGrid() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
          key={stat.label}
        >
          <p className="text-sm text-zinc-500">{stat.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.detail}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function CollectionsGrid() {
  return (
    <section className="space-y-4">
      <SectionHeader
        action="View all"
        eyebrow="Collections"
        title="Pinned workspaces"
      />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {collections.map((collection) => (
          <article
            className="group rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20 hover:bg-white/[0.055]"
            key={collection.name}
          >
            <div
              className={`h-20 rounded-md bg-gradient-to-br ${collection.accent} ring-1 ring-white/10`}
            >
              <div className="grid h-full grid-cols-6 gap-1 p-3">
                <span className="col-span-2 rounded bg-white/20" />
                <span className="col-span-4 rounded bg-white/10" />
                <span className="col-span-3 rounded bg-white/10" />
                <span className="col-span-3 rounded bg-white/15" />
                <span className="col-span-4 rounded bg-white/15" />
                <span className="col-span-2 rounded bg-white/10" />
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-white">
                  {collection.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                  {collection.description}
                </p>
              </div>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-300">
                {collection.count}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {collection.types.map((kind) => (
                <span
                  className={`rounded-md border px-2 py-1 text-xs ${typeMeta[kind].badge}`}
                  key={kind}
                >
                  {typeMeta[kind].label}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">{collection.updated}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemsPanel() {
  return (
    <section className="space-y-4">
      <SectionHeader action="Filter" eyebrow="Library" title="Recent items" />
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              className="rounded-lg border border-l-4 border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20 hover:bg-white/[0.055]"
              key={item.title}
              style={getAccentBorderStyle(typeMeta[item.kind].accentColor)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${typeMeta[item.kind].badge}`}
                  >
                    {typeMeta[item.kind].icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="max-w-full truncate text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      {item.pinned ? (
                        <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.collection} / {item.updated}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>

              <pre className="mt-4 min-h-20 overflow-hidden rounded-md border border-white/10 bg-[#090a0d] p-3 text-xs leading-5 text-zinc-300">
                <code>{item.preview}</code>
              </pre>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.language ? (
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
                    {item.language}
                  </span>
                ) : null}
                {item.tags.map((tag) => (
                  <span
                    className="rounded-md bg-white/[0.045] px-2 py-1 text-xs text-zinc-500"
                    key={tag}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <RecentActivity />
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Recent activity</h2>
        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-500">
          Today
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {activities.map((activity) => (
          <div className="flex gap-3" key={`${activity.action}-${activity.target}`}>
            <span
              className={`mt-1 size-2 shrink-0 rounded-full ${typeMeta[activity.kind].dot}`}
            />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-white">{activity.action}</span>{" "}
                {activity.target}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ItemDrawer() {
  return (
    <aside className="rounded-lg border border-white/10 bg-[#101216] shadow-[0_24px_80px_rgba(0,0,0,0.35)] xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Item drawer
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">New stash item</h2>
        </div>
        <button
          aria-label="Close drawer"
          className="flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-400"
          type="button"
        >
          x
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto p-5 xl:max-h-[calc(100vh-9rem)]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="item-title">
            Title
          </label>
          <input
            className="h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            id="item-title"
            readOnly
            value="Stripe webhook verification"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Type</p>
          <div className="grid grid-cols-2 gap-2">
            {itemTypes.slice(0, 6).map((kind) => (
              <button
                className={`flex h-10 items-center gap-2 rounded-md border px-3 text-left text-xs ${
                  kind === "snippet"
                    ? typeMeta[kind].badge
                    : "border-white/10 bg-white/[0.035] text-zinc-400"
                }`}
                key={kind}
                type="button"
              >
                <span className={`size-2 rounded-full ${typeMeta[kind].dot}`} />
                {typeMeta[kind].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="item-body">
            Content
          </label>
          <textarea
            className="min-h-40 w-full resize-none rounded-md border border-white/10 bg-[#090a0d] p-3 font-mono text-xs leading-5 text-zinc-300 outline-none"
            id="item-body"
            readOnly
            value={`import { headers } from "next/headers";

const signature = headers().get("stripe-signature");
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Collections</p>
          <div className="flex flex-wrap gap-2">
            {["Launch Recipes", "Backend Patterns", "Billing"].map((name) => (
              <span
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300"
                key={name}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">AI assists</p>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            {["Auto tags", "Summarize", "Explain code"].map((label) => (
              <button
                className="flex h-10 items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 text-left text-xs text-zinc-300"
                key={label}
                type="button"
              >
                {label}
                <span className="rounded bg-emerald-300/10 px-1.5 py-0.5 text-[10px] text-emerald-100">
                  Pro
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/10 pt-5">
          <button
            className="h-11 flex-1 rounded-md border border-white/10 bg-white/[0.04] text-sm font-medium text-zinc-300"
            type="button"
          >
            Save draft
          </button>
          <button
            className="h-11 flex-1 rounded-md bg-emerald-300 text-sm font-semibold text-zinc-950"
            type="button"
          >
            Create item
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({
  action,
  eyebrow,
  title,
}: {
  action: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase text-zinc-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>
      <button
        className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-300"
        type="button"
      >
        {action}
      </button>
    </div>
  );
}
