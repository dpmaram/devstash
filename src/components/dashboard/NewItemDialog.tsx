"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Check,
  Code2,
  LoaderCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  generateAutoDescription,
  generateAutoTags,
  optimizePrompt,
} from "@/actions/ai";
import { createItem as createItemAction } from "@/actions/items";
import { CollectionPicker } from "@/components/dashboard/CollectionPicker";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import {
  FileUpload,
  type UploadedFileDraft,
} from "@/components/dashboard/FileUpload";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createInitialNewItemDraft,
  createableTypeOrder,
  type CreateItemTypeSlug,
  type NewItemDraft,
} from "@/lib/create-item-types";
import {
  appendTagToTagsText,
  filterSuggestedTags,
  parseTagsText,
} from "@/lib/ai/tags";
import {
  getCodeEditorLanguage,
  getCodeEditorLanguageOptions,
  getCodeEditorLanguageLabel,
  shouldUseCodeEditor,
} from "@/lib/code-editor";
import { shouldUseMarkdownEditor } from "@/lib/markdown-editor";
import { isUploadItemTypeSlug } from "@/lib/uploads";
import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItemType } from "@/lib/db/items";
import type { ItemTypeSlug } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type NewItemToast = {
  message: string;
  tone: "error" | "success";
} | null;

export function NewItemDialog({
  collections = [],
  initialTypeSlug,
  isPro = false,
  itemTypes,
  triggerClassName,
  triggerLabel = "New Item",
  triggerLabelClassName = "hidden sm:inline",
}: {
  collections?: DashboardCollection[];
  initialTypeSlug?: string | null;
  isPro?: boolean;
  itemTypes: DashboardItemType[];
  triggerClassName?: string;
  triggerLabel?: string;
  triggerLabelClassName?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<NewItemDraft>(() =>
    createInitialNewItemDraft(initialTypeSlug),
  );
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [optimizedPromptSuggestion, setOptimizedPromptSuggestion] =
    useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [toast, setToast] = useState<NewItemToast>(null);
  const typeOptions = getCreateableItemTypes(itemTypes);
  const canSave =
    draft.title.trim().length > 0 &&
    (draft.typeSlug !== "link" || draft.url.trim().length > 0) &&
    (!isUploadItemTypeSlug(draft.typeSlug) || draft.fileUrl.trim().length > 0);

  function updateDraft(nextDraft: Partial<NewItemDraft>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
    }));
  }

  function resetForm() {
    setDraft(createInitialNewItemDraft(initialTypeSlug));
    setError(null);
    setIsGeneratingDescription(false);
    setIsOptimizingPrompt(false);
    setIsSaving(false);
    setOptimizedPromptSuggestion("");
    setIsSuggestingTags(false);
    setSuggestedTags([]);
  }

  async function handleOptimizePrompt() {
    if (
      isSaving ||
      isOptimizingPrompt ||
      draft.typeSlug !== "prompt" ||
      draft.content.trim().length === 0
    ) {
      return;
    }

    setIsOptimizingPrompt(true);

    try {
      const result = await optimizePrompt({
        typeSlug: "prompt",
        title: draft.title,
        description: draft.description,
        content: draft.content,
        tags: getDraftTags(draft.tagsText),
      });

      if (!result.success) {
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      if (!result.data.changed) {
        setOptimizedPromptSuggestion("");
        setToast({
          message: "Prompt already looks optimized.",
          tone: "success",
        });
        return;
      }

      setOptimizedPromptSuggestion(result.data.optimizedPrompt);
    } catch {
      setToast({
        message: "Unable to optimize prompt right now.",
        tone: "error",
      });
    } finally {
      setIsOptimizingPrompt(false);
    }
  }

  function acceptOptimizedPrompt() {
    if (!optimizedPromptSuggestion) {
      return;
    }

    updateDraft({
      content: optimizedPromptSuggestion,
    });
    setOptimizedPromptSuggestion("");
  }

  function rejectOptimizedPrompt() {
    setOptimizedPromptSuggestion("");
  }

  async function handleGenerateDescription() {
    if (isSaving || isGeneratingDescription) {
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const result = await generateAutoDescription({
        typeSlug: draft.typeSlug,
        title: draft.title,
        description: draft.description,
        content: draft.content,
        url: draft.url,
        fileName: draft.fileName,
        language: draft.language,
        tags: getDraftTags(draft.tagsText),
      });

      if (!result.success) {
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      updateDraft({
        description: result.data.description,
      });
    } catch {
      setToast({
        message: "Unable to generate a description right now.",
        tone: "error",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  async function handleSuggestTags() {
    if (isSaving || isSuggestingTags) {
      return;
    }

    setIsSuggestingTags(true);

    try {
      const result = await generateAutoTags({
        title: draft.title,
        description: draft.description,
        content: draft.content,
        tags: getDraftTags(draft.tagsText),
      });

      if (!result.success) {
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      setSuggestedTags(filterSuggestedTags(result.data.tags, draft.tagsText));
    } catch {
      setToast({
        message: "Unable to generate tag suggestions right now.",
        tone: "error",
      });
    } finally {
      setIsSuggestingTags(false);
    }
  }

  function acceptSuggestedTag(tag: string) {
    const nextTagsText = appendTagToTagsText(draft.tagsText, tag);

    updateDraft({
      tagsText: nextTagsText,
    });
    setSuggestedTags((currentTags) =>
      filterSuggestedTags(
        currentTags.filter((candidateTag) => candidateTag !== tag),
        nextTagsText,
      ),
    );
  }

  function rejectSuggestedTag(tag: string) {
    setSuggestedTags((currentTags) =>
      currentTags.filter((candidateTag) => candidateTag !== tag),
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave || isSaving) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const result = await createItemAction({
        typeSlug: draft.typeSlug,
        title: draft.title,
        description: draft.description,
        content: canEditContent(draft.typeSlug) ? draft.content : null,
        url: draft.typeSlug === "link" ? draft.url : null,
        fileUrl: isUploadItemTypeSlug(draft.typeSlug) ? draft.fileUrl : null,
        fileName: isUploadItemTypeSlug(draft.typeSlug) ? draft.fileName : null,
        fileSize: isUploadItemTypeSlug(draft.typeSlug) ? draft.fileSize : null,
        language: canEditLanguage(draft.typeSlug) ? draft.language : null,
        tags: getDraftTags(draft.tagsText),
        collectionIds: draft.collectionIds,
      });

      if (!result.success) {
        setError(result.error);
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      setIsOpen(false);
      resetForm();
      setToast({
        message: "Item created.",
        tone: "success",
      });
      router.refresh();
    } catch {
      const errorMessage = "Unable to create item. Try again.";

      setError(errorMessage);
      setToast({
        message: errorMessage,
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {toast ? (
        <NewItemToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          tone={toast.tone}
        />
      ) : null}
      <Button
        className={cn(
          "h-11 gap-2 rounded-lg bg-foreground px-4 text-base font-medium text-background hover:bg-foreground/90 sm:px-5",
          triggerClassName,
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus aria-hidden="true" className="size-5" />
        <span className={triggerLabelClassName}>{triggerLabel}</span>
      </Button>
      <Dialog.Root onOpenChange={handleOpenChange} open={isOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-devstash-line bg-[#0b0d10] shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-start gap-4 border-b border-devstash-line px-5 py-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                {renderItemTypeIcon(draft.typeSlug)}
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-2xl font-semibold text-white">
                  New Item
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Create a new DevStash item
                </Dialog.Description>
              </div>
              <button
                aria-label="Close new item dialog"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
                disabled={isSaving}
                onClick={() => handleOpenChange(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <form
              className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
              onSubmit={handleSubmit}
            >
              {error ? (
                <div
                  aria-live="polite"
                  className="mb-5 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
                >
                  {error}
                </div>
              ) : null}

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {typeOptions.map((itemType) => {
                      const isSelected = itemType.slug === draft.typeSlug;

                      return (
                        <button
                          className={cn(
                            "flex min-h-16 flex-col items-center justify-center gap-2 rounded-lg border border-devstash-line bg-white/[0.03] px-2 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            isSelected &&
                              "border-white/30 bg-white/[0.09] text-white",
                          )}
                          disabled={isSaving}
                          key={itemType.slug}
                          onClick={() => {
                            updateDraft({
                              typeSlug: itemType.slug,
                            });
                            setOptimizedPromptSuggestion("");
                          }}
                          type="button"
                        >
                          {renderItemTypeIcon(itemType.slug)}
                          <span>{itemType.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <EditField label="Title" required>
                  <Input
                    autoComplete="off"
                    className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft({
                        title: event.target.value,
                      })
                    }
                    required
                    value={draft.title}
                  />
                </EditField>

                <EditField label="Description">
                  <EditTextarea
                    disabled={isSaving}
                    onChange={(description) =>
                      updateDraft({
                        description,
                      })
                    }
                    rows={3}
                    value={draft.description}
                  />
                  {isPro ? (
                    <div className="mt-2 flex justify-end">
                      <Button
                        aria-label="Generate description"
                        className="size-9 rounded-md"
                        disabled={isSaving || isGeneratingDescription}
                        onClick={handleGenerateDescription}
                        title="Generate description"
                        type="button"
                        variant="ghost"
                      >
                        {isGeneratingDescription ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                        ) : (
                          <Sparkles aria-hidden="true" className="size-4" />
                        )}
                      </Button>
                    </div>
                  ) : null}
                </EditField>

                <EditField label="Tags">
                  <Input
                    autoComplete="off"
                    className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
                    disabled={isSaving}
                    onChange={(event) =>
                      {
                        const nextTagsText = event.target.value;

                        updateDraft({
                          tagsText: nextTagsText,
                        });
                        setSuggestedTags((currentTags) =>
                          filterSuggestedTags(currentTags, nextTagsText),
                        );
                      }
                    }
                    value={draft.tagsText}
                  />
                  {isPro ? (
                    <div className="mt-3 space-y-3">
                      <Button
                        className="h-9 gap-2 rounded-md px-3 text-sm"
                        disabled={isSaving || isSuggestingTags}
                        onClick={handleSuggestTags}
                        type="button"
                        variant="ghost"
                      >
                        {isSuggestingTags ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                        ) : (
                          <Sparkles aria-hidden="true" className="size-4" />
                        )}
                        <span>Suggest Tags</span>
                      </Button>

                      {suggestedTags.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Suggestions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedTags.map((tag) => (
                              <span
                                className="inline-flex items-center gap-1 rounded-md border border-devstash-line bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-100"
                                key={tag}
                              >
                                <span>{tag}</span>
                                <button
                                  aria-label={`Accept tag ${tag}`}
                                  className="rounded p-0.5 text-emerald-300 transition hover:bg-emerald-400/20"
                                  onClick={() => acceptSuggestedTag(tag)}
                                  type="button"
                                >
                                  <Check aria-hidden="true" className="size-3.5" />
                                </button>
                                <button
                                  aria-label={`Reject tag ${tag}`}
                                  className="rounded p-0.5 text-muted-foreground transition hover:bg-white/10 hover:text-zinc-100"
                                  onClick={() => rejectSuggestedTag(tag)}
                                  type="button"
                                >
                                  <X aria-hidden="true" className="size-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </EditField>

                <EditField label="Collections">
                  <CollectionPicker
                    collections={collections}
                    disabled={isSaving}
                    onChange={(collectionIds) =>
                      updateDraft({
                        collectionIds,
                      })
                    }
                    selectedCollectionIds={draft.collectionIds}
                  />
                </EditField>

                {isUploadItemTypeSlug(draft.typeSlug) ? (
                  <EditField label="Upload" required>
                    <FileUpload
                      disabled={isSaving}
                      onChange={(file) =>
                        updateDraft({
                          fileName: file?.fileName ?? "",
                          fileSize: file?.fileSize ?? null,
                          fileUrl: file?.fileUrl ?? "",
                        })
                      }
                      typeSlug={draft.typeSlug}
                      value={getUploadedFileDraft(draft)}
                    />
                  </EditField>
                ) : canEditContent(draft.typeSlug) ? (
                  <EditField label="Content">
                    {canEditLanguage(draft.typeSlug) ? (
                      <div className="mb-3 space-y-2">
                        <span className="block text-sm font-medium text-muted-foreground">
                          Language
                        </span>
                        <select
                          className="h-11 w-full rounded-lg border border-devstash-line bg-white/[0.03] px-3 text-base text-white outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSaving}
                          onChange={(event) =>
                            updateDraft({
                              language: event.target.value,
                            })
                          }
                          value={draft.language}
                        >
                          <option className="bg-[#0b0d10]" value="">
                            {draft.typeSlug === "command"
                              ? "Default (Shell)"
                              : "Default (Plain text)"}
                          </option>
                          {getCodeEditorLanguageOptions(draft.typeSlug).map(
                            (option) => (
                              <option
                                className="bg-[#0b0d10]"
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    ) : null}
                    {shouldUseCodeEditor(draft.typeSlug) ? (
                      <CodeEditor
                        ariaLabel="New item content editor"
                        disabled={isSaving}
                        language={getCodeEditorLanguage(
                          draft.language,
                          draft.typeSlug,
                        )}
                        languageLabel={getCodeEditorLanguageLabel(
                          draft.language,
                          draft.typeSlug,
                        )}
                        onChange={(content) =>
                          {
                            updateDraft({
                              content,
                            });
                            setOptimizedPromptSuggestion("");
                          }
                        }
                        value={draft.content}
                      />
                    ) : shouldUseMarkdownEditor(draft.typeSlug) ? (
                      <>
                        <MarkdownEditor
                          ariaLabel="New item markdown content editor"
                          canOptimize={draft.typeSlug === "prompt"}
                          disabled={isSaving}
                          isOptimizing={isOptimizingPrompt}
                          isProUser={isPro}
                          onChange={(content) => {
                            updateDraft({
                              content,
                            });
                            setOptimizedPromptSuggestion("");
                          }}
                          onOptimize={handleOptimizePrompt}
                          value={draft.content}
                        />
                        {draft.typeSlug === "prompt" && optimizedPromptSuggestion ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-devstash-line bg-white/[0.03] p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Use optimized prompt?
                            </p>
                            <div className="max-h-40 overflow-auto rounded-md border border-devstash-line bg-black/20 px-3 py-2 text-sm leading-6 text-zinc-100">
                              {optimizedPromptSuggestion}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                className="h-8 gap-1.5 rounded-md px-3 text-xs"
                                onClick={acceptOptimizedPrompt}
                                type="button"
                                variant="ghost"
                              >
                                <Check
                                  aria-hidden="true"
                                  className="size-3.5 text-emerald-300"
                                />
                                <span>Use this prompt</span>
                              </Button>
                              <Button
                                className="h-8 gap-1.5 rounded-md px-3 text-xs"
                                onClick={rejectOptimizedPrompt}
                                type="button"
                                variant="ghost"
                              >
                                <X aria-hidden="true" className="size-3.5" />
                                <span>Keep current</span>
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <EditTextarea
                        className="min-h-56 font-mono text-sm leading-7"
                        disabled={isSaving}
                        onChange={(content) =>
                          {
                            updateDraft({
                              content,
                            });
                            setOptimizedPromptSuggestion("");
                          }
                        }
                        rows={10}
                        value={draft.content}
                      />
                    )}
                  </EditField>
                ) : null}

                {draft.typeSlug === "link" ? (
                  <EditField label="URL" required>
                    <Input
                      className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
                      disabled={isSaving}
                      onChange={(event) =>
                        updateDraft({
                          url: event.target.value,
                        })
                      }
                      required
                      type="url"
                      value={draft.url}
                    />
                  </EditField>
                ) : null}
              </div>

              <div className="sticky bottom-0 -mx-5 mt-8 flex flex-col-reverse gap-2 border-t border-devstash-line bg-[#0b0d10] px-5 py-4 sm:flex-row sm:justify-end">
                <Button
                  className="h-10 rounded-lg bg-transparent px-4 text-base text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                  disabled={isSaving}
                  onClick={() => handleOpenChange(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className="h-10 gap-2 rounded-lg bg-foreground px-4 text-base text-background hover:bg-foreground/90 disabled:opacity-50"
                  disabled={!canSave || isSaving}
                  type="submit"
                >
                  {isSaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-5 animate-spin"
                    />
                  ) : (
                    <Check aria-hidden="true" className="size-5" />
                  )}
                  <span>Create</span>
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function EditField({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-muted-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-300">
            {" "}
            *
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function EditTextarea({
  className,
  disabled,
  onChange,
  rows,
  value,
}: {
  className?: string;
  disabled?: boolean;
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
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      value={value}
    />
  );
}

function NewItemToast({
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
        "fixed right-4 top-4 z-[90] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl shadow-black/30",
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

function getCreateableItemTypes(itemTypes: DashboardItemType[]) {
  return createableTypeOrder
    .map((typeSlug) => itemTypes.find((itemType) => itemType.slug === typeSlug))
    .filter((itemType): itemType is DashboardItemType & {
      slug: CreateItemTypeSlug;
    } => Boolean(itemType));
}

function getDraftTags(tagsText: string) {
  return parseTagsText(tagsText);
}

function canEditContent(typeSlug: CreateItemTypeSlug) {
  return !["link", "file", "image"].includes(typeSlug);
}

function canEditLanguage(typeSlug: CreateItemTypeSlug) {
  return typeSlug === "snippet" || typeSlug === "command";
}

function getUploadedFileDraft(
  draft: NewItemDraft,
): UploadedFileDraft | null {
  if (!draft.fileUrl || !draft.fileName || !draft.fileSize) {
    return null;
  }

  return {
    contentType: "",
    fileName: draft.fileName,
    fileSize: draft.fileSize,
    fileUrl: draft.fileUrl,
  };
}

function renderItemTypeIcon(slug: string) {
  if (isKnownItemTypeSlug(slug)) {
    const Icon = itemTypeIcons[slug];

    return (
      <Icon
        aria-hidden="true"
        className={`size-5 ${itemTypeIconClasses[slug]}`}
      />
    );
  }

  return <Code2 aria-hidden="true" className="size-5 text-zinc-400" />;
}

function isKnownItemTypeSlug(slug: string): slug is ItemTypeSlug {
  return slug in itemTypeIcons;
}
