"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, AlertOctagon, CheckCircle2, Clock, Phone, FileText, Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import {
  BOOKING_CATEGORY_LABELS,
  type Booking, type BookingCategory, type BookingStatus, type WeddingEvent,
} from "@/types/domain";
import { getBookingUrgency, URGENCY_STYLES, formatCurrency, formatDate, whatsappLink } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";

const STATUS_OPTIONS: BookingStatus[] = ["not_booked", "enquired", "negotiating", "booked", "confirmed", "cancelled"];
const STATUS_LABELS: Record<BookingStatus, string> = {
  not_booked: "Not Booked", enquired: "Enquired", negotiating: "Negotiating",
  booked: "Booked", confirmed: "Confirmed", cancelled: "Cancelled",
};

const FILTERS = ["all", "not_booked", "enquired", "negotiating", "booked", "confirmed", "overdue"] as const;

export function BookingsClient({
  initialBookings,
  events,
  isAdmin,
}: {
  initialBookings: Booking[];
  events: WeddingEvent[];
  isAdmin: boolean;
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const supabase = createClient();

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "booked").length;
    const overdue = bookings.filter((b) => getBookingUrgency(b.category, b.status) === "overdue").length;
    const trials = bookings.filter((b) => b.trial_scheduled_at && new Date(b.trial_scheduled_at) > new Date()).length;
    const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, overdue, trials, pending: total - confirmed, pct };
  }, [bookings]);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    if (filter === "overdue") return bookings.filter((b) => getBookingUrgency(b.category, b.status) === "overdue");
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  async function updateBooking(id: string, patch: Partial<Booking>) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const wasConfirmed = bookings.find((b) => b.id === id)?.status === "confirmed";
    await supabase.from("bookings").update(patch).eq("id", id);
    if (patch.status === "confirmed" && !wasConfirmed) fireConfetti();
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{stats.confirmed}/{stats.total}</p>
              <p className="text-xs text-muted-foreground">Confirmed bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">Overdue, unbooked</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{stats.trials}</p>
              <p className="text-xs text-muted-foreground">Upcoming trials/fittings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-semibold">{stats.pct}%</span>
          </div>
          <ProgressBar value={stats.pct} />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
        {isAdmin && <AddBookingDialog events={events} onCreated={(b) => setBookings((prev) => [b, ...prev])} />}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((b) => {
            const urgency = getBookingUrgency(b.category, b.status);
            const style = URGENCY_STYLES[urgency];
            const isUnbooked = b.status === "not_booked" || b.status === "enquired" || b.status === "negotiating";
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className={`gold-hover overflow-hidden border-l-4 ${style.border}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{b.vendor_name || "TBD"}</p>
                          <Badge variant="outline">{BOOKING_CATEGORY_LABELS[b.category]}</Badge>
                          {isUnbooked && (
                            <Badge variant={urgency === "overdue" || urgency === "critical" ? "red" : urgency === "urgent" ? "orange" : urgency === "upcoming" ? "yellow" : "green"}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} /> {style.label}
                            </Badge>
                          )}
                          {b.contract_signed && <Badge variant="gold"><FileText className="h-3 w-3" /> Contract signed</Badge>}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {b.contact_person && <span>{b.contact_person}</span>}
                          {b.booking_date && <span>Booked {formatDate(b.booking_date)}</span>}
                          {b.final_payment_due && <span>Final payment due {formatDate(b.final_payment_due)}</span>}
                          {(b.advance_paid > 0 || b.balance_due > 0) && (
                            <span>Advance {formatCurrency(b.advance_paid)} · Balance {formatCurrency(b.balance_due)}</span>
                          )}
                          {b.trial_scheduled_at && <span>Trial {formatDate(b.trial_scheduled_at)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.contact_phone && (
                          <a href={whatsappLink(b.contact_phone, `Hi ${b.contact_person || ""}, following up on our ${BOOKING_CATEGORY_LABELS[b.category]} booking.`)}
                             target="_blank" rel="noreferrer"
                             className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {isAdmin ? (
                          <select
                            value={b.status}
                            onChange={(e) => updateBooking(b.id, { status: e.target.value as BookingStatus })}
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge>{STATUS_LABELS[b.status]}</Badge>
                        )}
                        {isAdmin && <EditBookingDialog booking={b} events={events} onSaved={(patch) => updateBooking(b.id, patch)} />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No bookings match this filter.</p>
        )}
      </div>
    </div>
  );
}

function EditBookingDialog({
  booking, events, onSaved,
}: { booking: Booking; events: WeddingEvent[]; onSaved: (patch: Partial<Booking>) => void }) {
  const [form, setForm] = useState({
    vendor_name: booking.vendor_name,
    event_id: booking.event_id ?? "",
    contact_person: booking.contact_person ?? "",
    contact_phone: booking.contact_phone ?? "",
    booking_date: booking.booking_date ?? "",
    final_payment_due: booking.final_payment_due ?? "",
    advance_paid: booking.advance_paid ?? 0,
    balance_due: booking.balance_due ?? 0,
    contract_signed: booking.contract_signed,
    contract_url: booking.contract_url ?? null as string | null,
    trial_scheduled_at: booking.trial_scheduled_at ? booking.trial_scheduled_at.slice(0, 16) : "",
    notes: booking.notes ?? "",
  });
  const [open, setOpen] = useState(false);

  function save() {
    onSaved({
      ...form,
      event_id: form.event_id || null,
      trial_scheduled_at: form.trial_scheduled_at ? new Date(form.trial_scheduled_at).toISOString() : null,
      advance_paid: Number(form.advance_paid),
      balance_due: Number(form.balance_due),
    } as Partial<Booking>);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{BOOKING_CATEGORY_LABELS[booking.category]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Vendor name"><input className="input" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></Field>
          <Field label="Wedding function">
            <select className="input" value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
              <option value="">— none —</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person"><input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Booking date"><input type="date" className="input" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} /></Field>
            <Field label="Final payment due"><input type="date" className="input" value={form.final_payment_due} onChange={(e) => setForm({ ...form, final_payment_due: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Advance paid"><input type="number" className="input" value={form.advance_paid} onChange={(e) => setForm({ ...form, advance_paid: Number(e.target.value) })} /></Field>
            <Field label="Balance due"><input type="number" className="input" value={form.balance_due} onChange={(e) => setForm({ ...form, balance_due: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Trial / tasting / sample scheduled"><input type="datetime-local" className="input" value={form.trial_scheduled_at} onChange={(e) => setForm({ ...form, trial_scheduled_at: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.contract_signed} onChange={(e) => setForm({ ...form, contract_signed: e.target.checked })} />
            Contract signed
          </label>
          <Field label="Contract file">
            <FileUpload bucket="contracts" pathPrefix={booking.id} value={form.contract_url} onChange={(url) => setForm({ ...form, contract_url: url })} label="Upload contract" />
          </Field>
          <Field label="Notes"><textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Button className="w-full" onClick={save}>Save booking</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddBookingDialog({ events, onCreated }: { events: WeddingEvent[]; onCreated: (b: Booking) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState<BookingCategory>("other");

  async function create() {
    const { data, error } = await supabase
      .from("bookings")
      .insert({ vendor_name: vendorName || "TBD", category, status: "not_booked" })
      .select()
      .single();
    if (!error && data) onCreated(data as Booking);
    setOpen(false);
    setVendorName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="gold" className="ml-auto shrink-0 whitespace-nowrap"><Plus className="h-3.5 w-3.5" /> Add booking</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a booking</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as BookingCategory)}>
              {Object.entries(BOOKING_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Vendor name"><input className="input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Aria Studios" /></Field>
          <Button className="w-full" onClick={create}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
