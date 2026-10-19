import { AdminSettings } from "@/components/product/admin-management";
import { GithubRepositoryAdmin } from '@/components/product/github-connection';
import { PageTitle } from "@/components/product/primitives";

/**
 * Cài đặt hệ thống: một tiêu đề trang duy nhất, hai nhóm nội dung rõ ràng —
 * repository GitHub dùng chung (cấp tài khoản, webhook) và cấu hình nghiệp vụ
 * lưu tại Backend.
 */
export default function Page() {
  return (
    <>
      <PageTitle
        title="Cài đặt hệ thống"
        subtitle="Tài khoản GitHub dùng chung để tạo repository, webhook và cấu hình nghiệp vụ được lưu tại Backend"
      />
      <div className="mb-8">
        <GithubRepositoryAdmin />
      </div>
      <AdminSettings embedded />
    </>
  );
}
