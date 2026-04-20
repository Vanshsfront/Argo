"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  PRODUCTION_STAGES,
  PLATFORMS,
  FORMATS,
  type ContentItem,
  type ProductionStage,
} from "@/lib/types";
import ContentDetail from "./ContentDetail";
import { PageContainer } from "./ui/PageContainer";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { cn } from "@/lib/cn";
import { KanbanIcon, ListIcon, PlusIcon } from "./ui/Icon";

const COLOR_CLASSES = [
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  { bg: "bg-coral-50", border: "border-coral-200", text: "text-coral-700" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
];

const PROD_ACCENT: Record<ProductionStage, string> = {
  Brief: "slate",
  Scripting: "sky",
  Review: "amber",
  Approved: "violet",
  Posted: "emerald",
};
const PROD_CHIP: Record<ProductionStage, string> = {
  Brief: "stage-slate",
  Scripting: "stage-sky",
  Review: "stage-amber",
  Approved: "stage-violet",
  Posted: "stage-emerald",
};

export default function ProductionBoard() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<{ id: number; full_name: string }[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [velocity, setVelocity] = useState<{ completed: number; target: number }>({ completed: 0, target: 10 });
  const [filters, setFilters] = useState({ client_id: "", platform: "", status: "" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const [ci, cl, v] = await Promise.all([
      fetch("/api/content?production=1").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/production/velocity").then((r) => r.json()),
    ]);
    setItems(ci.items || []);
    setClients((cl.clients || []).map((c: any) => ({ id: c.id, full_name: c.full_name })));
    setVelocity(v);
  }
  useEffect(() => { load(); }, []);

  const colorFor = (clientId: number) => COLOR_CLASSES[clientId % COLOR_CLASSES.length];

  const grouped = useMemo(() => {
    const g: Record<string, ContentItem[]> = {};
    for (const s of PRODUCTION_STAGES) g[s] = [];
    for (const it of items) (g[it.production_stage] ||= []).push(it);
    return g;
  }, [items]);

  async function moveStage(id: number, stage: ProductionStage) {
    const item = items.find((i) => i.id === id);
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, production_stage: stage } : i)));
    await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ production_stage: stage }),
    });
    if (stage === "Posted" && item) {
      if (confirm(`Log performance for ${item.client_name}?`)) setDetailId(id);
    }
    load();
  }

  function onDragEnd(e: any) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const stage = over.id as ProductionStage;
    if (!PRODUCTION_STAGES.includes(stage)) return;
    const id = Number(active.id);
    const it = items.find((i) => i.id === id);
    if (!it || it.production_stage === stage) return;
    moveStage(id, stage);
  }

  const filtered = items.filter((i) =>
    (!filters.client_id || i.client_id === Number(filters.client_id)) &&
    (!filters.platform || i.platform === filters.platform) &&
    (!filters.status || i.production_stage === filters.status),
  );

  async function updateTarget(n: number) {
    await fetch("/api/production/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekly_script_target: n }),
    });
    setVelocity((v) => ({ ...v, target: n }));
  }

  const pct = velocity.target ? Math.min(100, Math.round((velocity.completed / velocity.target) * 100)) : 0;

  return (
    <PageContainer
      title="Content Production"
      size="wide"
      action={
        <>
          <div className="tab-list">
            <button className={cn("tab flex items-center gap-1.5", view === "kanban" && "tab-active")} onClick={() => setView("kanban")}>
              <KanbanIcon className="w-4 h-4" /> <span className="hidden sm:inline">Kanban</span>
            </button>
            <button className={cn("tab flex items-center gap-1.5", view === "list" && "tab-active")} onClick={() => setView("list")}>
              <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
            </button>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <PlusIcon className="w-4 h-4" /> Brief
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Card>
          <div className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <div>
                <span className="font-semibold text-text-primary tabular-nums">{velocity.completed}</span>
                <span className="text-text-secondary"> / {velocity.target} scripts done this week</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span>Weekly target</span>
                <input
                  type="number"
                  className="input w-20 py-1.5 tabular-nums"
                  value={velocity.target}
                  onChange={(e) => updateTarget(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="mt-3 h-2.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  pct >= 100 ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-teal-400 via-violet-500 to-coral-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>

        {view === "list" && (
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={filters.client_id} onChange={(e) => setFilters((f) => ({ ...f, client_id: e.target.value }))}>
              <option value="">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select className="input w-auto" value={filters.platform} onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All stages</option>
              {PRODUCTION_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        {view === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e) => setActiveId(Number(e.active.id))}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {PRODUCTION_STAGES.map((s) => (
                <Col key={s} stage={s} items={grouped[s] || []} colorFor={colorFor} onOpen={setDetailId} />
              ))}
            </div>
            <DragOverlay>
              {activeId != null &&
                (() => {
                  const it = items.find((i) => i.id === activeId);
                  return it ? <ProdCard it={it} color={colorFor(it.client_id)} /> : null;
                })()}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card>
            <div className="overflow-auto rounded-[inherit]">
              <table className="argo-table">
                <thead>
                  <tr><th>Title</th><th>Client</th><th>Platform</th><th>Format</th><th>Stage</th><th>Due</th></tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const color = colorFor(i.client_id);
                    return (
                      <tr key={i.id} className="cursor-pointer" onClick={() => setDetailId(i.id)}>
                        <td className="font-medium">{i.title}</td>
                        <td>
                          <span className={cn("chip", color.bg, color.border, color.text)}>
                            {i.client_name}
                          </span>
                        </td>
                        <td>{i.platform || "—"}</td>
                        <td>{i.format || "—"}</td>
                        <td><span className={cn("stage-chip", PROD_CHIP[i.production_stage])}>{i.production_stage}</span></td>
                        <td className="tabular-nums">{i.due_date || "—"}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-text-tertiary text-center py-6">No items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {detailId !== null && <ContentDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
        {creating && (
          <NewBriefModal
            clients={clients}
            onClose={() => setCreating(false)}
            onCreated={() => { setCreating(false); load(); }}
          />
        )}
      </div>
    </PageContainer>
  );
}

function Col({
  stage,
  items,
  colorFor,
  onOpen,
}: {
  stage: ProductionStage;
  items: ContentItem[];
  colorFor: (id: number) => (typeof COLOR_CLASSES)[number];
  onOpen: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      data-accent={PROD_ACCENT[stage]}
      className={cn("kanban-col", isOver && "bg-surface")}
    >
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-1">
        <span className={cn("stage-chip", PROD_CHIP[stage])}>{stage}</span>
        <div className="text-[10px] font-medium text-text-tertiary tabular-nums bg-surface px-1.5 py-0.5 rounded-full border border-border-light">
          {items.length}
        </div>
      </div>
      <div className="flex-1 space-y-2 min-h-[40px]">
        {items.map((it) => (
          <Drag key={it.id} it={it} color={colorFor(it.client_id)} onOpen={() => onOpen(it.id)} />
        ))}
      </div>
    </div>
  );
}

function Drag({
  it,
  color,
  onOpen,
}: {
  it: ContentItem;
  color: (typeof COLOR_CLASSES)[number];
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: it.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <div onClick={onOpen}><ProdCard it={it} color={color} /></div>
    </div>
  );
}

function ProdCard({
  it,
  color,
}: {
  it: ContentItem;
  color: (typeof COLOR_CLASSES)[number];
}) {
  return (
    <div className="kanban-card">
      <div className="font-medium text-text-primary truncate">{it.title}</div>
      <div className={cn("chip mt-1.5", color.bg, color.border, color.text)}>{it.client_name}</div>
      <div className="text-[11px] text-text-tertiary mt-1.5 flex justify-between tabular-nums">
        <span>{it.platform || "—"} · {it.format || "—"}</span>
        {it.due_date && <span>{it.due_date}</span>}
      </div>
    </div>
  );
}

function NewBriefModal({
  clients,
  onClose,
  onCreated,
}: {
  clients: { id: number; full_name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState<number | null>(clients[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [format, setFormat] = useState("Short Video");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !title.trim()) return;
    setBusy(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: title.trim(),
        platform,
        format,
        due_date: due || null,
        production_stage: "Brief",
      }),
    });
    setBusy(false);
    onCreated();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New brief"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!clientId} isLoading={busy}>Create</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Client">
          <select className="input" value={clientId ?? ""} onChange={(e) => setClientId(Number(e.target.value) || null)}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </Field>
        <Field label="Title">
          <input autoFocus className="input" placeholder="Title / working title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Format">
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Due">
            <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
