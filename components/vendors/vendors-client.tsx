"use client";

import { useState } from "react";
import { Plus, Phone, Star, Pencil, Mail, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Vendor, VendorCategory } from "@/types/domain";
import { formatCurrency, whatsappLink } from "@/lib/utils";

type VendorContact = { name: string; phone: string; email: string };
const CATEGORIES: VendorCategory[] = ["photographer", "decorator", "catering", "makeup", "mehendi_artist", "dj", "venue", "flowers", "jeweler", "other"];
const emptyContact = (): VendorContact => ({ name: "", phone: "", email: "" });
function contactsFor(v: Vendor): VendorContact[] {
  const saved = (v as Vendor & { contacts?: VendorContact[] | null }).contacts;
  if (saved?.length) return saved.map((c) => ({ name: c.name ?? "", phone: c.phone ?? "", email: c.email ?? "" }));
  if (v.phone || v.email) return [{ name: "", phone: v.phone ?? "", email: v.email ?? "" }];
  return [emptyContact()];
}

export function VendorsClient({ initialVendors, isAdmin }: { initialVendors: Vendor[]; isAdmin: boolean }) {
  const [vendors, setVendors] = useState(initialVendors);
  function updateVendor(updated: Vendor) { setVendors((prev) => prev.map((v) => v.id === updated.id ? updated : v)); }

  return (
    <div className="space-y-4">
      {isAdmin && <AddVendorDialog onCreated={(v) => setVendors((prev) => [...prev, v].sort((a, b) => a.name.localeCompare(b.name)))} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vendors.map((v) => {
          const contacts = contactsFor(v).filter((c) => c.name || c.phone || c.email);
          const firstPhone = contacts.find((c) => c.phone)?.phone || v.phone;
          return <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-medium">{v.name}</p><Badge variant="outline" className="mt-1 capitalize">{v.category.replace("_", " ")}</Badge></div>
                <div className="flex items-center gap-2">
                  {v.rating && <div className="flex items-center gap-0.5 text-gold-500">{Array.from({ length: v.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>}
                  {isAdmin && <EditVendorDialog vendor={v} onUpdated={updateVendor} />}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Advance {formatCurrency(v.advance_paid)}</span><span>Balance {formatCurrency(v.balance_due)}</span></div>
              {contacts.length > 0 && <div className="mt-3 space-y-2 border-t pt-3">
                {contacts.map((c, i) => <div key={`${v.id}-contact-${i}`} className="text-xs space-y-1">
                  {c.name && <p className="font-medium text-foreground">{c.name}</p>}
                  {c.phone && <a className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" href={`tel:${c.phone}`}><Phone className="h-3 w-3" />{c.phone}</a>}
                  {c.email && <a className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" href={`mailto:${c.email}`}><Mail className="h-3 w-3" />{c.email}</a>}
                </div>)}
              </div>}
              {firstPhone && <a href={whatsappLink(firstPhone)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400"><Phone className="h-3.5 w-3.5" /> Message on WhatsApp</a>}
              {v.notes && <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{v.notes}</p>}
            </CardContent>
          </Card>;
        })}
        {vendors.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No vendors added yet.</p>}
      </div>
    </div>
  );
}

function ContactFields({ contacts, setContacts }: { contacts: VendorContact[]; setContacts: (c: VendorContact[]) => void }) {
  function change(index: number, key: keyof VendorContact, value: string) { setContacts(contacts.map((c, i) => i === index ? { ...c, [key]: value } : c)); }
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><p className="text-sm font-medium">Contact people</p><Button type="button" variant="outline" size="sm" onClick={() => setContacts([...contacts, emptyContact()])}><Plus className="mr-1 h-3.5 w-3.5" /> Add contact</Button></div>
    {contacts.map((c, i) => <div key={i} className="space-y-2 rounded-xl border p-3">
      <div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Contact {i + 1}</p>{contacts.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setContacts(contacts.filter((_, n) => n !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
      <input className="input" placeholder="Contact name (optional)" value={c.name} onChange={(e) => change(i, "name", e.target.value)} />
      <input className="input" placeholder="Phone number" type="tel" value={c.phone} onChange={(e) => change(i, "phone", e.target.value)} />
      <input className="input" placeholder="Email address" type="email" value={c.email} onChange={(e) => change(i, "email", e.target.value)} />
    </div>)}
  </div>;
}

function AddVendorDialog({ onCreated }: { onCreated: (v: Vendor) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [category, setCategory] = useState<VendorCategory>("photographer");
  const [contacts, setContacts] = useState<VendorContact[]>([emptyContact()]); const [notes, setNotes] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function reset() { setName(""); setCategory("photographer"); setContacts([emptyContact()]); setNotes(""); setError(""); }
  async function create() {
    if (!name.trim()) { setError("Please enter a business name."); return; }
    setSaving(true); setError("");
    const clean = contacts.filter((c) => c.name.trim() || c.phone.trim() || c.email.trim()).map((c) => ({ name: c.name.trim(), phone: c.phone.trim(), email: c.email.trim() }));
    const first = clean[0];
    const { data, error: saveError } = await supabase.from("vendors").insert({ name: name.trim(), category, phone: first?.phone || null, email: first?.email || null, contacts: clean, notes: notes.trim() || null }).select().single();
    setSaving(false);
    if (saveError || !data) { setError(saveError?.message || "Could not save this vendor."); return; }
    onCreated(data as Vendor); setOpen(false); reset();
  }
  return <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
    <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Add vendor</Button></DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Add vendor</DialogTitle></DialogHeader>
      <div className="space-y-3"><input className="input" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</select>
        <ContactFields contacts={contacts} setContacts={setContacts} /><textarea className="input min-h-20" placeholder="Vendor notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={create} disabled={saving}>{saving ? "Saving…" : "Add vendor"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}

function EditVendorDialog({ vendor, onUpdated }: { vendor: Vendor; onUpdated: (v: Vendor) => void }) {
  const supabase = createClient(); const [open, setOpen] = useState(false); const [name, setName] = useState(vendor.name); const [category, setCategory] = useState<VendorCategory>(vendor.category);
  const [contacts, setContacts] = useState<VendorContact[]>(contactsFor(vendor)); const [notes, setNotes] = useState(vendor.notes ?? ""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function load() { setName(vendor.name); setCategory(vendor.category); setContacts(contactsFor(vendor)); setNotes(vendor.notes ?? ""); setError(""); }
  async function save() {
    if (!name.trim()) { setError("Please enter a business name."); return; }
    setSaving(true); setError(""); const clean = contacts.filter((c) => c.name.trim() || c.phone.trim() || c.email.trim()).map((c) => ({ name: c.name.trim(), phone: c.phone.trim(), email: c.email.trim() })); const first = clean[0];
    const { data, error: saveError } = await supabase.from("vendors").update({ name: name.trim(), category, phone: first?.phone || null, email: first?.email || null, contacts: clean, notes: notes.trim() || null }).eq("id", vendor.id).select().single();
    setSaving(false); if (saveError || !data) { setError(saveError?.message || "Could not update this vendor."); return; }
    onUpdated(data as Vendor); setOpen(false);
  }
  return <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) load(); }}>
    <DialogTrigger asChild><Button variant="outline" size="icon" aria-label={`Edit ${vendor.name}`}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit vendor</DialogTitle></DialogHeader>
      <div className="space-y-3"><input className="input" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</select>
        <ContactFields contacts={contacts} setContacts={setContacts} /><textarea className="input min-h-20" placeholder="Vendor notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
