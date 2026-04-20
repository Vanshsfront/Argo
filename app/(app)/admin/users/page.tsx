import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UsersAdmin from "@/components/UsersAdmin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (u.role !== "admin") redirect("/ceo");
  return <UsersAdmin />;
}
