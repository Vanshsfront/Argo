import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { serializeClient } from "@/lib/serialize";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const row = await prisma.client.findUnique({ where: { id: Number(id) } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ client: serializeClient(row) });
}

const SIMPLE_FIELDS: Record<string, string> = {
  full_name: "fullName",
  business_name: "businessName",
  niche: "niche",
  target_audience: "targetAudience",
  tone: "tone",
  goals: "goals",
  avoid: "avoid",
  start_date: "startDate",
  end_date: "endDate",
  retainer_amount: "retainerAmount",
  notes: "notes",
  status: "status",
};

const DATE_KEYS = new Set(["start_date", "end_date"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  if (user.role === "viewer") return new NextResponse("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, any> = {};

  for (const k of Object.keys(SIMPLE_FIELDS)) {
    if (k in body) {
      if (user.role === "team" && !["status", "notes"].includes(k)) continue;
      const prismaKey = SIMPLE_FIELDS[k];
      let v = body[k];
      if (DATE_KEYS.has(k)) v = v ? new Date(v) : null;
      if (k === "retainer_amount") v = Number(v || 0);
      data[prismaKey] = v;
    }
  }
  if ("platforms" in body) data.platforms = Array.isArray(body.platforms) ? body.platforms : [];
  if ("content_pillars" in body)
    data.contentPillars = Array.isArray(body.content_pillars) ? body.content_pillars : [];

  const row = Object.keys(data).length
    ? await prisma.client.update({ where: { id: Number(id) }, data })
    : await prisma.client.findUnique({ where: { id: Number(id) } });

  return NextResponse.json({ client: row ? serializeClient(row) : null });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.client.update({ where: { id: Number(id) }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
