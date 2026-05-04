const codeEditorTypeSlugs = new Set(["snippet", "command"]);

const monacoLanguageAliases = new Map([
  ["bash", "shell"],
  ["c#", "csharp"],
  ["c++", "cpp"],
  ["docker", "dockerfile"],
  ["dockerfile", "dockerfile"],
  ["go", "go"],
  ["golang", "go"],
  ["html", "html"],
  ["java", "java"],
  ["javascript", "javascript"],
  ["js", "javascript"],
  ["jsx", "javascript"],
  ["json", "json"],
  ["markdown", "markdown"],
  ["md", "markdown"],
  ["php", "php"],
  ["prisma", "prisma"],
  ["python", "python"],
  ["py", "python"],
  ["ruby", "ruby"],
  ["rust", "rust"],
  ["scss", "scss"],
  ["shell", "shell"],
  ["sh", "shell"],
  ["sql", "sql"],
  ["ts", "typescript"],
  ["tsx", "typescript"],
  ["typescript", "typescript"],
  ["yaml", "yaml"],
  ["yml", "yaml"],
  ["zsh", "shell"],
]);

export function shouldUseCodeEditor(typeSlug: string | null | undefined) {
  return Boolean(typeSlug && codeEditorTypeSlugs.has(typeSlug));
}

export function getCodeEditorLanguage(
  language: string | null | undefined,
  typeSlug: string,
) {
  const normalizedLanguage = language?.trim().toLowerCase();

  if (normalizedLanguage) {
    return monacoLanguageAliases.get(normalizedLanguage) ?? "plaintext";
  }

  return typeSlug === "command" ? "shell" : "plaintext";
}

export function getCodeEditorLanguageLabel(
  language: string | null | undefined,
  typeSlug: string,
) {
  const trimmedLanguage = language?.trim();

  if (trimmedLanguage) {
    return trimmedLanguage;
  }

  return typeSlug === "command" ? "Shell" : "Plain text";
}
