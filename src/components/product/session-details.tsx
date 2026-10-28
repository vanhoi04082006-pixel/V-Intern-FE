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
          <Link className="text-body text-primary" href="/instructor/sessions">
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
