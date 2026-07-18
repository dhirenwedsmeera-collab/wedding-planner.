"use client";

import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingItem, Profile } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export function EventCategoryList({
  eventId, category, items: initialItems, profiles, isAdmin, currentUserId,
}: {
  eventId: string; category: string; items: ShoppingItem[]; profiles: Profile[]; isAdmin: boolean; currentUserId: string | null;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const sortedCount = items.filter((i) => i.is_purchased).length;

  async function toggle(item: ShoppingItem) {
    if (!isAdmin && item.assigned_to !== currentUserId) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i)));
    await supabase.from("shopping_items").update({ is_purchased: !item.is_purchased }).eq("id", item.id);
  }

  async function remove(id: string) {
    if (!isAdmin) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sortedCount} of {items.length} sorted</p>
        <AddCategoryItemDialog eventId={eventId} category={category} profiles={profiles} onCreated={(i) => setItems((prev) => [i, ...prev])} />
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const assignee = profiles.find((p) => p.id === item.assigned_to);
          return (
            <Card key={item.id} className={item.is_purchased ? "opacity-70" : ""}>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.actual_price ?? item.budget)}{item.store ? ` · ${item.store}` : ""}{assignee ? ` · ${assignee.full_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggle(item)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${item.is_purchased ? "border-emerald-600 bg-emerald-600 text-white" : "border-border"}`}
                  >
                    {item.is_purchased && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {isAdmin && (
                    <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nothing added yet.</p>}
      </div>
    </div>
  );
}

function AddCategoryItemDialog({
  eventId, category, profiles, onCreated,
}: { eventId: string; category: string; profiles: Profile[]; onCreated: (i: ShoppingItem) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function create() {
    if (!name.trim()) return;
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({ name, category, event_id: eventId, budget: Number(budget || 0), assigned_to: assignedTo || null })
      .select()
      .single();
    if (!error && data) onCreated(data as ShoppingItem);
    setOpen(false);
    setName(""); setBudget("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add to {category}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" className="input" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <Button className="w-full" onClick={create}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
