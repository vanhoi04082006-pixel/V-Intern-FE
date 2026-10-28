"use client";
import { InternEntry } from "@/components/product/intern-entry";
import { StudentGithub } from "@/components/intern/student-github";
export default function Page() {
  return (
    <InternEntry>
      {(workspace) => <StudentGithub workspace={workspace} />}
    </InternEntry>
  );
}
