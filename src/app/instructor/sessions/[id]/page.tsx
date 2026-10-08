import { SessionDetails } from "@/components/product/session-details";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetails id={id} />;
}
