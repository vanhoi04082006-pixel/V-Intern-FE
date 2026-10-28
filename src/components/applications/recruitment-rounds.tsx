"use client";
import { CredentialRecovery } from "./credential-recovery";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  listRecruitmentRounds,
  createRound,
  roundDetail,
  roundStatus,
  createInterviewSlot,
  closeInterviewSlot,
  roundApplications,
  staffApplication,
  applicationAction,
  downloadStaffCv,
  requestApplicationAccess,
  resendApplicationCredentials,
  applicationLabels,
  type StaffApplication,
} from "@/lib/api/applications";
import { listRecruitingCareers } from "@/lib/api/career-roles";
import { useResource } from "@/lib/api/use-resource";
import { useAction } from "@/components/product/use-action";
import {
  buttonClass,
  inputClass,
  PageTitle,
  Empty,
  Pager,
  Modal,
  StatusDot,
} from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { ApplicationTimeline } from "./public-application";
import { InterviewRebooking } from './interview-rebooking';
const localIso = (value: FormDataEntryValue | null) =>
  new Date(String(value)).toISOString();
export function RecruitmentRounds() {
  const list = useResource(
      useCallback((signal: AbortSignal) => listRecruitmentRounds(signal), []),
    ),
    action = useAction();
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false);
  return (
    <div className="space-y-7">
      <PageTitle
        title="Tuyển dụng & hồ sơ CV"
        subtitle="Mở đợt tuyển, khung phỏng vấn và theo dõi hành trình từ CV đến tài khoản."
        action={
          <button className={buttonClass} onClick={() => setCreating(true)}>
            Tạo đợt tuyển
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4">
        <Link
          className="text-sm font-semibold text-blue-700"
          href="/apply"
          target="_blank"
        >
          Mở cổng nộp CV ↗
        </Link>
        <span className="text-xs text-slate-500">
          Chỉ nghề đang tuyển và đủ 10 câu hỏi theo nhóm mới mở được lịch.
        </span>
      </div>
      {list.loading && !list.data ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.data?.length ? (
        <label className="block max-w-xl text-sm font-medium">
          Đợt tuyển
          <select
            className={inputClass}
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
          >
            <option value="">Chọn đợt để quản lý</option>
            {list.data.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ·{" "}
                {r.status === "open"
                  ? "Đang mở"
                  : r.status === "closed"
                    ? "Đã đóng"
                    : "Bản nháp"}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <Empty
          title="Chưa có đợt tuyển"
          description="Tạo đợt, thêm lịch rồi mở nhận CV. Hệ thống không tự tạo lịch ngoài các khung bạn đã mở."
        />
      )}
      {selected && (
        <RoundWorkspace key={selected} id={selected} onUpdate={list.reload} />
      )}
      {creating && (
        <Modal
          title="Tạo đợt tuyển"
          onClose={() => {
            if (!action.busy) setCreating(false);
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void action.run(async () => {
                const round = await createRound({
                  name: String(data.get("name")),
                  opensAt: localIso(data.get("opens")),
                  closesAt: localIso(data.get("closes")),
                });
                list.reload();
                setSelected(round.id);
                setCreating(false);
              });
            }}
          >
            <label className="block text-sm font-medium">
              Tên đợt tuyển
              <input
                name="name"
                className={inputClass}
                minLength={3}
                maxLength={160}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Bắt đầu nhận CV (giờ máy của bạn)
              <input
                name="opens"
                type="datetime-local"
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Hạn nhận CV (giờ máy của bạn)
              <input
                name="closes"
                type="datetime-local"
                className={inputClass}
                required
              />
            </label>
            <p className="text-xs leading-5 text-slate-500">
              Đợt được lưu ở trạng thái nháp. Thêm ít nhất một khung giờ đủ điều
              kiện rồi mở nhận hồ sơ.
            </p>
            {action.error ? <ErrorState error={action.error} /> : null}
            <button className={buttonClass} disabled={action.busy}>
              Tạo bản nháp
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function RoundWorkspace({
  id,
  onUpdate,
}: {
  id: string;
  onUpdate: () => void;
}) {
  const state = useResource(
      useCallback((signal: AbortSignal) => roundDetail(id, signal), [id]),
    ),
    roles = useResource(
      useCallback((signal: AbortSignal) => listRecruitingCareers(signal), []),
    ),
    action = useAction();
  const [tab, setTab] = useState<"schedule" | "applications">("schedule"),
    [slotForm, setSlotForm] = useState(false),
    [notice, setNotice] = useState("");
  const reload = () => {
    state.reload();
    onUpdate();
  };
  if (state.loading && !state.data) return <LoadingState />;
  if (state.error)
    return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  const round = state.data;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy">{round.name}</h2>
          <p className="mt-2 text-xs text-slate-500">
            Mã đợt:{" "}
            <span className="select-all break-all font-mono">{round.id}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {new Date(round.opensAt).toLocaleString("vi-VN")} —{" "}
            {new Date(round.closesAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusDot tone={round.status === "open" ? "green" : "slate"}>
            {round.status === "open"
              ? "Đang nhận CV"
              : round.status === "closed"
                ? "Đã đóng"
                : "Bản nháp"}
          </StatusDot>
          <button
            className={buttonClass}
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                await roundStatus(
                  id,
                  round.status === "open" ? "closed" : "open",
                );
                reload();
              })
            }
          >
            {round.status === "open" ? "Đóng nhận CV" : "Mở nhận CV"}
          </button>
        </div>
      </div>
      <div
        className="flex gap-6 border-b border-slate-200"
        role="tablist"
        aria-label="Quản lý đợt tuyển"
      >
        {(["schedule", "applications"] as const).map((value) => (
          <button
            className={`border-b-2 py-3 text-sm font-semibold ${tab === value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}
            role="tab"
            aria-selected={tab === value}
            key={value}
            onClick={() => setTab(value)}
          >
            {value === "schedule" ? "Khung giờ phỏng vấn" : "Hồ sơ ứng tuyển"}
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {action.error ? <ErrorState error={action.error} /> : null}
      {tab === "schedule" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Agent chỉ chọn trong các lịch đang mở và còn chỗ. Mặc định cần 60
              phút chuẩn bị; email đăng nhập gửi trước 30 phút.
            </p>
            <button className={buttonClass} disabled={action.busy} onClick={() => {
              action.clearError();
              setNotice("");
              setSlotForm(true);
            }}>
              Thêm khung giờ
            </button>
          </div>
          {round.slots.length ? (
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {round.slots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-navy">
                      {roles.data?.find((r) => r.code === slot.roleCode)
                        ?.label ?? slot.roleCode}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: slot.timezone,
                      }).format(new Date(slot.startsAt))}{" "}
                      · {slot.timezone}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Chuẩn bị ≥{slot.minimumPreparationMinutes} phút · mail
                      đăng nhập trước {slot.credentialsLeadMinutes} phút
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm tabular-nums">
                      <strong>{slot.booked}</strong> / {slot.capacity} chỗ
                    </p>
                    <button
                      className="text-sm font-semibold text-blue-700 disabled:text-slate-400"
                      disabled={slot.status !== "open" || action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await closeInterviewSlot(id, slot.id);
                          setNotice(
                            "Đã đóng khung giờ cho lịch mới. Các booking đang xác nhận vẫn giữ nguyên; đổi/hủy từ hồ sơ ứng viên.",
                          );
                          reload();
                        })
                      }
                    >
                      {slot.status === "open" ? "Đóng khung giờ" : "Đã đóng"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title="Chưa có khung giờ"
              description="Thêm lịch cho từng nghề, sức chứa và múi giờ để Agent có thể xếp lịch."
            />
          )}
          {slotForm && (
            <Modal
              title="Mở khung phỏng vấn"
              onClose={() => {
                if (!action.busy) setSlotForm(false);
              }}
            >
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void action.run(async () => {
                    await createInterviewSlot(id, {
                      roleCode: String(data.get("role")),
                      startsAt: localIso(data.get("start")),
                      endsAt: localIso(data.get("end")),
                      timezone: String(data.get("timezone")),
                      capacity: Number(data.get("capacity")),
                      minimumPreparationMinutes: Number(data.get("prepare")),
                      credentialsLeadMinutes: Number(data.get("lead")),
                    });
                    setSlotForm(false);
                    reload();
                  });
                }}
              >
                <label className="text-sm font-medium sm:col-span-2">
                  Nghề đang tuyển
                  <select name="role" className={inputClass} required>
                    <option value="">Chọn nghề đủ ngân hàng câu hỏi</option>
                    {roles.data?.map((role) => (
                      <option key={role.code} value={role.code}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Bắt đầu (giờ máy của bạn)
                  <input
                    name="start"
                    type="datetime-local"
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Kết thúc (giờ máy của bạn)
                  <input
                    name="end"
                    type="datetime-local"
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Múi giờ hiển thị
                  <input
                    name="timezone"
                    className={inputClass}
                    defaultValue="Asia/Ho_Chi_Minh"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Số ứng viên tối đa
                  <input
                    name="capacity"
                    type="number"
                    className={inputClass}
                    min={1}
                    max={100}
                    defaultValue={1}
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Chuẩn bị tối thiểu (phút)
                  <input
                    name="prepare"
                    type="number"
                    className={inputClass}
                    min={30}
                    max={10080}
                    defaultValue={60}
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Gửi mail đăng nhập trước (phút)
                  <input
                    name="lead"
                    type="number"
                    className={inputClass}
                    min={5}
                    defaultValue={30}
                    required
                  />
                </label>
                {action.error ? (
                  <div className="sm:col-span-2">
                    <ErrorState error={action.error} />
                  </div>
                ) : null}
                <button
                  className={`${buttonClass} sm:col-span-2 sm:justify-self-start`}
                  disabled={action.busy}
                >
                  Mở khung giờ
                </button>
              </form>
            </Modal>
          )}
        </div>
      ) : (
        <RoundCandidates roundId={id} slots={round.slots} />
      )}
    </section>
  );
}
function RoundCandidates({
  roundId,
  slots,
}: {
  roundId: string;
  slots: Awaited<ReturnType<typeof roundDetail>>["slots"];
}) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState<StaffApplication | null>(null),
    [confirmCancel, setConfirmCancel] = useState(false),
    [credentialResend, setCredentialResend] = useState(false),
    [acknowledgeUncertain, setAcknowledgeUncertain] = useState(false),
    [notice, setNotice] = useState("");
  const state = useResource(
      useCallback(
        (signal: AbortSignal) => roundApplications(roundId, page, signal),
        [roundId, page],
      ),
    ),
    action = useAction();
  const refreshSelected = async () => {
    if (selected) setSelected(await staffApplication(roundId, selected.id));
    state.reload();
  };
  const resendAccess = async () => {
    const candidate = state.data?.items.find(
      (item) => item.id === selected?.id,
    );
    if (!candidate) return;
    await requestApplicationAccess(roundId, candidate.email);
    setNotice(
      "Đã tiếp nhận yêu cầu gửi lại liên kết theo dõi. Mỗi hồ sơ cần chờ 60 giây giữa hai lần yêu cầu. Mật khẩu không thay đổi.",
    );
  };
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <p className="text-sm text-slate-600">
          CV chỉ hiển thị trong phạm vi đợt tuyển bạn quản lý.
        </p>
        <button
          className="text-sm font-semibold text-blue-700"
          onClick={state.reload}
        >
          Làm mới
        </button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {state.loading && !state.data ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.data?.items.length ? (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {state.data.items.map((candidate) => (
            <li
              key={candidate.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-semibold text-navy">{candidate.fullName}</p>
                <p className="break-all text-sm text-slate-500">
                  {candidate.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {applicationLabels[candidate.status] ?? candidate.status}
                  {candidate.matchedRole ? ` · ${candidate.matchedRole}` : ""}
                  {candidate.lastCode ? ` · ${candidate.lastCode}` : ""}
                </p>
              </div>
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () =>
                    setSelected(await staffApplication(roundId, candidate.id)),
                  )
                }
              >
                Xem hồ sơ
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="Chưa có hồ sơ"
          description="Chia sẻ đường dẫn cổng nộp CV và mã đợt tuyển cho ứng viên."
        />
      )}
      {state.data && (
        <Pager
          page={page}
          total={state.data.total}
          totalPages={Math.ceil(state.data.total / 25)}
          onChange={setPage}
        />
      )}
      {selected && (
        <section className="space-y-5 border-t border-slate-200 pt-6">
          <div className="flex justify-between">
            <h2 className="font-semibold">Chi tiết hồ sơ</h2>
            <button
              className="text-sm text-blue-700"
              onClick={() => setSelected(null)}
            >
              Đóng chi tiết
            </button>
          </div>
          <ApplicationTimeline application={selected} showLoginLink={false} />
          <InterviewRebooking roundId={roundId} application={selected} slots={slots} onChanged={refreshSelected}/>
          <CredentialRecovery roundId={roundId} applicationId={selected.id} slots={slots} onChanged={refreshSelected}/>
          <details className="space-y-4 border-y border-slate-200 py-4">
            <summary className="cursor-pointer text-sm font-semibold text-blue-700">
              Phân tích CV & bằng chứng của Agent
            </summary>
            {selected.analysis.facts ? (
              <div className="space-y-4 text-sm leading-6">
                <p className="text-slate-500">
                  Độ tin cậy phân tích:{" "}
                  {Math.round(selected.analysis.facts.confidence * 100)}% · đây
                  là nhận định của Agent, không phải điểm phỏng vấn.
                </p>
                <ul className="space-y-3">
                  {selected.analysis.facts.facts.map((fact, i) => (
                    <li key={i}>
                      <p className="font-semibold">
                        {fact.skill}{" "}
                        <span className="font-normal text-slate-500">
                          ·{" "}
                          {fact.ref
                            .replace("page:", "Trang ")
                            .replace("paragraph:", "Đoạn ")}
                        </span>
                      </p>
                      <blockquote className="mt-1 border-l-2 border-slate-200 pl-3 text-slate-600">
                        {fact.quote}
                      </blockquote>
                    </li>
                  ))}
                </ul>
                {selected.analysis.facts.missing.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Thông tin cần bổ sung</h3>
                    <ul className="list-disc pl-5">
                      {selected.analysis.facts.missing.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.analysis.match && (
                  <p className="border-t border-slate-200 pt-3">
                    Đề xuất nghề:{" "}
                    {selected.analysis.match.roleCode ?? "Chưa đủ bằng chứng"} ·
                    độ tin cậy{" "}
                    {Math.round(selected.analysis.match.confidence * 100)}%.{" "}
                    {selected.analysis.match.reason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có kết quả phân tích. Chỉ hồ sơ đã xác minh mới được Agent
                xử lý.
              </p>
            )}
          </details>
          <div className="flex flex-wrap gap-3">
            <button
              className={buttonClass}
              disabled={action.busy || !selected.hasCv}
              onClick={() =>
                void action.run(async () => {
                  const blob = await downloadStaffCv(roundId, selected.id),
                    url = URL.createObjectURL(blob),
                    link = document.createElement("a");
                  link.href = url;
                  link.download = "cv-ung-vien";
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
              }
            >
              Tải CV riêng tư
            </button>
            <button
              className={buttonClass}
              disabled={
                action.busy ||
                !["failed", "waitlisted"].includes(selected.status)
              }
              onClick={() =>
                void action.run(async () => {
                  await applicationAction(roundId, selected.id, "retry");
                  setNotice("Đã xếp lại vào hàng chờ Agent.");
                  await refreshSelected();
                })
              }
            >
              Phân tích / xếp lịch lại
            </button>
            <button
              className={buttonClass}
              disabled={action.busy || selected.status === "cancelled"}
              onClick={() => setConfirmCancel(true)}
            >
              Hủy hồ sơ / lịch
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="text-sm font-semibold text-blue-700"
              disabled={action.busy}
              onClick={() => void action.run(resendAccess)}
            >
              Gửi lại liên kết theo dõi hồ sơ
            </button>
            {selected.booking?.status === "confirmed" && (
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() => setCredentialResend(true)}
              >
                Gửi lại email đăng nhập
              </button>
            )}
          </div>
          {credentialResend && (
            <Modal
              title="Gửi lại email đăng nhập của lịch này"
              onClose={() => {
                if (!action.busy) setCredentialResend(false);
              }}
            >
              <p className="mb-4 text-sm leading-6 text-slate-600">
                Chỉ xếp lại email chưa gửi thành công, còn hạn và còn payload
                bảo vệ. Mật khẩu giữ nguyên. Email chứa mật khẩu đã được SMTP
                nhận sẽ xóa payload và không thể khôi phục mật khẩu cũ.
              </p>
              <label className="mb-4 flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acknowledgeUncertain}
                  onChange={(e) => setAcknowledgeUncertain(e.target.checked)}
                />
                Nếu lần trước chưa rõ đã gửi, tôi chấp nhận nguy cơ thư bị gửi
                trùng.
              </label>
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    await resendApplicationCredentials(
                      roundId,
                      selected.id,
                      acknowledgeUncertain,
                    );
                    setCredentialResend(false);
                    setNotice(
                      "Đã xếp lại email đăng nhập. Không tạo hay thay đổi mật khẩu.",
                    );
                  })
                }
              >
                Xác nhận gửi lại email
              </button>
              {action.error ? <ErrorState error={action.error} /> : null}
            </Modal>
          )}
          {selected.booking?.status === "confirmed" && (
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void action.run(async () => {
                  await applicationAction(
                    roundId,
                    selected.id,
                    "reschedule",
                    String(data.get("slot")),
                  );
                  setNotice("Đã đổi lịch. Mật khẩu tài khoản được giữ nguyên.");
                  await refreshSelected();
                });
              }}
            >
              <label className="min-w-0 flex-1 text-sm font-medium">
                Chuyển sang khung giờ đang mở
                <select name="slot" className={inputClass} required>
                  <option value="">Chọn lịch mới</option>
                  {slots
                    .filter(
                      (s) =>
                        s.status === "open" &&
                        s.roleCode === selected.matchedRole &&
                        s.booked < s.capacity,
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.startsAt).toLocaleString("vi-VN")} ·{" "}
                        {s.timezone} · {s.capacity - s.booked} chỗ
                      </option>
                    ))}
                </select>
              </label>
              <button className={buttonClass} disabled={action.busy}>
                Xác nhận đổi lịch
              </button>
            </form>
          )}
          {confirmCancel && (
            <Modal
              title="Hủy hồ sơ và lịch phỏng vấn?"
              onClose={() => {
                if (!action.busy) setConfirmCancel(false);
              }}
            >
              <p className="mb-4 text-sm leading-6 text-slate-600">
                Email chưa gửi sẽ bị vô hiệu. Email đã được SMTP nhận không thể
                thu hồi. Nếu đang gửi mail, hệ thống yêu cầu chờ để bảo đảm nhất
                quán.
              </p>
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    await applicationAction(roundId, selected.id, "cancel");
                    setConfirmCancel(false);
                    await refreshSelected();
                  })
                }
              >
                Xác nhận hủy
              </button>
              {action.error ? <ErrorState error={action.error} /> : null}
            </Modal>
          )}
        </section>
      )}
      {action.error ? <ErrorState error={action.error} /> : null}
    </div>
  );
}
