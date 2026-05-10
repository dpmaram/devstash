const codeEditorTypeSlugs = new Set(["snippet", "command"]);

export type CodeEditorLanguageOption = {
  label: string;
  value: string;
};

const snippetLanguageOptions: CodeEditorLanguageOption[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
];

const commandLanguageOptions: CodeEditorLanguageOption[] = [
  { value: "shell", label: "Shell" },
  { value: "bash", label: "Bash" },
  { value: "zsh", label: "Zsh" },
  { value: "powershell", label: "PowerShell" },
  { value: "batch", label: "Batch" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "dockerfile", label: "Dockerfile" },
];

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

export function getCodeEditorLanguageOptions(
  typeSlug: string,
): CodeEditorLanguageOption[] {
  if (typeSlug === "command") {
    return commandLanguageOptions;
  }

  if (typeSlug === "snippet") {
    return snippetLanguageOptions;
  }

  return [];
}
