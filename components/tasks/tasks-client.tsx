"use client";

import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { LayoutGrid, Table2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus, TaskPriority, WeddingEvent, Profile } from "@/types/domain";
import { getTaskUrgency, URGENCY_STYLES, formatDate, initials } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskCalendar } from "@/components/tasks/task-calendar";

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "not_started", label: "Not Started" },
  { id: "in_progress", label: "In Progress" },
  { id: "waiting", label: "Waiting" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
];

const PRIORITY_COLOR: Record<TaskPriority, "red" | "orange" | "yellow" | "green"> = {
  critical: "red", high: "orange", medium: "yellow", low: "green",
};

export function TasksClient({
  initialTasks, events, profiles, currentUser,
}: { initialTasks: Task[]; events: WeddingEvent[]; profiles: Profile[]; currentUser: Profile | null }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"kanban" | "table" | "calendar">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const supabase = createClient();
  const isAdmin = currentUser?.role === "admin";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visibleTasks = useMemo(
    () => (eventFilter === "all" ? tasks : tasks.filter((t) => t.event_id === eventFilter)),
    [tasks, eventFilter]
  );

  function canEdit(t: Task) {
    return isAdmin || (t.assignees ?? []).some((a) => a.id === currentUser?.id);
  }

  async function moveTask(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || !canEdit(task)) return;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await supabase.from("tasks").update({ status }).eq("id", id);
    if (status === "completed") fireConfetti();
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    if (STATUS_COLUMNS.some((c) => c.id === newStatus)) {
      moveTask(active.id as string, newStatus);
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-border p-1">
          <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-emerald-700 text-white" : "text-muted-foreground"}`}>
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button onClick={() => setView("table")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${view === "table" ? "bg-emerald-700 text-white" : "text-muted-foreground"}`}>
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
          <button onClick={() => setView("calendar")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${view === "calendar" ? "bg-emerald-700 text-white" : "text-muted-foreground"}`}>
            <CalendarIcon className="h-3.5 w-3.5" /> Calendar
          </button>
        </div>

        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="input w-auto py-1.5 text-xs">
          <option value="all">All events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        {isAdmin && (
          <CreateTaskDialog events={events} profiles={profiles} onCreated={(t) => setTasks((prev) => [t, ...prev])} />
        )}
      </div>

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-5">
            {STATUS_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={visibleTasks.filter((t) => t.status === col.id)}
                canEditTask={canEdit}
              />
            ))}
          </div>
          <DragOverlay>{activeTask && <TaskCard task={activeTask} draggable={false} canEdit={canEdit(activeTask)} />}</DragOverlay>
        </DndContext>
      ) : view === "table" ? (
        <TaskTable tasks={visibleTasks} onStatusChange={moveTask} canEdit={canEdit} />
      ) : (
        <TaskCalendar tasks={visibleTasks} onSelectTask={setSelectedTask} />
      )}

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          canEdit={canEdit(selectedTask)}
          controlledOpen
          onOpenChange={(o) => !o && setSelectedTask(null)}
        >
          <span />
        </TaskDetailDialog>
      )}
    </div>
  );
}

function KanbanColumn({ id, label, tasks, canEditTask }: { id: TaskStatus; label: string; tasks: Task[]; canEditTask: (t: Task) => boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] w-[82vw] shrink-0 snap-center flex-col gap-2 rounded-2xl border border-dashed p-3 transition-colors sm:w-auto sm:shrink ${isOver ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border"}`}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((t) => (
          <SortableTaskCard key={t.id} task={t} canEdit={canEditTask(t)} />
        ))}
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, disabled: !canEdit });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <TaskCard task={task} canEdit={canEdit} />
    </div>
  );
}

function TaskCard({ task, draggable = true, canEdit }: { task: Task; draggable?: boolean; canEdit: boolean }) {
  const urgency = getTaskUrgency(task.due_date, task.status);
  const style = URGENCY_STYLES[urgency];
  return (
    <TaskDetailDialog task={task} canEdit={canEdit}>
      <motion.div layout={draggable} whileHover={{ y: -2 }} className={`cursor-pointer rounded-xl border bg-card p-3 shadow-soft ${style.border} ${!canEdit ? "opacity-80" : ""}`}>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
          {task.due_date && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarIcon className="h-3 w-3" /> {formatDate(task.due_date)}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug">{task.name}</p>
        {task.category && <p className="mt-0.5 text-[11px] text-muted-foreground">{task.category}</p>}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(task.assignees ?? []).slice(0, 3).map((a) => (
              <div key={a.id} title={a.full_name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-gold text-[9px] font-semibold text-white">
                {initials(a.full_name)}
              </div>
            ))}
          </div>
          {urgency !== "can_wait" && <Badge variant={urgency === "overdue" || urgency === "critical" ? "red" : urgency === "urgent" ? "orange" : "yellow"}>{style.label}</Badge>}
        </div>
      </motion.div>
    </TaskDetailDialog>
  );
}

function TaskTable({ tasks, onStatusChange, canEdit }: { tasks: Task[]; onStatusChange: (id: string, s: TaskStatus) => void; canEdit: (t: Task) => boolean }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Task</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Assigned</th>
            <th className="px-4 py-3">Urgency</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const urgency = getTaskUrgency(t.due_date, t.status);
            const style = URGENCY_STYLES[urgency];
            const editable = canEdit(t);
            return (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <TaskDetailDialog task={t} canEdit={editable}>
                    <span className="cursor-pointer font-medium hover:underline">{t.name}</span>
                  </TaskDetailDialog>
                </td>
                <td className="px-4 py-3"><Badge variant={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge></td>
                <td className="px-4 py-3">
                  <select
                    value={t.status}
                    disabled={!editable}
                    onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {STATUS_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.due_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {(t.assignees ?? []).map((a) => (
                      <div key={a.id} title={a.full_name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-gold text-[9px] font-semibold text-white">
                        {initials(a.full_name)}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{urgency !== "can_wait" && <Badge variant={urgency === "overdue" || urgency === "critical" ? "red" : urgency === "urgent" ? "orange" : "yellow"}>{style.label}</Badge>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function TaskDetailDialog({
  task, canEdit, children, controlledOpen, onOpenChange,
}: {
  task: Task; canEdit: boolean; children: React.ReactNode;
  controlledOpen?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  const supabase = createClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? true : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [desc, setDesc] = useState(task.description ?? "");
  const [pct, setPct] = useState(task.completion_pct);

  async function save() {
    if (!canEdit) return setOpen(false);
    await supabase.from("tasks").update({ description: desc, completion_pct: pct }).eq("id", task.id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
            {task.category && <Badge variant="outline">{task.category}</Badge>}
            {task.due_date && <Badge variant="outline">Due {formatDate(task.due_date)}</Badge>}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
            <textarea
              disabled={!canEdit}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="input disabled:opacity-60"
              placeholder="No description yet."
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Completion</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={pct} disabled={!canEdit}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
          {task.assignees && task.assignees.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Assigned to</p>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((a) => (
                  <span key={a.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-gold text-[8px] font-semibold text-white">{initials(a.full_name)}</span>
                    {a.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {canEdit && <Button className="w-full" onClick={save}>Save changes</Button>}
          {!canEdit && <p className="text-center text-xs text-muted-foreground">Only the assignee or admin can edit this task.</p>}
          <div className="border-t border-border pt-4">
            {open && <TaskComments taskId={task.id} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({ events, profiles, onCreated }: { events: WeddingEvent[]; profiles: Profile[]; onCreated: (t: Task) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  async function create() {
    if (!name.trim()) return;
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({ name, event_id: eventId || null, priority, due_date: dueDate || null, status: "not_started" })
      .select()
      .single();
    if (error || !task) return;
    if (assigneeIds.length > 0) {
      await supabase.from("task_assignees").insert(assigneeIds.map((user_id) => ({ task_id: task.id, user_id })));
    }
    onCreated({ ...task, assignees: profiles.filter((p) => assigneeIds.includes(p.id)) });
    setOpen(false);
    setName(""); setDueDate(""); setAssigneeIds([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto"><Plus className="h-3.5 w-3.5" /> New task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="Task name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Assign to</p>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAssigneeIds((prev) => prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id])}
                  className={`rounded-full border px-2.5 py-1 text-xs ${assigneeIds.includes(p.id) ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50" : "border-border"}`}
                >
                  {p.full_name}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={create}>Create task</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
