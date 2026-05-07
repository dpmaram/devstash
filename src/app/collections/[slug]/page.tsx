import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CollectionDetailActions } from "@/components/dashboard/CollectionDetailActions";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid } from "@/components/dashboard/ItemDrawer";
import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import { toCurrentUser } from "@/lib/auth/current-user";
import {
  getDashboardCollectionBySlug,
  getDashboardCollections,
} from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  getDashboardItemsByCollectionSlug,
  getDashboardItemTypes,
} from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type CollectionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { slug } = await params;
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [collection, itemTypes, sidebarCollections] = await Promise.all([
    getDashboardCollectionBySlug({ slug, user: dashboardUser }),
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
  ]);

  if (!collection) {
    notFound();
  }

  const items = await getDashboardItemsByCollectionSlug({
    collectionSlug: collection.slug,
    user: dashboardUser,
  });

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
    >
      <section className="space-y-8 p-5 sm:p-6 lg:p-8">
        <div
          className="space-y-4 border-l-4 pl-5"
          style={getAccentBorderStyle(collection.accentColor)}
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Collection
            </p>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {collection.name}
              </h1>
              <CollectionDetailActions collection={collection} />
            </div>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {collection.description}
            </p>
          </div>
          <p className="text-sm text-zinc-400">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <ItemCardGrid
          availableCollections={sidebarCollections}
          emptyMessage="No items in this collection yet."
          items={items}
        />
      </section>
    </DashboardChrome>
  );
}
