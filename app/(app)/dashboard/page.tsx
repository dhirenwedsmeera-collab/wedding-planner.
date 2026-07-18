import { createClient } from "@/lib/supabase/server";
import { DashboardHero } from "@/components/dashboard/hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskWidget } from "@/components/dashboard/task-widget";
import { BookingStatusWidget } from "@/components/dashboard/booking-status-widget";
import { EventStatusGrid } from "@/components/dashboard/event-status-grid";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { QuickNotes } from "@/components/notes/quick-notes";
import { KeyDecisionsWidget } from "@/components/dashboard/key-decisions-widget";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { CheckCircle2, AlertTriangle, ShoppingBag, Wallet } from "lucide-react";
import type { Task, Booking, WeddingEvent, ShoppingItem, BudgetLine, Expense, KeyDecision, WeddingSettings, Profile } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: events },
    { data: tasks },
    { data: bookings },
    { data: shoppingItems },
    { data: budgetLines },
    { data: expenses },
    { data: activity },
    { data: weddingSettings },
    { data: keyDecisions },
  ] = await Promise.all([
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("events").select("*").eq("is_archived", false).order("sort_order"),
    supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    supabase.from("bookings").select("*"),
    supabase.from("shopping_items").select("*"),
    supabase.from("budget_lines").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("wedding_settings").select("*").eq("id", true).single(),
    supabase.from("key_decisions").select("*").order("sort_order"),
  ]);

  const { data: guestEventsRaw } = await supabase.from("guest_events").select("*");
  const guestEvents = guestEventsRaw ?? [];

  const allTasks: Task[] = tasks ?? [];
  const allEvents: WeddingEvent[] = events ?? [];
  const allBookings: Booking[] = bookings ?? [];
  const allShopping: ShoppingItem[] = shoppingItems ?? [];
  const allBudget: BudgetLine[] = budgetLines ?? [];
  const allExpenses: Expense[] = expenses ?? [];
  const settings = weddingSettings as WeddingSettings | null;
  const decisions: KeyDecision[] = keyDecisions ?? [];
  const isAdmin = (profile as Profile | null)?.role === "admin";

  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const overallPct = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = allTasks.filter((t) => t.due_date === todayStr && t.status !== "completed");
  const urgent = allTasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date)
    .filter((t) => new Date(t.due_date!) <= new Date(Date.now() + 3 * 86400000))
    .slice(0, 6);

  const progressByEvent: Record<string, number> = {};
  const guestCountByEvent: Record<string, number> = {};
  const outfitPctByEvent: Record<string, number> = {};
  const decorPctByEvent: Record<string, number> = {};
  allEvents.forEach((e) => {
    const eventTasks = allTasks.filter((t) => t.event_id === e.id);
    progressByEvent[e.id] =
      eventTasks.length > 0
        ? Math.round((eventTasks.filter((t) => t.status === "completed").length / eventTasks.length) * 100)
        : 0;

    guestCountByEvent[e.id] = guestEvents.filter((g: any) => g.event_id === e.id).length;

    const outfits = allShopping.filter((s) => s.event_id === e.id && (s.category === "Outfits" || s.category === "Clothes"));
    outfitPctByEvent[e.id] = outfits.length > 0 ? Math.round((outfits.filter((s) => s.is_purchased).length / outfits.length) * 100) : -1;

    const decor = allShopping.filter((s) => s.event_id === e.id && s.category === "Decorations");
    decorPctByEvent[e.id] = decor.length > 0 ? Math.round((decor.filter((s) => s.is_purchased).length / decor.length) * 100) : -1;
  });

  const purchasedCount = allShopping.filter((s) => s.is_purchased).length;
  const totalPlanned = allBudget.reduce((sum, b) => sum + Number(b.planned_amount || 0), 0);
  const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["tasks", "bookings", "shopping_items", "expenses", "budget_lines", "activity_log", "wedding_settings", "key_decisions", "guest_events"]} />

      <DashboardHero firstName={firstName} overallPct={overallPct} weddingDate={settings?.wedding_date ?? null} isAdmin={isAdmin} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Tasks Completed" value={`${completedTasks}/${allTasks.length}`} sub={`${overallPct}% overall`} />
        <StatCard icon={AlertTriangle} label="Urgent Tasks" value={urgent.length} sub="due within 3 days" tone="red" />
        <StatCard icon={ShoppingBag} label="Shopping Purchased" value={`${purchasedCount}/${allShopping.length}`} tone="gold" />
        <StatCard icon={Wallet} label="Budget Spent" value={formatCurrency(totalSpent)} sub={`of ${formatCurrency(totalPlanned)} planned`} tone="gold" />
      </div>

      <EventStatusGrid events={allEvents} progressByEvent={progressByEvent} guestCountByEvent={guestCountByEvent} outfitPctByEvent={outfitPctByEvent} decorPctByEvent={decorPctByEvent} />

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TaskWidget title="Urgent & Overdue" tasks={urgent} emptyText="Nothing urgent — you're ahead of schedule! 🎉" />
        <TaskWidget title="Due Today" tasks={today} emptyText="No tasks due today." />
        <BookingStatusWidget bookings={allBookings} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KeyDecisionsWidget initialDecisions={decisions} isAdmin={isAdmin} />
        <QuickNotes />
      </div>

      <ActivityFeed items={(activity ?? []) as any} />
    </div>
  );
}
