import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import type { WeddingEvent, Task, ShoppingItem, BudgetLine, Expense, Guest, EventSection, EventSectionItem, Profile, GuestEventLink } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", params.slug).single();
  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: tasks }, { data: shopping }, { data: budget }, { data: expenses }, { data: notes },
    { data: allGuests }, { data: guestEvents }, { data: sections }, { data: profiles }, { data: me },
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", event.id),
    supabase.from("shopping_items").select("*").eq("event_id", event.id),
    supabase.from("budget_lines").select("*").eq("event_id", event.id),
    supabase.from("expenses").select("*").eq("event_id", event.id),
    supabase.from("notes").select("*").eq("event_id", event.id).order("created_at", { ascending: false }),
    supabase.from("guests").select("*"),
    supabase.from("guest_events").select("*").eq("event_id", event.id),
    supabase.from("event_sections").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("profiles").select("*"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const sectionIds = (sections ?? []).map((s: EventSection) => s.id);
  const { data: sectionItems } = sectionIds.length
    ? await supabase.from("event_section_items").select("*").in("section_id", sectionIds).order("sort_order")
    : { data: [] };

  return (
    <>
      <RealtimeRefresher tables={["tasks", "shopping_items", "budget_lines", "expenses", "guest_events", "event_sections", "event_section_items", "notes"]} />
      <EventDetailClient
        event={event as WeddingEvent}
        tasks={(tasks ?? []) as Task[]}
        shopping={(shopping ?? []) as ShoppingItem[]}
        budgetLines={(budget ?? []) as BudgetLine[]}
        expenses={(expenses ?? []) as Expense[]}
        notes={(notes ?? []) as any[]}
        allGuests={(allGuests ?? []) as Guest[]}
        guestLinks={(guestEvents ?? []) as GuestEventLink[]}
        sections={(sections ?? []) as EventSection[]}
        sectionItems={(sectionItems ?? []) as EventSectionItem[]}
        profiles={(profiles ?? []) as Profile[]}
        isAdmin={(me as Profile | null)?.role === "admin"}
        currentUserId={user?.id ?? null}
      />
    </>
  );
}
