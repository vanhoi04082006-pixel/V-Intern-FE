import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiFetch } from '../api-client';

const xlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8083/api/v1'));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('downloads a real Excel response through the dedicated XLSX contract', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('PK workbook', { headers: { 'content-type': xlsxType } })));
  const data = await apiFetch('/reports/example/xlsx', { responseType: 'xlsx' });
  expect(data).toMatchObject({ type: xlsxType });
  expect(await (data as Blob).text()).toBe('PK workbook');
});

it('retains the existing PDF download contract', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('%PDF', { headers: { 'content-type': 'application/pdf' } })));
  const data = await apiFetch('/reports/example/pdf', { responseType: 'blob' });
  expect(data).toMatchObject({ type: 'application/pdf' });
  expect(await (data as Blob).text()).toBe('%PDF');
});

it('rejects a JSON error disguised as a successful Excel download', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { headers: { 'content-type': 'application/json' } })));
  await expect(apiFetch('/reports/example/xlsx', { responseType: 'xlsx' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});

it('does not accept Excel content for a PDF-only request', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('PK', { headers: { 'content-type': xlsxType } })));
  await expect(apiFetch('/reports/example/pdf', { responseType: 'blob' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
