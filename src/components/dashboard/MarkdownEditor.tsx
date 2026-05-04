"use client";

import { Check, Copy, Eye, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { getMarkdownEditorHeight } from "@/lib/markdown-editor";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

type MarkdownEditorTab = "write" | "preview";

export function MarkdownEditor({
  ariaLabel = "Markdown editor",
  className,
  disabled,
  onChange,
  readOnly = false,
  value,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<MarkdownEditorTab>(
    readOnly ? "preview" : "write",
  );
  const [hasCopied, setHasCopied] = useState(false);
  const editorHeight = useMemo(() => getMarkdownEditorHeight(value), [value]);
  const currentTab = readOnly ? "preview" : activeTab;

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeout = window.setTimeout(() => setHasCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [hasCopied]);

  async function copyMarkdown() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setHasCopied(true);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-devstash-line bg-[#1e1e1e] shadow-lg shadow-black/20",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 border-b border-devstash-line bg-[#2d2d2d] px-3">
        <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-300" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        {!readOnly ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <MarkdownTabButton
              active={currentTab === "write"}
              icon={<Pencil aria-hidden="true" className="size-3.5" />}
              label="Write"
              onClick={() => setActiveTab("write")}
            />
            <MarkdownTabButton
              active={currentTab === "preview"}
              icon={<Eye aria-hidden="true" className="size-3.5" />}
              label="Preview"
              onClick={() => setActiveTab("preview")}
            />
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">
            Markdown
          </span>
        )}
        <Button
          aria-label={hasCopied ? "Copied markdown" : "Copy markdown"}
          className="h-8 gap-1.5 rounded-md bg-white/[0.04] px-2.5 text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white"
          disabled={disabled || value.length === 0}
          onClick={copyMarkdown}
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
      {currentTab === "write" ? (
        <textarea
          aria-label={ariaLabel}
          className="w-full resize-y border-0 bg-[#1e1e1e] px-4 py-4 font-mono text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          style={{
            height: editorHeight,
            maxHeight: "400px",
          }}
          value={value}
        />
      ) : (
        <div
          aria-label={ariaLabel}
          className="markdown-preview overflow-auto px-4 py-4 text-sm leading-7 text-zinc-100"
          style={{ height: editorHeight }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-zinc-500">No content yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MarkdownTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-white/[0.08] text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
