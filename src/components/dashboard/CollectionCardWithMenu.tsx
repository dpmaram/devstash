"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Circle, Folder, Heart, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { getAccentBorderStyle } from "./accent-border-style";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "./dashboard-icons";
import type { ItemTypeSlug } from "@/lib/mock-data";

export function CollectionCardWithMenu({
  collection,
  onEdit,
  onDelete,
  onFavorite,
}: {
  collection: DashboardCollection;
  onEdit: (collection: DashboardCollection) => void;
  onDelete: (collection: DashboardCollection) => void;
  onFavorite: (collection: DashboardCollection) => void;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleCardClick() {
    if (!isMenuOpen) {
      router.push(`/collections/${collection.slug}`);
    }
  }

  function handleMenuClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit(collection);
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(collection);
  }

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onFavorite(collection);
  }

  return (
    <div
      className="relative rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-5 transition hover:bg-white/[0.05] cursor-pointer"
      onClick={handleCardClick}
      style={getAccentBorderStyle(collection.accentColor)}
    >
      {/* Menu button */}
      <div className="absolute right-5 top-5">
        <button
          className="inline-flex size-8 items-center justify-center rounded-md border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
          onClick={handleMenuClick}
          type="button"
          title="Collection menu"
        >
          <MoreVertical className="size-4" />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-10 z-50 mt-1 w-48 rounded-lg border border-devstash-line bg-[#0b0d10] shadow-lg shadow-black/50">
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/[0.05] transition first:rounded-t-lg"
              onClick={handleEdit}
              type="button"
            >
              <Pencil className="size-4" />
              Edit
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/[0.05] transition"
              onClick={handleFavorite}
              type="button"
            >
              {collection.isFavorite ? (
                <>
                  <Heart className="size-4 fill-yellow-400 text-yellow-400" />
                  Remove Favorite
                </>
              ) : (
                <>
                  <Heart className="size-4" />
                  Add to Favorites
                </>
              )}
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition last:rounded-b-lg"
              onClick={handleDelete}
              type="button"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          </div>
        )}

        {/* Click outside handler */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-4 pr-12">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {collection.name}
            </h3>
            {collection.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {collection.itemCount} items
          </p>
        </div>
        <Folder
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-muted-foreground"
        />
      </div>
      <p className="mt-5 line-clamp-2 text-sm leading-6 text-zinc-400">
        {collection.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {collection.types.map((type) => {
          const Icon = getCollectionTypeIcon(type.slug);

          return (
            <span
              className="inline-flex size-6 items-center justify-center rounded-md bg-white/[0.05]"
              key={type.id}
              title={type.name}
            >
              <Icon
                aria-hidden="true"
                className={`size-4 ${getCollectionTypeIconClass(type.slug)}`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function isKnownItemTypeSlug(slug: string): slug is ItemTypeSlug {
  return slug in itemTypeIcons;
}

function getCollectionTypeIcon(slug: string) {
  if (isKnownItemTypeSlug(slug)) {
    return itemTypeIcons[slug];
  }

  return Circle;
}

function getCollectionTypeIconClass(slug: string) {
  if (isKnownItemTypeSlug(slug)) {
    return itemTypeIconClasses[slug];
  }

  return "text-zinc-400";
}
