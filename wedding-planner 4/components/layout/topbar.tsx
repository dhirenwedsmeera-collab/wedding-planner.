"use client";

import { Search, Bell } from "lucide-react";
import type { Profile } from "@/types/domain";
import { initials } from "@/lib/utils";

export function Topbar({ profile, unreadCount = 0 }: { profile: Profile | null; unreadCount?: number }) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-card/60 px-4 py-3 lg:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search tasks, vendors, guests…"
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-full p-2 hover:bg-muted">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-gold text-xs font-semibold text-white">
            {profile ? initials(profile.full_name) : "?"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">{profile?.full_name ?? "Guest"}</p>
            <p className="text-[11px] capitalize text-muted-foreground">{profile?.role ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
