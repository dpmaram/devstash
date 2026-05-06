import type { Session } from "next-auth";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getItemDetail } from "@/lib/db/items";

export type ItemDetailRouteContext = {
  params: Promise<{
    id?: string;
  }> | {
    id?: string;
  };
};

type ItemDetailRouteDeps = {
  auth: () => Promise<Session | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getItemDetail: typeof getItemDetail;
};

const defaultItemDetailRouteDeps: ItemDetailRouteDeps = {
  auth,
  getDashboardUserForSession,
  getItemDetail,
};

async function getRouteParams(context: ItemDetailRouteContext) {
  return Promise.resolve(context.params);
}

export async function handleGetItemDetail(
  request: Request,
  context: ItemDetailRouteContext,
  deps: ItemDetailRouteDeps = defaultItemDetailRouteDeps,
) {
  void request;

  const session = await deps.auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        success: false,
        error: "You must be signed in.",
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await getRouteParams(context);

  if (!id) {
    return Response.json(
      {
        success: false,
        error: "Item id is required.",
      },
      {
        status: 400,
      },
    );
  }

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return Response.json(
      {
        success: false,
        error: "Item not found.",
      },
      {
        status: 404,
      },
    );
  }

  const item = await deps.getItemDetail({
    itemId: id,
    userId: dashboardUser.id,
  });

  if (!item) {
    return Response.json(
      {
        success: false,
        error: "Item not found.",
      },
      {
        status: 404,
      },
    );
  }

  return Response.json({
    success: true,
    item,
  });
}
