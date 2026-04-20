import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeProspect } from "@/lib/serialize";

const FIELDS: Record<string, string> = {
  full_name: "fullName",
  platform: "platform",
  niche: "niche",
  deal_value: "dealValue",
  stage: "stage",
  next_action: "nextAction",
  next_follow_up: "nextFollowUp",
  lead_source: "leadSource",
  converted_client_id: "convertedClientId",
};
const DATE_KEYS = new Set(["next_follow_up"]);
const NUMBER_KEYS = new Set(["deal_value", "converted_client_id"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const b = await req.json();

  const existing = await prisma.prospect.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  for (const k of Object.keys(FIELDS)) {
    if (!(k in b)) continue;
    const pk = FIELDS[k];
    let v = b[k];
    if (DATE_KEYS.has(k)) v = v ? new Date(v) : null;
    if (NUMBER_KEYS.has(k)) v = v != null && v !== "" ? Number(v) : null;
    data[pk] = v;
  }
  if (b.stage && b.stage !== existing.stage) data.stageEnteredAt = new Date();

  const updated = Object.keys(data).length
    ? await prisma.prospect.update({ where: { id: Number(id) }, data })
    : existing;

  // Auto follow-up task sync.
  if (
    updated.nextFollowUp &&
    !["Closed Won", "Closed Lost"].includes(updated.stage)
  ) {
    const exists = await prisma.task.findFirst({
      where: { source: "prospect", sourceRef: String(updated.id), completed: false },
    });
    if (!exists) {
      await prisma.task.create({
        data: {
          title: `Follow up with ${updated.fullName}`,
          dueDate: updated.nextFollowUp,
          tag: "Sales",
          source: "prospect",
          sourceRef: String(updated.id),
        },
      });
    }
  }

  return NextResponse.json({ prospect: serializeProspect(updated) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { source: "prospect", sourceRef: String(id) } }),
    prisma.prospect.delete({ where: { id: Number(id) } }),
  ]);
  return NextResponse.json({ ok: true });
}
