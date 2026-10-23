import { GithubConnection } from "@/components/product/github-connection";
import Link from "next/link";
import {
  InstructorHeading,
  InstructorNotice,
} from "@/components/instructor/instructor-ui";
import { Panel } from "@/components/product/primitives";
export default function Page() {
  return (
    <>
      <InstructorHeading
        title="Kết nối GitHub"
        description="Liên kết danh tính giảng viên để tham gia repository của phiên. Hệ thống tạo repository bằng tài khoản chung do Admin cấu hình."
      />
      <div className="ins-github-layout">
        <div>
          <GithubConnection />
          <div className="mt-5">
            <InstructorNotice title="Tìm repository của phiên">
              Mở chi tiết phiên để xem repository, lời mời và hoạt động GitHub.
              Không cần tự tạo thêm repository cho mỗi sinh viên.
            </InstructorNotice>
          </div>
        </div>
        <Panel title="Chuẩn bị trước khi nhận bài">
          <ol className="ins-checklist">
            <li>
              <strong>Liên kết đúng danh tính</strong>
              <p>
                Kết nối tài khoản GitHub bạn dùng để hướng dẫn và review code.
              </p>
            </li>
            <li>
              <strong>Kiểm tra lời mời repository</strong>
              <p>
                Repository thuộc tài khoản chung. Chấp nhận lời mời trên GitHub
                để có quyền truy cập phù hợp.
              </p>
            </li>
            <li>
              <strong>Đối chiếu bài nộp</strong>
              <p>
                Mở bài từ nhiệm vụ để kiểm tra đúng liên kết, commit và kết quả
                AI trước khi duyệt.
              </p>
            </li>
          </ol>
          <Link className="ins-queue-action mt-5" href="/instructor/sessions">
            Mở các phiên thực tập
          </Link>
        </Panel>
      </div>
    </>
  );
}
