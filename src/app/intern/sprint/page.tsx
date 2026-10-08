"use client";
import { InternEntry, InternSprint } from "@/components/product/intern-entry";
export default function Page() {
  return (
    <InternEntry requireAssignment>
      {(workspace) => <InternSprint workspace={workspace} />}
    </InternEntry>
  );
}
