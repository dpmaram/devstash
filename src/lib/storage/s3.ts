import {
  DeleteObjectCommand,
  type GetObjectCommandOutput,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  defaultUploadObjectKeyPrefix,
  normalizeUploadObjectKeyPrefix,
  sanitizeUploadPathSegment,
} from "@/lib/uploads";

export const defaultS3BucketName = "eapi-chc-dev-ets-attachments";
export const defaultS3UploadPrefix = defaultUploadObjectKeyPrefix;

type S3Config = {
  bucketName: string;
  region: string;
  uploadPrefix: string;
};

type PutStoredFileInput = {
  body: Uint8Array;
  contentLength: number;
  contentType: string;
  key: string;
};

export type StoredFile = {
  body: BodyInit;
  cacheControl?: string;
  contentLength?: number;
  contentType: string;
  eTag?: string;
  lastModified?: Date;
};

let s3Client: S3Client | null = null;

export function getS3Config(env: NodeJS.ProcessEnv = process.env): S3Config {
  return {
    bucketName: env.S3_BUCKET_NAME?.trim() || defaultS3BucketName,
    region: env.AWS_REGION?.trim() || env.AWS_DEFAULT_REGION?.trim() || "us-east-1",
    uploadPrefix: normalizeUploadObjectKeyPrefix(
      env.S3_UPLOAD_PREFIX || defaultS3UploadPrefix,
    ),
  };
}

export function createS3Client(config = getS3Config()) {
  return new S3Client({
    region: config.region,
  });
}

export async function putStoredFile(input: PutStoredFileInput) {
  const config = getS3Config();

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentLength: input.contentLength,
      ContentType: input.contentType,
    }),
  );
}

export async function deleteStoredFile(fileUrl: string) {
  const key = getS3ObjectKey(fileUrl);

  if (!key) {
    return;
  }

  const config = getS3Config();

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export async function getStoredFile(fileUrl: string): Promise<StoredFile | null> {
  const key = getS3ObjectKey(fileUrl);

  if (!key) {
    return null;
  }

  const config = getS3Config();
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );

  if (!response.Body) {
    return null;
  }

  return {
    body: toResponseBody(response.Body),
    cacheControl: response.CacheControl,
    contentLength: response.ContentLength,
    contentType: response.ContentType ?? "application/octet-stream",
    eTag: response.ETag,
    lastModified: response.LastModified,
  };
}

export function getS3ObjectKey(
  fileUrl: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const uploadPrefix = getS3Config(env).uploadPrefix;

  if (fileUrl === uploadPrefix || fileUrl.startsWith(`${uploadPrefix}/`)) {
    return fileUrl;
  }

  return null;
}

export function isStoredFileOwnedByUser(
  fileUrl: string | null | undefined,
  userId: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!fileUrl) {
    return false;
  }

  const uploadPrefix = getS3Config(env).uploadPrefix;
  const userKeyPrefix = `${uploadPrefix}/${sanitizeUploadPathSegment(userId)}/`;
  const key = getS3ObjectKey(fileUrl, env);

  return Boolean(key?.startsWith(userKeyPrefix));
}

function getS3Client() {
  s3Client ??= createS3Client();

  return s3Client;
}

function toResponseBody(body: NonNullable<GetObjectCommandOutput["Body"]>): BodyInit {
  const streamBody = body as NonNullable<GetObjectCommandOutput["Body"]> & {
    transformToWebStream?: () => ReadableStream<Uint8Array>;
  };

  if (typeof streamBody.transformToWebStream === "function") {
    return streamBody.transformToWebStream();
  }

  return body as BodyInit;
}
