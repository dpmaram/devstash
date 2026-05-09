"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ChevronUp,
  Circle,
  Folder,
  Heart,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
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
import { NewCollectionDialog } from "@/components/dashboard/NewCollectionDialog";
import { NewItemDialog } from "@/components/dashboard/NewItemDialog";
import { SearchCommand } from "@/components/dashboard/SearchCommand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItemType } from "@/lib/db/items";
import type { SearchIndex } from "@/lib/db/search";
import type { CurrentUser, ItemTypeSlug } from "@/lib/mock-data";

type DashboardChromeProps = {
  children: ReactNode;
  collections: DashboardCollection[];
  currentUser: CurrentUser;
  itemTypes: DashboardItemType[];
  newItemInitialTypeSlug?: string | null;
  searchIndex: SearchIndex;
};

export function DashboardChrome({
  children,
  collections,
  currentUser,
  itemTypes,
  newItemInitialTypeSlug,
  searchIndex,
}: DashboardChromeProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      <SearchCommand
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        searchIndex={searchIndex}
      />
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
          <TopBar
            collections={collections}
            currentUser={currentUser}
            newItemInitialTypeSlug={newItemInitialTypeSlug}
            itemTypes={itemTypes}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
          {children}
        </div>
      </div>
    </main>
  );
}

function TopBar({
  collections,
  currentUser,
  itemTypes,
  newItemInitialTypeSlug,
  onOpenMobileSidebar,
  onOpenSearch,
}: {
  collections: DashboardCollection[];
  currentUser: CurrentUser;
  itemTypes: DashboardItemType[];
  newItemInitialTypeSlug?: string | null;
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
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

      <button
        className="relative min-w-0 flex-1 max-w-2xl cursor-pointer rounded-lg border border-devstash-line bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
        onClick={onOpenSearch}
        type="button"
      >
        <div className="flex items-center gap-3">
          <Search
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
          <span className="text-base text-muted-foreground">
            Search items...
          </span>
          <kbd className="ml-auto hidden text-xs font-semibold text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {currentUser.planTier === "free" && (
          <Link href="/upgrade">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Upgrade
            </Button>
          </Link>
        )}
        <Link
          href="/favorites"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-red-400"
          title="Favorites"
        >
          <Heart aria-hidden="true" className="size-5" />
        </Link>
        <NewCollectionDialog />
        <NewItemDialog
          collections={collections}
          initialTypeSlug={newItemInitialTypeSlug}
          itemTypes={itemTypes}
        />
      </div>
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
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white">
          <Folder aria-hidden="true" className="size-5" />
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
            const isProOnlyType = shouldShowSidebarProBadge(itemType.slug);
            const shouldShowUpgradeHint =
              currentUser.planTier === "free" && isProOnlyType;

            return (
              <Link
                className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                href={itemType.href}
                key={itemType.id}
                onClick={variant === "mobile" ? onCloseMobile : undefined}
                title={
                  isCollapsed
                    ? shouldShowUpgradeHint
                      ? `${itemType.label} (Pro feature - upgrade required)`
                      : itemType.label
                    : undefined
                }
              >
                {renderSidebarItemTypeIcon(itemType.slug)}
                {!isCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-base">
                      {itemType.label}
                    </span>
                    {shouldShowUpgradeHint ? (
                      <Badge
                        className="h-5 rounded-md border-devstash-line bg-white/[0.04] px-1.5 text-[0.62rem] font-semibold text-muted-foreground"
                        title="Upgrade to Pro to access this section"
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
      <div className="flex flex-col items-center gap-2">
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
        <Link
          aria-label="Settings"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-white"
          href="/settings"
          title="Settings"
        >
          <Settings aria-hidden="true" className="size-4" />
        </Link>
      </div>
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
          <Link
            className="flex h-11 items-center gap-3 px-3 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
            href="/settings"
            onClick={() => setIsOpen(false)}
          >
            <Settings aria-hidden="true" className="size-4 text-muted-foreground" />
            Settings
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
