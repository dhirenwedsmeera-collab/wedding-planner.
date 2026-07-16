import { createClient } from "@/lib/supabase/server";
import { BudgetClient } from "@/components/budget/budget-client";
import type { BudgetLine, Expense, WeddingEvent, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: lines }, { data: expenses }, { data: events }, { data: me }] = await Promise.all([
    supabase.from("budget_lines").select("*"),
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    supabase.from("events").select("*").eq("is_archived", false).order("sort_order"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["budget_lines", "expenses"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Budget</h1>
        <p className="text-sm text-muted-foreground">Planned vs. actual spending, by event and category.</p>
      </div>
      <BudgetClient
        initialLines={(lines ?? []) as BudgetLine[]}
        initialExpenses={(expenses ?? []) as Expense[]}
        events={(events ?? []) as WeddingEvent[]}
        isAdmin={(me as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
