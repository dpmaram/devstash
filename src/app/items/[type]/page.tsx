import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid } from "@/components/dashboard/ItemDrawer";
import { toCurrentUser } from "@/lib/auth/current-user";
import { getDashboardCollections } from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  getDashboardItemsByTypeSlug,
  getDashboardItemTypes,
  normalizeItemTypeRouteSlug,
} from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type ItemsByTypePageProps = {
  params: Promise<{
    type: string;
  }>;
};

export default async function ItemsByTypePage({ params }: ItemsByTypePageProps) {
  const { type } = await params;
  const normalizedTypeSlug = normalizeItemTypeRouteSlug(type);
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [itemTypes, sidebarCollections] = await Promise.all([
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
  ]);
  const itemType = itemTypes.find(
    (candidateItemType) => candidateItemType.slug === normalizedTypeSlug,
  );

  if (!itemType) {
    notFound();
  }

  const items = await getDashboardItemsByTypeSlug({
    typeSlug: itemType.slug,
    user: dashboardUser,
  });

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
    >
      <section className="space-y-8 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Items
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            {itemType.label}
          </h1>
          <p className="text-base text-muted-foreground">
            Browse your saved {itemType.label.toLowerCase()}.
          </p>
        </div>

        <ItemCardGrid
          emptyMessage={`No ${itemType.label.toLowerCase()} saved yet.`}
          items={items}
        />
      </section>
    </DashboardChrome>
  );
}
