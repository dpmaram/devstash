import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { CollectionsGridWithMenu } from "@/components/dashboard/CollectionsGridWithMenu";
import { toCurrentUser } from "@/lib/auth/current-user";
import {
  getDashboardCollections,
} from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getDashboardItemTypes } from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";
import { getSearchIndexAction } from "@/actions/search";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [collections, itemTypes, sidebarCollections, searchIndex] = await Promise.all([
    getDashboardCollections({ limit: 50, user: dashboardUser }),
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
      </section>
    </DashboardChrome>
  );
}
