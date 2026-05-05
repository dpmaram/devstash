import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
};

type PutStoredFileInput = {
  body: Uint8Array;
  contentLength: number;
  contentType: string;
  key: string;
};

let r2Client: S3Client | null = null;

export function getR2Config(env: NodeJS.ProcessEnv = process.env): R2Config {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucketName = env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 environment variables are not configured.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: env.R2_PUBLIC_URL,
  };
}

export function createR2Client(config = getR2Config()) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    region: "auto",
  });
}

export async function putStoredFile(input: PutStoredFileInput) {
  const config = getR2Config();

  await getR2Client().send(
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
  const key = getR2ObjectKey(fileUrl);

  if (!key) {
    return;
  }

  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export async function getStoredFile(fileUrl: string) {
  const key = getR2ObjectKey(fileUrl);

  if (!key) {
    return null;
  }

  const config = getR2Config();
  const response = await getR2Client().send(
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

export function getR2ObjectKey(fileUrl: string) {
  if (fileUrl.startsWith("uploads/")) {
    return fileUrl;
  }

  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!publicUrl || !fileUrl.startsWith(publicUrl)) {
    return null;
  }

  return fileUrl.slice(publicUrl.length).replace(/^\/+/, "");
}

function getR2Client() {
  r2Client ??= createR2Client();

  return r2Client;
}
