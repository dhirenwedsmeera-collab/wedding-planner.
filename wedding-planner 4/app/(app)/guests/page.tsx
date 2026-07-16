import { createClient } from "@/lib/supabase/server";
import { GuestsClient } from "@/components/guests/guests-client";
import type { Guest, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: guests }, { data: me }] = await Promise.all([
    supabase.from("guests").select("*").order("full_name"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["guests"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Guest List</h1>
        <p className="text-sm text-muted-foreground">RSVPs, invitations, and food preferences.</p>
      </div>
      <GuestsClient initialGuests={(guests ?? []) as Guest[]} isAdmin={(me as Profile | null)?.role === "admin"} />
    </div>
  );
}
