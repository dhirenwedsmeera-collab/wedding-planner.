
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
    if (busy) return;

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

    // Open the tab directly from the click so the browser is less
    // likely to block it while the secure link is being generated.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setError("Your browser blocked the new tab. Please allow pop-ups and try again.");
      return;
    }

    newTab.opener = null;
    setBusy(true);

    try {
      const supabase = createClient();

      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60);

      if (signError || !data?.signedUrl) {
        throw signError ?? new Error("Could not create a secure link.");
      }

      newTab.location.href = data.signedUrl;
    } catch {
      newTab.close();
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
