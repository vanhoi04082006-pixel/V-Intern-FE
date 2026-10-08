import { Verify } from "@/components/product/outcomes";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <Verify initialCode={code} />;
}
