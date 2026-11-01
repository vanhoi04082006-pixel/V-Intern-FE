"use client";
import Link from "next/link";
import { AcademicDetail } from "./academic";
import { PageTitle } from "./primitives";
const unchanged = () => {};
export function SessionDetails({ id }: { id: string }) {
  return (
    <>
      <PageTitle
        title="Chi tiết phiên thực tập"
        action={
          <Link className="inline-flex items-center gap-2 rounded-control px-1 text-body font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" href="/instructor/sessions">
            ← Danh sách phiên
          </Link>
        }
      />
      <AcademicDetail
        embedded
        kind="sessions"
        id={id}
        onClose={unchanged}
        onChanged={unchanged}
      />
    </>
  );
}
