"use client";
import { useRef, useState } from "react";
import type { Client } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { Card } from "./ui/Card";
import { Field } from "./ui/Field";
import { cn } from "@/lib/cn";

export default function ClientAbout({
  client: initial,
  role,
}: {
  client: Client;
  role: "admin" | "team" | "viewer";
}) {
  const [client, setClient] = useState<Client>(initial);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readOnly = role === "viewer";
  const restrictedToStatusNotes = role === "team";

  function scheduleSave(next: Partial<Client>) {
    const merged = { ...client, ...next };
    setClient(merged);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), 500);
  }

  async function save(patch: Partial<Client>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const { client: updated } = await res.json();
        if (updated) setClient(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  const canEdit = (field: string) => {
    if (readOnly) return false;
    if (restrictedToStatusNotes) return ["status", "notes"].includes(field);
    return true;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <span className="text-xs text-text-tertiary tabular-nums">
          {saving ? "Saving…" : "All changes saved"}
        </span>
      </div>

      <Card>
        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full name">
            <input className="input" value={client.full_name || ""} disabled={!canEdit("full_name")} onChange={(e) => scheduleSave({ full_name: e.target.value })} />
          </Field>
          <Field label="Business name">
            <input className="input" value={client.business_name || ""} disabled={!canEdit("business_name")} onChange={(e) => scheduleSave({ business_name: e.target.value })} />
          </Field>
          <Field label="Niche / industry">
            <input className="input" value={client.niche || ""} disabled={!canEdit("niche")} onChange={(e) => scheduleSave({ niche: e.target.value })} />
          </Field>
          <Field label="Target audience">
            <input className="input" value={client.target_audience || ""} disabled={!canEdit("target_audience")} onChange={(e) => scheduleSave({ target_audience: e.target.value })} />
          </Field>
          <Field label="Monthly retainer">
            <input type="number" className="input" value={client.retainer_amount || 0} disabled={!canEdit("retainer_amount")} onChange={(e) => scheduleSave({ retainer_amount: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <select className="input" value={client.status} disabled={!canEdit("status")} onChange={(e) => scheduleSave({ status: e.target.value as Client["status"] })}>
              <option value="green">Green — on track</option>
              <option value="yellow">Yellow — needs attention</option>
              <option value="red">Red — at risk</option>
            </select>
          </Field>
          <Field label="Engagement start">
            <input type="date" className="input" value={client.start_date || ""} disabled={!canEdit("start_date")} onChange={(e) => scheduleSave({ start_date: e.target.value })} />
          </Field>
          <Field label="Engagement end">
            <input type="date" className="input" value={client.end_date || ""} disabled={!canEdit("end_date")} onChange={(e) => scheduleSave({ end_date: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="p-5 md:p-6 space-y-5">
          <Field label="Platforms">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = client.platforms.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    disabled={!canEdit("platforms")}
                    onClick={() => {
                      const next = active ? client.platforms.filter((x) => x !== p) : [...client.platforms, p];
                      scheduleSave({ platforms: next });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-60",
                      active
                        ? "bg-text-primary text-background border-text-primary"
                        : "bg-surface text-text-secondary border-border hover:border-text-secondary",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Content pillars (3–5 core topics)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <input
                  key={i}
                  className="input"
                  placeholder={`Pillar ${i + 1}`}
                  disabled={!canEdit("content_pillars")}
                  value={client.content_pillars[i] || ""}
                  onChange={(e) => {
                    const arr = [...client.content_pillars];
                    arr[i] = e.target.value;
                    scheduleSave({ content_pillars: arr.filter((x, idx) => x || idx < 3) });
                  }}
                />
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Tone of voice">
              <input className="input" value={client.tone || ""} disabled={!canEdit("tone")} onChange={(e) => scheduleSave({ tone: e.target.value })} />
            </Field>
          </div>

          <Field label="90-day goals">
            <textarea className="input min-h-[96px]" value={client.goals || ""} disabled={!canEdit("goals")} onChange={(e) => scheduleSave({ goals: e.target.value })} />
          </Field>

          <Field label="What to avoid">
            <textarea className="input min-h-[80px]" value={client.avoid || ""} disabled={!canEdit("avoid")} onChange={(e) => scheduleSave({ avoid: e.target.value })} />
          </Field>

          <Field label="Notes">
            <textarea className="input min-h-[96px]" value={client.notes || ""} disabled={!canEdit("notes")} onChange={(e) => scheduleSave({ notes: e.target.value })} />
          </Field>
        </div>
      </Card>
    </div>
  );
}
