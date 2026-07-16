import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { Task, WeddingEvent, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: events }, { data: profiles }, { data: assignees }, { data: me }] =
    await Promise.all([
      supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("events").select("*").eq("is_archived", false).order("sort_order"),
      supabase.from("profiles").select("*"),
      supabase.from("task_assignees").select("*"),
      user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
    ]);

  const tasksWithAssignees: Task[] = (tasks ?? []).map((t: Task) => ({
    ...t,
    assignees: (assignees ?? [])
      .filter((a: any) => a.task_id === t.id)
      .map((a: any) => (profiles ?? []).find((p: Profile) => p.id === a.user_id))
      .filter(Boolean),
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["tasks", "task_assignees", "task_checklist_items"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">Drag cards between columns, or switch to table view.</p>
      </div>
      <TasksClient
        initialTasks={tasksWithAssignees}
        events={(events ?? []) as WeddingEvent[]}
        profiles={(profiles ?? []) as Profile[]}
        currentUser={me as Profile | null}
      />
    </div>
  );
}
