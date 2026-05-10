function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

export function parseTagsText(tagsText: string) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function appendTagToTagsText(tagsText: string, tag: string) {
  const trimmedTag = tag.trim();

  if (!trimmedTag) {
    return tagsText;
  }

  const existingTags = parseTagsText(tagsText);
  const existingTagKeys = new Set(existingTags.map(normalizeTag));
  const nextTagKey = normalizeTag(trimmedTag);

  if (existingTagKeys.has(nextTagKey)) {
    return existingTags.join(", ");
  }

  return [...existingTags, trimmedTag].join(", ");
}

export function filterSuggestedTags(
  suggestedTags: string[],
  tagsText: string,
) {
  const existingTags = new Set(parseTagsText(tagsText).map(normalizeTag));

  return suggestedTags.filter(
    (tag) => !existingTags.has(normalizeTag(tag)),
  );
}