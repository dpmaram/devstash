import type { Session } from "next-auth";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getItemDetail } from "@/lib/db/items";
import { getStoredFile } from "@/lib/storage/r2";

export const runtime = "nodejs";

type DownloadRouteContext = {
  params: Promise<{
    id?: string;
  }> | {
    id?: string;
  };
};

type DownloadRouteDeps = {
  auth: () => Promise<Session | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getItemDetail: typeof getItemDetail;
  getStoredFile: typeof getStoredFile;
};

const defaultDownloadRouteDeps: DownloadRouteDeps = {
  auth,
  getDashboardUserForSession,
  getItemDetail,
  getStoredFile,
};

async function getRouteParams(context: DownloadRouteContext) {
  return Promise.resolve(context.params);
}

export async function handleDownloadFile(
  request: Request,
  context: DownloadRouteContext,
  deps: DownloadRouteDeps = defaultDownloadRouteDeps,
) {
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
    return createFileNotFoundResponse();
  }

  const item = await deps.getItemDetail({
    itemId: id,
    userId: dashboardUser.id,
  });

  if (!item?.fileUrl) {
    return createFileNotFoundResponse();
  }

  const storedFile = await deps.getStoredFile(item.fileUrl);

  if (!storedFile) {
    return createFileNotFoundResponse();
  }

  const contentDisposition =
    new URL(request.url).searchParams.get("disposition") === "inline"
      ? "inline"
      : "attachment";

  return new Response(toArrayBuffer(storedFile.body), {
    headers: {
      "content-disposition": `${contentDisposition}; filename="${escapeHeaderValue(
        item.fileName ?? "download",
      )}"`,
      "content-length": String(storedFile.contentLength),
      "content-type": storedFile.contentType,
    },
  });
}

export async function GET(request: Request, context: DownloadRouteContext) {
  return handleDownloadFile(request, context);
}

function createFileNotFoundResponse() {
  return Response.json(
    {
      success: false,
      error: "File not found.",
    },
    {
      status: 404,
    },
  );
}

function escapeHeaderValue(value: string) {
  return value.replace(/["\\]/g, "");
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);

  copy.set(bytes);

  return copy.buffer;
}
