import { GithubConnection } from "@/components/product/github-connection";
import { PageTitle } from "@/components/product/primitives";
export default function Page() {
  return (
    <>
      <PageTitle
        title="Kết nối GitHub"
        subtitle="Repository của mỗi phiên thuộc tài khoản GitHub của giảng viên chủ trì."
      />
      <GithubConnection />
    </>
  );
}
