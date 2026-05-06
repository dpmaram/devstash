const codeExtensions = new Set([
  "c",
  "cpp",
  "cs",
  "css",
  "go",
  "html",
  "java",
  "js",
  "json",
  "jsx",
  "md",
  "php",
  "py",
  "rb",
  "rs",
  "sh",
  "sql",
  "swift",
  "ts",
  "tsx",
  "yaml",
  "yml",
]);

const imageExtensions = new Set([
  "avif",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

export type FileIconTone = "code" | "default" | "image";

export function shouldUseFileList(typeSlug: string | null | undefined) {
  return typeSlug === "file";
}

export function getFileDownloadUrl(itemId: string) {
  return `/api/uploads/${encodeURIComponent(itemId)}/download`;
}

export function formatFileListSize(fileSize: number | null | undefined) {
  if (typeof fileSize !== "number" || fileSize < 0) {
    return "Unknown size";
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  if (fileSize < 1024 * 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getFileExtensionLabel(fileName: string | null | undefined) {
  const extension = getFileExtension(fileName);

  return extension ? extension.toUpperCase() : "FILE";
}

export function getFileIconTone(
  fileName: string | null | undefined,
): FileIconTone {
  const extension = getFileExtension(fileName);

  if (extension && codeExtensions.has(extension)) {
    return "code";
  }

  if (extension && imageExtensions.has(extension)) {
    return "image";
  }

  return "default";
}

function getFileExtension(fileName: string | null | undefined) {
  if (!fileName) {
    return "";
  }

  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}
