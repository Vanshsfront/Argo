import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serializeClient } from "@/lib/serialize";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const p = await prisma.prospect.findUnique({ where: { id: Number(id) } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (p.convertedClientId) {
    const existing = await prisma.client.findUnique({ where: { id: p.convertedClientId } });
    if (existing) return NextResponse.json({ client: serializeClient(existing), existing: true });
  }

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 90);

  const [client] = await prisma.$transaction([
    prisma.client.create({
      data: {
        fullName: p.fullName,
        niche: p.niche,
        retainerAmount: Number(p.dealValue || 0),
        startDate: today,
        endDate: end,
      },
    }),
  ]);
  await prisma.prospect.update({
    where: { id: p.id },
    data: { convertedClientId: client.id, stage: "Closed Won" },
  });
  return NextResponse.json({ client: serializeClient(client) });
}
