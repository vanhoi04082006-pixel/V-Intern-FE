import { SessionOverview } from "@/components/sessions/session-overview";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionOverview sessionId={id} />;
}
