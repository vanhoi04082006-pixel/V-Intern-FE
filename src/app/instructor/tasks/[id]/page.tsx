import { TaskDetail } from "@/components/product/intern-work";
import {
  InstructorHeading,
  InstructorNotice,
} from "@/components/instructor/instructor-ui";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="ins-managed-task space-y-5">
      <InstructorHeading
        title="Chi tiết nhiệm vụ"
        description="Kiểm tra yêu cầu, tiến độ, bài nộp và minh chứng trước khi đưa ra phản hồi."
        back={{ href: "/instructor/sprints", label: "Sprint & công việc" }}
      />
      <InstructorNotice title="Duyệt theo đúng bài nộp">
        Đối chiếu commit đã nộp với yêu cầu và tiêu chí hoàn thành. Kết quả AI
        là gợi ý; điểm và quyết định chính thức được giảng viên xác nhận trong
        phần bài nộp.
      </InstructorNotice>
      <TaskDetail id={id} managed />
    </div>
  );
}
