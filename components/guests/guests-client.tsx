"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Phone, Pencil } from "lucide-react";
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
  const [sideFilter, setSideFilter] = useState<"all" | "bride" | "groom">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | GuestCategory>("all");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | RsvpStatus>("all");
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
      const matchesCategory = categoryFilter === "all" || g.category === categoryFilter;
      const matchesRsvp = rsvpFilter === "all" || g.rsvp_status === rsvpFilter;
      return matchesSearch && matchesSide && matchesCategory && matchesRsvp;
    });
  }, [guests, search, sideFilter, categoryFilter, rsvpFilter]);

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
        <select aria-label="Filter by side" value={sideFilter} onChange={(e) => setSideFilter(e.target.value as typeof sideFilter)} className="input w-auto py-1.5 text-xs">
          <option value="all">All sides</option><option value="bride">Bride</option><option value="groom">Groom</option>
        </select>
        <select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)} className="input w-auto py-1.5 text-xs">
          <option value="all">All categories</option><option value="family">Family</option><option value="friend">Friend</option><option value="vip">VIP</option>
        </select>
        <select aria-label="Filter by RSVP" value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value as typeof rsvpFilter)} className="input w-auto py-1.5 text-xs">
          <option value="all">All RSVP statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="no_response">No response</option>
        </select>
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
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{g.full_name}</span>
                    {isAdmin && <EditGuestDialog guest={g} onUpdated={(updated) => setGuests((prev) => prev.map((item) => item.id === updated.id ? updated : item))} />}
                  </div>
                </td>
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

function EditGuestDialog({ guest, onUpdated }: { guest: Guest; onUpdated: (g: Guest) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(guest.full_name);
  const [category, setCategory] = useState<GuestCategory>(guest.category);
  const [side, setSide] = useState<WeddingSide>(guest.side);
  const [phone, setPhone] = useState(guest.phone ?? "");
  const [email, setEmail] = useState(guest.email ?? "");
  const [rsvp, setRsvp] = useState<RsvpStatus>(guest.rsvp_status);
  const [food, setFood] = useState(guest.food_preference ?? "");
  const [plusOnes, setPlusOnes] = useState(String(guest.plus_ones ?? 0));
  const [notes, setNotes] = useState(guest.notes ?? "");
  const [invitationSent, setInvitationSent] = useState(guest.invitation_sent);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const changes = {
      full_name: name.trim(), category, side, phone: phone.trim() || null,
      email: email.trim() || null, rsvp_status: rsvp, food_preference: food.trim() || null,
      plus_ones: Math.max(0, Number.parseInt(plusOnes, 10) || 0), notes: notes.trim() || null,
      invitation_sent: invitationSent,
    };
    const { error } = await supabase.from("guests").update(changes).eq("id", guest.id);
    setSaving(false);
    if (error) {
      alert(`Couldn't save guest details: ${error.message}`);
      return;
    }
    onUpdated({ ...guest, ...changes });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button type="button" aria-label={`Edit ${guest.full_name}`} title="Edit guest" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit guest details</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">Full name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Category<select className="input" value={category} onChange={(e) => setCategory(e.target.value as GuestCategory)}><option value="family">Family</option><option value="friend">Friend</option><option value="vip">VIP</option></select></label>
          <label className="space-y-1 text-xs text-muted-foreground">Side<select className="input" value={side} onChange={(e) => setSide(e.target.value as WeddingSide)}><option value="bride">Bride</option><option value="groom">Groom</option><option value="both">Both</option></select></label>
          <label className="space-y-1 text-xs text-muted-foreground">Phone<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Email<input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">RSVP status<select className="input" value={rsvp} onChange={(e) => setRsvp(e.target.value as RsvpStatus)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="no_response">No response</option></select></label>
          <label className="space-y-1 text-xs text-muted-foreground">Food preference<input className="input" value={food} onChange={(e) => setFood(e.target.value)} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Plus ones<input type="number" min="0" className="input" value={plusOnes} onChange={(e) => setPlusOnes(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2"><input type="checkbox" checked={invitationSent} onChange={(e) => setInvitationSent(e.target.checked)} /> Invitation sent</label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">Notes<textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <Button className="w-full sm:col-span-2" onClick={save} disabled={saving || !name.trim()}>{saving ? "Saving..." : "Save guest details"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddGuestDialog({ onCreated }: { onCreated: (g: Guest) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GuestCategory>("family");
  const [side, setSide] = useState<WeddingSide>("both");
  const [phone, setPhone] = useState("");
  const [food, setFood] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("guests")
      .insert({
        full_name: name.trim(),
        category,
        side,
        phone: phone.trim() || null,
        food_preference: food.trim() || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      alert(`Couldn't add guest: ${error?.message ?? "No guest record was returned."}`);
      return;
    }

    onCreated(data as Guest);
    setOpen(false);
    setName("");
    setCategory("family");
    setSide("both");
    setPhone("");
    setFood("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="ml-auto"><Plus className="h-3.5 w-3.5" /> Add guest</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add guest</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1 text-xs text-muted-foreground">Full name
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">Category
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as GuestCategory)}>
                <option value="family">Family</option><option value="friend">Friend</option><option value="vip">VIP</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">Side
              <select className="input" value={side} onChange={(e) => setSide(e.target.value as WeddingSide)}>
                <option value="bride">Bride</option><option value="groom">Groom</option><option value="both">Both</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs text-muted-foreground">Phone
            <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs text-muted-foreground">Food preference
            <input className="input" placeholder="e.g. vegetarian, vegan, allergies" value={food} onChange={(e) => setFood(e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs text-muted-foreground">Notes
            <textarea className="input" rows={3} placeholder="Additional notes about this guest" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <Button className="w-full" onClick={create} disabled={saving || !name.trim()}>{saving ? "Adding..." : "Add guest"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
