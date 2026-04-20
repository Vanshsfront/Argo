"use client";
import { useEffect, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon, CloseIcon, DragIcon, PlusIcon } from "@/components/ui/Icon";

type Task = {
  id: number;
  title: string;
  due_date: string | null;
  tag: string | null;
  client_id: number | null;
  client_name: string | null;
  completed: boolean;
  sort_order: number;
};

type Filter = "today" | "all" | "done";

export default function TodoList({ clientId }: { clientId?: number }) {
  const [filter, setFilter] = useState<Filter>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [done, setDone] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const openScope = filter === "today" ? "today" : "open";
    const qs = new URLSearchParams({ scope: openScope });
    if (clientId) qs.set("client_id", String(clientId));
    const [openRes, doneRes] = await Promise.all([
      fetch(`/api/tasks?${qs.toString()}`).then((r) => r.json()),
      fetch(`/api/tasks?scope=done${clientId ? `&client_id=${clientId}` : ""}`).then((r) => r.json()),
    ]);
    setTasks(openRes.tasks || []);
    setDone(doneRes.tasks || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter, clientId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        due_date: due || null,
        tag: tag.trim() || null,
        client_id: clientId || null,
      }),
    });
    if (res.ok) {
      setTitle(""); setDue(""); setTag("");
      load();
    }
  }

  async function toggle(t: Task) {
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    });
    load();
  }

  async function remove(t: Task) {
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    load();
  }

  async function edit(t: Task, patch: Partial<Task>) {
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: any) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = tasks.findIndex((t) => t.id === active.id);
    const newIdx = tasks.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(tasks, oldIdx, newIdx);
    setTasks(next);
    fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: next.map((t) => t.id) }),
    });
  }

  const visible = filter === "done" ? done : tasks;

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-col md:flex-row gap-2">
        <input
          className="input md:flex-1"
          placeholder="Add a task — press Enter"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <input type="date" className="input md:w-40" value={due} onChange={(e) => setDue(e.target.value)} />
          {!clientId && (
            <input className="input md:w-36" placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          )}
          <Button variant="primary" type="submit" size="md">
            <PlusIcon className="w-4 h-4" />
            Add
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-1">
        <div className="tab-list">
          {(["today", "all", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn("tab", filter === f && "tab-active")}
            >
              {f === "today" ? "Today" : f === "all" ? "All open" : "Done"}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-text-tertiary">
          {loading ? "Loading…" : `${visible.length} ${visible.length === 1 ? "item" : "items"}`}
        </div>
      </div>

      {filter !== "done" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="rounded-2xl bg-surface border border-border-light divide-y divide-border-light overflow-hidden">
              {visible.map((t) => (
                <SortableRow key={t.id} task={t} onToggle={toggle} onDelete={remove} onEdit={edit} />
              ))}
              {visible.length === 0 && !loading && (
                <li className="p-6 text-sm text-text-tertiary text-center">
                  Nothing to do. Add your first task above.
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="rounded-2xl bg-surface border border-border-light divide-y divide-border-light overflow-hidden">
          {done.map((t) => (
            <StaticRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
          ))}
          {done.length === 0 && (
            <li className="p-6 text-sm text-text-tertiary text-center">Nothing completed yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function SortableRow({ task, onToggle, onDelete, onEdit }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const overdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 px-3 py-2.5 hover:bg-surface-secondary/60">
      <button
        className="w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-md cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag"
      >
        <DragIcon className="w-4 h-4" strokeWidth={2} />
      </button>

      <Check checked={!!task.completed} onClick={() => onToggle(task)} />

      <div className="flex-1 min-w-0">
        <InlineEdit value={task.title} onSave={(v) => onEdit(task, { title: v })} />
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {task.client_name && <span className="chip">{task.client_name}</span>}
          {task.tag && <span className="chip">{task.tag}</span>}
          {task.due_date && (
            <span className={cn("chip", overdue && "text-rose-600 border-rose-200 bg-rose-50")}>
              Due {task.due_date}
            </span>
          )}
        </div>
      </div>

      <button
        className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-rose-600 hover:bg-surface-secondary"
        aria-label="Delete"
        onClick={() => onDelete(task)}
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function StaticRow({ task, onToggle, onDelete }: any) {
  return (
    <li className="flex items-center gap-2 px-3 py-2.5">
      <div className="w-6" />
      <Check checked={!!task.completed} onClick={() => onToggle(task)} />
      <div className="flex-1 min-w-0">
        <div className="truncate line-through text-text-tertiary text-sm">{task.title}</div>
        <div className="flex flex-wrap gap-1.5 text-xs text-text-tertiary mt-0.5">
          {task.client_name && <span className="chip">{task.client_name}</span>}
          {task.tag && <span className="chip">{task.tag}</span>}
        </div>
      </div>
      <button
        className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-rose-600 hover:bg-surface-secondary"
        aria-label="Delete"
        onClick={() => onDelete(task)}
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function Check({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 shrink-0",
        checked
          ? "bg-text-primary text-background"
          : "bg-surface border border-border hover:border-text-secondary",
      )}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      {checked && <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />}
    </button>
  );
}

function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (!editing) {
    return (
      <button
        className="block text-left text-sm text-text-primary truncate w-full hover:text-text-secondary"
        onClick={() => setEditing(true)}
      >
        {value}
      </button>
    );
  }
  return (
    <input
      className="input py-1.5"
      value={v}
      autoFocus
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (v.trim() && v !== value) onSave(v.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") { setV(value); setEditing(false); }
      }}
    />
  );
}
