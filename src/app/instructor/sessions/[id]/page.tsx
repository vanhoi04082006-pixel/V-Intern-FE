import { SessionOverview } from "@/components/sessions/session-overview";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ taskStatus?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <SessionOverview
      key={`${id}:${String(query.taskStatus ?? "")}`}
      sessionId={id}
      initialTaskStatus={
        typeof query.taskStatus === "string" ? query.taskStatus : ""
      }
    />
  );
}
