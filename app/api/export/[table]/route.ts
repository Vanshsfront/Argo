import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Exporter = () => Promise<Record<string, any>[]>;

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : "");
const dateOnly = (d: Date | null | undefined) =>
  d ? d.toISOString().slice(0, 10) : "";

const EXPORTERS: Record<string, Exporter> = {
  clients: async () =>
    (await prisma.client.findMany({ orderBy: { id: "asc" } })).map((c) => ({
      id: c.id,
      full_name: c.fullName,
      business_name: c.businessName,
      niche: c.niche,
      target_audience: c.targetAudience,
      platforms: (c.platforms || []).join("|"),
      content_pillars: (c.contentPillars || []).join("|"),
      tone: c.tone,
      goals: c.goals,
      avoid: c.avoid,
      start_date: dateOnly(c.startDate),
      end_date: dateOnly(c.endDate),
      retainer_amount: c.retainerAmount,
      notes: c.notes,
      status: c.status,
      archived: c.archived ? 1 : 0,
      created_at: iso(c.createdAt),
    })),

  prospects: async () =>
    (await prisma.prospect.findMany({ orderBy: { id: "asc" } })).map((p) => ({
      id: p.id,
      full_name: p.fullName,
      platform: p.platform,
      niche: p.niche,
      deal_value: p.dealValue,
      stage: p.stage,
      stage_entered_at: iso(p.stageEnteredAt),
      date_added: iso(p.dateAdded),
      next_follow_up: dateOnly(p.nextFollowUp),
      next_action: p.nextAction,
      lead_source: p.leadSource,
      converted_client_id: p.convertedClientId,
    })),

  tasks: async () =>
    (
      await prisma.task.findMany({
        include: { client: true },
        orderBy: { id: "asc" },
      })
    ).map((t) => ({
      id: t.id,
      title: t.title,
      due_date: dateOnly(t.dueDate),
      tag: t.tag,
      client_id: t.clientId,
      client_name: t.client?.fullName ?? "",
      completed: t.completed ? 1 : 0,
      completed_at: iso(t.completedAt),
      created_at: iso(t.createdAt),
    })),

  content: async () =>
    (
      await prisma.contentItem.findMany({
        include: { client: true },
        orderBy: { id: "asc" },
      })
    ).map((ci) => ({
      id: ci.id,
      client_name: ci.client?.fullName ?? "",
      title: ci.title,
      platform: ci.platform,
      format: ci.format,
      status: ci.status,
      scheduled_date: dateOnly(ci.scheduledDate),
      production_stage: ci.productionStage,
      due_date: dateOnly(ci.dueDate),
      post_link: ci.postLink,
      perf_views: ci.perfViews,
      perf_likes: ci.perfLikes,
      perf_comments: ci.perfComments,
      perf_saves: ci.perfSaves,
      created_at: iso(ci.createdAt),
    })),

  invoices: async () =>
    (
      await prisma.invoice.findMany({
        include: { client: true },
        orderBy: { id: "asc" },
      })
    ).map((i) => ({
      id: i.id,
      client_name: i.client?.fullName ?? "",
      amount: i.amount,
      issue_date: dateOnly(i.issueDate),
      due_date: dateOnly(i.dueDate),
      status: i.status,
      payment_method: i.paymentMethod,
      notes: i.notes,
      paid_at: iso(i.paidAt),
      created_at: iso(i.createdAt),
    })),

  resources: async () =>
    (
      await prisma.resource.findMany({
        include: { client: true },
        orderBy: { id: "asc" },
      })
    ).map((r) => ({
      id: r.id,
      client_name: r.client?.fullName ?? "",
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      created_at: iso(r.createdAt),
    })),
};

function toCSV(rows: any[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export async function GET(_req: Request, { params }: { params: Promise<{ table: string }> }) {
  try {
    await requireRole("admin", "team");
  } catch (r) {
    return r as Response;
  }
  const { table } = await params;
  const name = table.replace(/\.csv$/, "");
  const exporter = EXPORTERS[name];
  if (!exporter) return new Response("Unknown table", { status: 404 });

  const rows = await exporter();
  const csv = toCSV(rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="argo-${name}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
