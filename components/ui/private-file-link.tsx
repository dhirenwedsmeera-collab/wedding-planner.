"use client";

import { useState } from "react";
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

  async function openFile() {
    setError(null);

    const splitAt = value.indexOf(":");

    if (splitAt < 1) {
      setError(
        "This is an older file link. It needs to be migrated before it can be opened securely."
      );
      return;
    }

    const bucket = value.slice(0, splitAt);
    const path = value.slice(splitAt + 1);

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
        .createSignedUrl(path, 60);

      if (signError || !data?.signedUrl) {
        throw signError ?? new Error("Could not create a secure link.");
      }

      const opened = window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!opened) {
        setError("Allow pop-ups to open this file.");
      }
    } catch {
      setError(
        "Unable to open this file. Check your access and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="min-w-0 flex-1">
      <button
        type="button"
        onClick={openFile}
        disabled={busy}
        className={`truncate text-left text-xs text-emerald-700 hover:underline disabled:opacity-60 dark:text-emerald-400 ${className}`}
      >
        {busy ? "Preparing secure link…" : label}
      </button>

      {error && (
        <span className="ml-2 text-[11px] text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
