"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FileUpload({
  bucket, pathPrefix, value, onChange, label = "Upload file",
}: {
  bucket: "receipts" | "contracts" | "event-files" | "avatars";
  pathPrefix: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <a href={value} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs text-emerald-700 hover:underline dark:text-emerald-400">
            View uploaded file
          </a>
          <button onClick={() => onChange(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
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
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading…" : label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
