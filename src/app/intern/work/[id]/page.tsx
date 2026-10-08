import { InternEntry } from "@/components/product/intern-entry";
import { TaskDetail } from "@/components/product/intern-work";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <InternEntry requireAssignment>
      <TaskDetail id={id} />
    </InternEntry>
  );
}
