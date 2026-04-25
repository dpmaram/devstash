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
import { mockDashboardData, type ItemTypeSlug } from "@/lib/mock-data";

const itemTypeIcons: Record<ItemTypeSlug, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  command: Terminal,
  note: NotebookText,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

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

          <section className="p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Main</h2>
          </section>
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
                  className="size-5 shrink-0"
                  style={{ color: itemType.color }}
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
