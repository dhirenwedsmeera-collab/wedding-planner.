"use client";

import { useMemo, useState } from "react";
import {
  Table2,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  WeddingEvent,
  Profile,
} from "@/types/domain";
import {
  getTaskUrgency,
  URGENCY_STYLES,
  formatDate,
} from "@/lib/utils";
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

const PRIORITY_COLOR: Record<
  TaskPriority,
  "red" | "orange" | "yellow" | "green"
> = {
  critical: "red",
  high: "orange",
  medium: "yellow",
  low: "green",
};

const TASK_CATEGORIES = [
  "Planning & coordination",
  "Final month",
  "Budget & payments",
  "Venue",
  "Suppliers & bookings",
  "Décor & styling",
  "Stationery & signage",
  "Ceremony supplies",
  "Guest arrangements",
  "Favours & guest experience",
  "Food & drinks",
  "Entertainment & activities",
  "Photography & videography",
  "Outfits & personal preparation",
];

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

  const [eventFilter, setEventFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateSort, setDueDateSort] = useState("default");

  const [completedOpen, setCompletedOpen] = useState(false);

  const supabase = createClient();
  const isAdmin = currentUser?.role === "admin";

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (eventFilter !== "all") {
      result = result.filter((t) => t.event_id === eventFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (t) => (t.category ?? "") === categoryFilter
      );
    }

    if (assigneeFilter !== "all") {
      result = result.filter((t) =>
        (t.assignees ?? []).some(
          (assignee) => assignee.id === assigneeFilter
        )
      );
    }

    if (dueDateSort === "earliest") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return (
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime()
        );
      });
    }

    if (dueDateSort === "latest") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return (
          new Date(b.due_date).getTime() -
          new Date(a.due_date).getTime()
        );
      });
    }

    return result;
  }, [
    tasks,
    eventFilter,
    priorityFilter,
    statusFilter,
    categoryFilter,
    assigneeFilter,
    dueDateSort,
  ]);

  const activeTasks = useMemo(
    () =>
      filteredTasks.filter(
        (t) => String(t.status).toLowerCase() !== "completed"
      ),
    [filteredTasks]
  );

  const completedTasks = useMemo(
    () =>
      filteredTasks.filter(
        (t) => String(t.status).toLowerCase() === "completed"
      ),
    [filteredTasks]
  );

  const categories = TASK_CATEGORIES;

  function canEdit(t: Task) {
    return (
      isAdmin ||
      (t.assignees ?? []).some(
        (a) => a.id === currentUser?.id
      )
    );
  }

  function updateTask(updatedTask: Task) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === updatedTask.id ? updatedTask : t
      )
    );

    setSelectedTask((prev) =>
      prev?.id === updatedTask.id
        ? updatedTask
        : prev
    );
  }

  function removeTask(taskId: string) {
    setTasks((prev) =>
      prev.filter((t) => t.id !== taskId)
    );

    setSelectedTask((prev) =>
      prev?.id === taskId ? null : prev
    );
  }

  async function moveTask(
    id: string,
    status: TaskStatus
  ) {
    const task = tasks.find((t) => t.id === id);

    if (!task || !canEdit(task) || task.status === status) {
      return;
    }

    const previousStatus = task.status;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status } : t
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id);

    if (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: previousStatus }
            : t
        )
      );

      alert(
        "Couldn't update the task status. Please try again."
      );
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
            <Table2 className="h-3.5 w-3.5" />
            Table
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              view === "calendar"
                ? "bg-emerald-700 text-white"
                : "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Calendar
          </button>
        </div>

        {isAdmin && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ImportTasksDialog
              events={events}
              existingTasks={tasks}
              onImported={(created) =>
                setTasks((prev) => [
                  ...created,
                  ...prev,
                ])
              }
            />

            <CreateTaskDialog
              events={events}
              profiles={profiles}
              onCreated={(t) =>
                setTasks((prev) => [t, ...prev])
              }
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
          categories={categories}
          eventFilter={eventFilter}
          onEventFilterChange={setEventFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          dueDateSort={dueDateSort}
          onDueDateSortChange={setDueDateSort}
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
          onClick={() =>
            setCompletedOpen((open) => !open)
          }
          aria-expanded={completedOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
        >
          <div>
            <p className="text-sm font-semibold">
              Completed
            </p>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length}{" "}
              {completedTasks.length === 1
                ? "task"
                : "tasks"}{" "}
              finished
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
                No completed tasks yet. Finished tasks
                will appear here.
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
                    <Badge variant="green">
                      Completed
                    </Badge>

                    {canEdit(task) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void moveTask(
                            task.id,
                            "not_started"
                          )
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
          onOpenChange={(o) =>
            !o && setSelectedTask(null)
          }
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
  categories,
  eventFilter,
  onEventFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  dueDateSort,
  onDueDateSortChange,
}: {
  tasks: Task[];
  onStatusChange: (
    id: string,
    s: TaskStatus
  ) => void;
  canEdit: (t: Task) => boolean;
  isAdmin: boolean;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
  events: WeddingEvent[];
  profiles: Profile[];
  categories: string[];
  eventFilter: string;
  onEventFilterChange: (
    value: string
  ) => void;
  priorityFilter: string;
  onPriorityFilterChange: (
    value: string
  ) => void;
  statusFilter: string;
  onStatusFilterChange: (
    value: string
  ) => void;
  categoryFilter: string;
  onCategoryFilterChange: (
    value: string
  ) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (
    value: string
  ) => void;
  dueDateSort: string;
  onDueDateSortChange: (
    value: string
  ) => void;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">
              Task
            </th>

            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Event</span>
                <select
                  value={eventFilter}
                  onChange={(e) =>
                    onEventFilterChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-28 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by event"
                >
                  <option value="all">
                    All events
                  </option>
                  <option value="">
                    No event
                  </option>
                  {events.map((event) => (
                    <option
                      key={event.id}
                      value={event.id}
                    >
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Category</span>
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    onCategoryFilterChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-28 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by category"
                >
                  <option value="all">
                    All categories
                  </option>
                  <option value="">
                    No category
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
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
                  onChange={(e) =>
                    onPriorityFilterChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-28 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by priority"
                >
                  <option value="all">
                    All priorities
                  </option>
                  <option value="critical">
                    Critical
                  </option>
                  <option value="high">
                    High
                  </option>
                  <option value="medium">
                    Medium
                  </option>
                  <option value="low">
                    Low
                  </option>
                </select>
              </div>
            </th>

            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    onStatusFilterChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-32 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by status"
                >
                  <option value="all">
                    All statuses
                  </option>
                  {STATUS_COLUMNS.filter(
                    (status) =>
                      status.id !== "completed"
                  ).map((status) => (
                    <option
                      key={status.id}
                      value={status.id}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Due Date</span>
                <select
                  value={dueDateSort}
                  onChange={(e) =>
                    onDueDateSortChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-32 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Sort tasks by due date"
                >
                  <option value="default">
                    Default order
                  </option>
                  <option value="earliest">
                    Earliest first
                  </option>
                  <option value="latest">
                    Latest first
                  </option>
                </select>
              </div>
            </th>

            <th className="px-4 py-3 align-top">
              <div className="space-y-2">
                <span>Assigned</span>
                <select
                  value={assigneeFilter}
                  onChange={(e) =>
                    onAssigneeFilterChange(
                      e.target.value
                    )
                  }
                  className="input w-full min-w-32 py-1 text-xs font-normal normal-case tracking-normal"
                  aria-label="Filter tasks by assignee"
                >
                  <option value="all">
                    Everyone
                  </option>
                  <option value="">
                    Unassigned
                  </option>
                  {profiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </th>

            <th className="px-4 py-3">
              Urgency
            </th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((t) => {
            const urgency = getTaskUrgency(
              t.due_date,
              t.status
            );
            const style =
              URGENCY_STYLES[urgency];
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

                <td className="px-4 py-3 text-muted-foreground">
                  {events.find(
                    (event) =>
                      event.id === t.event_id
                  )?.name ?? "—"}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {t.category || "—"}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    variant={
                      PRIORITY_COLOR[t.priority]
                    }
                  >
                    {t.priority}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={t.status}
                    disabled={!editable}
                    onChange={(e) =>
                      onStatusChange(
                        t.id,
                        e.target
                          .value as TaskStatus
                      )
                    }
                    className="input w-auto py-1 text-xs"
                  >
                    {STATUS_COLUMNS.map(
                      (s) => (
                        <option
                          key={s.id}
                          value={s.id}
                        >
                          {s.label}
                        </option>
                      )
                    )}
                  </select>
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {t.due_date
                    ? formatDate(t.due_date)
                    : "—"}
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(t.assignees ?? [])
                    .map(
                      (a) => a.full_name
                    )
                    .join(", ") || "—"}
                </td>

                <td className="px-4 py-3">
                  {urgency !==
                  "can_wait" ? (
                    <Badge
                      variant={
                        urgency ===
                          "overdue" ||
                        urgency ===
                          "critical"
                          ? "red"
                          : urgency ===
                              "urgent"
                            ? "orange"
                            : "yellow"
                      }
                    >
                      {style.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {tasks.length === 0 && (
            <tr>
              <td
                colSpan={8}
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
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState("");
  const [priority, setPriority] =
    useState<TaskPriority>("medium");
  const [status, setStatus] =
    useState<TaskStatus>("not_started");
  const [dueDate, setDueDate] =
    useState("");
  const [eventId, setEventId] =
    useState("");
  const [assigneeIds, setAssigneeIds] =
    useState<string[]>([]);
  const [saving, setSaving] =
    useState(false);

  const supabase = createClient();

  async function submit() {
    if (!name.trim() || saving) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        name: name.trim(),
        description:
          description.trim() || null,
        category: category.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        event_id: eventId || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      alert(
        error?.message ??
          "Could not create task."
      );
      setSaving(false);
      return;
    }

    if (assigneeIds.length) {
      const { error: assigneeError } =
        await supabase
          .from("task_assignees")
          .insert(
            assigneeIds.map((user_id) => ({
              task_id: data.id,
              user_id,
            }))
          );

      if (assigneeError) {
        await supabase
          .from("tasks")
          .delete()
          .eq("id", data.id);

        alert(
          `Task assignments could not be saved: ${assigneeError.message}`
        );
        setSaving(false);
        return;
      }
    }

    const assignees = profiles
      .filter((p) =>
        assigneeIds.includes(p.id)
      )
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
      }));

    onCreated({
      ...data,
      assignees,
    } as Task);

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
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">
              Task name
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Book photographer"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">
              Description
            </label>
            <textarea
              className="input min-h-20"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">
              Category
            </label>
            <select
              className="input"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              <option value="">No category</option>
              {TASK_CATEGORIES.map((taskCategory) => (
                <option key={taskCategory} value={taskCategory}>
                  {taskCategory}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">
                Priority
 
