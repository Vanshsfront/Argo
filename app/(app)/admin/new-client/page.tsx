"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function NewClient() {
  const r = useRouter();
  const [f, setF] = useState({
    full_name: "",
    business_name: "",
    niche: "",
    retainer_amount: 0,
    start_date: "",
    end_date: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.full_name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) {
      const { client } = await res.json();
      r.push(`/clients/${client.id}`);
    } else {
      alert("Failed");
    }
  }

  return (
    <PageContainer title="New client" description="Create a blank workspace. You can fill in the rest on the About tab.">
      <Card>
        <form onSubmit={submit} className="p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name">
              <input autoFocus className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            </Field>
            <Field label="Business name">
              <input className="input" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} />
            </Field>
            <Field label="Niche">
              <input className="input" value={f.niche} onChange={(e) => setF({ ...f, niche: e.target.value })} />
            </Field>
            <Field label="Monthly retainer">
              <input type="number" className="input tabular-nums" value={f.retainer_amount || ""} onChange={(e) => setF({ ...f, retainer_amount: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Start date">
              <input type="date" className="input" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
            </Field>
            <Field label="End date">
              <input type="date" className="input" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" type="submit" isLoading={busy} disabled={!f.full_name.trim()}>
              Create client
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
