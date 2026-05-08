import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { CollectionsGridWithMenu } from "@/components/dashboard/CollectionsGridWithMenu";
import { PaginationControls } from "@/components/dashboard/PaginationControls";
import { getSearchIndexAction } from "@/actions/search";
import { toCurrentUser } from "@/lib/auth/current-user";
import {
  getDashboardCollectionCount,
  getDashboardCollections,
} from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getDashboardItemTypes } from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";
import {
  COLLECTIONS_PER_PAGE,
  getTotalPages,
  parsePageNumber,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type CollectionsPageProps = {
  searchParams?: Promise<SearchParams>;
};

function getSearchParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePageNumber(getSearchParam(resolvedSearchParams, "page"));
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [collections, totalCollectionCount, itemTypes, sidebarCollections, searchIndex] =
    await Promise.all([
      getDashboardCollections({
        limit: COLLECTIONS_PER_PAGE,
        page: currentPage,
        user: dashboardUser,
      }),
      getDashboardCollectionCount({ user: dashboardUser }),
      getDashboardItemTypes({ user: dashboardUser }),
      getDashboardCollections({ limit: 20, user: dashboardUser }),
      getSearchIndexAction(),
    ]);
  const totalPages = getTotalPages(totalCollectionCount, COLLECTIONS_PER_PAGE);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
      searchIndex={searchIndex}
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

        <CollectionsGridWithMenu collections={collections} />

        <PaginationControls
          currentPage={Math.min(currentPage, totalPages)}
          getPageHref={(page) => `/collections?page=${page}`}
          totalPages={totalPages}
        />
      </section>
    </DashboardChrome>
  );
}
