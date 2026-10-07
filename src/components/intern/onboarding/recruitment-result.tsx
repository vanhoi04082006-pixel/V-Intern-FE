"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRecruitmentFlow } from "./recruitment-provider";
import { RECRUITMENT_ROLES } from "./recruitment-presentation";
import { roleLabel } from "@/lib/api/workspace";
export function RecruitmentResult() {
  const router = useRouter();
  const {
    profile,
    interview,
    busy,
    notice,
    retryEvaluation,
    selectRole,
    reload,
  } = useRecruitmentFlow();
  const result =
    profile.status === "passed" || profile.status === "failed"
      ? profile.result
      : null;
  const retryRole = RECRUITMENT_ROLES.find(
    (r) => r.id === (result?.recommendedRole ?? profile.selectedRole),
  );
  const canRetake = profile.attemptsRemaining > 0 && !profile.nextEligibleAt;
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-navy">Kết quả tuyển dụng</h1>
      {notice && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {notice}
        </p>
      )}
      {result ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2
                className={`text-2xl font-bold ${result.decision === "passed" ? "text-emerald-700" : "text-amber-700"}`}
              >
                {result.decision === "passed"
                  ? "Bạn đã trúng tuyển"
                  : "Chưa đạt yêu cầu tuyển dụng"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vị trí:{" "}
                {profile.selectedRoleLabel ?? roleLabel(profile.selectedRole)}
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Technical", score: result.technicalScore },
                  { label: "Soft Skill", score: result.softSkillScore },
                  { label: "Overall", score: result.overallScore },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-sm text-slate-500">{item.label}</dt>
                    <dd className="mt-1 text-2xl font-bold text-navy">
                      {item.score.toFixed(1)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Nhận xét từ AI Recruiter</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                {result.feedback}
              </p>
              {result.strengths.length > 0 && (
                <>
                  <h3 className="mt-4 font-semibold">Điểm mạnh</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {result.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.weaknesses.length > 0 && (
                <>
                  <h3 className="mt-4 font-semibold">Cần cải thiện</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {result.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.criteria.map((c) => (
                <p key={c.code} className="mt-3 text-sm">
                  {c.code}: {c.score} · {c.feedback}
                </p>
              ))}
            </section>
          </div>
          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">Bước tiếp theo</h2>
            {result.decision === "passed" ? (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  Vào Workspace để xem trạng thái phân công mới nhất.
                </p>
                <Link
                  href="/intern"
                  className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                  Vào Workspace
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm">
                  Số lần còn lại: {profile.attemptsRemaining}
                </p>
                {profile.nextEligibleAt && (
                  <p className="mt-3 text-sm">
                    Có thể thử lại sau:{" "}
                    {new Date(profile.nextEligibleAt).toLocaleString("vi-VN")}
                  </p>
                )}
                {result.recommendedRole && (
                  <p className="mt-3 text-sm">
                    Vị trí được đề xuất: {roleLabel(result.recommendedRole)}
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy || !canRetake || !retryRole}
                  onClick={async () => {
                    if (retryRole && (await selectRole(retryRole.id)))
                      router.replace("/intern/onboarding/role");
                  }}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Thử lại tuyển dụng
                </button>
              </>
            )}
          </aside>
        </div>
      ) : (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">
            {interview?.session.status === "evaluation_failed"
              ? "Đánh giá chưa khả dụng"
              : "Chưa có kết quả tuyển dụng"}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {interview?.session.status === "evaluation_failed"
              ? "Hệ thống chưa thể hoàn tất đánh giá. Câu trả lời đã nộp được giữ lại."
              : "Hệ thống đang xử lý trạng thái tuyển dụng của bạn."}
          </p>
          {interview?.session.status === "evaluation_failed" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void retryEvaluation()}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-white"
            >
              Thử lại đánh giá
            </button>
          )}
        </section>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void reload()}
        className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm"
      >
        Tải lại trạng thái
      </button>
    </div>
  );
}
