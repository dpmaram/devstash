import { randomUUID } from "node:crypto";

import type { Session } from "next-auth";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getS3Config, putStoredFile } from "@/lib/storage/s3";
import {
  buildUploadObjectKey,
  validateUploadCandidate,
} from "@/lib/uploads";

type UploadRouteDeps = {
  auth: () => Promise<Session | null>;
  createUploadId: () => string;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getUploadPrefix?: () => string;
  putStoredFile: typeof putStoredFile;
};

const defaultUploadRouteDeps: UploadRouteDeps = {
  auth,
  createUploadId: randomUUID,
  getDashboardUserForSession,
  getUploadPrefix: () => getS3Config().uploadPrefix,
  putStoredFile,
};

export async function handleUploadFile(
  request: Request,
  deps: UploadRouteDeps = defaultUploadRouteDeps,
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

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return Response.json(
      {
        success: false,
        error: "Unable to upload file.",
      },
      {
        status: 400,
      },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const typeSlug = formData.get("typeSlug");

  if (!(file instanceof File) || typeof typeSlug !== "string") {
    return Response.json(
      {
        success: false,
        error: "Upload is required.",
      },
      {
        status: 400,
      },
    );
  }

  const validation = validateUploadCandidate(
    {
      name: file.name,
      size: file.size,
      type: file.type,
    },
    typeSlug,
  );

  if (!validation.success) {
    return Response.json(
      {
        success: false,
        error: validation.error,
      },
      {
        status: 400,
      },
    );
  }

  const fileUrl = buildUploadObjectKey({
    fileName: file.name,
    prefix: deps.getUploadPrefix?.(),
    uploadId: deps.createUploadId(),
    userId: dashboardUser.id,
  });
  const body = new Uint8Array(await file.arrayBuffer());

  try {
    await deps.putStoredFile({
      body,
      contentLength: file.size,
      contentType: file.type,
      key: fileUrl,
    });
  } catch (error) {
    console.error("Unable to upload file to S3.", error);

    return Response.json(
      {
        success: false,
        error: "Unable to upload file. Check S3 bucket permissions.",
      },
      {
        status: 502,
      },
    );
  }

  return Response.json({
    success: true,
    file: {
      contentType: file.type,
      fileName: file.name,
      fileSize: file.size,
      fileUrl,
    },
  });
}
