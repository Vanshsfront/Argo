import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const r = await prisma.setting.findUnique({ where: { key: "weekly_script_target" } });
  return NextResponse.json({ weekly_script_target: Number(r?.value || 10) });
}

export async function PATCH(req: Request) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { weekly_script_target } = await req.json();
  const n = Math.max(0, Math.floor(Number(weekly_script_target)));
  await prisma.setting.upsert({
    where: { key: "weekly_script_target" },
    update: { value: String(n) },
    create: { key: "weekly_script_target", value: String(n) },
  });
  return NextResponse.json({ weekly_script_target: n });
}
