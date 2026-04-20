import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeContent } from "@/lib/serialize";

export async function GET(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const productionOnly = searchParams.get("production") === "1";

  const where: any = {};
  if (clientId) where.clientId = Number(clientId);
  if (productionOnly) where.inProduction = true;

  const rows = await prisma.contentItem.findMany({
    where,
    include: { client: true, assignee: true },
    orderBy: [{ sortOrder: "asc" }, { id: "desc" }],
  });
  return NextResponse.json({ items: rows.map(serializeContent) });
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.client_id || !b.title)
    return NextResponse.json({ error: "client_id and title required" }, { status: 400 });

  const row = await prisma.contentItem.create({
    data: {
      clientId: Number(b.client_id),
      title: String(b.title).trim(),
      platform: b.platform || null,
      format: b.format || null,
      status: b.status || "Briefed",
      scheduledDate: b.scheduled_date ? new Date(b.scheduled_date) : null,
      assigneeId: b.assignee_id || null,
      dueDate: b.due_date ? new Date(b.due_date) : null,
      productionStage: b.production_stage || "Brief",
      inProduction: b.in_production === false ? false : true,
    },
    include: { client: true, assignee: true },
  });
  return NextResponse.json({ item: serializeContent(row) });
}
