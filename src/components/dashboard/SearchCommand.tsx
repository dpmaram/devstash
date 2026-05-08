"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
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
  const safeSearchIndex = searchIndex ?? { items: [], collections: [] };

  // Search items
  const itemResults = fuzzySearch(
    safeSearchIndex.items,
    search,
    (item: SearchItem) => `${item.title} ${item.type} ${item.preview || ""}`,
  );

  // Search collections - need to convert to searchable format
  const collectionResults = fuzzySearch(
    safeSearchIndex.collections,
    search,
    (col: SearchCollection) => col.name,
  );

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      // Item detail is rendered from the type route + drawer, not /items/{id}.
      router.push(`/items/${item.typeSlug}?itemId=${item.id}`);
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
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-devstash-line bg-[#0b0d10] shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search items and collections in your dashboard
          </Dialog.Description>

          <Command className="min-h-0 flex flex-1 flex-col" shouldFilter={false}>
            <div className="flex items-center gap-3 border-b border-devstash-line px-4 py-3">
              <Search className="size-5 text-muted-foreground" />
              <Command.Input
                className="h-10 w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                onValueChange={setSearch}
                placeholder="Search items and collections... (⌘K)"
                value={search}
              />
            </div>

            <Command.List className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {!search ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Type to search items and collections
                </div>
              ) : null}

              {itemResults.length > 0 ? (
                <Command.Group heading="Items">
                  {itemResults.map((result: SearchResult<SearchItem>) => {
                    const item = result.item;
                    const Icon: LucideIcon =
                      itemTypeIcons[item.typeSlug as ItemTypeSlug] || FileText;

                    return (
                      <Command.Item
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.05]",
                        )}
                        key={item.id}
                        onSelect={() => handleSelectItem(item)}
                        value={item.id}
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
              ) : null}

              {collectionResults.length > 0 ? (
                <Command.Group heading="Collections">
                  {collectionResults.map((result: SearchResult<SearchCollection>) => {
                    const col = result.item;
                    return (
                      <Command.Item
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.05]",
                        )}
                        key={col.id}
                        onSelect={() => handleSelectCollection(col.slug)}
                        value={col.id}
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
              ) : null}

              {search && itemResults.length === 0 && collectionResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results found for &quot;{search}&quot;
                </div>
              ) : null}
            </Command.List>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
