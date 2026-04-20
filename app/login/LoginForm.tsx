"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginForm() {
  const r = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [email, setEmail] = useState("admin@argo.local");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setErr(error.message || "Invalid email or password.");
      return;
    }
    r.push(next);
    r.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-gradient-app">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-coral-300/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[360px] h-[360px] rounded-full bg-amber-200/40 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-sm">
        <form onSubmit={submit} className="p-6 md:p-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-cal-sm bg-gradient-to-br from-coral-400 via-coral-500 to-violet-500">
              <span className="text-white font-bold text-base">A</span>
            </div>
            <div>
              <div className="text-base font-semibold text-text-primary tracking-tight leading-none">Argo Growth</div>
              <div className="text-xs text-text-tertiary mt-1">Sign in to continue</div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Email">
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password" error={err || undefined}>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </div>

          <Button variant="primary" size="lg" className="w-full" isLoading={busy}>
            Sign in
          </Button>

          <div className="text-[11px] text-text-tertiary text-center">
            Default admin after first seed: admin@argo.local / argo2026
          </div>
        </form>
      </Card>
    </div>
  );
}
