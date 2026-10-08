import { InternEntry } from "@/components/product/intern-entry";
import { Evaluations } from "@/components/product/outcomes";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <InternEntry>
      <Evaluations id={id} />
    </InternEntry>
  );
}
