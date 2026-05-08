"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Database,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";

import type { DashboardItem } from "@/lib/db/item-shaping";
import type { DashboardCollection } from "@/lib/db/collection-shaping";
import {
  itemTypeIcons,
  itemTypeIconClasses,
} from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortType = "name" | "date" | "type";
type SortDirection = "asc" | "desc";

type SortPreference = {
  type: SortType;
  direction: SortDirection;
};

const SORT_STORAGE_KEY = "favorites-sort";
const DEFAULT_SORT: SortPreference = { type: "date", direction: "desc" };

type FavoritesData = {
  items: DashboardItem[];
  collections: DashboardCollection[];
  itemsCount: number;
  collectionsCount: number;
};

type FavoritesListViewProps = {
  data: FavoritesData;
};

function getSortPreference(): SortPreference {
  if (typeof window === "undefined") return DEFAULT_SORT;
  
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

function setSortPreference(pref: SortPreference): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(pref));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function sortItems(items: DashboardItem[], sort: SortPreference): DashboardItem[] {
  const sorted = [...items];

  switch (sort.type) {
    case "name":
      sorted.sort((a, b) =>
        sort.direction === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      );
      break;
    case "date":
      sorted.sort((a, b) => {
        const aDate = new Date(a.updatedAt).getTime();
        const bDate = new Date(b.updatedAt).getTime();
        return sort.direction === "asc" ? aDate - bDate : bDate - aDate;
      });
      break;
    case "type":
      sorted.sort((a, b) =>
        sort.direction === "asc"
          ? a.itemType.name.localeCompare(b.itemType.name)
          : b.itemType.name.localeCompare(a.itemType.name)
      );
      break;
  }

  return sorted;
}

function sortCollections(
  collections: DashboardCollection[],
  sort: SortPreference
): DashboardCollection[] {
  const sorted = [...collections];

  switch (sort.type) {
    case "name":
      sorted.sort((a, b) =>
        sort.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
      break;
    case "date":
      sorted.sort((a, b) => {
        const aDate = new Date(a.updatedAt).getTime();
        const bDate = new Date(b.updatedAt).getTime();
        return sort.direction === "asc" ? aDate - bDate : bDate - aDate;
      });
      break;
    case "type":
      // Collections don't have a "type" field, so sort by item count as fallback
      sorted.sort((a, b) =>
        sort.direction === "asc"
          ? a.itemCount - b.itemCount
          : b.itemCount - a.itemCount
      );
      break;
  }

  return sorted;
}

export function FavoritesListView({ data }: FavoritesListViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortPreference>(() => getSortPreference());

  // Update sort and persist to localStorage
  function handleSortChange(newSort: SortPreference) {
    setSort(newSort);
    setSortPreference(newSort);
  }

  // Toggle sort direction
  function toggleDirection() {
    const newDirection: SortDirection = sort.direction === "asc" ? "desc" : "asc";
    const newSort: SortPreference = {
      ...sort,
      direction: newDirection,
    };
    handleSortChange(newSort);
  }

  // Apply sorting to data
  const sortedItems = sortItems(data.items, sort);
  const sortedCollections = sortCollections(data.collections, sort);

  const isEmpty = data.itemsCount === 0 && data.collectionsCount === 0;

  if (isEmpty) {
    return (
      <article className="rounded-lg border border-devstash-line bg-white/[0.035] p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="size-8 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium text-white">No favorites yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add items or collections to your favorites to see them here
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <div className="flex gap-1">
          {(["name", "date", "type"] as const).map((sortType) => (
            <Button
              key={sortType}
              onClick={() => {
                const newDirection: SortDirection =
                  sort.type === sortType && sort.direction === "desc" ? "asc" : "desc";
                handleSortChange({
                  type: sortType,
                  direction: newDirection,
                });
              }}
              size="sm"
              variant={sort.type === sortType ? "default" : "outline"}
              className={cn(
                "gap-1.5",
                sort.type === sortType &&
                  "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <span>{sortType === "date" ? "Date" : sortType === "type" ? "Type" : "Name"}</span>
              {sort.type === sortType && (
                <ArrowUpDown
                  className={cn(
                    "size-3.5",
                    sort.direction === "desc" && "rotate-180"
                  )}
                />
              )}
            </Button>
          ))}
        </div>
        <Button
          onClick={toggleDirection}
          size="sm"
          variant="ghost"
          title={`Sort ${sort.direction === "asc" ? "descending" : "ascending"}`}
          className="gap-1"
        >
          <ArrowUpDown
            className={cn("size-4", sort.direction === "desc" && "rotate-180")}
          />
        </Button>
      </div>
      {/* Items Section */}
      {data.itemsCount > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
            <Database className="size-4" />
            Items ({data.itemsCount})
          </h2>
          <article className="rounded-lg border border-devstash-line bg-white/[0.035]">
            <div className="divide-y divide-devstash-line/50">
              {sortedItems.map((item) => {
                const IconComponent = itemTypeIcons[item.typeSlug as keyof typeof itemTypeIcons];
                const iconClass =
                  itemTypeIconClasses[item.typeSlug as keyof typeof itemTypeIconClasses];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/[0.08] active:bg-white/[0.12]"
                  >
                    <div className="flex items-center gap-3">
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            "size-4 shrink-0",
                            iconClass || "text-muted-foreground",
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-mono text-sm text-white">
                            {item.title}
                          </span>
                          <span className="inline-block shrink-0 rounded bg-white/[0.1] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            {item.itemType.name}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {item.updatedAt}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          {/* ItemDrawer Portal */}
          {selectedItemId && (
            <div
              className="fixed inset-0 z-50 bg-black/50 transition-opacity"
              onClick={() => setSelectedItemId(null)}
              role="presentation"
            >
              <ItemDrawerPortal
                itemId={selectedItemId}
                onClose={() => setSelectedItemId(null)}
              />
            </div>
          )}
        </section>
      )}

      {/* Collections Section */}
      {data.collectionsCount > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
            <Database className="size-4" />
            Collections ({data.collectionsCount})
          </h2>
          <article className="rounded-lg border border-devstash-line bg-white/[0.035]">
            <div className="divide-y divide-devstash-line/50">
              {sortedCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="block px-4 py-2.5 transition hover:bg-white/[0.08] active:bg-white/[0.12]"
                >
                  <div className="flex items-center gap-3">
                    <Database className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm text-white">
                          {collection.name}
                        </span>
                        <span className="inline-block shrink-0 rounded bg-white/[0.1] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {collection.itemCount} items
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {collection.updatedAt}
                      </div>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

// Placeholder for ItemDrawer - will be replaced with actual drawer once we determine how to handle it
function ItemDrawerPortal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  return (
    <div
      className="pointer-events-auto fixed right-0 top-0 bottom-0 w-96 bg-devstash-bg shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground hover:text-white"
      >
        ✕
      </button>
      <div className="p-4 text-center text-muted-foreground">
        Item drawer for {itemId}
      </div>
    </div>
  );
}
