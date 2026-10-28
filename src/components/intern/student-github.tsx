"use client";
import { CodeXml, GitPullRequest, ShieldCheck } from "lucide-react";
import type { InternWorkspace } from "@/lib/api/workspace";
import {
  GithubConnection,
  SessionRepositoryCard,
} from "@/components/product/github-connection";
import { StudentHeading, StudentPanel, StudentLink } from "./student-ui";

export function StudentGithub({ workspace }: { workspace: InternWorkspace }) {
  return (
    <>
      <StudentHeading
        title="GitHub của bạn"
        description="Liên kết đúng tài khoản, nhận lời mời vào dự án và chuẩn bị mã nguồn để nộp bài."
      />
      <div className="student-dashboard-grid student-github-workspace">
        <div className="space-y-5">
          <GithubConnection />
          {workspace.assignment ? (
            <SessionRepositoryCard
              sessionId={workspace.assignment.session.id}
            />
          ) : workspace.hasAssignmentHistory ? (
            <StudentPanel title="Kết nối cho hành trình tiếp theo">
              <p className="text-body leading-7 text-muted-foreground">
                Bạn hiện không có phân công đang hoạt động. Kết nối danh tính
                GitHub vẫn được giữ để sử dụng khi có phiên mới. Các kết quả
                đã ghi nhận có thể xem lại trong khu vực đánh giá.
              </p>
              <div className="mt-4">
                <StudentLink secondary href="/intern/evaluations">
                  Xem kết quả đã ghi nhận
                </StudentLink>
              </div>
            </StudentPanel>
          ) : (
            <StudentPanel title="Repository sẽ xuất hiện sau khi phân công">
              <p className="text-body leading-7 text-muted-foreground">
                Bạn có thể liên kết GitHub ngay bây giờ. Khi được phân vào dự
                án, kiểm tra lời mời repository trên GitHub trước khi bắt đầu
                viết code.
              </p>
            </StudentPanel>
          )}
        </div>
        <div className="space-y-5">
          <details open className="student-help-disclosure">
            <summary><GitPullRequest size={16} aria-hidden="true" />Từ kết nối đến bài nộp</summary>
            <ol className="student-step-list">
              <li>
                <div>
                  <strong>Liên kết đúng tài khoản</strong>
                  <p>
                    Dùng danh tính GitHub của bạn để hệ thống xác minh bài nộp.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Chấp nhận lời mời</strong>
                  <p>
                    Mở lời mời repository trên GitHub. Trạng thái gửi lời mời
                    không có nghĩa bạn đã chấp nhận.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Làm trên nhánh công việc</strong>
                  <p>
                    Tạo nhánh có mã nhiệm vụ để dễ đối chiếu, kiểm thử rồi mở
                    Pull Request.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Nộp tại nhiệm vụ</strong>
                  <p>
                    Dán liên kết vào bài nộp trong V-Intern và theo dõi kết quả
                    review.
                  </p>
                </div>
              </li>
            </ol>
          </details>
          <StudentPanel title="Giữ tài khoản an toàn" icon={ShieldCheck}>
            <p className="text-body leading-7 text-muted-foreground">
              V-Intern không yêu cầu bạn nhập mật khẩu GitHub tại đây. Việc liên
              kết được xác nhận trên trang GitHub.
            </p>
          </StudentPanel>
          {workspace.status === "active" && (
            <StudentLink secondary href="/intern/work">
              <CodeXml size={16} aria-hidden="true" />
              Đi đến công việc
            </StudentLink>
          )}
        </div>
      </div>
    </>
  );
}
