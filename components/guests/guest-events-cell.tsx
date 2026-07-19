"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { WeddingEvent, GuestEventLink, RsvpStatus } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";

const RSVP_BADGE: Record<RsvpStatus, "green" | "red" | "yellow" | "outline"> = {
  confirmed: "green", declined: "red", pending: "yellow", no_response: "outline",
};
const RSVP_LABEL: Record<RsvpStatus, string> = {
  confirmed: "Confirmed", declined: "Declined", pending: "Pending", no_response: "No response",
};
const RSVP_OPTIONS: RsvpStatus[] = ["pending", "confirmed", "declined", "no_response"];

export function GuestEventsCell({
  guestId, guestName, events, links, onChange, isAdmin,
}: {
  guestId: string; guestName: string; events: WeddingEvent[]; links: GuestEventLink[];
  onChange: (links: GuestEventLink[]) => void; isAdmin: boolean;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const linkedEvents = events.filter((e) => links.some((l) => l.event_id === e.id));

  async function link(eventId: string) {
    const next = [...links, { guest_id: guestId, event_id: eventId, rsvp_status: "pending" as RsvpStatus }];
    onChange(next);
    await supabase.from("guest_events").insert({ guest_id: guestId, event_id: eventId, rsvp_status: "pending" });
  }

  async function unlink(eventId: string) {
    onChange(links.filter((l) => l.event_id !== eventId));
    await supabase.from("guest_events").delete().eq("guest_id", guestId).eq("event_id", eventId);
  }

  async function setRsvp(eventId: string, rsvp_status: RsvpStatus) {
    onChange(links.map((l) => (l.event_id === eventId ? { ...l, rsvp_status } : l)));
    await supabase.from("guest_events").update({ rsvp_status }).eq("guest_id", guestId).eq("event_id", eventId);
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
          {linkedEvents.slice(0, 2).map((e) => {
            const link = links.find((l) => l.event_id === e.id)!;
            return (
              <Badge key={e.id} variant={RSVP_BADGE[link.rsvp_status]}>{e.name}</Badge>
            );
          })}
          {linkedEvents.length > 2 && (
            <span className="text-[11px] text-muted-foreground">+{linkedEvents.length - 2} more</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="overflow-y-auto">
        <DialogHeader><DialogTitle>{guestName} — RSVP by event</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {events.map((e) => {
            const link = links.find((l) => l.event_id === e.id);
            const gradient = EVENT_GRADIENTS[e.color_theme] ?? EVENT_GRADIENTS.emerald;
            return (
              <div key={e.id} className={`rounded-xl border px-3 py-2.5 ${link ? "border-emerald-200 dark:border-emerald-900" : "border-border"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-6 w-6 shrink-0 rounded-lg ${gradient}`} />
                    <span className="truncate text-sm font-medium">{e.name}</span>
                  </div>
                  {link ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isAdmin ? (
                        <>
                          <select
                            value={link.rsvp_status}
                            onChange={(ev) => setRsvp(e.id, ev.target.value as RsvpStatus)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                          >
                            {RSVP_OPTIONS.map((s) => <option key={s} value={s}>{RSVP_LABEL[s]}</option>)}
                          </select>
                          <button onClick={() => unlink(e.id)} className="text-[11px] text-muted-foreground hover:text-red-600">Remove</button>
                        </>
                      ) : (
                        <Badge variant={RSVP_BADGE[link.rsvp_status]}>{RSVP_LABEL[link.rsvp_status]}</Badge>
                      )}
                    </div>
                  ) : (
                    isAdmin && (
                      <button onClick={() => link(e.id)} className="shrink-0 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-gold-400 hover:text-foreground">
                        Invite
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No active events yet — add some from the Events page.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
