import { createClient } from "@/lib/supabase/server";
import { EventsClient } from "@/components/events/events-client";
import type { WeddingEvent, Task, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: tasks }, { data: me }] = await Promise.all([
    supabase.from("events").select("*").order("sort_order"),
    supabase.from("tasks").select("*"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const progressByEvent: Record<string, number> = {};
  (events ?? []).forEach((e: WeddingEvent) => {
    const eventTasks = (tasks ?? []).filter((t: Task) => t.event_id === e.id);
    progressByEvent[e.id] = eventTasks.length > 0
      ? Math.round((eventTasks.filter((t: Task) => t.status === "completed").length / eventTasks.length) * 100)
      : 0;
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["events"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Wedding Events</h1>
        <p className="text-sm text-muted-foreground">Add, remove, and open any function of the wedding.</p>
      </div>
      <EventsClient
        initialEvents={(events ?? []) as WeddingEvent[]}
        progressByEvent={progressByEvent}
        isAdmin={(me as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
