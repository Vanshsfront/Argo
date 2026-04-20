"use client";
import { useEffect, useMemo, useState } from "react";
import type { Invoice, Client, InvoiceStatus } from "@/lib/types";
import { INVOICE_STATUSES } from "@/lib/types";
import { fmtMoney } from "@/lib/serialize";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PageContainer, Section } from "./ui/PageContainer";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { Empty } from "./ui/Empty";
import { cn } from "@/lib/cn";
import { CloseIcon, DownloadIcon, PlusIcon } from "./ui/Icon";

export default function Financials() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const [ci, cl] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setInvoices(ci.invoices || []);
    setClients(cl.clients || []);
  }
  useEffect(() => { load(); }, []);

  const mrr = clients.reduce((a, c) => a + (c.retainer_amount || 0), 0);
  const ymStart = new Date(); ymStart.setDate(1);
  const thisMonthIso = ymStart.toISOString().slice(0, 7);
  const collected = invoices
    .filter((i) => i.status === "Paid" && (i.paid_at || "").slice(0, 7) === thisMonthIso)
    .reduce((a, i) => a + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "Sent" || i.status === "Overdue")
    .reduce((a, i) => a + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((a, i) => a + i.amount, 0);

  const chart = useMemo(() => {
    const by: Record<string, number> = {};
    for (const i of invoices) {
      if (i.status !== "Paid" || !i.paid_at) continue;
      const m = i.paid_at.slice(0, 7);
      by[m] = (by[m] || 0) + i.amount;
    }
    return Object.entries(by).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
  }, [invoices]);

  async function changeStatus(inv: Invoice, status: InvoiceStatus) {
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeInvoice(id: number) {
    if (!confirm("Delete invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <PageContainer
      title="Financials"
      action={
        <>
          <a className="btn" href="/api/export/invoices.csv">
            <DownloadIcon className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </a>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <PlusIcon className="w-4 h-4" /> Invoice
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat hue="teal"    label="MRR"                 value={fmtMoney(mrr)} />
          <Stat hue="emerald" label="Collected this month" value={fmtMoney(collected)} />
          <Stat hue="amber"   label="Outstanding"          value={fmtMoney(outstanding)} />
          <Stat hue={overdue > 0 ? "rose" : "violet"} label="Overdue" value={fmtMoney(overdue)} />
        </div>

        <Section title="Invoices">
          {invoices.length === 0 ? (
            <Empty title="No invoices yet" description="Add your first invoice to start tracking revenue." />
          ) : (
            <Card>
              <div className="overflow-auto rounded-[inherit]">
                <table className="argo-table">
                  <thead>
                    <tr>
                      <th>Client</th><th>Amount</th><th>Issued</th><th>Due</th>
                      <th>Status</th><th>Method</th><th>Notes</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id} className={i.status === "Overdue" ? "bg-rose-50/50" : ""}>
                        <td className="font-medium">{i.client_name}</td>
                        <td className="tabular-nums">{fmtMoney(i.amount)}</td>
                        <td className="tabular-nums">{i.issue_date || "—"}</td>
                        <td className="tabular-nums">{i.due_date || "—"}</td>
                        <td>
                          <select
                            className="input py-1 text-xs w-auto"
                            value={i.status}
                            onChange={(e) => changeStatus(i, e.target.value as InvoiceStatus)}
                          >
                            {INVOICE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>{i.payment_method || "—"}</td>
                        <td className="max-w-[220px] truncate text-text-secondary" title={i.notes || ""}>{i.notes || "—"}</td>
                        <td>
                          <button
                            className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-rose-600 hover:bg-surface-secondary"
                            aria-label="Delete invoice"
                            onClick={() => removeInvoice(i.id)}
                          >
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Section>

        <Section title="Revenue per month">
          <Card>
            <div className="p-5">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="finBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1fd9c4" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
                      formatter={(v: any) => fmtMoney(Number(v))}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--accent-violet)",
                        borderRadius: 12,
                        fontSize: 12,
                        boxShadow: "0 8px 24px -8px rgba(139,92,246,0.3)",
                      }}
                    />
                    <Bar dataKey="total" fill="url(#finBar)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Per-client summary">
          <Card>
            <ul className="divide-y divide-border-light">
              {clients.length === 0 && (
                <li className="p-5 text-sm text-text-tertiary">No clients yet.</li>
              )}
              {clients.map((c) => {
                const rows = invoices.filter((i) => i.client_id === c.id);
                const total = rows.reduce((a, r) => a + r.amount, 0);
                const paid = rows.filter((r) => r.status === "Paid").reduce((a, r) => a + r.amount, 0);
                const remaining = total - paid;
                return (
                  <li key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-5 py-3">
                    <div className="font-medium text-text-primary truncate">{c.full_name}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary tabular-nums sm:shrink-0">
                      <span>Contract <span className="text-text-primary font-medium">{fmtMoney(total)}</span></span>
                      <span>Collected <span className="text-text-primary font-medium">{fmtMoney(paid)}</span></span>
                      <span>Remaining <span className="text-text-primary font-medium">{fmtMoney(remaining)}</span></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Section>
      </div>

      {creating && (
        <NewInvoiceModal
          clients={clients}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}
    </PageContainer>
  );
}

function Stat({
  label,
  value,
  hue = "violet",
}: {
  label: string;
  value: string;
  hue?: "coral" | "amber" | "teal" | "violet" | "emerald" | "rose";
}) {
  return (
    <div className={cn("kpi-card", `kpi-card-${hue}`)}>
      <div className="label">{label}</div>
      <div className="kpi-value text-2xl font-bold tracking-tight tabular-nums mt-1.5">
        {value}
      </div>
    </div>
  );
}

function NewInvoiceModal({
  clients,
  onClose,
  onCreated,
}: {
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState<number | null>(clients[0]?.id ?? null);
  const [amount, setAmount] = useState(0);
  const [issue, setIssue] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("Sent");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) return;
    setBusy(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        amount,
        issue_date: issue,
        due_date: due || null,
        status,
        payment_method: method || null,
        notes: notes || null,
      }),
    });
    setBusy(false);
    onCreated();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New invoice"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!clientId || !amount} isLoading={busy}>Create</Button>
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input type="number" className="input tabular-nums" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              {INVOICE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Issue date">
            <input type="date" className="input" value={issue} onChange={(e) => setIssue(e.target.value)} />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Payment method">
          <input className="input" value={method} onChange={(e) => setMethod(e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea className="input min-h-[72px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
