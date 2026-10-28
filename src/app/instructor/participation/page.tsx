import { InstructorParticipation } from "@/components/participation/instructor";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  return <InstructorParticipation initialSessionId={sessionId} />;
}
