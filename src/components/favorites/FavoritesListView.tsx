"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";

import type { DashboardItem } from "@/lib/db/item-shaping";
import type { DashboardCollection } from "@/lib/db/collection-shaping";
import {
  itemTypeIcons,
  itemTypeIconClasses,
} from "@/components/dashboard/dashboard-icons";
import { cn } from "@/lib/utils";

type FavoritesData = {
  items: DashboardItem[];
  collections: DashboardCollection[];
  itemsCount: number;
  collectionsCount: number;
};

type FavoritesListViewProps = {
  data: FavoritesData;
};

export function FavoritesListView({ data }: FavoritesListViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
      {/* Items Section */}
      {data.itemsCount > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
            <Database className="size-4" />
            Items ({data.itemsCount})
          </h2>
          <article className="rounded-lg border border-devstash-line bg-white/[0.035]">
            <div className="divide-y divide-devstash-line/50">
              {data.items.map((item) => {
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
              {data.collections.map((collection) => (
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
