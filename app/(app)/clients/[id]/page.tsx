import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeClient, weekOfEngagement } from "@/lib/serialize";
import ClientWorkspace from "@/components/ClientWorkspace";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.client.findUnique({ where: { id: Number(id) } });
  if (!row) notFound();

  const client = serializeClient(row);
  const user = await getCurrentUser();
  const week = weekOfEngagement(client.start_date, client.end_date);
  return <ClientWorkspace client={client} week={week} role={user?.role || "viewer"} />;
}
