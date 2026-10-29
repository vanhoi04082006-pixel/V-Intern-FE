"use client";

/**
 * Domain API: KPI, Virtual salary, Certificates — admin quản trị,
 * intern xem của mình, public verify chứng nhận.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs, parsePaginated, downloadFile } from "@/lib/api/client";
import { parseKpiResult, parseSalaryEntry, type KpiResult, type SalaryEntry } from "@/lib/api/intern";

/* ───────────────────────────── KPI periods ─────────────────────── */

export interface KpiPeriod {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  resultCount: number;
}

function parsePeriod(d: Record<string, unknown>): KpiPeriod {
  return {
    id: strOf(d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    status: strOf(d.status, "draft"),
    startDate: dateOf(d.startDate as string),
    endDate: dateOf(d.endDate as string),
    resultCount: numOf(d.resultCount),
  };
}

export function fetchKpiPeriods(query: { status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/kpi-periods" + qs({ status: query.status, page: query.page ?? 1, pageSize: 20 }), parsePaginated(parsePeriod), signal);
}

export function createKpiPeriod(payload: { code: string; name: string; startDate: string; endDate: string }): Promise<KpiPeriod> {
  return sendJson("/api/v1/kpi-periods", "POST", payload, (data) => parsePeriod((data ?? {}) as Record<string, unknown>));
}

export function transitionKpiPeriod(id: string, status: string): Promise<KpiPeriod> {
  return sendJson(`/api/v1/kpi-periods/${encodeURIComponent(id)}/status`, "POST", { status }, (data) => parsePeriod((data ?? {}) as Record<string, unknown>));
}

export function calculateKpi(id: string): Promise<void> {
  return sendJson(`/api/v1/kpi-periods/${encodeURIComponent(id)}/calculate`, "POST", {}, () => undefined);
}

export function finalizeKpi(id: string): Promise<void> {
  return sendJson(`/api/v1/kpi-periods/${encodeURIComponent(id)}/finalize`, "POST", {}, () => undefined);
}

export function fetchKpiResults(periodId: string, signal?: AbortSignal): Promise<(KpiResult & { internName: string })[]> {
  return getJson(`/api/v1/kpi-periods/${encodeURIComponent(periodId)}/results`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (r0) => {
      const r = (r0 ?? {}) as Record<string, unknown>;
      const intern = (r.intern ?? {}) as Record<string, unknown>;
      return { ...parseKpiResult(r), internName: strOf(intern.displayName ?? r.internName) };
    });
  }, signal);
}

/* ───────────────────────── Virtual salary (admin) ───────────────── */

export function generateVirtualSalary(kpiPeriodId: string): Promise<void> {
  return sendJson(`/api/v1/virtual-salary/generate/${encodeURIComponent(kpiPeriodId)}`, "POST", {}, () => undefined);
}

export function createSalaryAdjustment(payload: { userId: string; type: string; amount: number; reason: string; kpiPeriodId?: string }): Promise<void> {
  return sendJson("/api/v1/virtual-salary/adjustments", "POST", payload, () => undefined);
}

export function fetchSalaryLedger(query: { userId?: string; type?: string; kpiPeriodId?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/virtual-salary" + qs({ userId: query.userId, type: query.type, kpiPeriodId: query.kpiPeriodId, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated(parseSalaryEntry),
    signal,
  );
}

export function fetchUserBalance(userId: string, kpiPeriodId?: string, signal?: AbortSignal): Promise<number> {
  return getJson(
    `/api/v1/virtual-salary/users/${encodeURIComponent(userId)}/balance` + qs({ kpiPeriodId }),
    (data) => {
      const r = (data ?? {}) as Record<string, unknown>;
      return numOf(r.balance ?? r.amount);
    },
    signal,
  );
}

/* ───────────────────────── Certificates (admin) ───────────────── */

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  holderName: string;
  userId: string;
  role: string | null;
  projectName: string | null;
  status: string;
  issuedAt: string | null;
  revokedAt: string | null;
}

export function fetchCertificates(query: { userId?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/certificates" + qs({ userId: query.userId, status: query.status, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      const holder = (r.holder ?? r.user ?? {}) as Record<string, unknown>;
      const project = (r.project ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        certificateNumber: strOf(r.certificateNumber ?? r.number),
        holderName: strOf(holder.displayName ?? r.holderName),
        userId: strOf(holder.id ?? r.userId),
        role: typeof r.role === "string" ? r.role : null,
        projectName: typeof project.name === "string" ? project.name : typeof r.projectName === "string" ? r.projectName : null,
        status: strOf(r.status, "issued"),
        issuedAt: dateOf(r.issuedAt as string),
        revokedAt: dateOf(r.revokedAt as string),
      } as CertificateItem;
    }),
    signal,
  );
}

export function issueCertificate(payload: { userId: string; projectId: string; roleCode?: string }): Promise<CertificateItem> {
  return sendJson("/api/v1/certificates/issue", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      certificateNumber: strOf(r.certificateNumber ?? r.number),
      holderName: strOf(r.holderName),
      userId: strOf(r.userId),
      role: typeof r.role === "string" ? r.role : null,
      projectName: typeof r.projectName === "string" ? r.projectName : null,
      status: strOf(r.status, "issued"),
      issuedAt: dateOf(r.issuedAt as string),
      revokedAt: null,
    };
  });
}

export function revokeCertificate(id: string, reason: string): Promise<void> {
  return sendJson(`/api/v1/certificates/${encodeURIComponent(id)}/revoke`, "POST", { reason }, () => undefined);
}

export function downloadCertificatePdf(id: string): Promise<Blob> {
  return downloadFile(`/api/v1/certificates/${encodeURIComponent(id)}/pdf`, "pdf");
}

export function downloadMyCertificatePdf(id: string): Promise<Blob> {
  return downloadFile(`/api/v1/intern/me/certificates/${encodeURIComponent(id)}/pdf`, "pdf");
}

/* ───────────────── Public verify (không cần đăng nhập) ───────────────── */

export interface VerifyResult {
  valid: boolean;
  certificateNumber?: string;
  holderName?: string;
  role?: string;
  projectName?: string;
  issuedAt?: string | null;
  status?: string;
  revokedAt?: string | null;
}

export function verifyCertificate(code: string, signal?: AbortSignal): Promise<VerifyResult | null> {
  return getJson(`/api/v1/certificates/verify/${encodeURIComponent(code)}`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    if (r.valid === undefined) return null;
    return {
      valid: r.valid === true,
      certificateNumber: typeof r.certificateNumber === "string" ? r.certificateNumber : undefined,
      holderName: typeof r.holderName === "string" ? r.holderName : undefined,
      role: typeof r.role === "string" ? r.role : undefined,
      projectName: typeof r.projectName === "string" ? r.projectName : undefined,
      issuedAt: typeof r.issuedAt === "string" ? r.issuedAt : null,
      status: typeof r.status === "string" ? r.status : undefined,
      revokedAt: typeof r.revokedAt === "string" ? r.revokedAt : null,
    };
  }, signal);
}
