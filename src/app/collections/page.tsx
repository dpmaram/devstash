import Link from "next/link";
import { Circle, Folder, Star } from "lucide-react";

import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { toCurrentUser } from "@/lib/auth/current-user";
import {
  getDashboardCollections,
  type DashboardCollection,
} from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getDashboardItemTypes } from "@/lib/db/items";
import { mockDashboardData, type ItemTypeSlug } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [collections, itemTypes, sidebarCollections] = await Promise.all([
    getDashboardCollections({ limit: 50, user: dashboardUser }),
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
  ]);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
    >
      <section className="space-y-8 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Collections
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            All Collections
          </h1>
          <p className="text-base text-muted-foreground">
            Browse your saved groups of developer knowledge.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {collections.length === 0 ? (
            <div className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
              No collections yet.
            </div>
          ) : null}
          {collections.map((collection) => (
            <CollectionCard collection={collection} key={collection.id} />
          ))}
        </div>
      </section>
    </DashboardChrome>
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
      style={getAccentBorderStyle(collection.accentColor)}
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
