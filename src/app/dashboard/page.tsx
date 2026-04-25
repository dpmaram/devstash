"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  File,
  Folder,
  ImageIcon,
  LinkIcon,
  Menu,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  Star,
  Terminal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  mockDashboardData,
  type Collection,
  type DashboardItem,
  type ItemTypeSlug,
} from "@/lib/mock-data";

const itemTypeIcons: Record<ItemTypeSlug, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  command: Terminal,
  note: NotebookText,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

const itemTypeIconClasses: Record<ItemTypeSlug, string> = {
  snippet: "text-blue-400",
  prompt: "text-violet-400",
  command: "text-orange-400",
  note: "text-yellow-300",
  file: "text-zinc-400",
  image: "text-pink-400",
  link: "text-emerald-400",
};

const collectionAccentClasses = [
  "border-l-blue-500",
  "border-l-violet-500",
  "border-l-zinc-500",
  "border-l-yellow-300",
  "border-l-orange-500",
  "border-l-emerald-500",
];

export default function DashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        />

        <div className="min-w-0 flex-1">
          <TopBar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

          <DashboardMain />
        </div>
      </div>
    </main>
  );
}

function TopBar({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar: () => void;
}) {
  return (
    <header className="flex h-20 items-center gap-4 border-b border-devstash-line bg-devstash-bg px-4 sm:px-6">
      <Button
        aria-label="Open sidebar"
        className="size-11 rounded-lg border-devstash-line bg-white/[0.04] text-foreground hover:bg-white/[0.08] md:hidden"
        onClick={onOpenMobileSidebar}
        type="button"
        variant="outline"
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>

      <div className="relative min-w-0 flex-1 max-w-2xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search items"
          className="h-11 rounded-lg border-devstash-line bg-white/[0.04] pl-11 text-base text-foreground placeholder:text-muted-foreground"
          placeholder="Search items..."
          readOnly
        />
      </div>

      <Button
        className="h-11 gap-2 rounded-lg bg-foreground px-4 text-base font-medium text-background hover:bg-foreground/90 sm:px-5"
        type="button"
      >
        <Plus aria-hidden="true" className="size-5" />
        <span className="hidden sm:inline">New Item</span>
      </Button>
    </header>
  );
}

function DashboardMain() {
  const { collections, items } = mockDashboardData;
  const favoriteItems = items.filter((item) => item.isFavorite);
  const favoriteCollections = collections.filter((collection) => collection.isFavorite);
  const pinnedItems = items.filter((item) => item.isPinned);
  const recentCollections = collections.slice(0, 6);
  const recentItems = items.slice(0, 10);
  const stats = [
    {
      label: "Items",
      value: items.length,
      detail: `${pinnedItems.length} pinned`,
    },
    {
      label: "Collections",
      value: collections.length,
      detail: `${recentCollections.length} recent`,
    },
    {
      label: "Favorite Items",
      value: favoriteItems.length,
      detail: "Saved for reuse",
    },
    {
      label: "Favorite Collections",
      value: favoriteCollections.length,
      detail: "Quick access",
    },
  ];

  return (
    <section className="space-y-8 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            className="rounded-lg border border-devstash-line bg-white/[0.035] p-5"
            key={stat.label}
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <DashboardSection title="Recent Collections">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {recentCollections.map((collection, index) => (
            <CollectionCard
              collection={collection}
              key={collection.id}
              accentClass={
                collectionAccentClasses[index % collectionAccentClasses.length]
              }
            />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Pinned Items">
        <div className="grid gap-4 xl:grid-cols-3">
          {pinnedItems.map((item) => (
            <PinnedItemCard item={item} key={item.id} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Recent Items">
        <div className="space-y-3">
          {recentItems.map((item) => (
            <RecentItemRow item={item} key={item.id} />
          ))}
        </div>
      </DashboardSection>
    </section>
  );
}

function DashboardSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function CollectionCard({
  accentClass,
  collection,
}: {
  accentClass: string;
  collection: Collection;
}) {
  return (
    <Link
      className={`block rounded-lg border border-l-4 border-devstash-line ${accentClass} bg-white/[0.025] p-5 transition hover:bg-white/[0.05]`}
      href={`/collections/${collection.slug}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {collection.name}
            </h3>
            {collection.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {collection.itemCount} items
          </p>
        </div>
        <Folder
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-muted-foreground"
        />
      </div>
      <p className="mt-5 line-clamp-2 text-sm leading-6 text-zinc-400">
        {collection.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {collection.itemTypeSlugs.map((typeSlug) => {
          const Icon = itemTypeIcons[typeSlug];

          return (
            <span
              className="inline-flex size-6 items-center justify-center rounded-md bg-white/[0.05]"
              key={typeSlug}
            >
              <Icon
                aria-hidden="true"
                className={`size-4 ${itemTypeIconClasses[typeSlug]}`}
              />
            </span>
          );
        })}
      </div>
    </Link>
  );
}

function PinnedItemCard({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeSlug];

  return (
    <Link
      className="block rounded-lg border border-devstash-line bg-white/[0.025] p-5 transition hover:bg-white/[0.05]"
      href={`/items/${item.typeSlug}s`}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          <Icon
            aria-hidden="true"
            className={`size-5 ${itemTypeIconClasses[item.typeSlug]}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {item.title}
            </h3>
            <span className="text-muted-foreground">Pinned</span>
            {item.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {item.description}
          </p>
          <TagList tags={item.tags} />
        </div>
      </div>
    </Link>
  );
}

function RecentItemRow({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeSlug];

  return (
    <Link
      className="flex items-start gap-4 rounded-lg border border-devstash-line bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
      href={`/items/${item.typeSlug}s`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        <Icon
          aria-hidden="true"
          className={`size-5 ${itemTypeIconClasses[item.typeSlug]}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-white">
                {item.title}
              </h3>
              {item.isPinned ? (
                <span className="text-sm text-muted-foreground">Pinned</span>
              ) : null}
              {item.isFavorite ? (
                <Star
                  aria-hidden="true"
                  className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
                />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">
              {item.description}
            </p>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">{item.updatedAt}</p>
        </div>
        <TagList tags={item.tags} />
      </div>
    </Link>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-md bg-white/[0.06] px-2.5 py-1 text-sm text-zinc-300"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function DashboardSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const sidebarWidth = isCollapsed ? "md:w-20" : "md:w-80";

  return (
    <>
      <aside
        className={`hidden shrink-0 border-r border-devstash-line bg-black/30 transition-[width] duration-200 md:flex md:h-screen md:flex-col ${sidebarWidth}`}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onCloseMobile={onCloseMobile}
          onToggleCollapse={onToggleCollapse}
          variant="desktop"
        />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-black/70"
            onClick={onCloseMobile}
            type="button"
          />
          <aside className="relative flex h-full w-[min(86vw,22rem)] flex-col border-r border-devstash-line bg-[#08090b] shadow-2xl">
            <SidebarContent
              isCollapsed={false}
              onCloseMobile={onCloseMobile}
              onToggleCollapse={onToggleCollapse}
              variant="mobile"
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  isCollapsed,
  onCloseMobile,
  onToggleCollapse,
  variant,
}: {
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  variant: "desktop" | "mobile";
}) {
  const { collections, currentUser, itemTypes } = mockDashboardData;
  const favoriteCollections = collections.filter((collection) => collection.isFavorite);
  const recentCollections = collections.slice(0, 5);

  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-devstash-line px-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-sm font-semibold text-white">
          DS
        </div>
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-white">DevStash</p>
          </div>
        ) : null}
        {variant === "mobile" ? (
          <Button
            aria-label="Close sidebar"
            className="ml-auto size-9 rounded-lg border-devstash-line bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
            onClick={onCloseMobile}
            type="button"
            variant="outline"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        ) : (
          <Button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto size-9 rounded-lg border-devstash-line bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
            onClick={onToggleCollapse}
            type="button"
            variant="outline"
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-6">
        <SidebarSection isCollapsed={isCollapsed} title="Types">
          {itemTypes.map((itemType) => {
            const Icon = itemTypeIcons[itemType.slug];
            const href = `/items/${itemType.name.toLowerCase()}`;

            return (
              <Link
                className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                href={href}
                key={itemType.id}
                onClick={variant === "mobile" ? onCloseMobile : undefined}
                title={isCollapsed ? itemType.name : undefined}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-5 shrink-0 ${itemTypeIconClasses[itemType.slug]}`}
                />
                {!isCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-base">
                      {itemType.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {itemType.itemCount}
                    </span>
                  </>
                ) : null}
              </Link>
            );
          })}
        </SidebarSection>

        <SidebarSection isCollapsed={isCollapsed} title="Favorite Collections">
          {favoriteCollections.map((collection) => (
            <CollectionLink
              collection={collection}
              isCollapsed={isCollapsed}
              key={collection.id}
              onClick={variant === "mobile" ? onCloseMobile : undefined}
              showFavorite
            />
          ))}
        </SidebarSection>

        <SidebarSection isCollapsed={isCollapsed} title="Recent Collections">
          {recentCollections.map((collection) => (
            <CollectionLink
              collection={collection}
              isCollapsed={isCollapsed}
              key={collection.id}
              onClick={variant === "mobile" ? onCloseMobile : undefined}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-devstash-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-950">
            {currentUser.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          {!isCollapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-white">
                  {currentUser.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
              <span className="rounded-md border border-devstash-line bg-white/[0.04] px-2 py-1 text-xs uppercase text-muted-foreground">
                {currentUser.planTier}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

function SidebarSection({
  children,
  isCollapsed,
  title,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
  title: string;
}) {
  return (
    <section className="mb-7 last:mb-0">
      {!isCollapsed ? (
        <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function CollectionLink({
  collection,
  isCollapsed,
  onClick,
  showFavorite = false,
}: {
  collection: (typeof mockDashboardData.collections)[number];
  isCollapsed: boolean;
  onClick?: () => void;
  showFavorite?: boolean;
}) {
  return (
    <Link
      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
      href={`/collections/${collection.slug}`}
      onClick={onClick}
      title={isCollapsed ? collection.name : undefined}
    >
      <Folder aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      {!isCollapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate text-base">{collection.name}</span>
          {showFavorite ? (
            <Star
              aria-hidden="true"
              className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {collection.itemCount}
            </span>
          )}
        </>
      ) : null}
    </Link>
  );
}
