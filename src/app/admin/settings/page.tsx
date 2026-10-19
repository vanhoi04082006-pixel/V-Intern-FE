import { AdminSettings } from "@/components/product/admin-management";
import { GithubRepositoryAdmin } from '@/components/product/github-connection';
export default function Page() {
  return <><GithubRepositoryAdmin /><AdminSettings /></>;
}
