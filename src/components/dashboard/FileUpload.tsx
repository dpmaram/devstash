"use client";

import {
  Check,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  isUploadItemTypeSlug,
  validateUploadCandidate,
  type UploadItemTypeSlug,
} from "@/lib/uploads";
import { cn } from "@/lib/utils";

export type UploadedFileDraft = {
  contentType: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
};

type FileUploadProps = {
  disabled?: boolean;
  onChange: (file: UploadedFileDraft | null) => void;
  typeSlug: UploadItemTypeSlug;
  value: UploadedFileDraft | null;
};

type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

type UploadResponse =
  | {
      success: true;
      file: UploadedFileDraft;
    }
  | {
      success: false;
      error: string;
    };

export function FileUpload({
  disabled,
  onChange,
  typeSlug,
  value,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>(value ? "uploaded" : "idle");
  const isImageUpload = typeSlug === "image";

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openFileDialog() {
    inputRef.current?.click();
  }

  function clearUpload() {
    setError(null);
    setProgress(0);
    setStatus("idle");
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleFile(file: File | null | undefined) {
    if (!file || disabled || !isUploadItemTypeSlug(typeSlug)) {
      return;
    }

    const validation = validateUploadCandidate(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      typeSlug,
    );

    if (!validation.success) {
      setError(validation.error);
      setStatus("error");
      onChange(null);
      return;
    }

    setError(null);
    setProgress(0);
    setStatus("uploading");

    if (isImageUpload) {
      setPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return URL.createObjectURL(file);
      });
    }

    try {
      const uploadedFile = await uploadFile(file, typeSlug, setProgress);

      setStatus("uploaded");
      setProgress(100);
      onChange(uploadedFile);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload file.",
      );
      setStatus("error");
      onChange(null);
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-lg border border-dashed border-devstash-line bg-white/[0.03] p-4 transition",
          isDragging && "border-blue-300/50 bg-blue-400/10",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files.item(0));
        }}
      >
        <input
          accept={isImageUpload ? imageAccept : fileAccept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => void handleFile(event.target.files?.item(0))}
          ref={inputRef}
          type="file"
        />

        {value ? (
          <UploadedFileSummary
            disabled={disabled}
            isImageUpload={isImageUpload}
            onClear={clearUpload}
            previewUrl={previewUrl}
            value={value}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-5 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-300">
              <UploadCloud aria-hidden="true" className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-100">
                Drop {isImageUpload ? "an image" : "a file"} here
              </p>
              <p className="text-xs text-muted-foreground">
                {isImageUpload ? "PNG, JPG, GIF, or WebP up to 5 MB" : "PDF, text, markdown, JSON, YAML, XML, CSV, TOML, or INI up to 10 MB"}
              </p>
            </div>
            <Button
              className="h-9 rounded-lg border border-devstash-line bg-white/[0.04] px-3 text-sm text-zinc-100 hover:bg-white/[0.08]"
              disabled={disabled}
              onClick={openFileDialog}
              type="button"
              variant="ghost"
            >
              Browse
            </Button>
          </div>
        )}
      </div>

      {status === "uploading" ? (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            <span>Uploading {progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-blue-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p aria-live="polite" className="text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function UploadedFileSummary({
  disabled,
  isImageUpload,
  onClear,
  previewUrl,
  value,
}: {
  disabled?: boolean;
  isImageUpload: boolean;
  onClear: () => void;
  previewUrl: string | null;
  value: UploadedFileDraft;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] text-zinc-300">
        {isImageUpload && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="size-full object-cover"
            src={previewUrl}
          />
        ) : isImageUpload ? (
          <ImageIcon aria-hidden="true" className="size-7" />
        ) : (
          <FileText aria-hidden="true" className="size-7" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">
              {value.fileName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)}
            </p>
          </div>
          <Check aria-hidden="true" className="mt-0.5 size-4 text-emerald-300" />
        </div>
        <Button
          className="mt-3 h-8 gap-1.5 rounded-md bg-white/[0.04] px-2.5 text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white"
          disabled={disabled}
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-3.5" />
          <span>Remove</span>
        </Button>
      </div>
    </div>
  );
}

function uploadFile(
  file: File,
  typeSlug: UploadItemTypeSlug,
  onProgress: (progress: number) => void,
) {
  return new Promise<UploadedFileDraft>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.set("file", file);
    formData.set("typeSlug", typeSlug);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      const response = parseUploadResponse(request.responseText);

      if (request.status >= 200 && request.status < 300 && response.success) {
        resolve(response.file);
        return;
      }

      reject(new Error(response.success ? "Unable to upload file." : response.error));
    };

    request.onerror = () => reject(new Error("Unable to upload file."));
    request.open("POST", "/api/uploads");
    request.send(formData);
  });
}

function parseUploadResponse(responseText: string): UploadResponse {
  try {
    return JSON.parse(responseText) as UploadResponse;
  } catch {
    return {
      success: false,
      error: "Unable to upload file.",
    };
  }
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

const imageAccept = ".png,.jpg,.jpeg,.gif,.webp";
const fileAccept = ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini";
