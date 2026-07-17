"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Archive, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { WeddingEvent } from "@/types/domain";
import { EVENT_GRADIENTS, formatDate } from "@/lib/utils";

const THEMES = ["mehendi", "haldi", "nikah", "reception", "emerald"];

export function EventsClient({
  initialEvents, progressByEvent, isAdmin,
}: { initialEvents: WeddingEvent[]; progressByEvent: Record<string, number>; isAdmin: boolean }) {
  const [events, setEvents] = useState(initialEvents.filter((e) => !e.is_archived));
  const supabase = createClient();

  async function archive(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("events").update({ is_archived: true }).eq("id", id);
  }

  return (
    <div className="space-y-4">
      {isAdmin && <AddEventDialog onCreated={(e) => setEvents((prev) => [...prev, e])} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {events.map((e) => (
            <motion.div key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="gold-hover overflow-hidden">
                <div className={`relative h-28 p-4 text-white ${EVENT_GRADIENTS[e.color_theme] ?? EVENT_GRADIENTS.emerald}`}>
                  <p className="font-display text-xl font-semibold">{e.name}</p>
                  <p className="text-xs text-white/85">{formatDate(e.event_date)}{e.venue ? ` · ${e.venue}` : ""}</p>
                  {isAdmin && (
                    <button onClick={() => archive(e.id)} className="absolute right-3 top-3 rounded-lg bg-white/15 p-1.5 hover:bg-white/25">
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {e.description && <p className="mb-3 text-sm text-muted-foreground">{e.description}</p>}
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{progressByEvent[e.id] ?? 0}%</span>
                  </div>
                  <ProgressBar value={progressByEvent[e.id] ?? 0} height="h-2" />
                  <Link href={`/events/${e.slug}`} className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted">
                    Open <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AddEventDialog({ onCreated }: { onCreated: (e: WeddingEvent) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [theme, setTheme] = useState("emerald");

  async function create() {
    if (!name.trim()) return;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase
      .from("events")
      .insert({ name, slug, event_date: date || null, venue: venue || null, color_theme: theme })
      .select()
      .single();
    if (!error && data) onCreated(data as WeddingEvent);
    setOpen(false);
    setName(""); setDate(""); setVenue("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add event</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New wedding event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="e.g. Sangeet" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" placeholder="Venue (optional)" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button className="w-full" onClick={create}>Create event</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
