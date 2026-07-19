"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Guest, GuestCategory, WeddingSide, RsvpStatus, WeddingEvent, GuestEventLink } from "@/types/domain";
import { whatsappLink } from "@/lib/utils";
import { GuestEventsCell } from "@/components/guests/guest-events-cell";

const RSVP_COLOR: Record<RsvpStatus, "green" | "red" | "yellow" | "outline"> = {
  confirmed: "green", declined: "red", pending: "yellow", no_response: "outline",
};

export function GuestsClient({
  initialGuests, events, initialGuestEvents, isAdmin,
}: {
  initialGuests: Guest[]; events: WeddingEvent[];
  initialGuestEvents: GuestEventLink[]; isAdmin: boolean;
}) {
  const [guests, setGuests] = useState(initialGuests);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | WeddingSide>("all");
  const [guestEventMap, setGuestEventMap] = useState<Record<string, GuestEventLink[]>>(() => {
    const map: Record<string, GuestEventLink[]> = {};
    initialGuestEvents.forEach((ge) => {
      map[ge.guest_id] = [...(map[ge.guest_id] ?? []), ge];
    });
    return map;
  });
  const supabase = createClient();

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch = g.full_name.toLowerCase().includes(search.toLowerCase());
      const matchesSide = sideFilter === "all" || g.side === sideFilter;
      return matchesSearch && matchesSide;
    });
  }, [guests, search, sideFilter]);

  const confirmed = guests.filter((g) => g.rsvp_status === "confirmed").length;

  async function updateRsvp(id: string, rsvp_status: RsvpStatus) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, rsvp_status } : g)));
    await supabase.from("guests").update({ rsvp_status }).eq("id", id);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total guests</p><p className="font-display text-2xl font-semibold">{guests.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Confirmed</p><p className="font-display text-2xl font-semibold">{confirmed}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Invitations sent</p><p className="font-display text-2xl font-semibold">{guests.filter((g) => g.invitation_sent).length}</p></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests…" className="input pl-9" />
        </div>
        {(["all", "bride", "groom", "both"] as const).map((s) => (
          <button key={s} onClick={() => setSideFilter(s)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${sideFilter === s ? "border-emerald-700 bg-emerald-700 text-white" : "border-border text-muted-foreground"}`}>{s}</button>
        ))}
        {isAdmin && <AddGuestDialog onCreated={(g) => setGuests((prev) => [...prev, g])} />}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">RSVP</th>
              <th className="px-4 py-3">Events</th>
              <th className="px-4 py-3">Food</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{g.full_name}</td>
                <td className="px-4 py-3 capitalize">{g.category}</td>
                <td className="px-4 py-3 capitalize">{g.side}</td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select value={g.rsvp_status} onChange={(e) => updateRsvp(g.id, e.target.value as RsvpStatus)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="no_response">No response</option>
                    </select>
                  ) : (
                    <Badge variant={RSVP_COLOR[g.rsvp_status]}>{g.rsvp_status.replace("_", " ")}</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <GuestEventsCell
                    guestId={g.id}
                    guestName={g.full_name}
                    events={events}
                    links={guestEventMap[g.id] ?? []}
                    onChange={(links) => setGuestEventMap((prev) => ({ ...prev, [g.id]: links }))}
                    isAdmin={isAdmin}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{g.food_preference ?? "—"}</td>
                <td className="px-4 py-3">
                  {g.phone && (
                    <a href={whatsappLink(g.phone)} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No guests match your search.</p>}
      </Card>
    </div>
  );
}

function AddGuestDialog({ onCreated }: { onCreated: (g: Guest) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GuestCategory>("family");
  const [side, setSide] = useState<WeddingSide>("both");
  const [phone, setPhone] = useState("");

  async function create() {
    if (!name.trim()) return;
    const { data, error } = await supabase.from("guests").insert({ full_name: name, category, side, phone: phone || null }).select().single();
    if (!error && data) onCreated(data as Guest);
    setOpen(false);
    setName(""); setPhone("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="ml-auto"><Plus className="h-3.5 w-3.5" /> Add guest</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add guest</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as GuestCategory)}>
              <option value="family">Family</option><option value="friend">Friend</option><option value="vip">VIP</option>
            </select>
            <select className="input" value={side} onChange={(e) => setSide(e.target.value as WeddingSide)}>
              <option value="bride">Bride</option><option value="groom">Groom</option><option value="both">Both</option>
            </select>
          </div>
          <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button className="w-full" onClick={create}>Add guest</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
