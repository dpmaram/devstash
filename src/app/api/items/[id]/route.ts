import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import type { Session } from "next-auth";

export const runtime = "nodejs";

type ItemDetailRouteContext = {
  params: Promise<{
    id?: string;
  }> | {
    id?: string;
  };
};

type ItemDetailRouteDeps = {
  auth: () => Promise<Session | null>;
  getItemDetail: typeof getItemDetail;
};

const defaultItemDetailRouteDeps: ItemDetailRouteDeps = {
  auth,
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

  const item = await deps.getItemDetail({
    itemId: id,
    userId: session.user.id,
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

export async function GET(request: Request, context: ItemDetailRouteContext) {
  return handleGetItemDetail(request, context);
}
