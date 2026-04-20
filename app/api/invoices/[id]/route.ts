import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serializeInvoice } from "@/lib/serialize";

const FIELDS: Record<string, string> = {
  client_id: "clientId",
  amount: "amount",
  issue_date: "issueDate",
  due_date: "dueDate",
  status: "status",
  payment_method: "paymentMethod",
  notes: "notes",
};
const DATE_KEYS = new Set(["issue_date", "due_date"]);
const NUMBER_KEYS = new Set(["client_id", "amount"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
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
    if (NUMBER_KEYS.has(k)) v = Number(v || 0);
    data[pk] = v;
  }
  if (b.status === "Paid") data.paidAt = new Date();
  if (b.status && b.status !== "Paid") data.paidAt = null;

  const row = Object.keys(data).length
    ? await prisma.invoice.update({
        where: { id: Number(id) },
        data,
        include: { client: true },
      })
    : await prisma.invoice.findUnique({ where: { id: Number(id) }, include: { client: true } });

  return NextResponse.json({ invoice: row ? serializeInvoice(row) : null });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await prisma.invoice.delete({ where: { id: Number(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
