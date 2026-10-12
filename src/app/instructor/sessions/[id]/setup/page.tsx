import { SessionSetup } from "@/components/sessions/session-setup";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { id } = await params;
  const { project } = await searchParams;
  return <SessionSetup sessionId={id} projectId={typeof project === "string" ? project : null} />;
}
