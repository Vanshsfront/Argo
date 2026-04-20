"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Button } from "./ui/Button";
import { TrashIcon, PlusIcon } from "./ui/Icon";
import { PROSPECT_STAGES } from "@/lib/types";

export default function ProspectDetail({
  id,
  onClose,
  onChanged,
}: {
  id: number;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [p, setP] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const all = await fetch("/api/prospects").then((r) => r.json());
    const found = (all.prospects || []).find((x: any) => x.id === id);
    setP(found || null);
    setNotes(found?.notes || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  function scheduleSave(patch: any) {
    if (!p) return;
    setP({ ...p, ...patch });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/prospects/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaving(false);
      onChanged?.();
    }, 400);
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    const r = await fetch(`/api/prospects/${id}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: noteBody.trim() }),
    });
    const data = await r.json();
    setNotes(data.notes || []);
    setNoteBody("");
  }

  async function remove() {
    if (!confirm("Delete this prospect?")) return;
    await fetch(`/api/prospects/${id}`, { method: "DELETE" });
    onChanged?.();
    onClose();
  }

  async function convert() {
    if (!confirm("Create a client workspace for this prospect?")) return;
    const r = await fetch(`/api/prospects/${id}/convert`, { method: "POST" });
    if (r.ok) {
      const { client } = await r.json();
      if (client?.id) window.location.href = `/clients/${client.id}`;
    }
  }

  if (!p) {
    return (
      <Modal isOpen onClose={onClose} title="Loading…">
        <div className="text-sm text-text-tertiary">Loading…</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={p.full_name}
      description={`Added ${p.date_added?.slice(0, 10)}${saving ? " · Saving…" : " · Saved"}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={remove}>
            <TrashIcon className="w-4 h-4" /> Delete
          </Button>
          <div className="flex-1" />
          {!p.converted_client_id && (
            <Button variant="outline" onClick={convert}>Convert to client</Button>
          )}
          <Button variant="primary" onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Full name">
            <input className="input" value={p.full_name} onChange={(e) => scheduleSave({ full_name: e.target.value })} />
          </Field>
          <Field label="Platform">
            <select className="input" value={p.platform || ""} onChange={(e) => scheduleSave({ platform: e.target.value })}>
              <option value="">—</option>
              {["Instagram", "LinkedIn", "Referral", "Inbound DM", "Other"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Niche">
            <input className="input" value={p.niche || ""} onChange={(e) => scheduleSave({ niche: e.target.value })} />
          </Field>
          <Field label="Deal value / month">
            <input type="number" className="input tabular-nums" value={p.deal_value || 0} onChange={(e) => scheduleSave({ deal_value: Number(e.target.value) })} />
          </Field>
          <Field label="Current stage">
            <select className="input" value={p.stage} onChange={(e) => scheduleSave({ stage: e.target.value })}>
              {PROSPECT_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Lead source">
            <input className="input" value={p.lead_source || ""} onChange={(e) => scheduleSave({ lead_source: e.target.value })} />
          </Field>
          <Field label="Next action">
            <input className="input" value={p.next_action || ""} onChange={(e) => scheduleSave({ next_action: e.target.value })} />
          </Field>
          <Field label="Follow-up due">
            <input type="date" className="input" value={p.next_follow_up || ""} onChange={(e) => scheduleSave({ next_follow_up: e.target.value })} />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="label">Notes log</div>
          <div className="flex gap-2">
            <textarea
              className="input min-h-[60px]"
              placeholder="Log an interaction…"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <Button variant="primary" onClick={addNote}>
              <PlusIcon className="w-4 h-4" /> Add
            </Button>
          </div>
          <ul className="divide-y divide-border-light rounded-2xl bg-surface-secondary max-h-60 overflow-auto">
            {notes.length === 0 && (
              <li className="p-4 text-xs text-text-tertiary text-center">No notes yet.</li>
            )}
            {notes.map((n) => (
              <li key={n.id} className="p-3 text-sm">
                <div className="text-[10px] text-text-tertiary tabular-nums">
                  {n.created_at?.slice(0, 16).replace("T", " ")}
                </div>
                <div className="whitespace-pre-wrap text-text-primary mt-0.5">{n.body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
