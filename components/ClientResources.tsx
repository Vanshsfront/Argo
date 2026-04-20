"use client";
import { useEffect, useState } from "react";
import type { Resource } from "@/lib/types";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Empty } from "./ui/Empty";
import { CloseIcon, LinkIcon, PlusIcon } from "./ui/Icon";

const TYPES = ["Loom", "Guide", "SOP", "Template", "Other"];

export default function ClientResources({
  clientId,
  role,
}: {
  clientId: number;
  role: "admin" | "team" | "viewer";
}) {
  const [items, setItems] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Loom");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const readOnly = role === "viewer";

  async function load() {
    const r = await fetch(`/api/resources?client_id=${clientId}`).then((r) => r.json());
    setItems(r.resources || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: title.trim(),
        type,
        url: url.trim() || null,
        description: description.trim() || null,
      }),
    });
    setTitle(""); setUrl(""); setDescription("");
    load();
  }

  async function edit(r: Resource, patch: Partial<Resource>) {
    await fetch(`/api/resources/${r.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function remove(r: Resource) {
    if (!confirm("Delete this resource?")) return;
    await fetch(`/api/resources/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card>
          <form onSubmit={add} className="p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="Title" className="md:col-span-2">
                <input className="input" placeholder="e.g. Brand kit — Loom walkthrough" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Type">
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="URL">
                <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input min-h-[64px]" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" type="submit"><PlusIcon className="w-4 h-4" /> Add resource</Button>
            </div>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <Empty title="No resources yet" description="Drop Looms, SOPs, guides, and templates here so the whole team has one source of truth." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((r) => (
            <Card key={r.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <span className="chip">{r.type || "Other"}</span>
                  {!readOnly && (
                    <button
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-rose-600 hover:bg-surface-secondary"
                      aria-label="Delete"
                      onClick={() => remove(r)}
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  className="input mt-2 font-medium"
                  value={r.title}
                  disabled={readOnly}
                  onChange={(e) => edit(r, { title: e.target.value })}
                />
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-primary hover:underline break-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {r.url}
                  </a>
                ) : !readOnly ? (
                  <input
                    className="input mt-2"
                    placeholder="Add URL"
                    onBlur={(e) => e.target.value && edit(r, { url: e.target.value })}
                  />
                ) : null}
                {r.description && <p className="text-xs text-text-secondary mt-2">{r.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
