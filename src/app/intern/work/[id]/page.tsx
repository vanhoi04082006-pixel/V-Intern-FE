import { InternEntry } from "@/components/product/intern-entry";
import { TaskDetail } from "@/components/product/intern-work";
import { StudentHeading } from "@/components/intern/student-ui";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const submitIntent = query.submit === "1";
  return (
    <InternEntry requireAssignment>
      <StudentHeading
        eyebrow="Từ yêu cầu đến kết quả"
        title={submitIntent ? "Nộp bài để chuyển sang Chờ duyệt" : "Chi tiết nhiệm vụ"}
        description={
          submitIntent
            ? "Gửi link PR/commit và mô tả bài làm. Trạng thái chỉ chuyển sang Chờ duyệt sau khi nộp thành công."
            : "Đọc tiêu chí, cập nhật tiến độ và theo dõi bài nộp cùng phản hồi ở một nơi."
        }
      />
      <TaskDetail id={id} intent={submitIntent ? "submit" : undefined} />
    </InternEntry>
  );
}
