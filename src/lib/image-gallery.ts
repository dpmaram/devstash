export function shouldUseImageGallery(typeSlug: string | null | undefined) {
  return typeSlug === "image";
}

export function getImageThumbnailUrl(itemId: string) {
  return `/api/uploads/${encodeURIComponent(itemId)}/download?disposition=inline`;
}
