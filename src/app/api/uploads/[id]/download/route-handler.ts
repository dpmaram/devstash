import type { Session } from "next-auth";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getItemDetail } from "@/lib/db/items";
import { getStoredFile } from "@/lib/storage/s3";

export type DownloadRouteContext = {
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

  const headers = new Headers({
    "cache-control": storedFile.cacheControl ?? "private, max-age=3600",
    "content-disposition": `${contentDisposition}; filename="${escapeHeaderValue(
      item.fileName ?? "download",
    )}"`,
    "content-type": storedFile.contentType,
  });

  if (storedFile.contentLength !== undefined) {
    headers.set("content-length", String(storedFile.contentLength));
  }

  if (storedFile.eTag) {
    headers.set("etag", storedFile.eTag);
  }

  if (storedFile.lastModified) {
    headers.set("last-modified", storedFile.lastModified.toUTCString());
  }

  return new Response(storedFile.body, {
    headers,
  });
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
