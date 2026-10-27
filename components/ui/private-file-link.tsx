
"use client";

import { useState } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

const allowedBuckets = new Set([
  "receipts",
  "contracts",
  "event-files",
  "avatars",
]);

export function PrivateFileLink({
  value,
  className = "",
  label = "View uploaded file",
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const splitAt = value.indexOf(":");
  const path = splitAt > 0 ? value.slice(splitAt + 1) : "";
  const extension = path.split(".").pop()?.toLowerCase() ?? "";

  const isImage = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "bmp",
    "avif",
  ].includes(extension);

  const isPdf = extension === "pdf";

  async function openFile() {
    if (busy) return;

    setError(null);

    if (splitAt < 1) {
      setError(
        "This older file reference cannot be opened securely. It may need to be migrated."
      );
      return;
    }

    const bucket = value.slice(0, splitAt);

    if (
      !allowedBuckets.has(bucket) ||
      !path ||
      path.startsWith("/") ||
      path.split("/").includes("..")
    ) {
      setError("This file reference is not valid.");
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();

      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 300);

      if (signError) {
        throw signError;
      }

      if (!data?.signedUrl) {
        throw new Error("No secure file link was returned.");
      }

      setSignedUrl(data.signedUrl);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Receipt preview failed:", err);

      setError(
        "Unable to load this file. Check your access and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  function openInNewTab() {
    if (!signedUrl) return;

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={openFile}
          disabled={busy}
          className={`truncate text-left text-xs text-emerald-700 hover:underline disabled:opacity-60 dark:text-emerald-400 ${className}`}
        >
          {busy ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading preview…
            </span>
          ) : (
            label
          )}
        </button>

        {error && (
          <span className="mt-1 block text-xs text-red-600">
            {error}
          </span>
        )}
      </span>

      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      >
        <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Receipt preview</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openInNewTab}
              disabled={!signedUrl}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </button>

            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Close preview
            </button>
          </div>

          <div className="min-h-[50vh] flex-1 overflow-auto rounded-lg border bg-muted/30">
            {signedUrl && isImage ? (
              <div className="flex min-h-[50vh] items-center justify-center p-3">
                <img
                  src={signedUrl}
                  alt="Receipt"
                  className="max-h-[65vh] max-w-full object-contain"
                />
              </div>
            ) : signedUrl ? (
              <iframe
                key={signedUrl}
                src={signedUrl}
                title="Receipt file preview"
                className="h-[65vh] w-full border-0"
              />
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No file is available to preview.
              </p>
            )}
          </div>

          {!isImage && !isPdf && (
            <p className="text-xs text-muted-foreground">
              If this file type cannot be previewed here, use Open in new tab.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
