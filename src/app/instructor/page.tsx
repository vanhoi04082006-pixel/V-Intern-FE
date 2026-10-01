import type { Metadata } from "next";

import { InstructorWorkspace } from "@/components/instructor/instructor-workspace";

export const metadata: Metadata = {
  title: "Instructor Workspace | V-Intern",
  description:
    "Không gian làm việc giảng viên trên V-Intern: phiên thực tập, sprint & burndown, hiệu suất sinh viên, review pull request và đánh giá AI.",
};

export default function InstructorPage() {
  return <InstructorWorkspace />;
}
