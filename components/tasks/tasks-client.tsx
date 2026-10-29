
"use client";

import { useMemo, useState } from "react";
import { Table2, Plus, Calendar as CalendarIcon, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus, TaskPriority, WeddingEvent, Profile } from "@/types/domain";
import { getTaskUrgency, URGENCY_STYLES, formatDate } from "@/lib/utils";
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
  critical: "red",
  high: "orange",
  medium: "yellow",
  low: "green",
};

export function TasksClient({
  initialTasks,
  events,
  profiles,
  currentUser,
}: {
  initialTasks: Task[];
  events: WeddingEvent[];
  profiles: Profile[];
  currentUser: Profile | null;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [completedOpen, setCompletedOpen] = useState(false);

  const supabase = createClient();
  const isAdmin = currentUser?.role === "admin";

  const visibleTasks = useMemo(
    () =>
      eventFilter === "all"
        ? tasks
        : tasks.filter((t) => t.event_id === eventFilter),
    [tasks, eventFilter]
  );

  const priorityFilteredTasks = useMemo(
    () =>
      priorityFilter === "all"
        ? visibleTasks
        : visibleTasks.filter((t) => t.priority === priorityFilter),
    [visibleTasks, priorityFilter]
  );

  const activeTasks = useMemo(
    () =>
      priorityFilteredTasks.filter(
        (t) => String(t.status).toLowerCase() !== "completed"
      ),
    [priorityFilteredTasks]
  );

  const completedTasks = useMemo(
    () =>
      priorityFilteredTasks.filter(
        (t) => String(t.status).toLowerCase() === "completed"
      ),
    [priorityFilteredTasks]
  );

  function canEdit(t: Task) {
    return isAdmin || (t.assignees ?? []).some((a) => a.id === currentUser?.id);
  }

  function updateTask(updatedTask: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask((prev) =>
      prev?.id === updatedTask.id ? updatedTask : prev
    );
  }

  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
  }

  async function moveTask(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || !canEdit(task) || task.status === status) return;

    const previousStatus = task.status;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id);

    if (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: previousStatus } : t
        )
      );
      alert("Couldn't update the task status. Please try again.");
      return;
    }

    if (status === "completed") {
      setCompletedOpen(true);
      fireConfetti();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-border p-1">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              view === "table"
                ? "bg-emerald-700 text-white"
                : "text-muted-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              view === "calendar"
                ? "bg-emerald-700 text-white"
                : "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Calendar
          </button>
        </div>


        {isAdmin && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ImportTasksDialog
              events={events}
              existingTasks={tasks}
              onImported={(created) =>
                setTasks((prev) => [...created, ...prev])
              }
            />
            <CreateTaskDialog
              events={events}
              profiles={profiles}
              onCreated={(t) => setTasks((prev) => [t, ...prev])}
            />
          </div>
        )}
      </div>

      {view === "table" ? (
<TaskTable
  tasks={activeTasks}
  onStatusChange={moveTask}
  canEdit={canEdit}
  isAdmin={isAdmin}
  onUpdated={updateTask}
  onDeleted={removeTask}
  events={events}
  profiles={profiles}
  eventFilter={eventFilter}
  onEventFilterChange={setEventFilter}
  priorityFilter={priorityFilter}
  onPriorityFilterChange={setPriorityFilter}
/>
      ) : (
        <TaskCalendar
          tasks={activeTasks}
          onSelectTask={setSelectedTask}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setCompletedOpen((open) => !open)}
          aria-expanded={completedOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
        >
          <div>
            <p className="text-sm font-semibold">Completed</p>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length}{" "}
              {completedTasks.length === 1 ? "task" : "tasks"} finished
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {completedOpen ? "Hide" : "Show"}
            <span aria-hidden="true">
              {completedOpen ? "▲" : "▼"}
            </span>
          </span>
        </button>

        {completedOpen && (
          <div className="space-y-2 border-t border-border p-3">
            {completedTasks.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No completed tasks yet. Finished tasks will appear here.
              </p>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <TaskDetailDialog
                      task={task}
                      events={events}
                      profiles={profiles}
                      canEdit={canEdit(task)}
                      isAdmin={isAdmin}
                      onUpdated={updateTask}
                      onDeleted={removeTask}
                    >
                      <span className="cursor-pointer text-sm font-medium hover:underline">
                        {task.name}
                      </span>
                    </TaskDetailDialog>

                    {task.category && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.category}
                      </p>
                    )}

                    {task.due_date && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Due {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="green">Completed</Badge>
                    {canEdit(task) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void moveTask(task.id, "not_started")
                        }
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          events={events}
          profiles={profiles}
          canEdit={canEdit(selectedTask)}
          isAdmin={isAdmin}
          onUpdated={updateTask}
          onDeleted={removeTask}
          controlledOpen
          onOpenChange={(o) => !o && setSelectedTask(null)}
        >
          <span />
        </TaskDetailDialog>
      )}
    </div>
  );
}

function TaskTable({
  tasks,
  onStatusChange,
  canEdit,
  isAdmin,
  onUpdated,
  onDeleted,
  events,
  profiles,
  eventFilter,
  onEventFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: {
  tasks: Task[];
  onStatusChange: (id: string, s: TaskStatus) => void;
  canEdit: (t: Task) => boolean;
  isAdmin: boolean;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
  events: WeddingEvent[];
  profiles: Profile[];
  eventFilter: string;
  onEventFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Task / Event</span>
                <select
                  value={eventFilter}
                  onChange={(e) => onEventFilterChange(e.target.value)}
                  className="input w-full min-w-32 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by event"
                >
                  <option value="all">All events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            </th>
            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Priority</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => onPriorityFilterChange(e.target.value)}
                  className="input w-full min-w-32 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by priority"
                >
                  <option value="all">All priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </th>
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
              <tr
                key={t.id}
                className="border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <TaskDetailDialog
                    task={t}
                    events={events}
                    profiles={profiles}
                    canEdit={editable}
                    isAdmin={isAdmin}
                    onUpdated={onUpdated}
                    onDeleted={onDeleted}
                  >
                    <span className="cursor-pointer font-medium hover:underline">
                      {t.name}
                    </span>
                  </TaskDetailDialog>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={PRIORITY_COLOR[t.priority]}>
                    {t.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={t.status}
                    disabled={!editable}
                    onChange={(e) =>
                      onStatusChange(t.id, e.target.value as TaskStatus)
                    }
                    className="input w-auto py-1 text-xs"
                  >
                    {STATUS_COLUMNS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t.due_date ? formatDate(t.due_date) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(t.assignees ?? []).map((a) => a.full_name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {urgency !== "can_wait" ? (
                    <Badge
                      variant={
                        urgency === "overdue" || urgency === "critical"
                          ? "red"
                          : urgency === "urgent"
                            ? "orange"
                            : "yellow"
                      }
                    >
                      {style.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {tasks.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                No tasks found for these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function CreateTaskDialog({
  events,
  profiles,
  onCreated,
}: {
  events: WeddingEvent[];
  profiles: Profile[];
  onCreated: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [dueDate, setDueDate] = useState("");
  const [eventId, setEventId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function submit() {
    if (!name.trim() || saving) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        event_id: eventId || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      alert(error?.message ?? "Could not create task.");
      setSaving(false);
      return;
    }

    if (assigneeIds.length) {
      const { error: assigneeError } = await supabase
        .from("task_assignees")
        .insert(assigneeIds.map((user_id) => ({ task_id: data.id, user_id })));

      if (assigneeError) {
        await supabase.from("tasks").delete().eq("id", data.id);
        alert(`Task assignments could not be saved: ${assigneeError.message}`);
        setSaving(false);
        return;
      }
    }

    const assignees = profiles
      .filter((p) => assigneeIds.includes(p.id))
      .map((p) => ({ id: p.id, full_name: p.full_name }));

    onCreated({ ...data, assignees } as Task);

    setName("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setStatus("not_started");
    setDueDate("");
    setEventId("");
    setAssigneeIds([]);
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Task name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Book photographer"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Description</label>
            <textarea
              className="input min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Ceremony"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {STATUS_COLUMNS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Due date</label>
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Event</label>
            <select
              className="input"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">No event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Assign to</label>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {profiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(p.id)}
                    onChange={(e) =>
                      setAssigneeIds((prev) =>
                        e.target.checked
                          ? [...prev, p.id]
                          : prev.filter((id) => id !== p.id)
                      )
                    }
                  />
                  {p.full_name}
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void submit()}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportTasksDialog({
  events,
  existingTasks,
  onImported,
}: {
  events: WeddingEvent[];
  existingTasks: Task[];
  onImported: (tasks: Task[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function readFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return;

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    setRows(
      lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
      })
    );
  }

  async function importTasks() {
    if (!rows.length || saving) return;
    setSaving(true);

    const existingNames = new Set(
      existingTasks.map((t) => t.name.trim().toLowerCase())
    );

    const newRows = rows.filter(
      (r) =>
        r.name?.trim() &&
        !existingNames.has(r.name.trim().toLowerCase())
    );

    const payload = newRows.map((r) => ({
      name: r.name.trim(),
      description: r.description || null,
      category: r.category || null,
      priority: (
        ["critical", "high", "medium", "low"].includes(r.priority)
          ? r.priority
          : "medium"
      ) as TaskPriority,
      status: (
        STATUS_COLUMNS.some((s) => s.id === r.status)
          ? r.status
          : "not_started"
      ) as TaskStatus,
      due_date: r.due_date || null,
      event_id:
        events.find((e) => e.name.toLowerCase() === r.event?.toLowerCase())?.id ??
        null,
    }));

    if (!payload.length) {
      alert("No new tasks to import.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("*");

    if (error || !data) {
      alert(error?.message ?? "Could not import tasks.");
      setSaving(false);
      return;
    }

    onImported(data as Task[]);
    setRows([]);
    setFileName("");
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-1.5 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            CSV columns: name, description, category, priority, status, due_date,
            event. Duplicate task names are skipped.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
            }}
            className="input"
          />
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Loaded: {fileName} ({rows.length} rows)
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => void importTasks()}
            disabled={!rows.length || saving}
          >
            {saving ? "Importing..." : "Import Tasks"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailDialog({
  task,
  events,
  profiles,
  canEdit,
  isAdmin,
  onUpdated,
  onDeleted,
  controlledOpen,
  onOpenChange,
  children,
}: {
  task: Task;
  events: WeddingEvent[];
  profiles: Profile[];
  canEdit: boolean;
  isAdmin: boolean;
  onUpdated?: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ? true : internalOpen;

  const setOpen = (value: boolean) => {
    if (controlledOpen) onOpenChange?.(value);
    else setInternalOpen(value);
  };

  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState(task.category ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [eventId, setEventId] = useState(task.event_id ?? "");
  const [saving, setSaving] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    (task.assignees ?? []).map((a) => a.id)
  );

  const supabase = createClient();

  async function save() {
    if (!canEdit || saving) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("tasks")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        event_id: eventId || null,
      })
      .eq("id", task.id)
      .select("*")
      .single();

    if (error || !data) {
      alert(error?.message ?? "Could not update task.");
      setSaving(false);
      return;
    }

    const { error: clearAssigneesError } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", task.id);

    if (clearAssigneesError) {
      alert(`Task details saved, but assignments could not be updated: ${clearAssigneesError.message}`);
      setSaving(false);
      return;
    }

    if (assigneeIds.length) {
      const { error: assigneeError } = await supabase
        .from("task_assignees")
        .insert(assigneeIds.map((user_id) => ({ task_id: task.id, user_id })));

      if (assigneeError) {
        alert(`Task details saved, but assignments could not be updated: ${assigneeError.message}`);
        setSaving(false);
        return;
      }
    }

    const assignees = profiles
      .filter((p) => assigneeIds.includes(p.id))
      .map((p) => ({ id: p.id, full_name: p.full_name }));

    const updated = { ...task, ...data, assignees } as Task;
    onUpdated?.(updated);

    if (status === "completed" && task.status !== "completed") {
      fireConfetti();
    }

    setSaving(false);
    setOpen(false);
  }

  async function deleteTask() {
    if (!isAdmin || saving) return;
    if (!confirm(`Delete "${task.name}"? This cannot be undone.`)) return;

    setSaving(true);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    onDeleted?.(task.id);
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Task name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Description</label>
            <textarea
              className="input min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={!canEdit}
              >
                {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={!canEdit}
              >
                {STATUS_COLUMNS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Due date</label>
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Event</label>
            <select
              className="input"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={!canEdit}
            >
              <option value="">No event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Assigned to</label>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {profiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(p.id)}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setAssigneeIds((prev) =>
                        e.target.checked
                          ? [...prev, p.id]
                          : prev.filter((id) => id !== p.id)
                      )
                    }
                  />
                  {p.full_name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {canEdit && (
              <Button
                className="flex-1"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={() => void deleteTask()}
                disabled={saving}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            )}
          </div>

          <TaskComments taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
