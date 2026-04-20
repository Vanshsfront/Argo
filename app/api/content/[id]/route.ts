import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeContent } from "@/lib/serialize";

const FIELDS: Record<string, string> = {
  title: "title",
  platform: "platform",
  format: "format",
  status: "status",
  scheduled_date: "scheduledDate",
  script: "script",
  notes: "notes",
  post_link: "postLink",
  perf_views: "perfViews",
  perf_likes: "perfLikes",
  perf_comments: "perfComments",
  perf_saves: "perfSaves",
  assignee_id: "assigneeId",
  due_date: "dueDate",
  in_production: "inProduction",
  production_stage: "productionStage",
};
const DATE_KEYS = new Set(["scheduled_date", "due_date"]);
const NUMBER_KEYS = new Set(["perf_views", "perf_likes", "perf_comments", "perf_saves"]);
const BOOL_KEYS = new Set(["in_production"]);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const row = await prisma.contentItem.findUnique({
    where: { id: Number(id) },
    include: { client: true, assignee: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: serializeContent(row) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  for (const k of Object.keys(FIELDS)) {
    if (!(k in b)) continue;
    const pk = FIELDS[k];
    let v = b[k];
    if (DATE_KEYS.has(k)) v = v ? new Date(v) : null;
    if (NUMBER_KEYS.has(k)) v = v == null || v === "" ? null : Number(v);
    if (BOOL_KEYS.has(k)) v = v === true || v === 1 || v === "1";
    if (k === "assignee_id") v = v || null;
    data[pk] = v;
  }

  const row = Object.keys(data).length
    ? await prisma.contentItem.update({
        where: { id: Number(id) },
        data,
        include: { client: true, assignee: true },
      })
    : await prisma.contentItem.findUnique({
        where: { id: Number(id) },
        include: { client: true, assignee: true },
      });

  return NextResponse.json({ item: row ? serializeContent(row) : null });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.contentItem.delete({ where: { id: Number(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
