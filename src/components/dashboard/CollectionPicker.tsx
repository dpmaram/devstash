"use client";

import { Check, Folder } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

type CollectionPickerProps = {
  collections: DashboardCollection[];
  disabled?: boolean;
  onChange: (collectionIds: string[]) => void;
  selectedCollectionIds: string[];
};

export function CollectionPicker({
  collections,
  disabled,
  onChange,
  selectedCollectionIds,
}: CollectionPickerProps) {
  const selectedCollectionIdSet = new Set(selectedCollectionIds);

  function toggleCollection(collectionId: string) {
    if (disabled) {
      return;
    }

    if (selectedCollectionIdSet.has(collectionId)) {
      onChange(
        selectedCollectionIds.filter(
          (selectedCollectionId) => selectedCollectionId !== collectionId,
        ),
      );
      return;
    }

    onChange([...selectedCollectionIds, collectionId]);
  }

  if (collections.length === 0) {
    return (
      <div className="rounded-lg border border-devstash-line bg-white/[0.025] px-3 py-3 text-sm text-muted-foreground">
        No collections available.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {collections.map((collection) => {
        const isSelected = selectedCollectionIdSet.has(collection.id);

        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "flex min-h-16 items-start gap-3 rounded-lg border border-devstash-line bg-white/[0.03] px-3 py-3 text-left transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              isSelected && "border-white/30 bg-white/[0.09]",
            )}
            disabled={disabled}
            key={collection.id}
            onClick={() => toggleCollection(collection.id)}
            type="button"
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-devstash-line bg-black/20 text-transparent",
                isSelected &&
                  "border-emerald-300/50 bg-emerald-400/15 text-emerald-200",
              )}
            >
              <Check aria-hidden="true" className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <Folder
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate text-sm font-medium text-zinc-100">
                  {collection.name}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {collection.itemCount} items
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
