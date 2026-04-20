import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeClient, weekOfEngagement, fmtMoney } from "@/lib/serialize";
import { PROSPECT_STAGES } from "@/lib/types";
import TodoList from "@/components/TodoList";
import { PageContainer, Section } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import CEOSparkline from "@/components/CEOSparkline";

export const dynamic = "force-dynamic";

const STAGE_CHIP: Record<string, string> = {
  Identified: "stage-slate",
  Contacted: "stage-sky",
  Responded: "stage-teal",
  "Discovery Call": "stage-violet",
  "Proposal Sent": "stage-amber",
  Negotiating: "stage-coral",
  "Closed Won": "stage-emerald",
  "Closed Lost": "stage-rose",
};

async function getData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [clientRows, openProspects, tasksDue, stageGroups, completedThisWeek] = await Promise.all([
    prisma.client.findMany({
      where: { archived: false },
      orderBy: { fullName: "asc" },
    }),
    prisma.prospect.count({
      where: { stage: { notIn: ["Closed Won", "Closed Lost"] } },
    }),
    prisma.task.count({
      where: {
        completed: false,
        OR: [{ dueDate: null }, { dueDate: { lte: endOfToday } }],
      },
    }),
    prisma.prospect.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { completed: true, completedAt: { gte: weekAgo } },
      select: { completedAt: true },
    }),
  ]);

  const clients = clientRows.map(serializeClient);
  const activeClients = clients.length;
  const mrr = clients.reduce((a, c) => a + (c.retainer_amount || 0), 0);

  const stageMap = new Map<string, number>(
    stageGroups.map((g) => [g.stage, g._count._all]),
  );
  const stageCounts = PROSPECT_STAGES.filter((s) => !s.startsWith("Closed")).map((s) => ({
    stage: s,
    count: stageMap.get(s) ?? 0,
  }));

  // Build 7-day bucket for completed tasks (oldest → newest)
  const bucket: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    bucket.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: 0,
    });
  }
  for (const t of completedThisWeek) {
    if (!t.completedAt) continue;
    const diff = Math.floor(
      (today.getTime() - new Date(t.completedAt).getTime()) / 86400000,
    );
    const idx = 6 - diff;
    if (idx >= 0 && idx < 7) bucket[idx].count += 1;
  }

  return {
    clients,
    activeClients,
    mrr,
    openDeals: openProspects,
    tasksDue,
    stageCounts,
    spark: bucket,
  };
}

export default async function CEOPage() {
  const { clients, activeClients, mrr, openDeals, tasksDue, stageCounts, spark } =
    await getData();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const completedThisWeek = spark.reduce((a, s) => a + s.count, 0);

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="page-header">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-coral-600">
                CEO · Dashboard
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
                Here's how Argo is doing today.
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">{today}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
              <span className="chip bg-surface border-border-light">
                <span className="dot dot-green" /> {activeClients} active
              </span>
              <span className="chip bg-surface border-border-light">
                {completedThisWeek} tasks done this week
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            hue="coral"
            label="Active Clients"
            value={String(activeClients)}
            sub="Retainers live"
          />
          <KpiCard
            hue="teal"
            label="MRR"
            value={fmtMoney(mrr)}
            sub="Monthly recurring"
          />
          <KpiCard
            hue="violet"
            label="Open Deals"
            value={String(openDeals)}
            sub="In the pipeline"
            href="/crm"
          />
          <KpiCard
            hue="amber"
            label="Tasks Due Today"
            value={String(tasksDue)}
            sub="Needs attention"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Momentum" className="lg:col-span-1">
            <Card>
              <div className="p-5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="label">Last 7 days</div>
                    <div className="text-3xl font-bold text-text-primary tabular-nums mt-1">
                      {completedThisWeek}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">Tasks completed</div>
                  </div>
                  <div className="flex h-2 w-20 rounded-full overflow-hidden bg-surface-secondary">
                    <div className="h-full bg-gradient-teal-violet" style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="mt-4 h-24">
                  <CEOSparkline data={spark} />
                </div>
              </div>
            </Card>
          </Section>

          <Section title="To-Do" className="lg:col-span-2">
            <Card>
              <div className="p-5">
                <TodoList />
              </div>
            </Card>
          </Section>
        </div>

        <Section
          title="Pipeline Snapshot"
          action={
            <Link
              href="/crm"
              className="text-xs font-medium text-coral-600 hover:text-coral-700"
            >
              Open CRM →
            </Link>
          }
        >
          <Card>
            <div className="p-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {stageCounts.map((s) => (
                  <Link
                    key={s.stage}
                    href={`/crm?stage=${encodeURIComponent(s.stage)}`}
                    className="shrink-0 min-w-[140px] px-4 py-3 rounded-2xl bg-surface-secondary/80 hover:bg-surface transition-colors border border-border-light"
                  >
                    <span className={cn("stage-chip", STAGE_CHIP[s.stage] || "stage-slate")}>
                      {s.stage}
                    </span>
                    <div className="text-2xl font-bold text-text-primary tabular-nums mt-2">
                      {s.count}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Client Health">
          {clients.length === 0 ? (
            <Card>
              <div className="p-6 text-sm text-text-secondary">
                No active clients yet. Win a deal in the CRM to get started.
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.map((c) => {
                const w = weekOfEngagement(c.start_date, c.end_date);
                const dotCls =
                  c.status === "red"
                    ? "dot-red"
                    : c.status === "yellow"
                      ? "dot-yellow"
                      : "dot-green";
                const barCls =
                  c.status === "red"
                    ? "health-bar-red"
                    : c.status === "yellow"
                      ? "health-bar-yellow"
                      : "health-bar-green";
                return (
                  <Link key={c.id} href={`/clients/${c.id}`} className="block">
                    <Card className="hover-lift overflow-hidden">
                      <div className={cn("health-bar", barCls)} />
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-text-primary truncate">
                            {c.full_name}
                          </div>
                          <span className={cn("dot", dotCls)} />
                        </div>
                        <div className="text-xs text-text-secondary truncate mt-0.5">
                          {c.business_name || c.niche || "—"}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-text-primary tabular-nums">
                            {w ? `Week ${w.current} of ${w.total}` : "Dates not set"}
                          </span>
                          {c.retainer_amount > 0 && (
                            <span className="text-[11px] font-medium text-teal-700 tabular-nums">
                              {fmtMoney(c.retainer_amount)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </PageContainer>
  );
}

function KpiCard({
  hue,
  label,
  value,
  sub,
  href,
}: {
  hue: "coral" | "amber" | "teal" | "violet" | "emerald" | "rose";
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <div className={cn("kpi-card", `kpi-card-${hue}`)}>
      <div className="label">{label}</div>
      <div className="kpi-value text-2xl md:text-[28px] font-bold tracking-tight tabular-nums mt-1.5">
        {value}
      </div>
      {sub && <div className="text-[11px] text-text-tertiary mt-0.5">{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
