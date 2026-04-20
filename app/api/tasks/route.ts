import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeTask } from "@/lib/serialize";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const clientId = searchParams.get("client_id");

  const where: any = {};
  if (clientId) where.clientId = Number(clientId);

  if (scope === "today") {
    where.completed = false;
    where.OR = [{ dueDate: null }, { dueDate: { lte: endOfToday() } }];
  } else if (scope === "open") {
    where.completed = false;
  } else if (scope === "done") {
    where.completed = true;
  }

  const rows = await prisma.task.findMany({
    where,
    include: { client: true },
    orderBy: [{ completed: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ tasks: rows.map(serializeTask) });
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = await req.json();
  const { title, due_date, tag, client_id } = body;
  if (!title || !String(title).trim())
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  const max = await prisma.task.aggregate({
    _max: { sortOrder: true },
    where: { completed: false },
  });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  const row = await prisma.task.create({
    data: {
      title: String(title).trim(),
      dueDate: due_date ? new Date(due_date) : null,
      tag: tag || null,
      clientId: client_id ? Number(client_id) : null,
      sortOrder,
    },
    include: { client: true },
  });
  return NextResponse.json({ task: serializeTask(row) });
}

export { startOfToday, endOfToday };
