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

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Colour theme</span>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((t) => {
                const gradient = EVENT_GRADIENTS[t.value] ?? EVENT_GRADIENTS.emerald;
                const selected = form.color_theme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, color_theme: t.value })}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${selected ? "border-emerald-600" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`h-6 w-10 rounded-lg ${gradient}`} />
                      <span className="text-sm">{t.label}</span>
                    </div>
                    {selected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" onClick={save}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
