"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FileText, Folder, type LucideIcon } from "lucide-react";
import { fuzzySearch, type SearchResult } from "@/lib/fuzzy-search";
import type { SearchIndex, SearchItem, SearchCollection } from "@/lib/db/search";
import { itemTypeIcons } from "./dashboard-icons";
import type { ItemTypeSlug } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchIndex: SearchIndex;
};

export function SearchCommand({
  open,
  onOpenChange,
  searchIndex,
}: SearchCommandProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Search items
  const itemResults = fuzzySearch(
    searchIndex.items,
    search,
    (item: SearchItem) => `${item.title} ${item.type} ${item.preview || ""}`,
  );

  // Search collections - need to convert to searchable format
  const collectionResults = fuzzySearch(
    searchIndex.collections,
    search,
    (col: SearchCollection) => col.name,
  );

  const handleSelectItem = useCallback(
    (itemId: string) => {
      router.push(`/items/${itemId}`);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  const handleSelectCollection = useCallback(
    (collectionSlug: string) => {
      router.push(`/collections/${collectionSlug}`);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-3 border-b border-devstash-line px-4 py-3">
        <Search className="size-5 text-muted-foreground" />
        <Command.Input
          placeholder="Search items and collections... (⌘K)"
          className="h-10 w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          value={search}
          onValueChange={setSearch}
        />
      </div>

      <Command.List className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {!search ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Type to search items and collections
          </div>
        ) : null}

        {/* Items Section */}
        {itemResults.length > 0 ? (
          <>
            <Command.Group heading="Items">
              {itemResults.map((result: SearchResult<SearchItem>) => {
                const item = result.item as SearchItem;
                const Icon: LucideIcon =
                  itemTypeIcons[item.typeSlug as ItemTypeSlug] ||
                  FileText;
                return (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelectItem(item.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.05]",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.type}
                        {item.preview ? ` • ${item.preview}` : ""}
                      </div>
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </>
        ) : null}

        {/* Collections Section */}
        {collectionResults.length > 0 ? (
          <>
            <Command.Group heading="Collections">
              {collectionResults.map((result) => {
                const col = result.item as SearchCollection;
                return (
                  <Command.Item
                    key={col.id}
                    value={col.id}
                    onSelect={() => handleSelectCollection(col.slug)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.05]",
                    )}
                  >
                    <Folder className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {col.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {col.itemCount} items
                      </div>
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </>
        ) : null}

        {search && itemResults.length === 0 && collectionResults.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found for &quot;{search}&quot;
          </div>
        ) : null}
      </Command.List>
    </Command.Dialog>
  );
}
