"use client";
import { useEffect, useMemo, useState } from "react";
import type { ContentItem } from "@/lib/types";
import { CONTENT_STATUSES, PLATFORMS, FORMATS } from "@/lib/types";
import ContentDetail from "./ContentDetail";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { cn } from "@/lib/cn";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KanbanIcon,
  ListIcon,
  PlusIcon,
} from "./ui/Icon";

type View = "calendar" | "list";

export default function ContentCalendar({ clientId }: { clientId: number }) {
  const [view, setView] = useState<View>("calendar");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [filters, setFilters] = useState<{ status: string; platform: string }>({ status: "", platform: "" });
  const [detailId, setDetailId] = useState<number | null>(null);
  const [newForDate, setNewForDate] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/content?client_id=${clientId}`).then((r) => r.json());
    setItems(r.items || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  const filtered = useMemo(() =>
    items.filter((i) =>
      (!filters.status || i.status === filters.status) &&
      (!filters.platform || i.platform === filters.platform),
    ), [items, filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="tab-list">
          <button className={cn("tab flex items-center gap-1.5", view === "calendar" && "tab-active")} onClick={() => setView("calendar")}>
            <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Calendar</span>
          </button>
          <button className={cn("tab flex items-center gap-1.5", view === "list" && "tab-active")} onClick={() => setView("list")}>
            <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
          </button>
        </div>
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {CONTENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={filters.platform} onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
          {view === "calendar" && (
            <div className="flex items-center gap-1 bg-surface-secondary rounded-full p-1">
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface text-text-secondary"
                onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d); }}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="text-xs font-medium w-32 text-center text-text-primary">
                {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface text-text-secondary"
                onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d); }}
                aria-label="Next month"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <Button variant="primary" size="md" onClick={() => setNewForDate(new Date().toISOString().slice(0, 10))}>
            <PlusIcon className="w-4 h-4" /> New
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <MonthGrid cursor={cursor} items={filtered} onOpen={(id) => setDetailId(id)} onCreate={(d) => setNewForDate(d)} />
      ) : (
        <ListView items={filtered} onOpen={(id) => setDetailId(id)} />
      )}

      {detailId !== null && (
        <ContentDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      )}
      {newForDate !== null && (
        <NewContentModal
          clientId={clientId}
          date={newForDate}
          onClose={() => setNewForDate(null)}
          onCreated={() => { setNewForDate(null); load(); }}
        />
      )}
    </div>
  );
}

function MonthGrid({
  cursor,
  items,
  onOpen,
  onCreate,
}: {
  cursor: Date;
  items: ContentItem[];
  onOpen: (id: number) => void;
  onCreate: (dateISO: string) => void;
}) {
  const first = new Date(cursor); first.setDate(1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7) cells.push(null);

  const byDate = new Map<string, ContentItem[]>();
  for (const it of items) {
    if (!it.scheduled_date) continue;
    const arr = byDate.get(it.scheduled_date) || [];
    arr.push(it);
    byDate.set(it.scheduled_date, arr);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <div className="overflow-hidden rounded-[inherit]">
        <div className="grid grid-cols-7 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary bg-surface-secondary border-b border-border-light">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="px-1 md:px-3 py-2 text-center md:text-left">
              <span className="md:hidden">{d}</span>
              <span className="hidden md:inline">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-border-light">
          {cells.map((d, i) => {
            const iso = d
              ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
              : null;
            const list = iso ? byDate.get(iso) || [] : [];
            const isToday = iso === todayIso;
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[70px] md:min-h-[100px] border-r border-b border-border-light p-1 md:p-1.5 text-xs",
                  d ? "bg-surface" : "bg-surface-secondary/60",
                )}
              >
                {d && (
                  <>
                    <button
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium transition-colors",
                        isToday
                          ? "bg-text-primary text-background"
                          : "text-text-tertiary hover:text-text-primary hover:bg-surface-secondary",
                      )}
                      onClick={() => onCreate(iso!)}
                      aria-label={`New content on ${iso}`}
                    >
                      {d.getDate()}
                    </button>
                    <div className="space-y-1 mt-1">
                      {list.map((it) => (
                        <button
                          key={it.id}
                          onClick={() => onOpen(it.id)}
                          className="block w-full text-left truncate rounded-lg bg-surface-secondary hover:bg-surface hover:border-border-light border border-transparent px-2 py-1"
                        >
                          <span className="font-medium text-text-primary">{it.title}</span>
                          {it.platform && <span className="text-text-tertiary"> · {it.platform}</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ListView({ items, onOpen }: { items: ContentItem[]; onOpen: (id: number) => void }) {
  const [sort, setSort] = useState<{ key: keyof ContentItem; dir: 1 | -1 }>({ key: "scheduled_date", dir: -1 });
  const sorted = [...items].sort((a, b) => {
    const av = (a[sort.key] ?? "") as any;
    const bv = (b[sort.key] ?? "") as any;
    if (av < bv) return -1 * sort.dir;
    if (av > bv) return 1 * sort.dir;
    return 0;
  });
  const header = (k: keyof ContentItem, label: string) => (
    <th
      className="cursor-pointer select-none"
      onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((s.dir * -1) as 1 | -1) : 1 }))}
    >
      {label} {sort.key === k ? (sort.dir === 1 ? "↑" : "↓") : ""}
    </th>
  );
  return (
    <Card>
      <div className="overflow-auto rounded-[inherit]">
        <table className="argo-table">
          <thead>
            <tr>
              {header("title", "Title")}
              {header("platform", "Platform")}
              {header("format", "Format")}
              {header("status", "Status")}
              {header("scheduled_date", "Scheduled")}
            </tr>
          </thead>
          <tbody>
            {sorted.map((it) => (
              <tr key={it.id} className="cursor-pointer" onClick={() => onOpen(it.id)}>
                <td className="font-medium">{it.title}</td>
                <td>{it.platform || "—"}</td>
                <td>{it.format || "—"}</td>
                <td><span className="chip">{it.status}</span></td>
                <td className="tabular-nums">{it.scheduled_date || "—"}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="text-text-tertiary text-center py-6">No content yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function NewContentModal({
  clientId,
  date,
  onClose,
  onCreated,
}: {
  clientId: number;
  date: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [format, setFormat] = useState("Short Video");
  const [scheduled, setScheduled] = useState(date);
  const [status, setStatus] = useState("Briefed");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: title.trim(),
        platform,
        format,
        scheduled_date: scheduled,
        status,
      }),
    });
    setBusy(false);
    onCreated();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New content item"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} isLoading={busy}>Create</Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <input className="input" placeholder="Title / working title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
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
          <Field label="Scheduled">
            <input type="date" className="input" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {CONTENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
