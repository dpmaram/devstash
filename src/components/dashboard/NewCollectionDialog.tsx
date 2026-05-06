"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, FolderPlus, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createCollection as createCollectionAction } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NewCollectionDraft = {
  name: string;
  description: string;
};

type NewCollectionToast = {
  message: string;
  tone: "error" | "success";
} | null;

const initialDraft: NewCollectionDraft = {
  name: "",
  description: "",
};

export function NewCollectionDialog({
  triggerClassName,
  triggerLabel = "New Collection",
  triggerLabelClassName = "hidden lg:inline",
}: {
  triggerClassName?: string;
  triggerLabel?: string;
  triggerLabelClassName?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<NewCollectionDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<NewCollectionToast>(null);
  const canSave = draft.name.trim().length > 0;

  function updateDraft(nextDraft: Partial<NewCollectionDraft>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
    }));
  }

  function resetForm() {
    setDraft(initialDraft);
    setError(null);
    setIsSaving(false);
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
      const result = await createCollectionAction({
        name: draft.name,
        description: draft.description,
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
        message: "Collection created.",
        tone: "success",
      });
      router.refresh();
    } catch {
      const errorMessage = "Unable to create collection. Try again.";

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
        <NewCollectionToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          tone={toast.tone}
        />
      ) : null}
      <Button
        className={cn(
          "h-11 gap-2 rounded-lg border-devstash-line bg-white/[0.04] px-3 text-base text-foreground hover:bg-white/[0.08] sm:px-4",
          triggerClassName,
        )}
        onClick={() => setIsOpen(true)}
        type="button"
        variant="outline"
      >
        <FolderPlus aria-hidden="true" className="size-5" />
        <span className={triggerLabelClassName}>{triggerLabel}</span>
      </Button>
      <Dialog.Root onOpenChange={handleOpenChange} open={isOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-devstash-line bg-[#0b0d10] shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-start gap-4 border-b border-devstash-line px-5 py-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                <FolderPlus aria-hidden="true" className="size-5 text-sky-300" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-2xl font-semibold text-white">
                  New Collection
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Create a new DevStash collection
                </Dialog.Description>
              </div>
              <button
                aria-label="Close new collection dialog"
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
                <EditField label="Name" required>
                  <Input
                    autoComplete="off"
                    className="h-11 border-devstash-line bg-white/[0.03] px-3 text-base text-white"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft({
                        name: event.target.value,
                      })
                    }
                    required
                    value={draft.name}
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
                    rows={5}
                    value={draft.description}
                  />
                </EditField>
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
  disabled,
  onChange,
  rows,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <textarea
      className="w-full resize-y rounded-lg border border-devstash-line bg-white/[0.03] px-3 py-2 text-base text-white outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      value={value}
    />
  );
}

function NewCollectionToast({
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
