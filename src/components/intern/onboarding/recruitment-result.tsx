"use client";
import { StudentHeading } from "../student-ui";
import { StudentScore } from "../student-score";
import { CircleCheck, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRecruitmentFlow } from "./recruitment-provider";
import { roleLabel } from "@/lib/api/workspace";
import { RateComparison } from "@/components/workspace/workspace-charts";
import { RecruitmentPolicy } from "./recruitment-policy";
const criterionLabels: Record<string, string> = { knowledge: "Kiến thức chuyên môn", communication: "Giao tiếp", problem_solving: "Giải quyết vấn đề", english: "Tiếng Anh", confidence: "Trình bày hiểu biết", reasoning: "Lập luận" };
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
  const roleGuidance = result?.decision === "failed" && result.overallScore >= 50 && result.overallScore <= 70;
  const alternativeRole = roleGuidance && result?.recommendedRole !== profile.selectedRole ? result?.recommendedRole : null;
  const retryRole = roleGuidance ? alternativeRole : profile.selectedRole;
  const canRetake = profile.attemptsRemaining > 0 && !profile.nextEligibleAt;
  return (
    <div>
      <StudentHeading
        title="Kết quả tuyển dụng"
        description="Đọc kết quả, hiểu điểm mạnh và chọn bước tiếp theo cho hành trình thực tập của bạn."
      />
      {notice && (
        <p
          role="alert"
          className="mt-4 rounded-control bg-destructive-subtle p-3 text-body text-destructive"
        >
          {notice}
        </p>
      )}
      {result ? (
        <div className="student-recruitment-result mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <section
              className="student-result-hero"
              data-passed={result.decision === "passed"}
            >
              <div>
                <span
                  className={`mb-4 inline-flex rounded-full px-3 py-1 text-caption font-semibold ${result.decision === "passed" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}
                >
                  {result.decision === "passed"
                    ? "Đã hoàn tất đánh giá"
                  : roleGuidance ? alternativeRole ? "Khám phá hướng phù hợp hơn" : "Cần định hướng thêm" : "Chuẩn bị cho lần tiếp theo"}
                </span>
                <h2
                  className={`text-page font-bold ${result.decision === "passed" ? "text-success" : "text-warning"}`}
                >
                  {result.decision === "passed"
                    ? "Bạn đã trúng tuyển"
                  : roleGuidance ? alternativeRole ? "AI đề xuất bạn thử một vai trò khác" : "Cần định hướng thêm" : "Chưa đạt yêu cầu tuyển dụng"}
                </h2>
                {result.decision === "passed" && (
                  <p
                    role="status"
                    className="mt-2 font-semibold text-success"
                  >
                    Chúc mừng! Bạn đã vượt qua phỏng vấn.
                  </p>
                )}
                <p className="mt-3 text-body leading-7 text-muted-foreground">
                  Vị trí:{" "}
                  {profile.selectedRoleLabel ?? roleLabel(profile.selectedRole)}
                </p>
              </div>
              <StudentScore
                value={result.overallScore}
                label="Điểm tổng hợp"
                tone={result.decision === "passed" ? "green" : "amber"}
              />
              <div className="space-y-5 sm:col-span-2">
                {[
                  ["Chuyên môn", result.technicalScore],
                  ["Giao tiếp & tiếng Anh", result.softSkillScore],
                ].map(([label, score]) => (
                  <div className="student-progress" key={String(label)}>
                    <div>
                      <span>{label}</span>
                      <span>
                        <strong>{Number(score).toFixed(1)}</strong> /100
                      </span>
                    </div>
                    <progress
                      aria-label={String(label)}
                      max={100}
                      value={Number(score)}
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="workspace-interview-feedback">
              <h2 className="text-section font-bold">Nhận xét từ AI Recruiter</h2>
              <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed">
                {result.feedback}
              </p>
              {result.strengths.length > 0 && (
                <>
                  <h3 className="mt-5 flex items-center gap-2 font-semibold text-success">
                    <CircleCheck size={17} aria-hidden="true" />
                    Điểm mạnh
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-body leading-7 text-muted-foreground">
                    {result.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.weaknesses.length > 0 && (
                <>
                  <h3 className="mt-5 flex items-center gap-2 font-semibold text-warning">
                    <Lightbulb size={17} aria-hidden="true" />
                    Cần cải thiện
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-body leading-7 text-muted-foreground">
                    {result.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
              {result.criteria.length > 0 && <div className="mt-8"><RateComparison label="Năng lực thể hiện qua phỏng vấn" unit="điểm" items={result.criteria.map((c) => ({ label: criterionLabels[c.code] ?? c.code, value: c.score }))} /><dl className="workspace-interview-criteria">{result.criteria.map((c) => <div key={c.code}><dt>{criterionLabels[c.code] ?? c.code}</dt><dd>{c.feedback}</dd></div>)}</dl></div>}
            </section>
          </div>
          <aside className="workspace-interview-next">
            <h2 className="font-bold">Bước tiếp theo</h2>
            {result.decision === "passed" ? (
              <>
                <p className="mt-3 text-body text-muted-foreground">
                  Vào Workspace để xem trạng thái phân công mới nhất.
                </p>
                <Link
                  href="/intern"
                  className="mt-4 inline-block rounded-control bg-primary px-4 py-2 text-body font-semibold text-primary-foreground"
                >
                  Vào Workspace
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-body">
                  Số lần còn lại: {profile.attemptsRemaining}
                </p>
                {profile.nextEligibleAt && (
                  <p className="mt-3 text-body">
                    Có thể thử lại sau:{" "}
                    {new Date(profile.nextEligibleAt).toLocaleString("vi-VN")}
                  </p>
                )}
                {alternativeRole && (
                  <p className="mt-3 text-body">
                    Vị trí được đề xuất: <strong>{roleLabel(alternativeRole)}</strong>
                  </p>
                )}
                {roleGuidance && <p className="mt-3 text-body leading-7 text-muted-foreground">{alternativeRole ? 'Đọc lý do và các câu trả lời được AI viện dẫn trong phần nhận xét. Đề xuất giúp bạn chọn hướng học tập; bạn cần phỏng vấn lại để đạt vị trí mới.' : 'Điểm nằm trong khoảng 50–70, nhưng hiện chưa có nghề thay thế đang nhận hồ sơ. Xem nhận xét và liên hệ giảng viên để được hướng dẫn. Kết quả và số lượt vẫn được giữ.'}</p>}
                {profile.attemptsRemaining <= 0 && <p role="status" className="mt-4 text-body text-warning">Bạn đã dùng hết 3 lượt phỏng vấn. Liên hệ giảng viên hoặc quản trị viên để được hướng dẫn; đổi vai trò không tạo thêm lượt.</p>}
                {profile.interviewSchedule ? <div className="mt-4 space-y-3"><p className="text-body leading-7 text-muted-foreground">Liên hệ giảng viên để hẹn lịch tiếp theo. Nghề mới phải phù hợp với đề xuất đã lưu; số lượt và thời gian chờ vẫn được giữ.</p><Link className="student-link inline-flex" href="/intern/onboarding/role">Xem lịch của tôi</Link></div> : <>{roleGuidance && !alternativeRole ? <Link href="/intern/onboarding/role" className="student-link mt-4 inline-flex">Xem vị trí đang tuyển</Link> : <button
                  type="button"
                  disabled={busy || !canRetake || !retryRole}
                  onClick={async () => {
                    if (retryRole && (await selectRole(retryRole)))
                      router.replace("/intern/onboarding/role");
                  }}
                  className="student-action mt-4"
                >
                  {roleGuidance ? "Chọn vai trò được đề xuất" : "Thử lại tuyển dụng"}
                </button>}
                {roleGuidance && alternativeRole && canRetake && <Link className="student-link mt-4 inline-flex" href="/intern/onboarding/role">Tự chọn vai trò khác</Link>}</>}
              </>
            )}
            <RecruitmentPolicy attemptNumber={profile.attemptNumber} attemptsRemaining={profile.attemptsRemaining} />
          </aside>
        </div>
      ) : (
        <section className="mt-6 rounded-panel border border-border bg-card p-6">
          <h2 className="text-section font-bold">
            {interview?.session.status === "evaluation_failed"
              ? "Đánh giá chưa khả dụng"
              : "Chưa có kết quả tuyển dụng"}
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            {interview?.session.status === "evaluation_failed"
              ? "Hệ thống chưa thể hoàn tất đánh giá. Câu trả lời đã nộp được giữ lại."
              : "Hệ thống đang xử lý trạng thái tuyển dụng của bạn."}
          </p>
          {interview?.session.status === "evaluation_failed" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void retryEvaluation()}
              className="mt-4 rounded-control bg-primary px-4 py-2 text-primary-foreground"
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
        className="mt-5 rounded-control border border-border px-4 py-2 text-body"
      >
        Tải lại trạng thái
      </button>
    </div>
  );
}
