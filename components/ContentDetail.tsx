"use client";
import { useEffect, useRef, useState } from "react";
import type { ContentItem } from "@/lib/types";
import { CONTENT_STATUSES, PLATFORMS, FORMATS, PRODUCTION_STAGES } from "@/lib/types";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Button } from "./ui/Button";
import { TrashIcon } from "./ui/Icon";

export default function ContentDetail({
  id,
  onClose,
  onChanged,
}: {
  id: number;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const r = await fetch(`/api/content/${id}`).then((r) => r.json());
    setItem(r.item);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  function scheduleSave(patch: Partial<ContentItem>) {
    if (!item) return;
    setItem({ ...item, ...patch });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaving(false);
      onChanged?.();
    }, 400);
  }

  async function remove() {
    if (!confirm("Delete this content item?")) return;
    await fetch(`/api/content/${id}`, { method: "DELETE" });
    onChanged?.();
    onClose();
  }

  if (!item) {
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
      title={item.title || "Content item"}
      description={`${item.client_name ?? ""}${saving ? " · Saving…" : " · Saved"}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={remove}>
            <TrashIcon className="w-4 h-4" /> Delete
          </Button>
          <div className="flex-1" />
          <Button variant="primary" onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Title">
          <input className="input text-[15px] font-medium" value={item.title} onChange={(e) => scheduleSave({ title: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <LabeledSelect label="Platform" value={item.platform || ""} onChange={(v) => scheduleSave({ platform: v })} options={["", ...PLATFORMS]} />
          <LabeledSelect label="Format" value={item.format || ""} onChange={(v) => scheduleSave({ format: v })} options={["", ...FORMATS]} />
          <LabeledSelect label="Status" value={item.status} onChange={(v) => scheduleSave({ status: v as any })} options={[...CONTENT_STATUSES]} />
          <LabeledSelect label="Production stage" value={item.production_stage} onChange={(v) => scheduleSave({ production_stage: v as any })} options={[...PRODUCTION_STAGES]} />
          <Field label="Scheduled">
            <input type="date" className="input" value={item.scheduled_date || ""} onChange={(e) => scheduleSave({ scheduled_date: e.target.value })} />
          </Field>
          <Field label="Due">
            <input type="date" className="input" value={item.due_date || ""} onChange={(e) => scheduleSave({ due_date: e.target.value })} />
          </Field>
        </div>

        <Field label="Script / brief">
          <textarea className="input min-h-[180px]" value={item.script || ""} onChange={(e) => scheduleSave({ script: e.target.value })} />
        </Field>

        <Field label="Notes">
          <textarea className="input min-h-[80px]" value={item.notes || ""} onChange={(e) => scheduleSave({ notes: e.target.value })} />
        </Field>

        <div className="space-y-3">
          <Field label="Post link (after posting)">
            <input className="input" value={item.post_link || ""} placeholder="https://…" onChange={(e) => scheduleSave({ post_link: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField label="Views" value={item.perf_views} onChange={(v) => scheduleSave({ perf_views: v })} />
            <NumField label="Likes" value={item.perf_likes} onChange={(v) => scheduleSave({ perf_likes: v })} />
            <NumField label="Comments" value={item.perf_comments} onChange={(v) => scheduleSave({ perf_comments: v })} />
            <NumField label="Saves" value={item.perf_saves} onChange={(v) => scheduleSave({ perf_saves: v })} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </Field>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        className="input tabular-nums"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </Field>
  );
}
