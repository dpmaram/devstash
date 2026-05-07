"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Edit2, Heart, Loader, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteCollection, updateCollection } from "@/actions/collections";
import type { DashboardCollection } from "@/lib/db/collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ActionToast = {
  message: string;
  tone: "error" | "success";
} | null;

export function CollectionDetailActions({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const router = useRouter();
  const [editDraft, setEditDraft] = useState({
    name: collection.name,
    description: collection.description || "",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ActionToast>(null);

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editDraft.name.trim() || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateCollection({
        collectionId: collection.id,
        name: editDraft.name,
        description: editDraft.description || null,
      });

      if (!result.success) {
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      setIsEditOpen(false);
      setToast({
        message: "Collection updated.",
        tone: "success",
      });
      router.refresh();
    } catch {
      setToast({
        message: "Unable to update collection. Try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    setIsSaving(true);

    try {
      const result = await deleteCollection(collection.id);

      if (!result.success) {
        setToast({
          message: result.error,
          tone: "error",
        });
        return;
      }

      setIsDeleteOpen(false);
      setToast({
        message: "Collection deleted.",
        tone: "success",
      });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch {
      setToast({
        message: "Unable to delete collection. Try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {toast ? (
        <CollectionActionToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          tone={toast.tone}
        />
      ) : null}

      <div className="flex items-center gap-2">
        {/* Edit Button */}
        <Button
          className="h-9 w-9 p-0"
          onClick={() => setIsEditOpen(true)}
          title="Edit collection"
          variant="ghost"
        >
          <Edit2 className="size-4" />
        </Button>

        {/* Delete Button */}
        <Button
          className="h-9 w-9 p-0"
          onClick={() => setIsDeleteOpen(true)}
          title="Delete collection"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>

        {/* Favorite Button (placeholder) */}
        <Button
          className="h-9 w-9 p-0"
          disabled
          title="Favorites coming soon"
          variant="ghost"
        >
          <Heart className="size-4" />
        </Button>
      </div>

      {/* Edit Modal */}
      <Dialog.Root onOpenChange={setIsEditOpen} open={isEditOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-devstash-line bg-[#0b0d10] shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-start gap-4 border-b border-devstash-line px-5 py-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                <Edit2 aria-hidden="true" className="size-5 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-2xl font-semibold text-white">
                  Edit Collection
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Edit collection name and description
                </Dialog.Description>
              </div>
              <button
                aria-label="Close edit collection dialog"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => setIsEditOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleEditSubmit}>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Name
                  </label>
                  <Input
                    autoFocus
                    className="bg-white/5 text-white placeholder:text-muted-foreground"
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                    placeholder="Collection name"
                    value={editDraft.name}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-devstash-line bg-white/5 px-3 py-2 text-white placeholder:text-muted-foreground"
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, description: e.target.value })
                    }
                    placeholder="Collection description"
                    rows={3}
                    value={editDraft.description}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-devstash-line px-5 py-4">
                <Button
                  disabled={isSaving || !editDraft.name.trim()}
                  onClick={() => setIsEditOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  disabled={isSaving || !editDraft.name.trim()}
                  type="submit"
                >
                  {isSaving ? (
                    <Loader aria-hidden="true" className="size-4 animate-spin" />
                  ) : null}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/75 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-devstash-line bg-[#0b0d10] shadow-2xl shadow-black/50 outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-start gap-4 border-b border-devstash-line px-5 py-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-red-950/40">
                <Trash2 aria-hidden="true" className="size-5 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-2xl font-semibold text-white">
                  Delete Collection?
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Confirm deletion of this collection
                </Dialog.Description>
              </div>
              <button
                aria-label="Close delete confirmation dialog"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-devstash-line bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => setIsDeleteOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-base text-muted-foreground">
                Are you sure you want to delete <strong>{collection.name}</strong>?
              </p>
              <div className="rounded-lg border border-amber-600/30 bg-amber-950/20 p-3">
                <p className="text-sm text-amber-200">
                  This collection will be deleted but all items will be preserved.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-devstash-line px-5 py-4">
              <Button
                disabled={isSaving}
                onClick={() => setIsDeleteOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="gap-2 bg-red-600 hover:bg-red-700"
                disabled={isSaving}
                onClick={handleDeleteConfirm}
                type="button"
              >
                {isSaving ? (
                  <Loader aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                {isSaving ? "Deleting..." : "Delete Collection"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function CollectionActionToast({
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
      className={cn(
        "fixed bottom-4 left-4 right-4 z-[100] max-w-sm rounded-lg border p-4 text-sm shadow-lg",
        tone === "success"
          ? "border-green-600/30 bg-green-950/50 text-green-200"
          : "border-red-600/30 bg-red-950/50 text-red-200",
      )}
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <p>{message}</p>
        <button
          aria-label="Dismiss"
          className="text-opacity-60 hover:text-opacity-100"
          onClick={onDismiss}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
