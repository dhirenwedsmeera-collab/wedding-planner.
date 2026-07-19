"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { WeddingEvent } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";

export function GuestEventsCell({
  guestId, guestName, events, linkedEventIds, onChange,
}: {
  guestId: string; guestName: string; events: WeddingEvent[]; linkedEventIds: string[];
  onChange: (eventIds: string[]) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const linkedEvents = events.filter((e) => linkedEventIds.includes(e.id));

  async function toggle(eventId: string) {
    const isLinked = linkedEventIds.includes(eventId);
    const next = isLinked ? linkedEventIds.filter((id) => id !== eventId) : [...linkedEventIds, eventId];
    onChange(next);
    if (isLinked) {
      await supabase.from("guest_events").delete().eq("guest_id", guestId).eq("event_id", eventId);
    } else {
      await supabase.from("guest_events").insert({ guest_id: guestId, event_id: eventId });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-wrap items-center gap-1 text-left">
          {linkedEvents.length === 0 && (
            <span className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-gold-400 hover:text-foreground">
              <Plus className="h-3 w-3" /> Add events
            </span>
          )}
          {linkedEvents.slice(0, 2).map((e) => (
            <Badge key={e.id} variant="outline">{e.name}</Badge>
          ))}
          {linkedEvents.length > 2 && (
            <span className="text-[11px] text-muted-foreground">+{linkedEvents.length - 2} more</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{guestName} — events invited to</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {events.map((e) => {
            const isLinked = linkedEventIds.includes(e.id);
            const gradient = EVENT_GRADIENTS[e.color_theme] ?? EVENT_GRADIENTS.emerald;
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${isLinked ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-border hover:bg-muted"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-6 w-6 rounded-lg ${gradient}`} />
                  <span className="text-sm font-medium">{e.name}</span>
                </div>
                {isLinked && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
          {events.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No active events yet — add some from the Events page.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
