import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serializeUser } from "@/lib/serialize";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export async function GET() {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const rows = await prisma.profile.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users: rows.map(serializeUser) });
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");
  } catch (r) {
    return r as Response;
  }
  const b = await req.json();
  if (!b.email || !b.name || !b.password || !b.role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!["admin", "team", "viewer"].includes(b.role)) {
    return NextResponse.json({ error: "Bad role" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const email = String(b.email).toLowerCase().trim();

  const created = await admin.auth.admin.createUser({
    email,
    password: b.password,
    email_confirm: true,
    user_metadata: { name: String(b.name).trim() },
  });
  if (created.error || !created.data.user) {
    return NextResponse.json(
      { error: created.error?.message || "Could not create auth user" },
      { status: 400 },
    );
  }

  const authId = created.data.user.id;
  try {
    const profile = await prisma.profile.create({
      data: {
        id: authId,
        email,
        name: String(b.name).trim(),
        role: b.role as Role,
        assignedClientIds: Array.isArray(b.assigned_client_ids)
          ? b.assigned_client_ids.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
          : [],
      },
    });
    return NextResponse.json({ user: serializeUser(profile) });
  } catch (e: any) {
    // Compensating rollback — avoid an orphan auth.users row.
    await admin.auth.admin.deleteUser(authId).catch(() => {});
    return NextResponse.json(
      { error: e?.message || "Could not create profile" },
      { status: 400 },
    );
  }
}
