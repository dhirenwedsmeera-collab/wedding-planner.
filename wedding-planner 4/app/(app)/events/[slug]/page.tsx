import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventDetailClient } from "@/components/events/event-detail-client";
import type { WeddingEvent, Task, ShoppingItem, BudgetLine, Expense, Guest } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", params.slug).single();
  if (!event) notFound();

  const [{ data: tasks }, { data: shopping }, { data: budget }, { data: expenses }, { data: notes }] = await Promise.all([
    supabase.from("tasks").select("*").eq("event_id", event.id),
    supabase.from("shopping_items").select("*").eq("event_id", event.id),
    supabase.from("budget_lines").select("*").eq("event_id", event.id),
    supabase.from("expenses").select("*").eq("event_id", event.id),
    supabase.from("notes").select("*").eq("event_id", event.id).order("created_at", { ascending: false }),
  ]);

  return (
    <EventDetailClient
      event={event as WeddingEvent}
      tasks={(tasks ?? []) as Task[]}
      shopping={(shopping ?? []) as ShoppingItem[]}
      budgetLines={(budget ?? []) as BudgetLine[]}
      expenses={(expenses ?? []) as Expense[]}
      notes={(notes ?? []) as any[]}
    />
  );
}
