"use client";

import {
  Check,
  Code2,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DashboardItem, ItemDetail } from "@/lib/db/items";
import {
  formatFileListSize,
  getFileDownloadUrl,
  getFileExtensionLabel,
  getFileIconTone,
  type FileIconTone,
} from "@/lib/file-list";
import { getImageThumbnailUrl } from "@/lib/image-gallery";
import { getQuickCopyText, getQuickCopyTextFromDetail } from "@/lib/item-copy";
import type { ItemTypeSlug } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ItemDetailResponse =
  | {
      success: true;
      item: ItemDetail;
    }
  | {
      success: false;
      error: string;
    };

type ItemOpenHandler = (item: DashboardItem) => void;

export function ImageThumbnailCard({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: ItemOpenHandler;
}) {
  return (
    <div
      className="group block w-full cursor-pointer overflow-hidden rounded-lg border border-devstash-line bg-white/[0.025] text-left transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => onOpen(item)}
      onKeyDown={(event) => openItemFromKeyboard(event, item, onOpen)}
      role="button"
      tabIndex={0}
    >
      <div className="aspect-video overflow-hidden bg-white/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="size-full object-cover transition duration-300 group-hover:scale-105"
          src={getImageThumbnailUrl(item.id)}
        />
      </div>
      <div className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.updatedAt}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {item.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
            <QuickCopyButton item={item} />
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
          {item.description}
        </p>
        <CardTagList tags={item.tags} />
      </div>
    </div>
  );
}

export function FileItemRow({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: ItemOpenHandler;
}) {
  const fileName = item.fileName ?? item.title;
  const shouldShowTitle = item.title !== fileName;

  return (
    <div
      className="group flex w-full cursor-pointer flex-col gap-4 rounded-lg border border-devstash-line bg-white/[0.025] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
      onClick={() => onOpen(item)}
      onKeyDown={(event) => openItemFromKeyboard(event, item, onOpen)}
      role="button"
      tabIndex={0}
    >
      <div className="flex min-w-0 items-start gap-4">
        <FileListIcon fileName={fileName} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {fileName}
          </h3>
          {shouldShowTitle ? (
            <p className="mt-1 truncate text-sm text-zinc-400">{item.title}</p>
          ) : null}
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
            <span>{formatFileListSize(item.fileSize)}</span>
            <span className="hidden sm:inline" aria-hidden="true">
              /
            </span>
            <span>Uploaded {item.createdAtLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <QuickCopyButton item={item} />
        <a
          aria-label={`Download ${fileName}`}
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "flex-1 border-devstash-line bg-white/[0.03] text-zinc-100 hover:bg-white/[0.08] sm:flex-none",
          )}
          href={getFileDownloadUrl(item.id)}
          onClick={(event) => event.stopPropagation()}
        >
          <Download aria-hidden="true" className="size-4" />
          Download
        </a>
      </div>
    </div>
  );
}

export function PinnedItemCard({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: ItemOpenHandler;
}) {
  return (
    <div
      className="group block w-full cursor-pointer rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-5 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => onOpen(item)}
      onKeyDown={(event) => openItemFromKeyboard(event, item, onOpen)}
      role="button"
      style={getAccentBorderStyle(item.accentColor)}
      tabIndex={0}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          {renderDashboardItemTypeIcon(item.typeSlug, "size-5")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {item.title}
            </h3>
            <CardItemTypeBadge item={item} />
            <span className="text-muted-foreground">Pinned</span>
            {item.isFavorite ? (
              <Star
                aria-hidden="true"
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {item.description}
          </p>
          <CardTagList tags={item.tags} />
        </div>
        <QuickCopyButton item={item} />
      </div>
    </div>
  );
}

export function RecentItemRow({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: ItemOpenHandler;
}) {
  return (
    <div
      className="group flex w-full cursor-pointer items-start gap-4 rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-4 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => onOpen(item)}
      onKeyDown={(event) => openItemFromKeyboard(event, item, onOpen)}
      role="button"
      style={getAccentBorderStyle(item.accentColor)}
      tabIndex={0}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        {renderDashboardItemTypeIcon(item.typeSlug, "size-5")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-white">
                {item.title}
              </h3>
              <CardItemTypeBadge item={item} />
              {item.isPinned ? (
                <span className="text-sm text-muted-foreground">Pinned</span>
              ) : null}
              {item.isFavorite ? (
                <Star
                  aria-hidden="true"
                  className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
                />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">
              {item.description}
            </p>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">{item.updatedAt}</p>
        </div>
        <CardTagList tags={item.tags} />
      </div>
      <QuickCopyButton item={item} />
    </div>
  );
}

function QuickCopyButton({
  className,
  item,
}: {
  className?: string;
  item: DashboardItem;
}) {
  const [hasCopied, setHasCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeout = window.setTimeout(() => setHasCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [hasCopied]);

  async function copyItem(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!navigator.clipboard) {
      return;
    }

    setIsCopying(true);

    try {
      const detail = await fetchQuickCopyItemDetail(item.id);

      await navigator.clipboard.writeText(
        detail ? getQuickCopyTextFromDetail(detail) : getQuickCopyText(item),
      );
      setHasCopied(true);
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Button
      aria-label={hasCopied ? `Copied ${item.title}` : `Copy ${item.title}`}
      className={cn(
        "size-8 shrink-0 border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white",
        hasCopied && "text-emerald-300",
        className,
      )}
      disabled={isCopying}
      onClick={copyItem}
      size="icon"
      title={hasCopied ? "Copied" : "Copy"}
      type="button"
      variant="ghost"
    >
      {hasCopied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}

function FileListIcon({ fileName }: { fileName: string }) {
  const tone = getFileIconTone(fileName);

  return (
    <div
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]",
        getFileIconToneClassName(tone),
      )}
    >
      {tone === "code" ? (
        <Code2 aria-hidden="true" className="size-5" />
      ) : tone === "image" ? (
        <ImageIcon aria-hidden="true" className="size-5" />
      ) : (
        <FileText aria-hidden="true" className="size-5" />
      )}
      <span className="mt-0.5 max-w-9 truncate text-[0.625rem] font-semibold leading-none">
        {getFileExtensionLabel(fileName)}
      </span>
    </div>
  );
}

function CardItemTypeBadge({ item }: { item: DashboardItem }) {
  return (
    <span
      className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-zinc-300"
      style={{ borderColor: item.accentColor }}
    >
      {formatItemTypeName(item.itemType.name)}
    </span>
  );
}

function CardTagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-md bg-white/[0.06] px-2.5 py-1 text-sm text-zinc-300"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

async function fetchQuickCopyItemDetail(itemId: string) {
  try {
    const response = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as ItemDetailResponse;

    return result.success ? result.item : null;
  } catch {
    return null;
  }
}

function openItemFromKeyboard(
  event: React.KeyboardEvent<HTMLElement>,
  item: DashboardItem,
  onOpen: ItemOpenHandler,
) {
  if (event.target !== event.currentTarget) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen(item);
  }
}

function getFileIconToneClassName(tone: FileIconTone) {
  if (tone === "code") {
    return "text-blue-200";
  }

  if (tone === "image") {
    return "text-pink-200";
  }

  return "text-zinc-300";
}

function renderDashboardItemTypeIcon(slug: string, sizeClass: string) {
  if (isKnownItemTypeSlug(slug)) {
    const Icon = itemTypeIcons[slug];

    return (
      <Icon
        aria-hidden="true"
        className={`${sizeClass} ${itemTypeIconClasses[slug]}`}
      />
    );
  }

  return <Code2 aria-hidden="true" className={`${sizeClass} text-zinc-400`} />;
}

function isKnownItemTypeSlug(slug: string): slug is ItemTypeSlug {
  return slug in itemTypeIcons;
}

function formatItemTypeName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
