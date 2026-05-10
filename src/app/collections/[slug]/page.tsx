import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CollectionDetailActions } from "@/components/dashboard/CollectionDetailActions";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid } from "@/components/dashboard/ItemDrawer";
import { PaginationControls } from "@/components/dashboard/PaginationControls";
import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import { toCurrentUser } from "@/lib/auth/current-user";
import {
  getDashboardCollectionBySlug,
  getDashboardCollections,
} from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getSearchIndexAction } from "@/actions/search";
import {
  getDashboardItemCountByCollectionSlug,
  getDashboardItemsByCollectionSlug,
  getDashboardItemTypes,
} from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";
import {
  COLLECTIONS_PER_PAGE,
  getTotalPages,
  parsePageNumber,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

type CollectionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: CollectionDetailPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePageNumber(getSearchParam(resolvedSearchParams, "page"));
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [collection, itemTypes, sidebarCollections, searchIndex] = await Promise.all([
    getDashboardCollectionBySlug({ slug, user: dashboardUser }),
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
    getSearchIndexAction(),
  ]);

  if (!collection) {
    notFound();
  }

  const [items, totalItemCount] = await Promise.all([
    getDashboardItemsByCollectionSlug({
      collectionSlug: collection.slug,
      user: dashboardUser,
      limit: COLLECTIONS_PER_PAGE,
      page: currentPage,
    }),
    getDashboardItemCountByCollectionSlug({
      collectionSlug: collection.slug,
      user: dashboardUser,
    }),
  ]);
  const totalPages = getTotalPages(totalItemCount, COLLECTIONS_PER_PAGE);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
      searchIndex={searchIndex}
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
          isProUser={currentUser.planTier === "pro"}
          items={items}
        />

        <PaginationControls
          currentPage={Math.min(currentPage, totalPages)}
          getPageHref={(page) => `/collections/${collection.slug}?page=${page}`}
          totalPages={totalPages}
        />
      </section>
    </DashboardChrome>
  );
}
