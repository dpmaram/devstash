import Link from "next/link";
import { Circle, Folder, Star } from "lucide-react";

import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import {
  getDashboardCollectionData,
  type DashboardCollection,
  type DashboardStat,
} from "@/lib/db/collections";
import {
  mockDashboardData,
  type DashboardItem,
  type ItemTypeSlug,
} from "@/lib/mock-data";

export async function DashboardShell() {
  const { currentUser, itemTypes } = mockDashboardData;
  const { collections, stats } = await getDashboardCollectionData({ limit: 6 });

  return (
    <DashboardChrome
      collections={collections}
      currentUser={currentUser}
      itemTypes={itemTypes}
    >
      <DashboardMain collections={collections} stats={stats} />
    </DashboardChrome>
  );
}

function DashboardMain({
  collections,
  stats,
}: {
  collections: DashboardCollection[];
  stats: DashboardStat[];
}) {
  const { items } = mockDashboardData;
  const pinnedItems = items.filter((item) => item.isPinned);
  const recentCollections = collections.slice(0, 6);
  const recentItems = items.slice(0, 10);

  return (
    <section className="space-y-8 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            className="rounded-lg border border-devstash-line bg-white/[0.035] p-5"
            key={stat.label}
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <DashboardSection title="Recent Collections">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {recentCollections.length === 0 ? (
            <div className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
              No collections yet.
            </div>
          ) : null}
          {recentCollections.map((collection) => (
            <CollectionCard collection={collection} key={collection.id} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Pinned Items">
        <div className="grid gap-4 xl:grid-cols-3">
          {pinnedItems.map((item) => (
            <PinnedItemCard item={item} key={item.id} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Recent Items">
        <div className="space-y-3">
          {recentItems.map((item) => (
            <RecentItemRow item={item} key={item.id} />
          ))}
        </div>
      </DashboardSection>
    </section>
  );
}

function DashboardSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  return (
    <Link
      className="block rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-5 transition hover:bg-white/[0.05]"
      href={`/collections/${collection.slug}`}
      style={{ borderLeftColor: collection.accentColor }}
    >
      <div className="flex items-start justify-between gap-4">
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
    </Link>
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

function PinnedItemCard({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeSlug];

  return (
    <Link
      className="block rounded-lg border border-devstash-line bg-white/[0.025] p-5 transition hover:bg-white/[0.05]"
      href={`/items/${item.typeSlug}s`}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          <Icon
            aria-hidden="true"
            className={`size-5 ${itemTypeIconClasses[item.typeSlug]}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {item.title}
            </h3>
            <span className="text-muted-foreground">Pinned</span>
            {item.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {item.description}
          </p>
          <TagList tags={item.tags} />
        </div>
      </div>
    </Link>
  );
}

function RecentItemRow({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeSlug];

  return (
    <Link
      className="flex items-start gap-4 rounded-lg border border-devstash-line bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
      href={`/items/${item.typeSlug}s`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        <Icon
          aria-hidden="true"
          className={`size-5 ${itemTypeIconClasses[item.typeSlug]}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-white">
                {item.title}
              </h3>
              {item.isPinned ? (
                <span className="text-sm text-muted-foreground">Pinned</span>
              ) : null}
              {item.isFavorite ? (
                <Star
                  aria-hidden="true"
                  className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
                />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">
              {item.description}
            </p>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">{item.updatedAt}</p>
        </div>
        <TagList tags={item.tags} />
      </div>
    </Link>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-md bg-white/[0.06] px-2.5 py-1 text-sm text-zinc-300"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
