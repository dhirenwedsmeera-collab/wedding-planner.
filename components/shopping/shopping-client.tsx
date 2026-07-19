"use client";

import { useMemo, useState } from "react";
import { Plus, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingItem, WeddingEvent, Profile } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export function ShoppingClient({
  initialItems, events, profiles, categories, currentUserId, isAdmin,
}: {
  initialItems: ShoppingItem[]; events: WeddingEvent[]; profiles: Profile[];
  categories: string[]; currentUserId: string | null; isAdmin: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const supabase = createClient();

  const filtered = useMemo(
    () => (categoryFilter === "all" ? items : items.filter((i) => i.category === categoryFilter)),
    [items, categoryFilter]
  );

  const totalBudget = items.reduce((s, i) => s + Number(i.budget || 0), 0);
  const totalActual = items.reduce((s, i) => s + Number(i.actual_price || 0), 0);
  const purchasedCount = items.filter((i) => i.is_purchased).length;

  async function togglePurchased(item: ShoppingItem) {
    if (!isAdmin && item.assigned_to !== currentUserId) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i)));
    await supabase.from("shopping_items").update({ is_purchased: !item.is_purchased }).eq("id", item.id);
  }

  async function updateItem(item: ShoppingItem, patch: Partial<ShoppingItem>) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    await supabase.from("shopping_items").update(patch).eq("id", item.id);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Items purchased</p><p className="font-display text-2xl font-semibold">{purchasedCount}/{items.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Budgeted</p><p className="font-display text-2xl font-semibold">{formatCurrency(totalBudget)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Actual spend</p><p className="font-display text-2xl font-semibold">{formatCurrency(totalActual)}</p></Card>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setCategoryFilter("all")} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${categoryFilter === "all" ? "border-emerald-700 bg-emerald-700 text-white" : "border-border text-muted-foreground"}`}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${categoryFilter === c ? "border-emerald-700 bg-emerald-700 text-white" : "border-border text-muted-foreground"}`}>{c}</button>
        ))}
        {isAdmin && <AddItemDialog events={events} profiles={profiles} categories={categories} onCreated={(i) => setItems((prev) => [i, ...prev])} />}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const assignee = profiles.find((p) => p.id === item.assigned_to);
          const canEditItem = isAdmin || item.assigned_to === currentUserId;
          return (
            <ItemDetailDialog key={item.id} item={item} assignee={assignee} canEdit={canEditItem} onSaved={(patch) => updateItem(item, patch)}>
              <Card className={`cursor-pointer gold-hover ${item.is_purchased ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · Qty {item.quantity}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePurchased(item); }}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${item.is_purchased ? "border-emerald-600 bg-emerald-600 text-white" : "border-border"}`}
                    >
                      {item.is_purchased && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatCurrency(item.actual_price ?? item.budget)}{item.store ? ` · ${item.store}` : ""}</span>
                    {assignee && <Badge variant="outline">{assignee.full_name}</Badge>}
                  </div>
                </CardContent>
              </Card>
            </ItemDetailDialog>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No items in this category yet.</p>}
      </div>
    </div>
  );
}

function ItemDetailDialog({
  item, assignee, canEdit, onSaved, children,
}: { item: ShoppingItem; assignee?: Profile; canEdit: boolean; onSaved: (patch: Partial<ShoppingItem>) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [actualPrice, setActualPrice] = useState(item.actual_price?.toString() ?? "");
  const [store, setStore] = useState(item.store ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(item.receipt_url);

  function save() {
    onSaved({ actual_price: actualPrice ? Number(actualPrice) : null, store, receipt_url: receiptUrl });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{item.category}</Badge>
            <Badge variant="outline">Qty {item.quantity}</Badge>
            <Badge variant="outline">Budget {formatCurrency(item.budget)}</Badge>
            {assignee && <Badge variant="outline">{assignee.full_name}</Badge>}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Actual price paid</span>
            <input type="number" disabled={!canEdit} className="input disabled:opacity-60" value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Store</span>
            <input disabled={!canEdit} className="input disabled:opacity-60" value={store} onChange={(e) => setStore(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Receipt</span>
            {canEdit ? (
              <FileUpload bucket="receipts" pathPrefix={item.id} value={receiptUrl} onChange={setReceiptUrl} label="Upload receipt" />
            ) : receiptUrl ? (
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 hover:underline dark:text-emerald-400">View receipt</a>
            ) : (
              <p className="text-xs text-muted-foreground">No receipt uploaded.</p>
            )}
          </label>
          {canEdit && <Button className="w-full" onClick={save}>Save</Button>}
          {!canEdit && <p className="text-center text-xs text-muted-foreground">Only the assigned person or admin can edit this item.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddItemDialog({ events, profiles, categories, onCreated }: { events: WeddingEvent[]; profiles: Profile[]; categories: string[]; onCreated: (i: ShoppingItem) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [budget, setBudget] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function create() {
    if (!name.trim()) return;
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({ name, category, event_id: eventId || null, budget: Number(budget || 0), assigned_to: assignedTo || null })
      .select()
      .single();
    if (!error && data) onCreated(data as ShoppingItem);
    setOpen(false);
    setName(""); setBudget("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="ml-auto shrink-0 whitespace-nowrap"><Plus className="h-3.5 w-3.5" /> Add item</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add shopping item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <input type="number" className="input" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <Button className="w-full" onClick={create}>Add item</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
