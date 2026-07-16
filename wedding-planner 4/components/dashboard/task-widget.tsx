import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/domain";
import { getTaskUrgency, URGENCY_STYLES, formatDate } from "@/lib/utils";

const URGENCY_BADGE: Record<string, "red" | "orange" | "yellow" | "green"> = {
  overdue: "red",
  critical: "red",
  urgent: "orange",
  upcoming: "yellow",
  can_wait: "green",
};

export function TaskWidget({ title, tasks, emptyText }: { title: string; tasks: Task[]; emptyText: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Link href="/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>}
        {tasks.map((t) => {
          const urgency = getTaskUrgency(t.due_date, t.status);
          const style = URGENCY_STYLES[urgency];
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${style.bg} ${style.border}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">Due {formatDate(t.due_date)}</p>
              </div>
              <Badge variant={URGENCY_BADGE[urgency]}>{style.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
