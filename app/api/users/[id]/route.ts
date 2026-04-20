import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serializeUser } from "@/lib/serialize";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  if ("name" in b) data.name = String(b.name);
  if ("role" in b && ["admin", "team", "viewer"].includes(b.role)) data.role = b.role as Role;
  if ("assigned_client_ids" in b) {
    data.assignedClientIds = Array.isArray(b.assigned_client_ids)
      ? b.assigned_client_ids.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
      : [];
  }

  if ("password" in b && b.password) {
    const admin = getSupabaseAdmin();
    const pwd = await admin.auth.admin.updateUserById(id, { password: String(b.password) });
    if (pwd.error) return NextResponse.json({ error: pwd.error.message }, { status: 400 });
  }

  const profile = Object.keys(data).length
    ? await prisma.profile.update({ where: { id }, data })
    : await prisma.profile.findUnique({ where: { id } });

  return NextResponse.json({ user: profile ? serializeUser(profile) : null });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const admin = getSupabaseAdmin();
  await admin.auth.admin.deleteUser(id).catch(() => {});
  await prisma.profile.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
