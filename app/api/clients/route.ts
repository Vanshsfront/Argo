import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { serializeClient } from "@/lib/serialize";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const rows = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ clients: rows.map(serializeClient) });
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.full_name) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  const row = await prisma.client.create({
    data: {
      fullName: b.full_name,
      businessName: b.business_name || null,
      niche: b.niche || null,
      retainerAmount: Number(b.retainer_amount || 0),
      startDate: b.start_date ? new Date(b.start_date) : null,
      endDate: b.end_date ? new Date(b.end_date) : null,
      platforms: Array.isArray(b.platforms) ? b.platforms : [],
      contentPillars: Array.isArray(b.content_pillars) ? b.content_pillars : [],
    },
  });
  return NextResponse.json({ client: serializeClient(row) });
}
