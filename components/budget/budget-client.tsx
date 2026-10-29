
"use client";

import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Plus, Save, Trash2, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { BudgetLine, Expense, WeddingEvent } from "@/types/domain";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { PrivateFileLink } from "@/components/ui/private-file-link";

type OverallBudget = {
  id: string;
  category: string;
  planned_amount: number;
  notes: string | null;
};

const DEFAULT_OVERALL_CATEGORIES = [
  "Venues", "Accommodation", "Decor", "Outfits", "Catering",
  "DJ / Entertainment",
] as const;

const COLORS = [
  "#0f7a56", "#1fa373", "#d18f1e", "#eec455",
  "#4a7c3f", "#e8ab30", "#0a4a37", "#c9a44d",
];

export function BudgetClient({
  initialLines,
  initialExpenses,
  events,
  isAdmin,
  initialOverallBudgets,
  eventCategories,
}: {
  initialLines: BudgetLine[];
  initialExpenses: Expense[];
  events: WeddingEvent[];
  isAdmin: boolean;
  initialOverallBudgets: OverallBudget[];
  eventCategories: Record<string, string[]>;
}) {
  const [lines, setLines] = useState(initialLines);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [overallBudgets, setOverallBudgets] = useState(initialOverallBudgets);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");
  const [newOverallCategory, setNewOverallCategory] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const overallCategories = Array.from(
    new Set([
      ...DEFAULT_OVERALL_CATEGORIES,
      ...overallBudgets.map((b) => b.category),
    ])
  ).sort((a, b) => {
    const ai = DEFAULT_OVERALL_CATEGORIES.indexOf(
      a as (typeof DEFAULT_OVERALL_CATEGORIES)[number]
    );
    const bi = DEFAULT_OVERALL_CATEGORIES.indexOf(
      b as (typeof DEFAULT_OVERALL_CATEGORIES)[number]
    );
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });

  const totalPlanned = overallBudgets.length
    ? overallBudgets.reduce((s, l) => s + Number(l.planned_amount || 0), 0)
    : lines.reduce((s, l) => s + Number(l.planned_amount || 0), 0);

  const totalSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0), 0
  );
  const remaining = totalPlanned - totalSpent;

  const byEvent = useMemo(() => {
    return events.map((e) => {
      const eventLines = lines.filter((l) => l.event_id === e.id);
      const planned = eventLines.reduce(
        (s, l) => s + Number(l.planned_amount || 0), 0
      );
      const spent = expenses
        .filter((ex) => ex.event_id === e.id)
        .reduce((s, ex) => s + Number(ex.amount || 0), 0);
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

  async function deleteExpense(expense: Expense) {
    if (
      !window.confirm(
        `Delete the expense "${expense.description}"? This cannot be undone.`
      )
    ) return;

    const previous = expenses;
    setExpenses((current) =>
      current.filter((item) => item.id !== expense.id)
    );

    const { data, error } = await createClient()
      .from("expenses")
      .delete()
      .eq("id", expense.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setExpenses(previous);
      window.alert(
        error
          ? `Couldn't delete expense: ${error.message}`
          : "The expense was not deleted. Your account may not have permission."
      );
    }
  }

  async function saveOverallBudgets() {
    setBudgetSaving(true);
    setBudgetMessage("");
    const supabase = createClient();
    const rows = overallCategories.map((category) => ({
      category,
      planned_amount: Number(
        overallBudgets.find((b) => b.category === category)?.planned_amount ?? 0
      ),
    }));
    const { error } = await supabase
      .from("overall_budget_lines")
      .upsert(rows, { onConflict: "category" });
    setBudgetSaving(false);
    setBudgetMessage(
      error ? `Could not save: ${error.message}` : "Overall budget saved."
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set your total planned amount for each major wedding category.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overallCategories.map((category) => {
              const item = overallBudgets.find((b) => b.category === category);
              return (
                <label key={category} className="space-y-1 text-sm font-medium">
                  <span>{category}</span>
                  <div className="flex items-center rounded-lg border border-border px-3">
                    <span className="text-muted-foreground">£</span>
                    <input
                      aria-label={`${category} budget`}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full bg-transparent p-2 outline-none"
                      value={item?.planned_amount ?? 0}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        setOverallBudgets((prev) =>
                          prev.some((b) => b.category === category)
                            ? prev.map((b) =>
                                b.category === category
                                  ? { ...b, planned_amount: Number(e.target.value) }
                                  : b
                              )
                            : [
                                ...prev,
                                {
                                  id: "",
                                  category,
                                  planned_amount: Number(e.target.value),
                                  notes: null,
                                },
                              ]
                        )
                      }
                    />
                  </div>
                </label>
              );
            })}
          </div>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                className="input max-w-xs"
                aria-label="New overall budget category"
                placeholder="New category (e.g. Wedding Planner)"
                value={newOverallCategory}
                onChange={(e) => setNewOverallCategory(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const category = newOverallCategory.trim();
                  if (!category) return;
                  if (
                    overallCategories.some(
                      (c) => c.toLowerCase() === category.toLowerCase()
                    )
                  ) {
                    setBudgetMessage("That category already exists.");
                    return;
                  }
                  setOverallBudgets((prev) => [
                    ...prev,
                    { id: "", category, planned_amount: 0, notes: null },
                  ]);
                  setNewOverallCategory("");
                  setBudgetMessage("Category added. Save the overall budget to keep it.");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add category
              </Button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-4 flex items-center gap-3">
              <Button disabled={budgetSaving} onClick={saveOverallBudgets}>
                <Save className="mr-2 h-4 w-4" />
                {budgetSaving ? "Saving…" : "Save overall budget"}
              </Button>
              {budgetMessage && (
                <p className="text-sm text-muted-foreground">{budgetMessage}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Planned</p>
          <p className="font-display text-2xl font-semibold">
            {formatCurrency(totalPlanned)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="font-display text-2xl font-semibold">
            {formatCurrency(totalSpent)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className={`font-display text-2xl font-semibold ${remaining < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(remaining)}
          </p>
        </Card>
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
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No expenses logged yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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
          <CardTitle>Expenses</CardTitle>
          {isAdmin && (
            <AddExpenseDialog
              lines={lines}
              setLines={setLines}
              events={events}
              eventCategories={eventCategories}
              onCreated={(e) => setExpenses((prev) => [e, ...prev])}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {expenses.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No expenses recorded.
            </p>
          )}

          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(e.expense_date)}
                  {e.paid_to ? ` · ${e.paid_to}` : ""}
                  {e.event_id
                    ? ` · ${events.find((ev) => ev.id === e.event_id)?.name ?? "Wedding event"}`
                    : " · No event assigned"}
                </p>
                {e.receipt_url && (
                  <div className="mt-1">
                    <PrivateFileLink value={e.receipt_url} label="View receipt" />
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <p className="font-semibold">{formatCurrency(e.amount)}</p>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit expense ${e.description}`}
                      onClick={() => setEditingExpense(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Delete expense ${e.description}`}
                      onClick={() => deleteExpense(e)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editingExpense && (
        <EditExpenseDialog
          key={editingExpense.id}
          expense={editingExpense}
          lines={lines}
          setLines={setLines}
          events={events}
          eventCategories={eventCategories}
          onClose={() => setEditingExpense(null)}
          onUpdated={(updated) => {
            setExpenses((current) =>
              current.map((item) => item.id === updated.id ? updated : item)
            );
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
}

function AddExpenseDialog({
  lines, setLines, events, eventCategories, onCreated,
}: {
  lines: BudgetLine[];
  setLines: (update: (prev: BudgetLine[]) => BudgetLine[]) => void;
  events: WeddingEvent[];
  eventCategories: Record<string, string[]>;
  onCreated: (e: Expense) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetLineId, setBudgetLineId] = useState(lines[0]?.id ?? "");
  const [category, setCategory] = useState("");
  const [eventId, setEventId] = useState("");
  const uniqueCategories = Array.from(new Set([
    ...(eventId ? (eventCategories[eventId] ?? []) : []),
    ...lines.filter((line) => !eventId || line.event_id === eventId).map((line) => line.category.trim()),
  ].filter(Boolean))).sort();
  const selectedCategory = category && uniqueCategories.includes(category)
    ? category : uniqueCategories[0] ?? "";
  const [paidTo, setPaidTo] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!description.trim() || !amount || Number(amount) < 0) {
      setErrorMessage("Enter a description and a valid amount.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    let line = lines.find((l) =>
      l.id === budgetLineId && l.category === selectedCategory &&
      (!eventId || l.event_id === eventId)
    );

    if (!line && selectedCategory) {
      const { data: createdLine, error: lineError } = await supabase
        .from("budget_lines")
        .insert({
          category: selectedCategory,
          event_id: eventId || null,
          planned_amount: 0,
        })
        .select("*")
        .single();

      if (lineError) {
        setErrorMessage(`Could not create budget category: ${lineError.message}`);
        setSaving(false);
        return;
      }
      line = createdLine as BudgetLine;
      setLines((prev) => [...prev, line!]);
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: description.trim(),
        amount: Number(amount),
        budget_line_id: line?.id ?? null,
        event_id: eventId || line?.event_id || null,
        paid_to: paidTo.trim() || null,
        receipt_url: receiptUrl,
      })
      .select()
      .single();

    setSaving(false);
    if (error || !data) {
      setErrorMessage(`Could not save expense: ${error?.message ?? "No record returned."}`);
      return;
    }

    onCreated(data as Expense);
    setOpen(false);
    setDescription("");
    setAmount("");
    setPaidTo("");
    setEventId("");
    setCategory("");
    setReceiptUrl(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log an expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input type="number" min="0" step="0.01" className="input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input" value={selectedCategory} onChange={(e) => { setCategory(e.target.value); setBudgetLineId(lines.find((line) => line.category.trim() === e.target.value && (!eventId || line.event_id === eventId))?.id ?? ""); }}>
            {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="block space-y-1 text-sm">Wedding event (optional)
            <select className="input" value={eventId} onChange={(e) => { setEventId(e.target.value); setCategory(""); setBudgetLineId(""); }}>
              <option value="">Choose event…</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </label>
          <input className="input" placeholder="Paid to (vendor/store)" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
          <div className="space-y-1">
            <p className="text-sm font-medium">Receipt (optional)</p>
            <FileUpload bucket="receipts" pathPrefix="expenses" value={receiptUrl} onChange={setReceiptUrl} label="Upload receipt image or PDF" accept="image/*,application/pdf" />
          </div>
          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
          <Button className="w-full" onClick={create} disabled={saving}>
            {saving ? "Saving…" : "Save expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditExpenseDialog({
  expense, lines, setLines, events, eventCategories, onClose, onUpdated,
}: {
  expense: Expense;
  lines: BudgetLine[];
  setLines: (update: (prev: BudgetLine[]) => BudgetLine[]) => void;
  events: WeddingEvent[];
  eventCategories: Record<string, string[]>;
  onClose: () => void;
  onUpdated: (expense: Expense) => void;
}) {
  const supabase = createClient();
  const existingLine = lines.find((line) => line.id === expense.budget_line_id);
  const [description, setDescription] = useState(expense.description ?? "");
  const [amount, setAmount] = useState(String(expense.amount ?? ""));
  const [eventId, setEventId] = useState(expense.event_id ?? "");
  const [category, setCategory] = useState(existingLine?.category ?? "");
  const [paidTo, setPaidTo] = useState(expense.paid_to ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(expense.receipt_url ?? null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = Array.from(new Set([
    ...(eventId ? (eventCategories[eventId] ?? []) : []),
    ...lines.filter((line) => !eventId || line.event_id === eventId).map((line) => line.category.trim()),
    ...(category ? [category] : []),
  ].filter(Boolean))).sort();

  async function save() {
    if (!description.trim() || !amount || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      setErrorMessage("Enter a description and a valid amount.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    let line = lines.find((l) =>
      l.category === category && (!eventId || l.event_id === eventId)
    );

    if (!line && category) {
      const { data, error } = await supabase
        .from("budget_lines")
        .insert({ category, event_id: eventId || null, planned_amount: 0 })
        .select("*")
        .single();

      if (error || !data) {
        setErrorMessage(`Could not save category: ${error?.message ?? "No record returned."}`);
        setSaving(false);
        return;
      }
      line = data as BudgetLine;
      setLines((current) => [...current, line!]);
    }

    const { data, error } = await supabase
      .from("expenses")
      .update({
        description: description.trim(),
        amount: Number(amount),
        budget_line_id: line?.id ?? null,
        event_id: eventId || line?.event_id || null,
        paid_to: paidTo.trim() || null,
        receipt_url: receiptUrl,
      })
      .eq("id", expense.id)
      .select()
      .maybeSingle();

    setSaving(false);

    if (error || !data) {
      setErrorMessage(
        error
          ? `Could not update expense: ${error.message}`
          : "The expense was not updated. Your account may not have permission to edit expenses."
      );
      return;
    }

    onUpdated(data as Expense);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">Description
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">Amount (£)
            <input type="number" min="0" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">Category
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm">Wedding event (optional)
            <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">No event assigned</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm">Paid to
            <input className="input" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Vendor/store" />
          </label>
          <div className="space-y-1">
            <p className="text-sm font-medium">Receipt (optional)</p>
            <FileUpload bucket="receipts" pathPrefix="expenses" value={receiptUrl} onChange={setReceiptUrl} label="Upload receipt image or PDF" accept="image/*,application/pdf" />
          </div>
          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
