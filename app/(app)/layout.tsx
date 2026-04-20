import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where: any = { archived: false };
  if (user.role === "viewer") where.id = { in: user.assigned_client_ids };

  const clients = await prisma.client.findMany({
    where,
    select: { id: true, fullName: true, businessName: true, status: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <AppShell
      user={user}
      clients={clients.map((c) => ({
        id: c.id,
        full_name: c.fullName,
        business_name: c.businessName,
        status: c.status,
      }))}
    >
      {children}
    </AppShell>
  );
}
