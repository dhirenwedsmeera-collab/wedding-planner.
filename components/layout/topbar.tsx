"use client";

import type { Profile } from "@/types/domain";
import { initials } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function Topbar({ profile, notifications = [] }: { profile: Profile | null; notifications?: Notification[] }) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-card/60 px-4 py-3 lg:px-6">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell initialNotifications={notifications} />
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
