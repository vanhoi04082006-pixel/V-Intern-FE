import { InternEntry } from "@/components/product/intern-entry";
import { InternWork } from "@/components/product/intern-work";
export default function Page() {
  return (
    <InternEntry requireAssignment>
      <InternWork />
    </InternEntry>
  );
}
