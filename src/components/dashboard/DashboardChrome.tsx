"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ChevronUp,
  Circle,
  Folder,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { UserAvatar } from "@/components/auth/user-avatar";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import {
  SIDEBAR_PRO_BADGE_LABEL,
  shouldShowSidebarProBadge,
} from "@/components/dashboard/sidebar-pro-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItemType } from "@/lib/db/items";
import type { CurrentUser, ItemTypeSlug } from "@/lib/mock-data";

type DashboardChromeProps = {
  children: ReactNode;
  collections: DashboardCollection[];
  currentUser: CurrentUser;
  itemTypes: DashboardItemType[];
};

export function DashboardChrome({
  children,
  collections,
  currentUser,
  itemTypes,
}: DashboardChromeProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar
          collections={collections}
          currentUser={currentUser}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          itemTypes={itemTypes}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        />

        <div className="min-w-0 flex-1">
          <TopBar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
          {children}
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
  collections,
  currentUser,
  isCollapsed,
  isMobileOpen,
  itemTypes,
  onCloseMobile,
  onToggleCollapse,
}: {
  collections: DashboardCollection[];
  currentUser: CurrentUser;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  itemTypes: DashboardItemType[];
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
          collections={collections}
          currentUser={currentUser}
          isCollapsed={isCollapsed}
          itemTypes={itemTypes}
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
              collections={collections}
              currentUser={currentUser}
              isCollapsed={false}
              itemTypes={itemTypes}
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
  collections,
  currentUser,
  isCollapsed,
  itemTypes,
  onCloseMobile,
  onToggleCollapse,
  variant,
}: {
  collections: DashboardCollection[];
  currentUser: CurrentUser;
  isCollapsed: boolean;
  itemTypes: DashboardItemType[];
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  variant: "desktop" | "mobile";
}) {
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
          {itemTypes.map((itemType) => (
            <Link
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              href={itemType.href}
              key={itemType.id}
              onClick={variant === "mobile" ? onCloseMobile : undefined}
              title={isCollapsed ? itemType.label : undefined}
            >
              {renderSidebarItemTypeIcon(itemType.slug)}
              {!isCollapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-base">
                    {itemType.label}
                  </span>
                  {shouldShowSidebarProBadge(itemType.slug) ? (
                    <Badge
                      className="h-5 rounded-md border-devstash-line bg-white/[0.04] px-1.5 text-[0.62rem] font-semibold text-muted-foreground"
                      variant="outline"
                    >
                      {SIDEBAR_PRO_BADGE_LABEL}
                    </Badge>
                  ) : null}
                  <span className="text-sm text-muted-foreground">
                    {itemType.itemCount}
                  </span>
                </>
              ) : null}
            </Link>
          ))}
        </SidebarSection>

        <SidebarSection isCollapsed={isCollapsed} title="Favorite Collections">
          {favoriteCollections.map((collection) => (
            <CollectionLink
              collection={collection}
              isCollapsed={isCollapsed}
              key={collection.id}
              onClick={variant === "mobile" ? onCloseMobile : undefined}
              variant="favorite"
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
              variant="recent"
            />
          ))}
          <ViewAllCollectionsLink
            isCollapsed={isCollapsed}
            onClick={variant === "mobile" ? onCloseMobile : undefined}
          />
        </SidebarSection>
      </nav>

      <div className="border-t border-devstash-line p-4">
        <SidebarUserMenu currentUser={currentUser} isCollapsed={isCollapsed} />
      </div>
    </>
  );
}

function SidebarUserMenu({
  currentUser,
  isCollapsed,
}: {
  currentUser: CurrentUser;
  isCollapsed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (isCollapsed) {
    return (
      <Link
        aria-label="Open profile"
        className="inline-flex rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50"
        href="/profile"
        title={currentUser.name}
      >
        <UserAvatar
          email={currentUser.email}
          imageUrl={currentUser.avatarUrl}
          name={currentUser.name}
        />
      </Link>
    );
  }

  return (
    <div className="relative">
      {isOpen ? (
        <div className="absolute bottom-full left-0 right-0 mb-3 overflow-hidden rounded-lg border border-devstash-line bg-[#111318] shadow-2xl shadow-black/40">
          <Link
            className="flex h-11 items-center gap-3 px-3 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
            href="/profile"
            onClick={() => setIsOpen(false)}
          >
            <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
            Profile
          </Link>
          <button
            className="flex h-11 w-full items-center gap-3 px-3 text-left text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4 text-muted-foreground" />
            Sign out
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Link
          aria-label="Open profile"
          className="rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50"
          href="/profile"
        >
          <UserAvatar
            email={currentUser.email}
            imageUrl={currentUser.avatarUrl}
            name={currentUser.name}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-white">
            {currentUser.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
        <Button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close user menu" : "Open user menu"}
          className="size-9 rounded-lg border-devstash-line bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
          variant="outline"
        >
          <ChevronUp
            aria-hidden="true"
            className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}

function SidebarSection({
  children,
  isCollapsed,
  title,
}: {
  children: ReactNode;
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
  variant,
}: {
  collection: DashboardCollection;
  isCollapsed: boolean;
  onClick?: () => void;
  variant: "favorite" | "recent";
}) {
  return (
    <Link
      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
      href={`/collections/${collection.slug}`}
      onClick={onClick}
      title={isCollapsed ? collection.name : undefined}
    >
      {variant === "recent" ? (
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full ring-2 ring-white/[0.06]"
          style={{ backgroundColor: collection.accentColor }}
        />
      ) : (
        <Folder aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      )}
      {!isCollapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate text-base">{collection.name}</span>
          {variant === "favorite" ? (
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

function ViewAllCollectionsLink({
  isCollapsed,
  onClick,
}: {
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
      href="/collections"
      onClick={onClick}
      title={isCollapsed ? "View all collections" : undefined}
    >
      <Folder aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      {!isCollapsed ? (
        <span className="min-w-0 flex-1 truncate text-base">
          View all collections
        </span>
      ) : null}
    </Link>
  );
}

function isKnownItemTypeSlug(slug: string): slug is ItemTypeSlug {
  return slug in itemTypeIcons;
}

function renderSidebarItemTypeIcon(slug: string) {
  if (isKnownItemTypeSlug(slug)) {
    const Icon = itemTypeIcons[slug];

    return (
      <Icon
        aria-hidden="true"
        className={`size-5 shrink-0 ${itemTypeIconClasses[slug]}`}
      />
    );
  }

  return (
    <Circle aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
  );
}
