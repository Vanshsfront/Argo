import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function startOfWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // treat Monday as start of week
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const setting = await prisma.setting.findUnique({ where: { key: "weekly_script_target" } });
  const target = Number(setting?.value || 10);

  const completed = await prisma.contentItem.count({
    where: {
      productionStage: { in: ["Review", "Approved", "Posted"] },
      createdAt: { gte: startOfWeek() },
    },
  });
  return NextResponse.json({ target, completed });
}
