import { request } from './client';
import * as p from './parse';

/**
 * Admin finance console adapters: KPI periods → virtual salary → certificates.
 * Mirrors the intern-side parsers in outcomes.ts; admin shapes add user scoping.
 */

/* ------------------------------ KPI periods ------------------------------ */

export const kpiPeriodStatuses = ['draft', 'open', 'calculating', 'finalized', 'closed'] as const;
export type KpiPeriodStatus = (typeof kpiPeriodStatuses)[number];

export function parseKpiPeriod(raw: unknown) {
  const v = p.record(raw);
  return {
    id: p.string(v.id),
    code: p.string(v.code),
    name: p.string(v.name),
    startDate: p.string(v.startDate),
    endDate: p.string(v.endDate),
    status: p.oneOf(v.status, kpiPeriodStatuses),
    ruleVersion: p.string(v.ruleVersion),
    createdAt: p.string(v.createdAt),
    updatedAt: p.string(v.updatedAt),
  };
}
export type KpiPeriod = ReturnType<typeof parseKpiPeriod>;

/** KPI periods return the legacy `{ items, total }` envelope (no meta block). */
function parseItems<T>(raw: unknown, item: (v: unknown) => T, pageSizeFallback = 20) {
  const v = p.record(raw);
  const total = p.number(v.total);
  return { items: p.array(v.items, item), total, pageSize: pageSizeFallback };
}

export const listKpiPeriods = (status: string, page: number, signal?: AbortSignal) =>
  request(`/kpi-periods?${new URLSearchParams({ page: String(page), pageSize: '20', ...(status ? { status } : {}) })}`, raw => parseItems(raw, parseKpiPeriod), { signal });

export const createKpiPeriod = (body: { code: string; name: string; startDate: string; endDate: string }) =>
  request('/kpi-periods', parseKpiPeriod, { method: 'POST', body });

export const updateKpiPeriod = (id: string, body: { name?: string; startDate?: string; endDate?: string }) =>
  request(`/kpi-periods/${encodeURIComponent(id)}`, parseKpiPeriod, { method: 'PATCH', body });

export const transitionKpiPeriod = (id: string, status: KpiPeriodStatus) =>
  request(`/kpi-periods/${encodeURIComponent(id)}/status`, parseKpiPeriod, { method: 'POST', body: { status } });

export const calculateKpiPeriod = (id: string) =>
  request(`/kpi-periods/${encodeURIComponent(id)}/calculate`, raw => {
    const v = p.record(raw);
    return { period: parseKpiPeriod(v.period), calculated: p.number(v.calculated), insufficientData: p.number(v.insufficientData) };
  }, { method: 'POST' });

export const finalizeKpiPeriod = (id: string) =>
  request(`/kpi-periods/${encodeURIComponent(id)}/finalize`, parseKpiPeriod, { method: 'POST' });

/* ------------------------------- KPI results ------------------------------ */

export function parseKpiResultRow(raw: unknown) {
  const v = p.record(raw);
  return {
    id: p.string(v.id),
    periodId: p.string(v.periodId),
    userId: p.string(v.userId),
    ruleVersion: p.string(v.ruleVersion),
    status: p.oneOf(v.status, ['calculated', 'insufficient_data']),
    finalScore: p.nullable(v.finalScore, p.number),
    calculatedAt: p.string(v.calculatedAt),
  };
}
export type KpiResultRow = ReturnType<typeof parseKpiResultRow>;

export const listKpiResults = (periodId: string, page: number, signal?: AbortSignal) =>
  request(`/kpi-periods/${encodeURIComponent(periodId)}/results?${new URLSearchParams({ page: String(page), pageSize: '20' })}`, raw => parseItems(raw, parseKpiResultRow), { signal });

export const getKpiResult = (id: string) =>
  request(`/kpi-results/${encodeURIComponent(id)}`, raw => {
    const v = p.record(raw);
    return {
      result: parseKpiResultRow(v.result),
      metrics: p.array(v.metrics, raw => {
        const m = p.record(raw);
        return {
          metricCode: p.string(m.metricCode),
          sourceValue: p.nullable(m.sourceValue, p.number),
          configuredWeight: p.number(m.configuredWeight),
          effectiveWeight: p.nullable(m.effectiveWeight, p.number),
          weightedContribution: p.nullable(m.weightedContribution, p.number),
          sourceJson: p.string(m.sourceJson),
        };
      }),
    };
  });

/* ------------------------------ Virtual salary ---------------------------- */

export const salaryLedgerTypes = ['kpi_earning', 'bonus', 'penalty', 'adjustment', 'reversal'] as const;
export const salaryAdjustmentTypes = ['bonus', 'penalty', 'adjustment', 'reversal'] as const;

export function parseSalaryLedgerRow(raw: unknown) {
  const v = p.record(raw);
  return {
    id: p.string(v.id),
    userId: p.string(v.userId),
    kpiPeriodId: p.nullable(v.kpiPeriodId, p.string),
    type: p.oneOf(v.type, salaryLedgerTypes),
    amount: p.number(v.amount),
    unit: p.string(v.unit),
    description: p.string(v.description),
    createdAt: p.string(v.createdAt),
  };
}
export type SalaryLedgerRow = ReturnType<typeof parseSalaryLedgerRow>;

export const listSalaryLedger = (params: { userId?: string; type?: string; kpiPeriodId?: string; page: number }, signal?: AbortSignal) =>
  request(`/virtual-salary?${new URLSearchParams({ page: String(params.page), pageSize: '20', ...(params.userId ? { userId: params.userId } : {}), ...(params.type ? { type: params.type } : {}), ...(params.kpiPeriodId ? { kpiPeriodId: params.kpiPeriodId } : {}) })}`, raw => parseItems(raw, parseSalaryLedgerRow), { signal });

export const generateSalaryForPeriod = (kpiPeriodId: string) =>
  request(`/virtual-salary/generate/${encodeURIComponent(kpiPeriodId)}`, raw => {
    const v = p.record(raw);
    return { kpiPeriodId: p.string(v.kpiPeriodId), generated: p.number(v.generated), skipped: p.number(v.skipped), unit: p.string(v.unit) };
  }, { method: 'POST' });

export const createSalaryAdjustment = (body: { userId: string; type: (typeof salaryAdjustmentTypes)[number]; amount?: number; sourceId?: string; reason: string; requestId: string }) =>
  request('/virtual-salary/adjustments', parseSalaryLedgerRow, { method: 'POST', body });

export const getUserSalaryBalance = (userId: string, kpiPeriodId?: string, signal?: AbortSignal) =>
  request(`/virtual-salary/users/${encodeURIComponent(userId)}/balance${kpiPeriodId ? `?kpiPeriodId=${encodeURIComponent(kpiPeriodId)}` : ''}`, raw => {
    const v = p.record(raw);
    if (p.boolean(v.virtual) !== true) p.invalid();
    return {
      balance: p.number(v.balance),
      unit: p.string(v.unit),
      virtual: true as const,
      earnedThisPeriod: p.number(v.earnedThisPeriod),
      latestEntries: p.array(v.latestEntries, parseSalaryLedgerRow),
    };
  }, { signal });

/* ------------------------------- Certificates ----------------------------- */

export function parseAdminCertificate(raw: unknown) {
  const v = p.record(raw);
  return {
    id: p.string(v.id),
    certificateNumber: p.string(v.certificateNumber),
    verificationCode: p.string(v.verificationCode),
    userId: p.string(v.userId),
    status: p.oneOf(v.status, ['issued', 'revoked']),
    issuedAt: p.string(v.issuedAt),
    completedAt: p.nullable(v.completedAt ?? null, p.string),
    holderName: p.nullable(v.holderNameSnapshot ?? null, p.string),
    roleName: p.nullable(v.roleLabelSnapshot ?? null, p.string),
    projectName: p.nullable(v.projectNameSnapshot ?? null, p.string),
    sessionName: p.nullable(v.sessionNameSnapshot ?? null, p.string),
    revokedAt: p.nullable(v.revokedAt ?? null, p.string),
    revokeReason: p.nullable(v.revokeReason ?? null, p.string),
    policyCode: p.string(v.policyCode),
    policyVersion: p.number(v.policyVersion),
  };
}
export type AdminCertificate = ReturnType<typeof parseAdminCertificate>;

export const listCertificates = (params: { userId?: string; status?: string; page: number }, signal?: AbortSignal) =>
  request(`/certificates?${new URLSearchParams({ page: String(params.page), pageSize: '20', ...(params.userId ? { userId: params.userId } : {}), ...(params.status ? { status: params.status } : {}) })}`, raw => parseItems(raw, parseAdminCertificate), { signal });

export const issueCertificate = (userId: string) =>
  request('/certificates/issue', parseAdminCertificate, { method: 'POST', body: { userId } });

export const revokeCertificate = (id: string, reason: string) =>
  request(`/certificates/${encodeURIComponent(id)}/revoke`, parseAdminCertificate, { method: 'POST', body: { reason } });

/** Admin PDF download (issued certificates only; revoked → 409). */
export const downloadCertificatePdf = (id: string) =>
  request(`/certificates/${encodeURIComponent(id)}/pdf`, (value) => (value instanceof Blob ? value : p.invalid()), { responseType: 'blob' });
