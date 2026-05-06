import { getFileDownloadUrl } from "@/lib/file-list";

export type QuickCopyItem = {
  fileName: string | null;
  id: string;
  preview: string;
  title: string;
  typeSlug: string;
};

export type QuickCopyDetailItem = {
  content: string | null;
  fileName: string | null;
  id: string;
  title: string;
  typeSlug: string;
  url: string | null;
};

export function getQuickCopyText(item: QuickCopyItem) {
  if (item.typeSlug === "file" || item.typeSlug === "image") {
    return getFileDownloadUrl(item.id);
  }

  const preview = item.preview.trim();

  if (preview) {
    return preview;
  }

  return item.fileName ?? item.title;
}

export function getQuickCopyTextFromDetail(item: QuickCopyDetailItem) {
  if (item.typeSlug === "file" || item.typeSlug === "image") {
    return getFileDownloadUrl(item.id);
  }

  if (item.typeSlug === "link") {
    const url = item.url?.trim();

    if (url) {
      return url;
    }
  }

  const content = item.content?.trim();

  if (content) {
    return content;
  }

  return item.fileName ?? item.title;
}
