import { InternEntry } from "@/components/product/intern-entry";
import { Salary } from "@/components/product/outcomes";
import { PageTitle } from "@/components/product/primitives";
export default function Page() {
  return (
    <InternEntry>
      <PageTitle
        title="Lương ảo"
        subtitle="Số dư và sổ giao dịch VND_VIRTUAL từ hệ thống"
      />
      <Salary />
    </InternEntry>
  );
}
