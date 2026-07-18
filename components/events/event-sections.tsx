"use client";

import { useState } from "react";
import { Plus, Check, Trash2, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { EventSection, EventSectionItem, Profile } from "@/types/domain";

export function AddSectionDialog({ eventId, onCreated }: { eventId: string; onCreated: (s: EventSection) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function create() {
    if (!name.trim()) return;
    const { data, error } = await supabase
      .from("event_sections")
      .insert({ event_id: eventId, name, sort_order: 100 })
      .select()
      .single();
    if (!error && data) onCreated(data as EventSection);
    setOpen(false);
    setName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-gold-400 hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add tab
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a custom tab</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            e.g. "Photography Shot List", "Transport", "Sound & Lighting" — anything you want a
            checklist for on this event.
          </p>
          <input className="input" placeholder="Tab name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button className="w-full" onClick={create}>Create tab</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventSectionPanel({
  section, items: initialItems, profiles, isAdmin, currentUserId, onDeleted,
}: {
  section: EventSection; items: EventSectionItem[]; profiles: Profile[]; isAdmin: boolean;
  currentUserId: string | null; onDeleted: () => void;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const sortedCount = items.filter((i) => i.status === "sorted").length;

  async function toggle(item: EventSectionItem) {
    const newStatus = item.status === "sorted" ? "needed" : "sorted";
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
    await supabase.from("event_section_items").update({ status: newStatus }).eq("id", item.id);
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("event_section_items").delete().eq("id", id);
  }

  async function deleteSection() {
    if (!confirm(`Delete the "${section.name}" tab and everything in it?`)) return;
    await supabase.from("event_sections").delete().eq("id", section.id);
    onDeleted();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sortedCount} of {items.length} sorted</p>
        <div className="flex items-center gap-2">
          <AddSectionItemDialog sectionId={section.id} profiles={profiles} onCreated={(i) => setItems((prev) => [i, ...prev])} />
          {isAdmin && (
            <button onClick={deleteSection} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-red-300 hover:text-red-600">
              <Settings2 className="h-3.5 w-3.5" /> Delete tab
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const assignee = profiles.find((p) => p.id === item.assigned_to);
          const canEdit = isAdmin || item.assigned_to === currentUserId || item.created_by === currentUserId;
          return (
            <Card key={item.id} className={item.status === "sorted" ? "opacity-70" : ""}>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  {(item.notes || assignee) && (
                    <p className="text-xs text-muted-foreground">{[assignee?.full_name, item.notes].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggle(item)}
                    disabled={!canEdit}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 disabled:opacity-40 ${item.status === "sorted" ? "border-emerald-600 bg-emerald-600 text-white" : "border-border"}`}
                  >
                    {item.status === "sorted" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {canEdit && (
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

function AddSectionItemDialog({
  sectionId, profiles, onCreated,
}: { sectionId: string; profiles: Profile[]; onCreated: (i: EventSectionItem) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  async function create() {
    if (!label.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("event_section_items")
      .insert({ section_id: sectionId, label, assigned_to: assignedTo || null, notes: notes || null, created_by: user?.id })
      .select()
      .single();
    if (!error && data) onCreated(data as EventSectionItem);
    setOpen(false);
    setLabel(""); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="e.g. Book uplighting" value={label} onChange={(e) => setLabel(e.target.value)} />
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <input className="input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="w-full" onClick={create}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
