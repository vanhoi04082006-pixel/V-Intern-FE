import { InternEntry } from "@/components/product/intern-entry";
import { Salary } from "@/components/product/outcomes";
import { StudentOutcomeHeading } from "@/components/intern/student-outcome-heading";
export default function Page() {
  return (
    <InternEntry>
      <StudentOutcomeHeading
        title="Lương ảo"
        subtitle="Theo dõi tích lũy và các thay đổi trong sổ giao dịch của chương trình"
      />
      <Salary />
    </InternEntry>
  );
}
