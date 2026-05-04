const markdownEditorTypeSlugs = new Set(["note", "prompt"]);

export function shouldUseMarkdownEditor(typeSlug: string | null | undefined) {
  return Boolean(typeSlug && markdownEditorTypeSlugs.has(typeSlug));
}

export function getMarkdownEditorHeight(value: string) {
  const lineCount = Math.max(1, value.split("\n").length);
  const minimumHeight = 320;
  const preferredHeight = lineCount * 22 + 56;

  return `${Math.min(400, Math.max(minimumHeight, preferredHeight))}px`;
}
