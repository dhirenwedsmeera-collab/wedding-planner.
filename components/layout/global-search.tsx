"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, ListChecks, ClipboardCheck, Users, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Result {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: typeof ListChecks;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const term = `%${query.trim()}%`;
      const [tasks, bookings, guests, vendors] = await Promise.all([
        supabase.from("tasks").select("id,name,category").ilike("name", term).limit(4),
        supabase.from("bookings").select("id,vendor_name,category").ilike("vendor_name", term).limit(4),
        supabase.from("guests").select("id,full_name,category").ilike("full_name", term).limit(4),
        supabase.from("vendors").select("id,name,category").ilike("name", term).limit(4),
      ]);

      const combined: Result[] = [
        ...(tasks.data ?? []).map((t: any) => ({ id: t.id, label: t.name, sublabel: t.category ?? "Task", href: "/tasks", icon: ListChecks })),
        ...(bookings.data ?? []).map((b: any) => ({ id: b.id, label: b.vendor_name, sublabel: "Booking", href: "/bookings", icon: ClipboardCheck })),
        ...(guests.data ?? []).map((g: any) => ({ id: g.id, label: g.full_name, sublabel: "Guest", href: "/guests", icon: Users })),
        ...(vendors.data ?? []).map((v: any) => ({ id: v.id, label: v.name, sublabel: "Vendor", href: "/vendors", icon: Store })),
      ];
      setResults(combined);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative max-w-md flex-1" ref={ref}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search tasks, vendors, guests…"
        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {query && (
        <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-border bg-card shadow-soft-lg">
          {loading && <p className="p-4 text-center text-xs text-muted-foreground">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">No matches for "{query}"</p>
          )}
          {!loading && results.map((r) => (
            <Link
              key={`${r.href}-${r.id}`}
              href={r.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-muted"
            >
              <r.icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
