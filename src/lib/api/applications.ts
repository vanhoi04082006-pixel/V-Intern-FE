import { apiFetch } from "@/lib/auth/api-client";
import { request } from "./client";
import * as p from "./parse";
export const applicationLabels: Record<string, string> = {
  unverified: "Chờ xác minh email",
  queued: "Chờ phân tích",
  analyzing: "Agent đang phân tích",
  needs_information: "Cần bổ sung CV",
  waitlisted: "Đang chờ khung giờ",
  booked: "Đã có lịch phỏng vấn",
  cancelled: "Đã hủy",
  deferred: "Chờ đợt tiếp theo",
  failed: "Cần người phụ trách kiểm tra",
};
export function parseApplication(raw: unknown) {
  const r = p.record(raw);
  const booking =
    r.booking === null
      ? null
      : (() => {
          const b = p.record(r.booking);
          return {
            id: p.string(b.id),
            roleCode: p.string(b.roleCode),
            roleName: p.string(b.roleName),
            status: p.string(b.status),
            startsAt: p.string(b.startsAt),
            endsAt: p.string(b.endsAt),
            timezone: p.string(b.timezone),
            version: p.number(b.version),
          };
        })();
  return {
    id: p.string(r.id),
    fullName: p.string(r.fullName),
    status: p.string(r.status),
    matchedRole: p.nullable(r.matchedRole, p.string),
    revision: p.number(r.revision),
    hasCv: p.boolean(r.hasCv),
    booking,
    timeline: p.array(r.timeline, (raw) => {
      const e = p.record(raw);
      return {
        kind: p.string(e.kind),
        message: p.string(e.message),
        createdAt: p.string(e.createdAt),
      };
    }),
  };
}
export type Application = ReturnType<typeof parseApplication>;
export const publicRounds = (signal?: AbortSignal) =>
  apiFetch("/applications/rounds", { signal }).then((raw) =>
    p.array(p.record(raw).items, (raw) => {
      const r = p.record(raw);
      return {
        id: p.string(r.id),
        name: p.string(r.name),
        closesAt: p.string(r.closesAt),
      };
    }),
  );
export const submitApplication = (formData: FormData) =>
  apiFetch("/applications", { method: "POST", formData });
export const leaveCandidateSession = () =>
  apiFetch("/applications/leave", { method: "POST", body: {} }).then((raw) =>
    p.boolean(p.record(raw).cleared),
  );
export const requestApplicationAccess = (roundId: string, email: string) =>
  apiFetch("/applications/request-access", {
    method: "POST",
    body: { roundId, email },
  });
export const verifyApplication = (token: string) =>
  apiFetch("/applications/verify", { method: "POST", body: { token } });
export const myApplication = () =>
  apiFetch("/applications/me").then(parseApplication);
export const supplementCv = (cv: File) => {
  const data = new FormData();
  data.append("cv", cv);
  return apiFetch("/applications/me/cv", {
    method: "POST",
    formData: data,
  }).then(parseApplication);
};
const parseRound = (raw: unknown) => {
  const r = p.record(raw);
  return {
    id: p.string(r.id),
    name: p.string(r.name),
    status: p.string(r.status),
    opensAt: p.string(r.opensAt),
    closesAt: p.string(r.closesAt),
  };
};
export const listRecruitmentRounds = (signal?: AbortSignal) =>
  request(
    "/recruitment-rounds",
    (raw) => p.array(p.record(raw).items, parseRound),
    { signal },
  );
export const roundDetail = (id: string, signal?: AbortSignal) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(id)}`,
    (raw) => {
      const r = p.record(raw);
      return {
        ...parseRound(raw),
        slots: p.array(r.slots, (raw) => {
          const s = p.record(raw);
          return {
            id: p.string(s.id),
            roleCode: p.string(s.roleCode),
            startsAt: p.string(s.startsAt),
            endsAt: p.string(s.endsAt),
            timezone: p.string(s.timezone),
            capacity: p.number(s.capacity),
            booked: p.number(s.booked),
            status: p.string(s.status),
            minimumPreparationMinutes: p.number(s.minimumPreparationMinutes),
            credentialsLeadMinutes: p.number(s.credentialsLeadMinutes),
          };
        }),
      };
    },
    { signal },
  );
export const createRound = (body: {
  name: string;
  opensAt: string;
  closesAt: string;
}) => request("/recruitment-rounds", parseRound, { method: "POST", body });
export const roundStatus = (id: string, status: string) =>
  request(`/recruitment-rounds/${encodeURIComponent(id)}/status`, parseRound, {
    method: "POST",
    body: { status },
  });
export const createInterviewSlot = (
  id: string,
  body: {
    roleCode: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    capacity: number;
    minimumPreparationMinutes: number;
    credentialsLeadMinutes: number;
  },
) =>
  request(`/recruitment-rounds/${encodeURIComponent(id)}/slots`, parseRound, {
    method: "POST",
    body,
  });
export const closeInterviewSlot = (roundId: string, id: string) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(roundId)}/slots/${encodeURIComponent(id)}/close`,
    (raw) => p.boolean(p.record(raw).closed),
    { method: "POST", body: {} },
  );
export const roundApplications = (
  round: string,
  page: number,
  signal?: AbortSignal,
) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications?page=${page}`,
    (raw) => {
      const r = p.record(raw);
      return {
        total: p.number(r.total),
        page: p.number(r.page),
        items: p.array(r.items, (raw) => {
          const a = p.record(raw);
          return {
            id: p.string(a.id),
            fullName: p.string(a.fullName),
            email: p.string(a.email),
            status: p.string(a.status),
            matchedRole: p.nullable(a.matchedRole, p.string),
            lastCode: p.nullable(a.lastCode, p.string),
          };
        }),
      };
    },
    { signal },
  );
export const staffApplication = (round: string, id: string) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}`,
    (raw) => {
      const analysis = p.record(
        p.record(raw).analysis ?? { facts: null, match: null },
      );
      const facts =
        analysis.facts === null
          ? null
          : (() => {
              const f = p.record(analysis.facts);
              return {
                confidence: p.number(f.confidence),
                missing: p.array(f.missing, p.string),
                facts: p.array(f.facts, (raw) => {
                  const item = p.record(raw);
                  return {
                    skill: p.string(item.skill),
                    ref: p.string(item.ref),
                    quote: p.string(item.quote),
                  };
                }),
              };
            })();
      const match =
        analysis.match === null
          ? null
          : (() => {
              const m = p.record(analysis.match);
              return {
                roleCode: p.nullable(m.roleCode, p.string),
                confidence: p.number(m.confidence),
                reason: p.string(m.reason),
              };
            })();
      const policy = p.record(raw).interviewPolicy;
      const interviewPolicy =
        policy === null || policy === undefined
          ? null
          : (() => {
              const view = p.record(policy);
              return {
                canRebook: p.boolean(view.canRebook),
                serverNow: p.string(view.serverNow),
                attemptsUsed: p.number(view.attemptsUsed),
                attemptsRemaining: p.number(view.attemptsRemaining),
                nextEligibleAt: p.nullable(view.nextEligibleAt, p.string),
                allowedRoleCodes: p.array(view.allowedRoleCodes, p.string),
              };
            })();
      return {
        ...parseApplication(raw),
        analysis: { facts, match },
        interviewPolicy,
      };
    },
  );
export type StaffApplication = Awaited<ReturnType<typeof staffApplication>>;
export const rebookApplication = (
  round: string,
  id: string,
  slotId: string,
  reason: string,
) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}/retake`,
    (raw) => p.boolean(p.record(raw).rebooked),
    { method: "POST", body: { slotId, reason } },
  );
export const applicationAction = (
  round: string,
  id: string,
  action: "cancel" | "retry" | "reschedule",
  slotId?: string,
) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}/${action}`,
    p.record,
    { method: "POST", body: slotId ? { slotId } : {} },
  );
export const downloadStaffCv = (round: string, id: string) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}/cv`,
    (raw) => raw as Blob,
    { responseType: "cv" },
  );
export const resendApplicationCredentials = (
  round: string,
  id: string,
  acknowledgeUncertain: boolean,
) =>
  request(
    `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}/resend-credentials`,
    (raw) => p.boolean(p.record(raw).queued),
    { method: "POST", body: { acknowledgeUncertain } },
  );
