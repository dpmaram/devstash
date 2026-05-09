import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ItemCardGrid } from "@/components/dashboard/ItemDrawer";
import { NewItemDialog } from "@/components/dashboard/NewItemDialog";
import { PaginationControls } from "@/components/dashboard/PaginationControls";
import { buttonVariants } from "@/components/ui/button";
import { toCurrentUser } from "@/lib/auth/current-user";
import { shouldRequireProForItemType } from "@/lib/billing/item-type-gates";
import { getUserBillingState } from "@/lib/db/billing";
import { isCreateItemTypeSlug } from "@/lib/create-item-types";
import { getDashboardCollections } from "@/lib/db/collections";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getSearchIndexAction } from "@/actions/search";
import {
  getDashboardItemCountByTypeSlug,
  getDashboardItemsByTypeSlug,
  getDashboardItemTypes,
  normalizeItemTypeRouteSlug,
} from "@/lib/db/items";
import { shouldUseFileList } from "@/lib/file-list";
import { shouldUseImageGallery } from "@/lib/image-gallery";
import { mockDashboardData } from "@/lib/mock-data";
import {
  getTotalPages,
  ITEMS_PER_PAGE,
  parsePageNumber,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type ItemsByTypePageProps = {
  params: Promise<{
    type: string;
  }>;
  searchParams?: Promise<SearchParams>;
};

function getSearchParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: ItemsByTypePageProps) {
  const { type } = await params;
  const resolvedSearchParams = await searchParams;
  const initialItemId = getSearchParam(resolvedSearchParams, "itemId") ?? null;
  const currentPage = parsePageNumber(getSearchParam(resolvedSearchParams, "page"));
  const normalizedTypeSlug = normalizeItemTypeRouteSlug(type);
  const session = await auth();
  const dashboardUser = await getDashboardUserForSession(session?.user);
  const currentUser = toCurrentUser(session?.user, mockDashboardData.currentUser);
  const [itemTypes, sidebarCollections, searchIndex] = await Promise.all([
    getDashboardItemTypes({ user: dashboardUser }),
    getDashboardCollections({ limit: 20, user: dashboardUser }),
    getSearchIndexAction(),
  ]);
  const itemType = itemTypes.find(
    (candidateItemType) => candidateItemType.slug === normalizedTypeSlug,
  );

  if (!itemType) {
    notFound();
  }

  const billingState = dashboardUser
    ? await getUserBillingState(dashboardUser.id)
    : null;
  const isProUser = billingState?.isPro ?? false;

  if (shouldRequireProForItemType(itemType.slug, isProUser)) {
    return (
      <DashboardChrome
        collections={sidebarCollections}
        currentUser={currentUser}
        itemTypes={itemTypes}
        searchIndex={searchIndex}
      >
        <section className="space-y-8 p-5 sm:p-6 lg:p-8">
          <div className="rounded-xl border border-devstash-line bg-white/[0.04] p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Pro Feature
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Upgrade to Access {itemType.label}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              File and image libraries are available on Pro plans. Upgrade to
              unlock uploads, secure file access, and media organization.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90",
                )}
                href="/settings"
              >
                Upgrade to Pro
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/dashboard"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </DashboardChrome>
    );
  }

  const [items, totalItemCount] = await Promise.all([
    getDashboardItemsByTypeSlug({
      typeSlug: itemType.slug,
      user: dashboardUser,
      limit: ITEMS_PER_PAGE,
      page: currentPage,
    }),
    getDashboardItemCountByTypeSlug({
      typeSlug: itemType.slug,
      user: dashboardUser,
    }),
  ]);
  const totalPages = getTotalPages(totalItemCount, ITEMS_PER_PAGE);
  const canCreateItemType = isCreateItemTypeSlug(itemType.slug);

  return (
    <DashboardChrome
      collections={sidebarCollections}
      currentUser={currentUser}
      itemTypes={itemTypes}
      newItemInitialTypeSlug={canCreateItemType ? itemType.slug : null}
      searchIndex={searchIndex}
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
          initialItemId={initialItemId}
          items={items}
        />

        <PaginationControls
          currentPage={Math.min(currentPage, totalPages)}
          getPageHref={(page) => `/items/${itemType.slug}?page=${page}`}
          totalPages={totalPages}
        />
      </section>
    </DashboardChrome>
  );
}
