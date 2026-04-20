"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  BriefcaseIcon,
  CashIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  SettingsIcon,
  SparkIcon,
  UsersIcon,
  CloseIcon,
} from "./ui/Icon";

type MiniClient = { id: number; full_name: string; business_name: string | null; status: string };
type User = { id: string; name: string; email: string; role: "admin" | "team" | "viewer" };

const pillars = [
  { href: "/ceo", label: "CEO", icon: HomeIcon },
  { href: "/crm", label: "CRM", icon: UsersIcon },
  { href: "/production", label: "Content", icon: SparkIcon },
  { href: "/financials", label: "Financials", icon: CashIcon },
];

export default function AppShell({
  user,
  clients,
  children,
}: {
  user: User;
  clients: MiniClient[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const dotCls = (s: string) =>
    s === "red" ? "dot-red" : s === "yellow" ? "dot-yellow" : "dot-green";

  const Sidebar = (
    <nav className="h-full flex flex-col px-3 py-6 w-60 bg-surface border-r border-border-light">
      <Link
        href="/ceo"
        className="flex items-center gap-2.5 px-3 mb-7"
        onClick={() => setDrawerOpen(false)}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-cal-sm bg-gradient-to-br from-coral-400 via-coral-500 to-violet-500">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-base text-text-primary tracking-tight">Argo Growth</span>
      </Link>

      <div className="flex flex-col gap-1">
        {pillars.map((p) => {
          const Ico = p.icon;
          const active = isActive(p.href);
          return (
            <Link
              key={p.href}
              href={p.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 overflow-hidden",
                active
                  ? "bg-gradient-to-r from-coral-100/80 via-amber-50 to-violet-100/70 text-text-primary shadow-[inset_0_0_0_1px_rgba(241,90,43,0.14)]"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary/60",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-coral-500 to-violet-500"
                />
              )}
              <Ico className={cn("w-5 h-5", active ? "text-coral-600" : "")} strokeWidth={active ? 2 : 1.75} />
              <span>{p.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 mt-7 mb-2">
        <div className="label">Clients</div>
        {user.role === "admin" && (
          <Link
            href="/admin/new-client"
            onClick={() => setDrawerOpen(false)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="New client"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-0.5 pr-0.5">
        {clients.length === 0 && (
          <div className="px-3 py-1.5 text-xs text-text-tertiary">No clients yet.</div>
        )}
        {clients.map((c) => {
          const active = isActive(`/clients/${c.id}`);
          return (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-sm transition-all duration-200",
                active
                  ? "bg-surface-secondary text-text-primary font-medium"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary/60",
              )}
            >
              <span className="truncate">{c.full_name}</span>
              <span className={cn("dot", dotCls(c.status))} />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border-light space-y-2">
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium transition-colors",
              isActive("/admin/users")
                ? "bg-surface-secondary text-text-primary"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary/60",
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Manage users</span>
          </Link>
        )}
        <div className="flex items-center justify-between gap-2 px-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">{user.name}</div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Sign out"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-gradient-app overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:block sticky top-0 h-screen shrink-0">{Sidebar}</aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-surface/80 backdrop-blur border-b border-border-light">
        <button
          aria-label="Open menu"
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-coral-400 via-coral-500 to-violet-500">
            <span className="text-white font-bold text-[10px]">A</span>
          </div>
          <span className="font-semibold text-sm text-text-primary">Argo Growth</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-surface shadow-cal-xl">
            <button
              aria-label="Close menu"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
              onClick={() => setDrawerOpen(false)}
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            {Sidebar}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-28 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-safe">
        <div className="max-w-lg mx-auto mb-3">
          <div className="tab-bar flex items-center h-[68px] px-2">
            {pillars.map((p) => {
              const Ico = p.icon;
              const active = isActive(p.href);
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={cn(
                    "flex flex-1 min-w-0 flex-col items-center justify-center py-2 rounded-2xl transition-all duration-200",
                    active
                      ? "bg-gradient-to-br from-coral-100 via-amber-50 to-violet-100 text-coral-700"
                      : "text-text-tertiary",
                  )}
                >
                  <Ico className="w-5 h-5" strokeWidth={active ? 2 : 1.75} />
                  <span className="text-[10px] mt-1 font-medium">{p.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
