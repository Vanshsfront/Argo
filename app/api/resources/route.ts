import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeResource } from "@/lib/serialize";

export async function GET(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const clientId = new URL(req.url).searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const rows = await prisma.resource.findMany({
    where: { clientId: Number(clientId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ resources: rows.map(serializeResource) });
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.client_id || !b.title)
    return NextResponse.json({ error: "client_id and title required" }, { status: 400 });

  const row = await prisma.resource.create({
    data: {
      clientId: Number(b.client_id),
      title: String(b.title).trim(),
      type: b.type || null,
      url: b.url || null,
      description: b.description || null,
    },
  });
  return NextResponse.json({ resource: serializeResource(row) });
}
