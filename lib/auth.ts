import { prisma } from "./prisma";
import { getSupabaseServer } from "./supabase/server";
import type { Role, User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as Role,
    assigned_client_ids: profile.assignedClientIds,
  };
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Response("Unauthorized", { status: 401 });
  return u;
}

export async function requireRole(...allowed: Role[]): Promise<User> {
  const u = await requireUser();
  if (!allowed.includes(u.role)) throw new Response("Forbidden", { status: 403 });
  return u;
}
