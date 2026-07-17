"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListChecks, CalendarHeart, ClipboardCheck,
  Wallet, ShoppingBag, Users, Store, Sparkles, Sun, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarHeart },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Store },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 p-4 lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-gold text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Dhiren &amp; Meera</p>
          <p className="text-[11px] text-muted-foreground">Jul 26, 2027</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-700 text-white shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </aside>
  );
}
