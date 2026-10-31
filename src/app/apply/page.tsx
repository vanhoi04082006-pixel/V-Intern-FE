import type { Metadata } from "next";
import { PublicApplication } from "@/components/applications/public-application";
import "@/components/auth/support.css";

export const metadata: Metadata = {
  title: "Nộp CV ứng tuyển | V-Intern",
  description:
    "Nộp CV một lần — Agent phân tích năng lực, đề xuất nghề phù hợp và xếp lịch phỏng vấn AI trong các khung giờ đang mở.",
};

export default function Page() {
  return <PublicApplication />;
}
