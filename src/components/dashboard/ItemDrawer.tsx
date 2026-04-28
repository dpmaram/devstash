"use client";

import {
  CalendarDays,
  Circle,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  LoaderCircle,
  Pencil,
  Pin,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DashboardItem, ItemDetail } from "@/lib/db/items";
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

type DrawerStatus = "idle" | "loading" | "ready" | "error";

type ItemDrawerState = {
  error: string | null;
  item: ItemDetail | null;
  selectedItem: DashboardItem | null;
  status: DrawerStatus;
};

const initialDrawerState: ItemDrawerState = {
  error: null,
  item: null,
  selectedItem: null,
  status: "idle",
};

export function ItemCardGrid({
  emptyMessage = "No items yet.",
  items,
}: {
  emptyMessage?: string;
  items: DashboardItem[];
}) {
  const drawer = useItemDrawer();

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground xl:col-span-3">
            {emptyMessage}
          </p>
        ) : null}
        {items.map((item) => (
          <PinnedItemCard item={item} key={item.id} onOpen={drawer.openItem} />
        ))}
      </div>
      <ItemDetailSheet
        onOpenChange={drawer.onOpenChange}
        open={drawer.isOpen}
        state={drawer.state}
      />
    </>
  );
}

export function ItemRowList({
  emptyMessage = "No items yet.",
  items,
}: {
  emptyMessage?: string;
  items: DashboardItem[];
}) {
  const drawer = useItemDrawer();

  return (
    <>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-devstash-line bg-white/[0.025] p-5 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : null}
        {items.map((item) => (
          <RecentItemRow item={item} key={item.id} onOpen={drawer.openItem} />
        ))}
      </div>
      <ItemDetailSheet
        onOpenChange={drawer.onOpenChange}
        open={drawer.isOpen}
        state={drawer.state}
      />
    </>
  );
}

function useItemDrawer() {
  const requestIdRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ItemDrawerState>(initialDrawerState);

  async function openItem(item: DashboardItem) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsOpen(true);
    setState({
      error: null,
      item: null,
      selectedItem: item,
      status: "loading",
    });

    try {
      const response = await fetch(`/api/items/${encodeURIComponent(item.id)}`);
      const data = (await response.json()) as ItemDetailResponse;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok || !data.success) {
        setState({
          error: data.success ? "Unable to load item." : data.error,
          item: null,
          selectedItem: item,
          status: "error",
        });
        return;
      }

      setState({
        error: null,
        item: data.item,
        selectedItem: item,
        status: "ready",
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState({
        error: "Unable to load item. Try again.",
        item: null,
        selectedItem: item,
        status: "error",
      });
    }
  }

  function onOpenChange(open: boolean) {
    setIsOpen(open);
  }

  return {
    isOpen,
    onOpenChange,
    openItem,
    state,
  };
}

function PinnedItemCard({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: (item: DashboardItem) => void;
}) {
  return (
    <button
      className="block w-full rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-5 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => onOpen(item)}
      style={getAccentBorderStyle(item.accentColor)}
      type="button"
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
            <ItemTypeBadge item={item} />
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
          <TagList tags={item.tags} />
        </div>
      </div>
    </button>
  );
}

function RecentItemRow({
  item,
  onOpen,
}: {
  item: DashboardItem;
  onOpen: (item: DashboardItem) => void;
}) {
  return (
    <button
      className="flex w-full items-start gap-4 rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-4 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => onOpen(item)}
      style={getAccentBorderStyle(item.accentColor)}
      type="button"
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
              <ItemTypeBadge item={item} />
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
        <TagList tags={item.tags} />
      </div>
    </button>
  );
}

function ItemDetailSheet({
  onOpenChange,
  open,
  state,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  state: ItemDrawerState;
}) {
  const headerItem = state.item ?? state.selectedItem;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start gap-4 border-b border-devstash-line px-5 py-5 sm:px-7">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              {headerItem ? (
                renderDashboardItemTypeIcon(headerItem.typeSlug, "size-6")
              ) : (
                <Circle aria-hidden="true" className="size-6 text-muted-foreground" />
              )}
            </div>
            <SheetHeader className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-3">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-2xl font-semibold text-white">
                    {headerItem?.title ?? "Item details"}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Item detail drawer
                  </SheetDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {headerItem ? <ItemTypeBadge item={headerItem} /> : null}
                    {state.item?.language ? (
                      <span className="rounded-md border border-devstash-line bg-white/[0.03] px-2.5 py-1 text-sm text-zinc-300">
                        {state.item.language}
                      </span>
                    ) : null}
                  </div>
                </div>
                <SheetClose
                  aria-label="Close item drawer"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </SheetClose>
              </div>
            </SheetHeader>
          </div>

          <ItemActionBar item={state.item} />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {state.status === "loading" ? <ItemDetailSkeleton /> : null}
            {state.status === "error" ? (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
                {state.error}
              </div>
            ) : null}
            {state.status === "ready" && state.item ? (
              <ItemDetailBody item={state.item} />
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemActionBar({ item }: { item: ItemDetail | null }) {
  async function copyItem() {
    if (!item || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(
      item.content ?? item.url ?? item.fileUrl ?? item.title,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-devstash-line px-5 py-4 sm:px-7">
      <ActionButton
        active={item?.isFavorite}
        activeClassName="text-yellow-400"
        icon={<Star className={cn("size-5", item?.isFavorite && "fill-yellow-400")} />}
        label="Favorite"
      />
      <ActionButton
        active={item?.isPinned}
        icon={<Pin className="size-5" />}
        label="Pin"
      />
      <ActionButton
        icon={<Copy className="size-5" />}
        label="Copy"
        onClick={copyItem}
      />
      <ActionButton
        className="sm:ml-auto"
        icon={<Pencil className="size-5" />}
        label="Edit"
      />
      <ActionButton
        className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
        icon={<Trash2 className="size-5" />}
        label="Delete"
      />
    </div>
  );
}

function ActionButton({
  active,
  activeClassName,
  className,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  activeClassName?: string;
  className?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      className={cn(
        "h-10 gap-2 rounded-lg bg-transparent px-3 text-base text-zinc-200 hover:bg-white/[0.06] hover:text-white",
        active && activeClassName,
        className,
      )}
      onClick={onClick}
      title={label}
      type="button"
      variant="ghost"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function ItemDetailBody({ item }: { item: ItemDetail }) {
  return (
    <div className="space-y-8">
      <DetailSection title="Description">
        <p className="text-base leading-7 text-zinc-100">{item.description}</p>
      </DetailSection>

      <DetailSection title="Content">
        <ItemContent item={item} />
      </DetailSection>

      {item.tags.length > 0 ? (
        <DetailSection
          icon={<Tag aria-hidden="true" className="size-4" />}
          title="Tags"
        >
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-sm text-zinc-200"
                key={tag.slug}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {item.collections.length > 0 ? (
        <DetailSection
          icon={<Folder aria-hidden="true" className="size-4" />}
          title="Collections"
        >
          <div className="flex flex-wrap gap-2">
            {item.collections.map((collection) => (
              <span
                className="rounded-lg border border-devstash-line bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-200"
                key={collection.id}
              >
                {collection.name}
              </span>
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection
        icon={<CalendarDays aria-hidden="true" className="size-4" />}
        title="Details"
      >
        <dl className="grid gap-4 text-base sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-zinc-100 sm:text-right">{item.createdAtLabel}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-zinc-100 sm:text-right">{item.updatedAtLabel}</dd>
        </dl>
      </DetailSection>
    </div>
  );
}

function ItemContent({ item }: { item: ItemDetail }) {
  if (item.content) {
    return (
      <pre className="max-h-[28rem] overflow-auto rounded-lg border border-blue-400/20 bg-blue-950/30 p-4 text-sm leading-7 text-zinc-100">
        <code>{item.content}</code>
      </pre>
    );
  }

  if (item.url) {
    return (
      <a
        className="inline-flex items-center gap-2 rounded-lg border border-devstash-line bg-white/[0.03] px-3 py-2 text-sm text-emerald-200 transition hover:bg-white/[0.07]"
        href={item.url}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink aria-hidden="true" className="size-4" />
        {item.url}
      </a>
    );
  }

  if (item.fileName || item.fileUrl) {
    return (
      <div className="rounded-lg border border-devstash-line bg-white/[0.03] p-4">
        <div className="flex items-center gap-3 text-zinc-100">
          <FileText aria-hidden="true" className="size-5 text-muted-foreground" />
          <span>{item.fileName ?? "Attached file"}</span>
        </div>
        {item.fileSize ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {formatFileSize(item.fileSize)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <p className="rounded-lg border border-devstash-line bg-white/[0.03] p-4 text-sm text-muted-foreground">
      No content saved for this item yet.
    </p>
  );
}

function DetailSection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ItemDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-5 w-4/5" />
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-20" />
        <div className="rounded-lg border border-devstash-line bg-white/[0.03] p-4">
          <LoaderCircle
            aria-hidden="true"
            className="mb-4 size-5 animate-spin text-muted-foreground"
          />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="mt-3 h-4 w-11/12" />
          <SkeletonLine className="mt-3 h-4 w-3/4" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <SkeletonLine className="h-8 w-20" />
        <SkeletonLine className="h-8 w-24" />
        <SkeletonLine className="h-8 w-16" />
      </div>
    </div>
  );
}

function SkeletonLine({ className }: { className: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/[0.08]", className)}
    />
  );
}

function ItemTypeBadge({ item }: { item: DashboardItem | ItemDetail }) {
  return (
    <span
      className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-zinc-300"
      style={{ borderColor: item.accentColor }}
    >
      {formatItemTypeName(item.itemType.name)}
    </span>
  );
}

function TagList({ tags }: { tags: string[] }) {
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

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}
