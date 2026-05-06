import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  defaultUploadObjectKeyPrefix,
  normalizeUploadObjectKeyPrefix,
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

export async function getStoredFile(fileUrl: string) {
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

  const body = await response.Body.transformToByteArray();

  return {
    body,
    contentLength: response.ContentLength ?? body.byteLength,
    contentType: response.ContentType ?? "application/octet-stream",
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

function getS3Client() {
  s3Client ??= createS3Client();

  return s3Client;
}
