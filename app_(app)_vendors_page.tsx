import { createClient } from "@/lib/supabase/server";
import { VendorsClient } from "@/components/vendors/vendors-client";
import type { Vendor, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: vendors }, { data: me }] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["vendors"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Vendors</h1>
        <p className="text-sm text-muted-foreground">Contact directory and ratings. For booking status, see the Booking Tracker.</p>
      </div>
      <VendorsClient initialVendors={(vendors ?? []) as Vendor[]} isAdmin={(me as Profile | null)?.role === "admin"} />
    </div>
  );
}
