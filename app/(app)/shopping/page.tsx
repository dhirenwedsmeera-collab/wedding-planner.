import { createClient } from "@/lib/supabase/server";
import { ShoppingClient } from "@/components/shopping/shopping-client";
import type { ShoppingItem, WeddingEvent, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Outfits", "Clothes", "Jewelry", "Decorations", "Flowers", "Food", "Return Gifts", "Wedding Cards", "Stage", "Lighting", "Other"];

export default async function ShoppingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items }, { data: events }, { data: profiles }, { data: me }] = await Promise.all([
    supabase.from("shopping_items").select("*"),
    supabase.from("events").select("*").eq("is_archived", false).order("sort_order"),
    supabase.from("profiles").select("*"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["shopping_items"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Shopping Planner</h1>
        <p className="text-sm text-muted-foreground">Track everything to buy, by category and event.</p>
      </div>
      <ShoppingClient
        initialItems={(items ?? []) as ShoppingItem[]}
        events={(events ?? []) as WeddingEvent[]}
        profiles={profiles ?? []}
        categories={CATEGORIES}
        currentUserId={(me as Profile | null)?.id ?? null}
        isAdmin={(me as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
