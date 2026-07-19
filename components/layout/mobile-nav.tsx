"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the current tab scrolled into view when navigating, so it's
  // always obvious where you are even with 8 tabs in a scrollable strip.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex snap-x snap-mandatory items-stretch gap-0.5 overflow-x-auto px-1 py-1.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={active ? activeRef : undefined}
              className={cn(
                "flex shrink-0 snap-center flex-col items-center justify-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-colors min-w-[68px]",
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "text-muted-foreground active:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-emerald-700 dark:text-emerald-400")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
