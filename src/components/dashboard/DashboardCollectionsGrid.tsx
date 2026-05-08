"use client";

import { useState } from "react";

import { CollectionCardWithMenu } from "./CollectionCardWithMenu";
import { CollectionDetailActions } from "./CollectionDetailActions";
import type { DashboardCollection } from "@/lib/db/collections";

export function DashboardCollectionsGrid({
  collections,
}: {
  collections: DashboardCollection[];
}) {
  const [editingCollection, setEditingCollection] = useState<DashboardCollection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<DashboardCollection | null>(null);

  if (collections.length === 0) {
    return (
      <div className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
        No collections yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCardWithMenu
            collection={collection}
            key={collection.id}
            onEdit={setEditingCollection}
            onDelete={setDeletingCollection}
            onFavorite={() => {}}
          />
        ))}
      </div>

      {editingCollection && (
        <CollectionDetailActions
          collection={editingCollection}
          initialMode="edit"
          onClose={() => setEditingCollection(null)}
        />
      )}

      {deletingCollection && (
        <CollectionDetailActions
          collection={deletingCollection}
          initialMode="delete"
          onClose={() => setDeletingCollection(null)}
        />
      )}
    </>
  );
}
