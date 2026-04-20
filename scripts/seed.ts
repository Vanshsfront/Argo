import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const email = (process.env.ADMIN_EMAIL || "admin@argo.local").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "argo2026";
const name = process.env.ADMIN_NAME || "Admin";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
    );
  }

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const prisma = new PrismaClient();

  // 1) Find or create the auth user.
  let authId: string | undefined;
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => (u.email || "").toLowerCase() === email);
  if (existing) {
    authId = existing.id;
    console.log(`Auth user already exists: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) throw error || new Error("Could not create auth user");
    authId = data.user.id;
    console.log(`Created auth user: ${email} / ${password}`);
  }

  // 2) Upsert the profile row with the same id.
  await prisma.profile.upsert({
    where: { id: authId! },
    update: { email, name, role: "admin" },
    create: { id: authId!, email, name, role: "admin" },
  });
  console.log(`Profile ready for ${email}.`);

  // 3) Default settings.
  await prisma.setting.upsert({
    where: { key: "weekly_script_target" },
    update: {},
    create: { key: "weekly_script_target", value: "10" },
  });

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
