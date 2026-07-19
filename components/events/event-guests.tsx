"use client";

import { useMemo, useState } from "react";
import { UserPlus, X, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Guest, RsvpStatus, GuestEventLink } from "@/types/domain";

const RSVP_BADGE: Record<RsvpStatus, "green" | "red" | "yellow" | "outline"> = {
  confirmed: "green", declined: "red", pending: "yellow", no_response: "outline",
};
const RSVP_LABEL: Record<RsvpStatus, string> = {
  confirmed: "Confirmed", declined: "Declined", pending: "Pending", no_response: "No response",
};
const RSVP_OPTIONS: RsvpStatus[] = ["pending", "confirmed", "declined", "no_response"];

export function EventGuests({
  eventId, allGuests, initialLinks, isAdmin,
}: { eventId: string; allGuests: Guest[]; initialLinks: GuestEventLink[]; isAdmin: boolean }) {
  const supabase = createClient();
  const [links, setLinks] = useState(initialLinks);

  const eventGuests = useMemo(
    () => links.map((l) => ({ link: l, guest: allGuests.find((g) => g.id === l.guest_id) })).filter((x) => x.guest),
    [links, allGuests]
  );
  const confirmedCount = links.filter((l) => l.rsvp_status === "confirmed").length;
  const linkedIds = new Set(links.map((l) => l.guest_id));

  async function unlink(guestId: string) {
    setLinks((prev) => prev.filter((l) => l.guest_id !== guestId));
    await supabase.from("guest_events").delete().eq("guest_id", guestId).eq("event_id", eventId);
  }

  async function link(guestId: string) {
    setLinks((prev) => [...prev, { guest_id: guestId, event_id: eventId, rsvp_status: "pending" }]);
    await supabase.from("guest_events").insert({ guest_id: guestId, event_id: eventId, rsvp_status: "pending" });
  }

  async function setRsvp(guestId: string, rsvp_status: RsvpStatus) {
    setLinks((prev) => prev.map((l) => (l.guest_id === guestId ? { ...l, rsvp_status } : l)));
    await supabase.from("guest_events").update({ rsvp_status }).eq("guest_id", guestId).eq("event_id", eventId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{confirmedCount} confirmed of {eventGuests.length} invited to this event</p>
        <AddGuestToEventDialog allGuests={allGuests} linkedIds={linkedIds} onLink={link} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {eventGuests.map(({ link, guest }) => (
          <Card key={guest!.id} className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{guest!.full_name}</p>
              <p className="text-xs capitalize text-muted-foreground">{guest!.side} side · {guest!.category}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <select
                  value={link.rsvp_status}
                  onChange={(e) => setRsvp(guest!.id, e.target.value as RsvpStatus)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                >
                  {RSVP_OPTIONS.map((s) => <option key={s} value={s}>{RSVP_LABEL[s]}</option>)}
                </select>
              ) : (
                <Badge variant={RSVP_BADGE[link.rsvp_status]}>{RSVP_LABEL[link.rsvp_status]}</Badge>
              )}
              <button onClick={() => unlink(guest!.id)} className="text-muted-foreground hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {eventGuests.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No guests linked to this event yet — add from the full guest list.
          </p>
        )}
      </div>
    </div>
  );
}

function AddGuestToEventDialog({
  allGuests, linkedIds, onLink,
}: { allGuests: Guest[]; linkedIds: Set<string>; onLink: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const available = allGuests.filter(
    (g) => !linkedIds.has(g.id) && g.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-3.5 w-3.5" /> Add guests</Button>
      </DialogTrigger>
      <DialogContent className="overflow-y-auto">
        <DialogHeader><DialogTitle>Add guests to this event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guest list…" className="input pl-9" />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {available.map((g) => (
              <button
                key={g.id}
                onClick={() => onLink(g.id)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <span>{g.full_name}</span>
                <span className="text-xs capitalize text-muted-foreground">{g.side}</span>
              </button>
            ))}
            {available.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {allGuests.length === 0 ? "No guests in your guest list yet — add some from the Guests page first." : "No matches."}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
