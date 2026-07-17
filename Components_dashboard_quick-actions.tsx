"use client";

import Link from "next/link";
import { Plus, ClipboardCheck, Wallet, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";

const ACTIONS = [
  { href: "/tasks?new=1", label: "New Task", icon: Plus, tone: "bg-emerald-700" },
  { href: "/bookings?new=1", label: "Log Booking", icon: ClipboardCheck, tone: "bg-gold-600" },
  { href: "/budget?new=1", label: "Add Expense", icon: Wallet, tone: "bg-emerald-600" },
  { href: "/shopping?new=1", label: "Add Item", icon: ShoppingBag, tone: "bg-gold-500" },
];

export function QuickActions() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-3 text-center transition-colors hover:border-gold-400 hover:bg-muted"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.tone} text-white`}>
              <a.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium">{a.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
