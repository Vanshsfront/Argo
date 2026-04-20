import CRMBoard from "@/components/CRMBoard";

export const dynamic = "force-dynamic";

export default function CRMPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  return <CRMBoard />;
}
