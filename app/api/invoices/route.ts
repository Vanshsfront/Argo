import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { serializeInvoice } from "@/lib/serialize";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.invoice.updateMany({
    where: {
      status: { in: ["Sent", "Draft"] },
      dueDate: { not: null, lt: today },
    },
    data: { status: "Overdue" },
  });

  const rows = await prisma.invoice.findMany({
    include: { client: true },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ invoices: rows.map(serializeInvoice) });
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.client_id || !b.amount)
    return NextResponse.json({ error: "client_id and amount required" }, { status: 400 });

  const row = await prisma.invoice.create({
    data: {
      clientId: Number(b.client_id),
      amount: Number(b.amount || 0),
      issueDate: b.issue_date ? new Date(b.issue_date) : null,
      dueDate: b.due_date ? new Date(b.due_date) : null,
      status: b.status || "Draft",
      paymentMethod: b.payment_method || null,
      notes: b.notes || null,
    },
    include: { client: true },
  });
  return NextResponse.json({ invoice: serializeInvoice(row) });
}
