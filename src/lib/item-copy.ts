import { getFileDownloadUrl } from "@/lib/file-list";

export type QuickCopyItem = {
  fileName: string | null;
  id: string;
  preview: string;
  title: string;
  typeSlug: string;
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
