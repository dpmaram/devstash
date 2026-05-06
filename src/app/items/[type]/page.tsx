import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid } from "@/components/dashboard/ItemDrawer";
import { NewItemDialog } from "@/components/dashboard/NewItemDialog";
import { toCurrentUser } from "@/lib/auth/current-user";
import { isCreateItemTypeSlug } from "@/lib/create-item-types";
import { getDashboardCollections } from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  getDashboardItemsByTypeSlug,
  getDashboardItemTypes,
  normalizeItemTypeRouteSlug,
} from "@/lib/db/items";
import { shouldUseFileList } from "@/lib/file-list";
import { shouldUseImageGallery } from "@/lib/image-gallery";
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
  const canCreateItemType = isCreateItemTypeSlug(itemType.slug);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
      newItemInitialTypeSlug={canCreateItemType ? itemType.slug : null}
    >
      <section className="space-y-8 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

          {canCreateItemType ? (
            <NewItemDialog
              collections={sidebarCollections}
              initialTypeSlug={itemType.slug}
              itemTypes={itemTypes}
              triggerClassName="w-full sm:w-auto"
              triggerLabel={`New ${itemType.name}`}
              triggerLabelClassName="inline"
            />
          ) : null}
        </div>

        <ItemCardGrid
          availableCollections={sidebarCollections}
          displayMode={
            shouldUseImageGallery(itemType.slug)
              ? "imageGallery"
              : shouldUseFileList(itemType.slug)
                ? "fileList"
                : "cards"
          }
          emptyMessage={`No ${itemType.label.toLowerCase()} saved yet.`}
          items={items}
        />
      </section>
    </DashboardChrome>
  );
}
