import type { Metadata } from "next";
import { Verify } from "@/components/product/outcomes";

export const metadata: Metadata = {
  title: "Xác minh chứng nhận | V-Intern",
  description:
    "Nhập mã xác minh in trên chứng nhận để kiểm tra hiệu lực — kết quả đọc trực tiếp từ hệ thống V-Intern.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <Verify initialCode={code} />;
}
