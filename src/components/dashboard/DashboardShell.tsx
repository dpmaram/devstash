import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid, ItemRowList } from "@/components/dashboard/ItemDrawer";
import { CollectionsGridWithMenu } from "@/components/dashboard/CollectionsGridWithMenu";
import {
  getDashboardCollectionData,
  getDashboardCollections,
  type DashboardCollection,
  type DashboardStat,
} from "@/lib/db/collections";
import {
  getDashboardItemData,
  getDashboardItemTypes,
  type DashboardItem,
} from "@/lib/db/items";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { toCurrentUser } from "@/lib/auth/current-user";
import { mockDashboardData } from "@/lib/mock-data";
import { getSearchIndexAction } from "@/actions/search";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";

export async function DashboardShell() {
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [
    { collections, stats },
    { pinnedItems, recentItems },
    itemTypes,
    sidebarCollections,
    searchIndex,
  ] = await Promise.all([
    getDashboardCollectionData({ limit: DASHBOARD_COLLECTIONS_LIMIT, user: dashboardUser }),
    getDashboardItemData({ pinnedLimit: 3, recentLimit: DASHBOARD_RECENT_ITEMS_LIMIT, user: dashboardUser }),
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
    getSearchIndexAction(),
  ]);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
      searchIndex={searchIndex}
    >
      <DashboardMain
        availableCollections={sidebarCollections}
        collections={collections}
        isProUser={currentUser.planTier === "pro"}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        stats={stats}
      />
    </DashboardChrome>
  );
}

function DashboardMain({
  availableCollections,
  collections,
  isProUser,
  pinnedItems,
  recentItems,
  stats,
}: {
  availableCollections: DashboardCollection[];
  collections: DashboardCollection[];
  isProUser: boolean;
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
  stats: DashboardStat[];
}) {
  const recentCollections = collections.slice(0, 6);

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
        <CollectionsGridWithMenu collections={recentCollections} />
      </DashboardSection>

      {pinnedItems.length > 0 ? (
        <DashboardSection title="Pinned Items">
          <ItemCardGrid
            availableCollections={availableCollections}
            isProUser={isProUser}
            items={pinnedItems}
          />
        </DashboardSection>
      ) : null}

      <DashboardSection title="Recent Items">
        <ItemRowList
          availableCollections={availableCollections}
          isProUser={isProUser}
          items={recentItems}
        />
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
