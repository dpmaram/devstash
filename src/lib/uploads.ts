export type UploadItemTypeSlug = "file" | "image";

type UploadCandidate = {
  name: string;
  size: number;
  type: string;
};

type UploadValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const imageMaxSize = 5 * 1024 * 1024;
const fileMaxSize = 10 * 1024 * 1024;

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const fileExtensions = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
]);

const imageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const fileMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

export function isUploadItemTypeSlug(
  typeSlug: string | null | undefined,
): typeSlug is UploadItemTypeSlug {
  return typeSlug === "file" || typeSlug === "image";
}

export function validateUploadCandidate(
  candidate: UploadCandidate,
  typeSlug: string,
): UploadValidationResult {
  if (!isUploadItemTypeSlug(typeSlug)) {
    return {
      success: false,
      error: "Upload type is not supported.",
    };
  }

  const extension = getFileExtension(candidate.name);

  if (typeSlug === "image") {
    if (candidate.size > imageMaxSize) {
      return {
        success: false,
        error: "Images must be 5 MB or smaller.",
      };
    }

    if (!imageExtensions.has(extension) || !imageMimeTypes.has(candidate.type)) {
      return {
        success: false,
        error: "That image type is not supported.",
      };
    }

    return { success: true };
  }

  if (candidate.size > fileMaxSize) {
    return {
      success: false,
      error: "Files must be 10 MB or smaller.",
    };
  }

  if (!fileExtensions.has(extension) || !fileMimeTypes.has(candidate.type)) {
    return {
      success: false,
      error: "That file type is not supported.",
    };
  }

  return { success: true };
}

export function buildUploadObjectKey({
  fileName,
  uploadId,
  userId,
}: {
  fileName: string;
  uploadId: string;
  userId: string;
}) {
  return `uploads/${sanitizePathSegment(userId)}/${sanitizePathSegment(
    uploadId,
  )}-${sanitizeFileName(fileName)}`;
}

export function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const baseFileName = fileName
    .split(/[\\/]/)
    .at(-1)
    ?.toLowerCase();
  const extension = getFileExtension(baseFileName ?? "");
  const stemSource = (extension
    ? baseFileName?.slice(0, -extension.length)
    : baseFileName
  ) ?? "";
  const stem = stemSource
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${stem || "upload"}${extension}`;
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
