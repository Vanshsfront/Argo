import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { ids } = await req.json();
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids required" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id: any, i: number) =>
      prisma.task.update({ where: { id: Number(id) }, data: { sortOrder: i } }),
    ),
  );
  return NextResponse.json({ ok: true });
}
