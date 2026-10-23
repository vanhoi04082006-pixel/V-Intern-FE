"use client";
import { StudentHeading } from "../student-ui";
import Link from "next/link";
import { useState } from "react";
import { RoleCard } from "./role-card";
import { RECRUITMENT_ROLES } from "./recruitment-presentation";
import { HorizontalStepper, MobileStepbar } from "./onboarding-stepper";
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
      <StudentHeading
        eyebrow="Bước 2 · Chọn hướng phát triển"
        title="Chọn vị trí ứng tuyển"
        description="Khám phá yêu cầu của từng vị trí và chọn hướng phù hợp với thế mạnh của bạn. Vòng phỏng vấn sẽ dựa trên lựa chọn này."
      />
      <div className="mt-6 lg:hidden">
        <MobileStepbar activeStep={2} variant="card" />
      </div>
      <div className="mt-6 hidden lg:block">
        <HorizontalStepper activeStep={2} />
      </div>
      <fieldset disabled={busy} className="mt-8">
        <legend className="sr-only">Chọn vị trí ứng tuyển</legend>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
      <section className="mt-8 border-t border-slate-200 pt-6">
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
        <p role="alert" className="mt-4 text-sm text-rose-700">
          {notice}
        </p>
      )}
      <div className="student-selection-bar">
        <p className="mr-auto text-sm text-slate-600">
          {chosen ? (
            <>
              Bạn đã chọn{" "}
              <strong className="text-navy">
                {RECRUITMENT_ROLES.find((role) => role.id === chosen)?.label}
              </strong>
            </>
          ) : (
            "Chọn một vị trí ở trên để tiếp tục"
          )}
        </p>
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
