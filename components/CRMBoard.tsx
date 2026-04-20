"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { PROSPECT_STAGES, type Prospect, type ProspectStage } from "@/lib/types";
import ProspectDetail from "./ProspectDetail";
import { fmtMoney } from "@/lib/serialize";
import { PageContainer } from "./ui/PageContainer";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { cn } from "@/lib/cn";
import { KanbanIcon, ListIcon, PlusIcon } from "./ui/Icon";

type P = Prospect & { notes: { id: number; body: string; created_at: string }[] };

const STAGE_ACCENT: Record<ProspectStage, string> = {
  Identified: "slate",
  Contacted: "sky",
  Responded: "teal",
  "Discovery Call": "violet",
  "Proposal Sent": "amber",
  Negotiating: "coral",
  "Closed Won": "emerald",
  "Closed Lost": "rose",
};
const STAGE_CHIP: Record<ProspectStage, string> = {
  Identified: "stage-slate",
  Contacted: "stage-sky",
  Responded: "stage-teal",
  "Discovery Call": "stage-violet",
  "Proposal Sent": "stage-amber",
  Negotiating: "stage-coral",
  "Closed Won": "stage-emerald",
  "Closed Lost": "stage-rose",
};

export default function CRMBoard() {
  const sp = useSearchParams();
  const router = useRouter();
  const focusedStage = sp.get("stage");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [prospects, setProspects] = useState<P[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterStage, setFilterStage] = useState<string>(focusedStage || "");
  const [filterSource, setFilterSource] = useState<string>("");
  const [minValue, setMinValue] = useState<number>(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const r = await fetch("/api/prospects").then((r) => r.json());
    setProspects(r.prospects || []);
  }
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const by: Record<string, P[]> = {};
    for (const s of PROSPECT_STAGES) by[s] = [];
    for (const p of prospects) { (by[p.stage] ||= []).push(p); }
    return by;
  }, [prospects]);

  async function moveStage(id: number, stage: ProspectStage) {
    setProspects((arr) => arr.map((p) => (p.id === id ? { ...p, stage } : p)));
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (stage === "Closed Won") {
      if (confirm(`Create client workspace for ${prospects.find((p) => p.id === id)?.full_name}?`)) {
        const res = await fetch(`/api/prospects/${id}/convert`, { method: "POST" });
        if (res.ok) {
          const { client } = await res.json();
          if (client?.id) router.push(`/clients/${client.id}`);
        }
      }
    }
    load();
  }

  function onDragEnd(e: any) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const targetStage = over.id as ProspectStage;
    if (!PROSPECT_STAGES.includes(targetStage)) return;
    const id = Number(active.id);
    const p = prospects.find((x) => x.id === id);
    if (!p || p.stage === targetStage) return;
    moveStage(id, targetStage);
  }

  const filtered = prospects.filter((p) =>
    (!filterStage || p.stage === filterStage) &&
    (!filterSource || (p.lead_source || "").toLowerCase().includes(filterSource.toLowerCase())) &&
    (!minValue || (p.deal_value || 0) >= minValue),
  );

  return (
    <PageContainer
      title="CRM / Sales"
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
            <PlusIcon className="w-4 h-4" /> Prospect
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {view === "list" && (
          <div className="flex flex-wrap items-center gap-2">
            <select className="input w-auto" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
              <option value="">All stages</option>
              {PROSPECT_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="input w-auto" placeholder="Source contains…" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} />
            <input type="number" className="input w-32" placeholder="Min value" value={minValue || ""} onChange={(e) => setMinValue(Number(e.target.value) || 0)} />
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
              {PROSPECT_STAGES.map((s) => (
                <Column key={s} stage={s} items={grouped[s] || []} onOpen={setDetailId} highlight={focusedStage === s} />
              ))}
            </div>
            <DragOverlay>
              {activeId != null && <DragCard p={prospects.find((p) => p.id === activeId)!} />}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card>
            <div className="overflow-auto rounded-[inherit]">
              <table className="argo-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Stage</th><th>Value</th><th>Source</th><th>Next follow-up</th><th>Days in stage</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setDetailId(p.id)}>
                      <td className="font-medium">{p.full_name}</td>
                      <td><span className={cn("stage-chip", STAGE_CHIP[p.stage])}>{p.stage}</span></td>
                      <td className="tabular-nums">{fmtMoney(p.deal_value)}</td>
                      <td>{p.lead_source || "—"}</td>
                      <td className="tabular-nums">{p.next_follow_up || "—"}</td>
                      <td className="tabular-nums">{daysSince(p.stage_entered_at)}d</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-text-tertiary text-center py-6">No prospects match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {detailId !== null && (
          <ProspectDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} />
        )}
        {creating && (
          <NewProspectModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />
        )}
      </div>
    </PageContainer>
  );
}

function Column({
  stage,
  items,
  onOpen,
  highlight,
}: {
  stage: ProspectStage;
  items: P[];
  onOpen: (id: number) => void;
  highlight?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      data-accent={STAGE_ACCENT[stage]}
      className={cn(
        "kanban-col",
        isOver && "bg-surface",
        highlight && "ring-2 ring-coral-400/50 ring-offset-2 ring-offset-[var(--background)]",
      )}
    >
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-1">
        <span className={cn("stage-chip", STAGE_CHIP[stage])}>{stage}</span>
        <div className="text-[10px] font-medium text-text-tertiary tabular-nums bg-surface px-1.5 py-0.5 rounded-full border border-border-light">
          {items.length}
        </div>
      </div>
      <div className="flex-1 space-y-2 min-h-[40px]">
        {items.map((p) => (
          <DraggableCard key={p.id} p={p} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ p, onOpen }: { p: P; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <div onClick={onOpen}><DragCard p={p} /></div>
    </div>
  );
}

function DragCard({ p }: { p: P }) {
  const overdue = p.next_follow_up && new Date(p.next_follow_up) < new Date(new Date().toDateString());
  return (
    <div className="kanban-card">
      <div className="font-medium text-text-primary truncate">{p.full_name}</div>
      <div className="text-[11px] text-text-secondary flex items-center justify-between mt-1 tabular-nums">
        <span>{fmtMoney(p.deal_value || 0)}/mo</span>
        <span>{daysSince(p.stage_entered_at)}d in stage</span>
      </div>
      {p.next_follow_up && (
        <div className={cn("text-[11px] mt-1 tabular-nums", overdue ? "text-rose-600" : "text-text-tertiary")}>
          Follow up {p.next_follow_up}
        </div>
      )}
    </div>
  );
}

function daysSince(iso: string) {
  if (!iso) return 0;
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return Math.max(0, Math.floor(d));
}

function NewProspectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [niche, setNiche] = useState("");
  const [value, setValue] = useState(0);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/prospects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        full_name: name.trim(),
        platform,
        niche,
        deal_value: value,
        lead_source: source,
      }),
    });
    setBusy(false);
    onCreated();
  }
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New prospect"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} isLoading={busy}>Create</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input autoFocus className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {["Instagram", "LinkedIn", "Referral", "Inbound DM", "Other"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Niche">
            <input className="input" value={niche} onChange={(e) => setNiche(e.target.value)} />
          </Field>
          <Field label="Deal value / month">
            <input type="number" className="input tabular-nums" value={value || ""} onChange={(e) => setValue(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Lead source">
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
