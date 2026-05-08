"use client";

import { useState } from "react";

import { toggleCollectionFavoriteAction } from "@/actions/collections";
import { CollectionCardWithMenu } from "./CollectionCardWithMenu";
import { CollectionDetailActions } from "./CollectionDetailActions";
import type { DashboardCollection } from "@/lib/db/collections";

export function DashboardCollectionsGrid({
  collections: initialCollections,
}: {
  collections: DashboardCollection[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [editingCollection, setEditingCollection] = useState<DashboardCollection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<DashboardCollection | null>(null);

  async function handleToggleFavorite(collection: DashboardCollection) {
    const previousFavorite = collection.isFavorite;

    // Optimistic UI update
    setCollections((prevCollections) =>
      prevCollections.map((c) =>
        c.id === collection.id ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );

    // Call server action
    const result = await toggleCollectionFavoriteAction(collection.id);

    if (!result.success) {
      // Revert on failure
      setCollections((prevCollections) =>
        prevCollections.map((c) =>
          c.id === collection.id ? { ...c, isFavorite: previousFavorite } : c
        )
      );
    }
  }

  if (collections.length === 0) {
    return (
      <div className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground md:col-span-2 2xl:grid-cols-3">
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
            onFavorite={handleToggleFavorite}
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
