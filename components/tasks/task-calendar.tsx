"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, format, addMonths, subMonths,
} from "date-fns";
import type { Task, TaskPriority } from "@/types/domain";
import { getTaskUrgency, URGENCY_STYLES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const PRIORITY_COLOR: Record<TaskPriority, "red" | "orange" | "yellow" | "green"> = {
  critical: "red", high: "orange", medium: "yellow", low: "green",
};

export function TaskCalendar({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (t: Task) => void }) {
  const [month, setMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date;
      map.set(key, [...(map.get(key) ?? []), t]);
    });
    return map;
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg font-semibold">{format(month, "MMMM yyyy")}</p>
        <div className="flex gap-1">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="rounded-lg p-1.5 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(new Date())} className="rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-muted">
            Today
          </button>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-lg p-1.5 hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={key}
              className={`min-h-[86px] rounded-xl border p-1.5 text-left ${inMonth ? "border-border" : "border-transparent opacity-40"} ${isToday ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800" : ""}`}
            >
              <p className={`mb-1 text-[11px] ${isToday ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const urgency = getTaskUrgency(t.due_date, t.status);
                  const style = URGENCY_STYLES[urgency];
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium ${style.bg} ${style.text}`}
                      title={t.name}
                    >
                      {t.name}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <p className="px-1 text-[9px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
