import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeProspectNote } from "@/lib/serialize";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const { body } = await req.json();
  if (!body || !String(body).trim())
    return NextResponse.json({ error: "Empty note" }, { status: 400 });

  await prisma.prospectNote.create({
    data: { prospectId: Number(id), body: String(body).trim() },
  });
  const notes = await prisma.prospectNote.findMany({
    where: { prospectId: Number(id) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ notes: notes.map(serializeProspectNote) });
}
