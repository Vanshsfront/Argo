import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeProspect, serializeProspectNote } from "@/lib/serialize";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const rows = await prisma.prospect.findMany({
    include: { notes: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ sortOrder: "asc" }, { id: "desc" }],
  });
  return NextResponse.json({
    prospects: rows.map((p) => ({
      ...serializeProspect(p),
      notes: (p.notes || []).map(serializeProspectNote),
    })),
  });
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.full_name) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  const row = await prisma.prospect.create({
    data: {
      fullName: b.full_name,
      platform: b.platform || null,
      niche: b.niche || null,
      dealValue: Number(b.deal_value || 0),
      stage: b.stage || "Identified",
      nextAction: b.next_action || null,
      nextFollowUp: b.next_follow_up ? new Date(b.next_follow_up) : null,
      leadSource: b.lead_source || null,
    },
  });
  return NextResponse.json({ prospect: serializeProspect(row) });
}
