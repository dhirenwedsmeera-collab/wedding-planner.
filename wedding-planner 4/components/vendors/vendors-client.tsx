"use client";

import { useState } from "react";
import { Plus, Phone, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Vendor, VendorCategory } from "@/types/domain";
import { formatCurrency, whatsappLink } from "@/lib/utils";

const CATEGORIES: VendorCategory[] = ["photographer", "decorator", "catering", "makeup", "mehendi_artist", "dj", "venue", "flowers", "jeweler", "other"];

export function VendorsClient({ initialVendors, isAdmin }: { initialVendors: Vendor[]; isAdmin: boolean }) {
  const [vendors, setVendors] = useState(initialVendors);

  return (
    <div className="space-y-4">
      {isAdmin && <AddVendorDialog onCreated={(v) => setVendors((prev) => [...prev, v])} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vendors.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{v.category.replace("_", " ")}</Badge>
                </div>
                {v.rating && (
                  <div className="flex items-center gap-0.5 text-gold-500">
                    {Array.from({ length: v.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Advance {formatCurrency(v.advance_paid)}</span>
                <span>Balance {formatCurrency(v.balance_due)}</span>
              </div>
              {v.phone && (
                <a href={whatsappLink(v.phone)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Phone className="h-3.5 w-3.5" /> Message on WhatsApp
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {vendors.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No vendors added yet.</p>}
      </div>
    </div>
  );
}

function AddVendorDialog({ onCreated }: { onCreated: (v: Vendor) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("photographer");
  const [phone, setPhone] = useState("");

  async function create() {
    if (!name.trim()) return;
    const { data, error } = await supabase.from("vendors").insert({ name, category, phone: phone || null }).select().single();
    if (!error && data) onCreated(data as Vendor);
    setOpen(false);
    setName(""); setPhone("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Add vendor</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add vendor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
          <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button className="w-full" onClick={create}>Add vendor</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
