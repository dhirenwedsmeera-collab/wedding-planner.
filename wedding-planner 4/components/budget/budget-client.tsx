"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { BudgetLine, Expense, WeddingEvent } from "@/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";

const COLORS = ["#0f7a56", "#1fa373", "#d18f1e", "#eec455", "#4a7c3f", "#e8ab30", "#0a4a37", "#c9a44d"];

export function BudgetClient({
  initialLines, initialExpenses, events, isAdmin,
}: { initialLines: BudgetLine[]; initialExpenses: Expense[]; events: WeddingEvent[]; isAdmin: boolean }) {
  const [lines] = useState(initialLines);
  const [expenses, setExpenses] = useState(initialExpenses);

  const totalPlanned = lines.reduce((s, l) => s + Number(l.planned_amount || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = totalPlanned - totalSpent;

  const byEvent = useMemo(() => {
    return events.map((e) => {
      const eventLines = lines.filter((l) => l.event_id === e.id);
      const planned = eventLines.reduce((s, l) => s + Number(l.planned_amount || 0), 0);
      const spent = expenses.filter((ex) => ex.event_id === e.id).reduce((s, ex) => s + Number(ex.amount || 0), 0);
      return { name: e.name, planned, spent };
    });
  }, [events, lines, expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const line = lines.find((l) => l.id === e.budget_line_id);
      const cat = line?.category ?? "Other";
      map.set(cat, (map.get(cat) ?? 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses, lines]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Planned</p><p className="font-display text-2xl font-semibold">{formatCurrency(totalPlanned)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Spent</p><p className="font-display text-2xl font-semibold">{formatCurrency(totalSpent)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Remaining</p><p className={`font-display text-2xl font-semibold ${remaining < 0 ? "text-red-600" : ""}`}>{formatCurrency(remaining)}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Planned vs. Spent by Event</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEvent}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="planned" fill="#a3ebc8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spent" fill="#0f7a56" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          <CardContent className="h-72">
            {byCategory.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No expenses logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Expense History</CardTitle>
          {isAdmin && <AddExpenseDialog lines={lines} events={events} onCreated={(e) => setExpenses((prev) => [e, ...prev])} />}
        </CardHeader>
        <CardContent className="space-y-2">
          {expenses.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No expenses recorded.</p>}
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{e.description}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(e.expense_date)}{e.paid_to ? ` · ${e.paid_to}` : ""}</p>
              </div>
              <p className="font-semibold">{formatCurrency(e.amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AddExpenseDialog({ lines, events, onCreated }: { lines: BudgetLine[]; events: WeddingEvent[]; onCreated: (e: Expense) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetLineId, setBudgetLineId] = useState(lines[0]?.id ?? "");
  const [paidTo, setPaidTo] = useState("");

  async function create() {
    const line = lines.find((l) => l.id === budgetLineId);
    const { data, error } = await supabase
      .from("expenses")
      .insert({ description, amount: Number(amount), budget_line_id: budgetLineId || null, event_id: line?.event_id ?? null, paid_to: paidTo || null })
      .select()
      .single();
    if (!error && data) onCreated(data as Expense);
    setOpen(false);
    setDescription(""); setAmount(""); setPaidTo("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Add expense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log an expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input type="number" className="input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input" value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)}>
            {lines.map((l) => {
              const ev = events.find((e) => e.id === l.event_id);
              return <option key={l.id} value={l.id}>{ev?.name} — {l.category}</option>;
            })}
          </select>
          <input className="input" placeholder="Paid to (vendor/store)" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
          <Button className="w-full" onClick={create}>Save expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
