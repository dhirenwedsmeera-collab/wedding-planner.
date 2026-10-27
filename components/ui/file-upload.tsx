
"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FileUpload({
  bucket,
  pathPrefix,
  value,
  onChange,
  label = "Upload file",
  accept,
}: {
  bucket: "receipts" | "contracts" | "event-files" | "avatars";
  pathPrefix: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  accept?: string;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be 10 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${pathPrefix}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      onChange(`${bucket}:${path}`);
    } catch {
      setError("Something went wrong while uploading. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <span className="min-w-0 flex-1 truncate text-xs">
            File uploaded
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Remove file reference"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:border-gold-400 hover:text-foreground disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.currentTarget.value = "";
        }}
      />

      {error && (
        <p className="mt-1 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}
