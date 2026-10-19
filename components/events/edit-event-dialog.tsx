"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { WeddingEvent } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";

const THEMES: { value: string; label: string }[] = [
  { value: "mehendi", label: "Mehendi (henna green)" },
  { value: "haldi", label: "Haldi (marigold yellow)" },
  { value: "nikah", label: "Nikah (emerald/gold)" },
  { value: "reception", label: "Reception (champagne)" },
  { value: "emerald", label: "Classic emerald/gold" },
];

export function EditEventDialog({
  event, onSaved, trigger,
}: { event: WeddingEvent; onSaved: (patch: Partial<WeddingEvent>) => void; trigger?: React.ReactNode }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    event_date: event.event_date ?? "",
    event_time: event.event_time ?? "",
    venue: event.venue ?? "",
    description: event.description ?? "",
    color_theme: event.color_theme,
    color_primary: event.color_primary ?? "#166534",
    color_secondary: event.color_secondary ?? "#f7f3e8",
    color_accent: event.color_accent ?? "#d4a72c",
  });

  async function save() {
    if (!form.name.trim()) return;
    const patch = {
      name: form.name,
      event_date: form.event_date || null,
      event_time: form.event_time || null,
      venue: form.venue || null,
      description: form.description || null,
      color_theme: form.color_theme,
      color_primary: form.color_primary,
      color_secondary: form.color_secondary,
      color_accent: form.color_accent,
    };
    onSaved(patch);
    setOpen(false);
    await supabase.from("events").update(patch).eq("id", event.id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {event.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Event name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
              <input type="date" className="input" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Time</span>
              <input type="time" className="input" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Venue</span>
            <input className="input" placeholder="Venue (optional)" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Description / notes</span>
            <textarea className="input" rows={3} placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="space-y-3 rounded-xl border border-border p-3">
            <div>
              <span className="block text-sm font-medium">Event colours</span>
              <span className="text-xs text-muted-foreground">Choose colours just for this event.</span>
            </div>
            {([
              ["color_primary", "Primary colour"],
              ["color_secondary", "Background colour"],
              ["color_accent", "Accent colour"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{form[key].toUpperCase()}</span>
                  <input
                    aria-label={label}
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </span>
              </label>
            ))}
            <div className="rounded-lg p-4 text-sm font-medium" style={{ background: form.color_secondary, color: form.color_primary, border: `2px solid ${form.color_accent}` }}>
              Theme preview · {event.name}
              <div className="mt-2 inline-block rounded-full px-3 py-1 text-xs text-white" style={{ background: form.color_primary }}>
                Accent button
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={save}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
