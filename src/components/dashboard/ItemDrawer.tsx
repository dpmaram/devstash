"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  CalendarDays,
  Check,
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
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteItem as deleteItemAction,
  updateItem as updateItemAction,
} from "@/actions/items";
import { getAccentBorderStyle } from "@/components/dashboard/accent-border-style";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ItemEditDraft = {
  content: string;
  description: string;
  itemId: string;
  language: string;
  tagsText: string;
  title: string;
  url: string;
};

type DrawerToast = {
  message: string;
  tone: "error" | "success";
} | null;

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
        replaceItem={drawer.replaceItem}
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
        replaceItem={drawer.replaceItem}
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

  function replaceItem(item: ItemDetail) {
    setState((currentState) => ({
      ...currentState,
      error: null,
      item,
      selectedItem: currentState.selectedItem
        ? toDashboardItemSummary(item, currentState.selectedItem)
        : null,
      status: "ready",
    }));
  }

  return {
    isOpen,
    onOpenChange,
    openItem,
    replaceItem,
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
  replaceItem,
  state,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  replaceItem: (item: ItemDetail) => void;
  state: ItemDrawerState;
}) {
  const router = useRouter();
  const headerItem = state.item ?? state.selectedItem;
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemEditDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "view">("view");
  const [toast, setToast] = useState<DrawerToast>(null);
  const isEditingCurrentItem =
    mode === "edit" && Boolean(state.item && draft?.itemId === state.item.id);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  function startEdit() {
    if (!state.item) {
      return;
    }

    setDraft(createItemEditDraft(state.item));
    setFormError(null);
    setMode("edit");
  }

  function cancelEdit() {
    setDraft(state.item ? createItemEditDraft(state.item) : null);
    setFormError(null);
    setMode("view");
  }

  async function saveEdit() {
    if (!state.item || !draft || draft.itemId !== state.item.id || isSaving) {
      return;
    }

    if (!draft.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const result = await updateItemAction(
        state.item.id,
        createUpdateItemPayload(state.item, draft),
      );

      if (!result.success) {
        setFormError(result.error);
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      replaceItem(result.data);
      setDraft(createItemEditDraft(result.data));
      setMode("view");
      setToast({
        message: "Item updated.",
        tone: "success",
      });
      router.refresh();
    } catch {
      const errorMessage = "Unable to save item. Try again.";

      setFormError(errorMessage);
      setToast({
        message: errorMessage,
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!state.item || isDeleting) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      const result = await deleteItemAction(state.item.id);

      if (!result.success) {
        setDeleteError(result.error);
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      setIsDeleteDialogOpen(false);
      setToast({
        message: "Item deleted.",
        tone: "success",
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      const errorMessage = "Unable to delete item. Try again.";

      setDeleteError(errorMessage);
      setToast({
        message: errorMessage,
        tone: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setDeleteError(null);
      setDraft(null);
      setFormError(null);
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      setIsSaving(false);
      setMode("view");
    }

    onOpenChange(nextOpen);
  }

  return (
    <>
      {toast ? (
        <ItemDrawerToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          tone={toast.tone}
        />
      ) : null}
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetContent className="overflow-hidden">
          <DeleteItemConfirmationDialog
            error={deleteError}
            isDeleting={isDeleting}
            item={state.item}
            onConfirm={confirmDelete}
            onOpenChange={(nextOpen) => {
              if (!isDeleting) {
                setDeleteError(null);
                setIsDeleteDialogOpen(nextOpen);
              }
            }}
            open={isDeleteDialogOpen}
          />
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

          {isEditingCurrentItem ? (
            <ItemEditActionBar
              canSave={Boolean(draft?.title.trim())}
              isSaving={isSaving}
              onCancel={cancelEdit}
              onSave={saveEdit}
            />
          ) : (
            <ItemActionBar
              item={state.item}
              onDelete={() => setIsDeleteDialogOpen(true)}
              onEdit={startEdit}
            />
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {state.status === "loading" ? <ItemDetailSkeleton /> : null}
            {state.status === "error" ? (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
                {state.error}
              </div>
            ) : null}
            {state.status === "ready" && state.item ? (
              isEditingCurrentItem && draft ? (
                <ItemEditForm
                  draft={draft}
                  error={formError}
                  isSaving={isSaving}
                  item={state.item}
                  onChange={setDraft}
                  onSave={saveEdit}
                />
              ) : (
                <ItemDetailBody item={state.item} />
              )
            ) : null}
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ItemActionBar({
  item,
  onDelete,
  onEdit,
}: {
  item: ItemDetail | null;
  onDelete: () => void;
  onEdit: () => void;
}) {
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
        disabled={!item}
        icon={<Star className={cn("size-5", item?.isFavorite && "fill-yellow-400")} />}
        label="Favorite"
      />
      <ActionButton
        active={item?.isPinned}
        disabled={!item}
        icon={<Pin className="size-5" />}
        label="Pin"
      />
      <ActionButton
        disabled={!item}
        icon={<Copy className="size-5" />}
        label="Copy"
        onClick={copyItem}
      />
      <ActionButton
        className="sm:ml-auto"
        disabled={!item}
        icon={<Pencil className="size-5" />}
        label="Edit"
        onClick={onEdit}
      />
      <ActionButton
        className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
        disabled={!item}
        icon={<Trash2 className="size-5" />}
        label="Delete"
        onClick={onDelete}
      />
    </div>
  );
}

function ActionButton({
  active,
  activeClassName,
  className,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  activeClassName?: string;
  className?: string;
  disabled?: boolean;
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
      disabled={disabled}
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

function ItemEditActionBar({
  canSave,
  isSaving,
  onCancel,
  onSave,
}: {
  canSave: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-devstash-line px-5 py-4 sm:px-7">
      <Button
        className="h-10 gap-2 rounded-lg bg-transparent px-3 text-base text-zinc-200 hover:bg-white/[0.06] hover:text-white"
        disabled={isSaving}
        onClick={onCancel}
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-5" />
        <span>Cancel</span>
      </Button>
      <Button
        className="h-10 gap-2 rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-4 text-base text-emerald-100 hover:bg-emerald-400/25 disabled:opacity-50"
        disabled={!canSave || isSaving}
        onClick={onSave}
        type="button"
      >
        {isSaving ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="size-5" />
        )}
        <span>Save</span>
      </Button>
    </div>
  );
}

function ItemEditForm({
  draft,
  error,
  isSaving,
  item,
  onChange,
  onSave,
}: {
  draft: ItemEditDraft;
  error: string | null;
  isSaving: boolean;
  item: ItemDetail;
  onChange: (draft: ItemEditDraft) => void;
  onSave: () => void;
}) {
  const fieldId = useId();
  const titleId = `${fieldId}-title`;
  const descriptionId = `${fieldId}-description`;
  const tagsId = `${fieldId}-tags`;
  const contentId = `${fieldId}-content`;
  const languageId = `${fieldId}-language`;
  const urlId = `${fieldId}-url`;

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {error ? (
        <div
          aria-live="polite"
          className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <EditField htmlFor={titleId} label="Title" required>
          <Input
            aria-invalid={error === "Title is required."}
            autoComplete="off"
            className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
            disabled={isSaving}
            id={titleId}
            onChange={(event) =>
              onChange({
                ...draft,
                title: event.target.value,
              })
            }
            required
            value={draft.title}
          />
        </EditField>

        <EditField htmlFor={descriptionId} label="Description">
          <EditTextarea
            disabled={isSaving}
            id={descriptionId}
            onChange={(value) =>
              onChange({
                ...draft,
                description: value,
              })
            }
            rows={3}
            value={draft.description}
          />
        </EditField>

        <EditField htmlFor={tagsId} label="Tags">
          <Input
            autoComplete="off"
            className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
            disabled={isSaving}
            id={tagsId}
            onChange={(event) =>
              onChange({
                ...draft,
                tagsText: event.target.value,
              })
            }
            value={draft.tagsText}
          />
        </EditField>

        {canEditItemContent(item) ? (
          <EditField htmlFor={contentId} label="Content">
            <EditTextarea
              className="min-h-64 font-mono text-sm leading-7"
              disabled={isSaving}
              id={contentId}
              onChange={(value) =>
                onChange({
                  ...draft,
                  content: value,
                })
              }
              rows={12}
              value={draft.content}
            />
          </EditField>
        ) : null}

        {canEditItemUrl(item) ? (
          <EditField htmlFor={urlId} label="URL">
            <Input
              className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
              disabled={isSaving}
              id={urlId}
              onChange={(event) =>
                onChange({
                  ...draft,
                  url: event.target.value,
                })
              }
              type="url"
              value={draft.url}
            />
          </EditField>
        ) : null}

        {canEditItemLanguage(item) ? (
          <EditField htmlFor={languageId} label="Language">
            <Input
              autoComplete="off"
              className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
              disabled={isSaving}
              id={languageId}
              onChange={(event) =>
                onChange({
                  ...draft,
                  language: event.target.value,
                })
              }
              value={draft.language}
            />
          </EditField>
        ) : null}
      </div>

      <DetailSection title="Non-editable details">
        <dl className="grid gap-4 text-base sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="text-zinc-100 sm:text-right">
            {formatItemTypeName(item.itemType.name)}
          </dd>
          <dt className="text-muted-foreground">Collections</dt>
          <dd className="text-zinc-100 sm:text-right">
            {item.collections.length > 0
              ? item.collections.map((collection) => collection.name).join(", ")
              : "None"}
          </dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-zinc-100 sm:text-right">{item.createdAtLabel}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-zinc-100 sm:text-right">{item.updatedAtLabel}</dd>
        </dl>
      </DetailSection>
    </form>
  );
}

function EditField({
  children,
  htmlFor,
  label,
  required,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-300">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function EditTextarea({
  className,
  disabled,
  id,
  onChange,
  rows,
  value,
}: {
  className?: string;
  disabled?: boolean;
  id: string;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-lg border border-devstash-line bg-white/[0.03] px-3 py-2 text-base text-white outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      value={value}
    />
  );
}

function ItemDrawerToast({
  message,
  onDismiss,
  tone,
}: {
  message: string;
  onDismiss: () => void;
  tone: "error" | "success";
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl shadow-black/30",
        tone === "success"
          ? "border-emerald-300/30 bg-emerald-950 text-emerald-50"
          : "border-red-300/30 bg-red-950 text-red-50",
      )}
      role="status"
    >
      <p className="min-w-0 flex-1">{message}</p>
      <button
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-current/70 transition hover:bg-white/10 hover:text-current"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

function DeleteItemConfirmationDialog({
  error,
  isDeleting,
  item,
  onConfirm,
  onOpenChange,
  open,
}: {
  error: string | null;
  isDeleting: boolean;
  item: ItemDetail | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-devstash-line bg-[#0b0d10] p-5 shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-xl font-semibold text-white">
            Delete item?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-zinc-300">
            This will permanently delete
            {item ? ` "${item.title}"` : " this item"}. This action cannot be
            undone.
          </Dialog.Description>

          {error ? (
            <div
              aria-live="polite"
              className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="h-10 rounded-lg bg-transparent px-4 text-base text-zinc-200 hover:bg-white/[0.06] hover:text-white"
              disabled={isDeleting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="h-10 gap-2 rounded-lg border border-red-300/30 bg-red-400/15 px-4 text-base text-red-100 hover:bg-red-400/25 disabled:opacity-50"
              disabled={isDeleting || !item}
              onClick={onConfirm}
              type="button"
            >
              {isDeleting ? (
                <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-5" />
              )}
              <span>Delete</span>
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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

function toDashboardItemSummary(
  item: ItemDetail,
  previousItem: DashboardItem,
): DashboardItem {
  return {
    ...previousItem,
    id: item.id,
    title: item.title,
    description: item.description,
    typeSlug: item.typeSlug,
    itemType: item.itemType,
    collectionSlugs: item.collections.map((collection) => collection.slug),
    collectionNames: item.collections.map((collection) => collection.name),
    tags: item.tags.map((tag) => tag.name),
    updatedAt: "Just now",
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    language: item.language,
    preview: getItemDetailPreview(item),
    accentColor: item.accentColor,
  };
}

function createItemEditDraft(item: ItemDetail): ItemEditDraft {
  return {
    itemId: item.id,
    title: item.title,
    description: item.description === "No description yet." ? "" : item.description,
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tagsText: item.tags.map((tag) => tag.name).join(", "),
  };
}

function createUpdateItemPayload(item: ItemDetail, draft: ItemEditDraft) {
  return {
    title: draft.title,
    description: draft.description,
    content: canEditItemContent(item) ? draft.content : null,
    url: canEditItemUrl(item) ? draft.url : null,
    language: canEditItemLanguage(item) ? draft.language : null,
    tags: getDraftTags(draft.tagsText),
  };
}

function getDraftTags(tagsText: string) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getItemDetailPreview(item: ItemDetail) {
  return item.content ?? item.url ?? item.fileName ?? item.fileUrl ?? "";
}

function canEditItemContent(item: ItemDetail) {
  return ["snippet", "prompt", "command", "note"].includes(item.typeSlug);
}

function canEditItemLanguage(item: ItemDetail) {
  return ["snippet", "command"].includes(item.typeSlug);
}

function canEditItemUrl(item: ItemDetail) {
  return item.typeSlug === "link";
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
