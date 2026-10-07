"use client";
import Link from "next/link";
import { useState } from "react";
import { RoleCard } from "./role-card";
import { RECRUITMENT_ROLES } from "./recruitment-presentation";
import { HorizontalStepper } from "./onboarding-stepper";
import { useRecruitmentFlow } from "./recruitment-provider";
import type { RecruitmentRole } from "@/lib/api/workspace";
export function RoleSelectionStep() {
  const { profile, selectRole, start, busy, notice } = useRecruitmentFlow();
  const [selected, setSelected] = useState<RecruitmentRole | null>(null);
  const chosen =
    selected ??
    RECRUITMENT_ROLES.find((r) => r.id === profile.selectedRole)?.id ??
    null;
  const canStart = profile.attemptsRemaining > 0 && !profile.nextEligibleAt;
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-navy">
        Chọn vị trí ứng tuyển
      </h1>
      <p className="mt-3 text-slate-600">
        Chọn thế mạnh của bạn để bắt đầu vòng phỏng vấn.
      </p>
      <div className="mt-6">
        <HorizontalStepper activeStep={2} />
      </div>
      <fieldset disabled={busy} className="mt-8">
        <legend className="sr-only">Chọn vị trí ứng tuyển</legend>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RECRUITMENT_ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              checked={chosen === role.id}
              onChange={setSelected}
            />
          ))}
        </div>
      </fieldset>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Trước khi bắt đầu</h2>
        <p className="mt-2 text-sm text-slate-600">
          Vai trò sẽ được lưu vào hệ thống. Bạn chỉ có thể thay đổi trước khi
          bắt đầu phỏng vấn.
        </p>
        <p className="mt-2 text-sm">
          Số lần còn lại: {profile.attemptsRemaining}
        </p>
        {profile.nextEligibleAt && (
          <p className="mt-2 text-sm">
            Có thể thử lại sau:{" "}
            {new Date(profile.nextEligibleAt).toLocaleString("vi-VN")}
          </p>
        )}
      </section>
      {notice && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {notice}
        </p>
      )}
      <div className="mt-7 flex gap-3">
        <Link
          href="/intern/onboarding"
          className="rounded-lg border border-slate-200 px-5 py-3 text-sm"
        >
          Quay lại
        </Link>
        <button
          type="button"
          disabled={!chosen || busy || !canStart}
          onClick={async () => {
            if (chosen && (await selectRole(chosen))) await start();
          }}
          className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Đang xử lý..." : "Bắt đầu phỏng vấn"}
        </button>
      </div>
    </div>
  );
}
