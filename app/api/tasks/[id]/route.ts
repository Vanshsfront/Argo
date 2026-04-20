import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeTask } from "@/lib/serialize";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if ("title" in body) data.title = String(body.title);
  if ("due_date" in body) data.dueDate = body.due_date ? new Date(body.due_date) : null;
  if ("tag" in body) data.tag = body.tag || null;
  if ("client_id" in body) data.clientId = body.client_id ? Number(body.client_id) : null;
  if ("completed" in body) {
    const c = body.completed === true || body.completed === 1 || body.completed === "1";
    data.completed = c;
    data.completedAt = c ? new Date() : null;
  }

  const row = Object.keys(data).length
    ? await prisma.task.update({
        where: { id: Number(id) },
        data,
        include: { client: true },
      })
    : await prisma.task.findUnique({ where: { id: Number(id) }, include: { client: true } });

  return NextResponse.json({ task: row ? serializeTask(row) : null });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.task.delete({ where: { id: Number(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
