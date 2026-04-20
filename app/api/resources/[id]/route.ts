import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeResource } from "@/lib/serialize";

const FIELDS = ["title", "type", "url", "description"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  for (const k of FIELDS) if (k in b) data[k] = b[k] ?? null;

  const row = Object.keys(data).length
    ? await prisma.resource.update({ where: { id: Number(id) }, data })
    : await prisma.resource.findUnique({ where: { id: Number(id) } });

  return NextResponse.json({ resource: row ? serializeResource(row) : null });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.resource.delete({ where: { id: Number(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
