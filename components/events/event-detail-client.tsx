"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { WeddingEvent, Task, ShoppingItem, BudgetLine, Expense } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";
import { formatCurrency, formatDate, getTaskUrgency, URGENCY_STYLES } from "@/lib/utils";

const TABS = ["Overview", "Tasks", "Budget", "Shopping", "Notes"] as const;

export function EventDetailClient({
  event, tasks, shopping, budgetLines, expenses, notes,
}: {
  event: WeddingEvent; tasks: Task[]; shopping: ShoppingItem[];
  budgetLines: BudgetLine[]; expenses: Expense[]; notes: any[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const planned = budgetLines.reduce((s, b) => s + Number(b.planned_amount || 0), 0);
  const spent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const purchased = shopping.filter((s) => s.is_purchased).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Link href="/events" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <div className={`rounded-2xl p-6 text-white lg:p-8 ${EVENT_GRADIENTS[event.color_theme] ?? EVENT_GRADIENTS.emerald}`}>
        <h1 className="font-display text-3xl font-semibold">{event.name}</h1>
        <p className="mt-1 text-sm text-white/85">{formatDate(event.event_date)}{event.venue ? ` · ${event.venue}` : ""}</p>
        <div className="mt-4 max-w-xs">
          <div className="mb-1 flex justify-between text-xs"><span>Overall progress</span><span className="font-semibold">{pct}%</span></div>
          <ProgressBar value={pct} height="h-2" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${tab === t ? "border-emerald-700 bg-emerald-700 text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Tasks</p><p className="font-display text-2xl font-semibold">{completed}/{tasks.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Budget</p><p className="font-display text-2xl font-semibold">{formatCurrency(spent)} <span className="text-sm text-muted-foreground">/ {formatCurrency(planned)}</span></p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Shopping</p><p className="font-display text-2xl font-semibold">{purchased}/{shopping.length}</p></Card>
        </div>
      )}

      {tab === "Tasks" && (
        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet for this event — add some from the Tasks page.</p>}
          {tasks.map((t) => {
            const urgency = getTaskUrgency(t.due_date, t.status);
            const style = URGENCY_STYLES[urgency];
            return (
              <Card key={t.id} className={`border-l-4 p-3 ${style.border}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.name}</p>
                  <Badge>{t.status.replace("_", " ")}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Budget" && (
        <div className="space-y-2">
          {budgetLines.map((b) => {
            const lineSpent = expenses.filter((e) => e.budget_line_id === b.id).reduce((s, e) => s + Number(e.amount), 0);
            return (
              <Card key={b.id} className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span>{formatCurrency(lineSpent)} / {formatCurrency(b.planned_amount)}</span>
                </div>
                <ProgressBar value={b.planned_amount > 0 ? Math.min(100, (lineSpent / b.planned_amount) * 100) : 0} height="h-1.5" className="mt-2" />
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Shopping" && (
        <div className="space-y-2">
          {shopping.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category} · Qty {s.quantity}</p>
              </div>
              <Badge variant={s.is_purchased ? "green" : "yellow"}>{s.is_purchased ? "Purchased" : "Pending"}</Badge>
            </Card>
          ))}
          {shopping.length === 0 && <p className="text-sm text-muted-foreground">No shopping items linked to this event yet.</p>}
        </div>
      )}

      {tab === "Notes" && (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} className="p-3"><p className="text-sm">{n.body}</p></Card>
          ))}
          {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        </div>
      )}
    </div>
  );
}
