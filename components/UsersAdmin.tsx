"use client";
import { useEffect, useState } from "react";
import type { User, Client } from "@/lib/types";
import { PageContainer, Section } from "./ui/PageContainer";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { CloseIcon, PlusIcon } from "./ui/Icon";
import { cn } from "@/lib/cn";

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "team" as User["role"],
    assigned: [] as number[],
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [u, c] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setUsers(u.users || []);
    setClients(c.clients || []);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, assigned_client_ids: form.assigned }),
    });
    setBusy(false);
    if (res.ok) {
      setForm({ email: "", name: "", password: "", role: "team", assigned: [] });
      load();
    } else {
      alert("Failed to create user");
    }
  }

  async function update(id: string, patch: any) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <PageContainer title="Users" description="Manage team access and viewer assignments.">
      <div className="space-y-6">
        <Section title="Add team member">
          <Card>
            <form onSubmit={create} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Name">
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </Field>
                <Field label="Initial password">
                  <input className="input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                </Field>
                <Field label="Role">
                  <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}>
                    <option value="admin">Admin</option>
                    <option value="team">Team</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </Field>
              </div>
              {form.role === "viewer" && (
                <Field label="Assigned clients">
                  <div className="flex flex-wrap gap-2">
                    {clients.length === 0 && <div className="text-xs text-text-tertiary">No clients to assign.</div>}
                    {clients.map((c) => {
                      const active = form.assigned.includes(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            active
                              ? "bg-text-primary text-background border-text-primary"
                              : "bg-surface text-text-secondary border-border hover:border-text-secondary",
                          )}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              assigned: f.assigned.includes(c.id)
                                ? f.assigned.filter((x) => x !== c.id)
                                : [...f.assigned, c.id],
                            }))
                          }
                        >
                          {c.full_name}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
              <div className="flex justify-end">
                <Button variant="primary" type="submit" isLoading={busy}>
                  <PlusIcon className="w-4 h-4" /> Create user
                </Button>
              </div>
            </form>
          </Card>
        </Section>

        <Section title="All users">
          <Card>
            <div className="overflow-auto rounded-[inherit]">
              <table className="argo-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Assigned clients</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          className="input py-1 text-xs w-auto"
                          value={u.role}
                          onChange={(e) => update(u.id, { role: e.target.value })}
                        >
                          <option value="admin">admin</option>
                          <option value="team">team</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </td>
                      <td className="text-xs text-text-tertiary">
                        {u.assigned_client_ids.length ? u.assigned_client_ids.join(", ") : "—"}
                      </td>
                      <td>
                        <button
                          className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-rose-600 hover:bg-surface-secondary"
                          aria-label="Delete user"
                          onClick={() => remove(u.id)}
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
        </Section>

        <p className="text-xs text-text-tertiary">
          To reset a password, edit the user row and enter a new password value, or manage directly in the Supabase Auth dashboard.
        </p>
      </div>
    </PageContainer>
  );
}
