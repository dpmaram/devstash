export type CreateItemTypeSlug =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "link"
  | "file"
  | "image";

export type NewItemDraft = {
  collectionIds: string[];
  content: string;
  description: string;
  fileName: string;
  fileSize: number | null;
  fileUrl: string;
  language: string;
  tagsText: string;
  title: string;
  typeSlug: CreateItemTypeSlug;
  url: string;
};

export const createableTypeOrder: CreateItemTypeSlug[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
];

const createableTypeSlugs = new Set<string>(createableTypeOrder);

export function isCreateItemTypeSlug(
  typeSlug: string | null | undefined,
): typeSlug is CreateItemTypeSlug {
  return Boolean(typeSlug && createableTypeSlugs.has(typeSlug));
}

export function resolveCreateItemTypeSlug(
  typeSlug: string | null | undefined,
): CreateItemTypeSlug {
  return isCreateItemTypeSlug(typeSlug) ? typeSlug : "snippet";
}

export function createInitialNewItemDraft(
  initialTypeSlug?: string | null,
): NewItemDraft {
  return {
    collectionIds: [],
    content: "",
    description: "",
    fileName: "",
    fileSize: null,
    fileUrl: "",
    language: "",
    tagsText: "",
    title: "",
    typeSlug: resolveCreateItemTypeSlug(initialTypeSlug),
    url: "",
  };
}
