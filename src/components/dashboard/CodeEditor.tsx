"use client";

import { loader, type OnMount } from "@monaco-editor/react";
import { Check, Copy, Crown, Loader2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => <CodeEditorLoading />,
  ssr: false,
});

const DEFAULT_FONT_SIZE = 14;
const DEFAULT_TAB_SIZE = 2;

type CodeEditorProps = {
  ariaLabel?: string;
  canExplain?: boolean;
  className?: string;
  disabled?: boolean;
  explanation?: string;
  explanationLabel?: string;
  isExplaining?: boolean;
  isProUser?: boolean;
  language: string;
  languageLabel: string;
  onExplain?: () => void;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

type CodeEditorTab = "code" | "explain";

export function CodeEditor({
  ariaLabel = "Code editor",
  canExplain = false,
  className,
  disabled,
  explanation = "",
  explanationLabel = "Explain",
  isExplaining = false,
  isProUser = false,
  language,
  languageLabel,
  onExplain,
  onChange,
  readOnly = false,
  value,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<CodeEditorTab>("code");
  const [hasCopied, setHasCopied] = useState(false);
  const [isMonacoConfigured, setIsMonacoConfigured] = useState(false);
  const [editorPreferences, setEditorPreferences] = useState<{
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
    theme: string;
  }>({
    fontSize: DEFAULT_FONT_SIZE,
    tabSize: DEFAULT_TAB_SIZE,
    wordWrap: true,
    minimap: false,
    theme: "vs-dark",
  });
  
  const editorHeight = useMemo(() => getEditorHeight(value, readOnly), [
    readOnly,
    value,
  ]);
  const hasExplanation = explanation.trim().length > 0;
  const currentTab = hasExplanation ? activeTab : "code";
  const showExplainControls = readOnly && canExplain;

  // Load editor preferences from server
  useEffect(() => {
    async function loadPreferences() {
      try {
        const { getEditorPreferences } = await import("@/actions/editor-preferences");
        const saved = await getEditorPreferences();
        if (saved) {
          setEditorPreferences(saved);
        }
      } catch {
        // Fall back to defaults if preferences can't be loaded
      }
    }

    void loadPreferences();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function configureMonaco() {
      configureMonacoWorkers();
      const monaco = await import("monaco-editor");

      if (!isActive) {
        return;
      }

      loader.config({ monaco });
      setIsMonacoConfigured(true);
    }

    void configureMonaco();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeout = window.setTimeout(() => setHasCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [hasCopied]);

  async function copyCode() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setHasCopied(true);
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme("devstash-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e4e4e7", background: "0b0d10" },
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "93c5fd" },
        { token: "number", foreground: "fbbf24" },
        { token: "string", foreground: "86efac" },
      ],
      colors: {
        "editor.background": "#0b0d10",
        "editor.foreground": "#e4e4e7",
        "editor.lineHighlightBackground": "#ffffff08",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editorCursor.foreground": "#f8fafc",
        "editor.selectionBackground": "#2563eb66",
        "scrollbar.shadow": "#00000000",
      },
    });
    monaco.editor.setTheme("devstash-dark");
    editor.layout();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-devstash-line bg-[#0b0d10] shadow-lg shadow-black/20",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 border-b border-devstash-line bg-white/[0.035] px-3">
        <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-300" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        {hasExplanation ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <CodeTabButton
              active={currentTab === "code"}
              label={languageLabel}
              onClick={() => setActiveTab("code")}
            />
            <CodeTabButton
              active={currentTab === "explain"}
              label={explanationLabel}
              onClick={() => setActiveTab("explain")}
            />
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">
            {languageLabel}
          </span>
        )}
        {showExplainControls ? (
          isProUser ? (
            <Button
              aria-label={isExplaining ? "Generating explanation" : "Explain code"}
              className="h-8 gap-1.5 rounded-md bg-white/[0.04] px-2.5 text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white"
              disabled={disabled || value.length === 0 || isExplaining}
              onClick={onExplain}
              type="button"
              variant="ghost"
            >
              {isExplaining ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="size-3.5" />
              )}
              <span>{isExplaining ? "Explaining" : "Explain"}</span>
            </Button>
          ) : (
            <Button
              aria-label="AI features require Pro subscription"
              className="h-8 gap-1.5 rounded-md bg-white/[0.04] px-2.5 text-xs text-zinc-200"
              disabled
              title="AI features require Pro subscription"
              type="button"
              variant="ghost"
            >
              <Crown aria-hidden="true" className="size-3.5 text-amber-300" />
              <span>Explain</span>
            </Button>
          )
        ) : null}
        <Button
          aria-label={hasCopied ? "Copied code" : "Copy code"}
          className="h-8 gap-1.5 rounded-md bg-white/[0.04] px-2.5 text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white"
          disabled={disabled || value.length === 0}
          onClick={copyCode}
          type="button"
          variant="ghost"
        >
          {hasCopied ? (
            <Check aria-hidden="true" className="size-3.5 text-emerald-300" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
          <span>{hasCopied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <div className="devstash-code-editor" style={{ height: editorHeight }}>
        {currentTab === "explain" && hasExplanation ? (
          <div
            aria-label="AI explanation"
            className="markdown-preview h-full overflow-auto px-4 py-4 text-sm leading-7 text-zinc-100"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
          </div>
        ) : isMonacoConfigured ? (
          <MonacoEditor
            height="100%"
            language={language}
            onChange={(nextValue) => onChange?.(nextValue ?? "")}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              contextmenu: false,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              domReadOnly: readOnly || disabled,
              fontFamily:
                "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontLigatures: true,
              fontSize: editorPreferences.fontSize,
              lineHeight: 22,
              minimap: { enabled: editorPreferences.minimap },
              padding: { bottom: 16, top: 16 },
              readOnly: readOnly || disabled,
              renderLineHighlight: "line",
              scrollbar: {
                alwaysConsumeMouseWheel: false,
                horizontalScrollbarSize: 8,
                verticalScrollbarSize: 8,
              },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              tabSize: editorPreferences.tabSize,
              wordWrap: editorPreferences.wordWrap ? "on" : "off",
            }}
            theme="devstash-dark"
            value={value}
            wrapperProps={{
              "aria-label": ariaLabel,
            }}
          />
        ) : (
          <CodeEditorLoading />
        )}
      </div>
    </div>
  );
}

function CodeEditorLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0b0d10] px-4 text-sm text-zinc-500">
      Loading editor...
    </div>
  );
}

function CodeTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-md px-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-white/[0.08] text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function configureMonacoWorkers() {
  const monacoGlobal = globalThis as typeof globalThis & {
    MonacoEnvironment?: {
      getWorker?: (_workerId: string, label: string) => Worker;
    };
  };

  monacoGlobal.MonacoEnvironment = {
    getWorker: (_workerId: string, label: string) => {
      if (label === "json") {
        return new Worker(
          new URL(
            "monaco-editor/esm/vs/language/json/json.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        );
      }

      if (label === "css" || label === "scss" || label === "less") {
        return new Worker(
          new URL(
            "monaco-editor/esm/vs/language/css/css.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        );
      }

      if (label === "html" || label === "handlebars" || label === "razor") {
        return new Worker(
          new URL(
            "monaco-editor/esm/vs/language/html/html.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        );
      }

      if (label === "typescript" || label === "javascript") {
        return new Worker(
          new URL(
            "monaco-editor/esm/vs/language/typescript/ts.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        );
      }

      return new Worker(
        new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
        { type: "module" },
      );
    },
  };
}

function getEditorHeight(value: string, readOnly: boolean) {
  const lineCount = Math.max(1, value.split("\n").length);
  const minimumHeight = readOnly ? 180 : 240;
  const preferredHeight = lineCount * 22 + 56;

  return `${Math.min(400, Math.max(minimumHeight, preferredHeight))}px`;
}
