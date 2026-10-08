"use client";
import { InternEntry, InternProject } from "@/components/product/intern-entry";
export default function Page() {
  return (
    <InternEntry requireAssignment>
      {(workspace) => <InternProject workspace={workspace} />}
    </InternEntry>
  );
}
