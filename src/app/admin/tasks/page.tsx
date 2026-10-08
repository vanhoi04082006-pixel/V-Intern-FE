import { TaskManagement } from "@/components/product/sprint-management";
import { PageTitle } from "@/components/product/primitives";
export default function Page() {
  return (
    <>
      <PageTitle
        title="Nhiệm vụ hệ thống"
        subtitle="Quản lý nhiệm vụ và kết quả review"
      />
      <TaskManagement />
    </>
  );
}
