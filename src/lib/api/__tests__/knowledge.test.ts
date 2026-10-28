import { describe, expect, it, vi } from 'vitest';
import { parseKnowledgeDocument, parseKnowledgeMetadata, parseKnowledgeSnapshot, toKnowledgeDraft, createKnowledge, updateKnowledge, publishKnowledge, archiveKnowledge, restoreKnowledge, checkKnowledgePublication } from '../knowledge';
const transport = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../client', () => transport);
const snapshot = { schemaVersion: 1, code: 'promise-errors', version: 2, status: 'published', kind: 'qa', title: 'Xử lý Promise', summary: 'Kiểm soát lỗi có bằng chứng.', language: 'vi', difficulty: 'medium', audience: 'grading_only', purposes: ['interview_evaluation'], roleCodes: ['mobile'], tags: ['Promise'], sources: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }], body: { validAnswers: ['Cách thứ nhất\nCó nhiều dòng.', 'Cách thứ hai.'], rubric: [{ criterion: 'Bắt lỗi', weight: 100, description: 'Có giải thích rõ ràng.' }], extraDraftField: { keep: true } } };
const metadata = { ...snapshot, id: 'test-id', updatedAt: '2026-10-24T00:00:00Z', sha256: 'a'.repeat(64) };
describe('knowledge API contract', () => {
  it('checks publication through a read-only GET and rejects another document identity', async () => {
    transport.request.mockImplementationOnce(async (_path, parse) => parse({ code: 'promise-errors', currentVersion: 2, status: 'draft', sha256: 'a'.repeat(64), publishable: false, issues: ['Cần bổ sung nguồn.'] }));
    const controller = new AbortController();
    await expect(checkKnowledgePublication('promise-errors', controller.signal)).resolves.toMatchObject({ currentVersion: 2, publishable: false, issues: ['Cần bổ sung nguồn.'] });
    expect(transport.request).toHaveBeenLastCalledWith('/admin/knowledge/promise-errors/publication-check', expect.any(Function), { signal: controller.signal });
    transport.request.mockImplementationOnce(async (_path, parse) => parse({ code: 'another-document', currentVersion: 2, status: 'draft', sha256: 'a'.repeat(64), publishable: true, issues: [] }));
    await expect(checkKnowledgePublication('promise-errors')).rejects.toThrow();
  });
  it('preserves full source, multiline alternatives and draft JSON instead of flattening it', () => {
    const result = parseKnowledgeSnapshot(snapshot);
    expect(result.body).toEqual(snapshot.body); expect(result.roleCodes).toEqual(['mobile']);
    expect(result.sources).toEqual(snapshot.sources);
  });
  it('does not turn a metadata collection into hidden answer data', () => {
    const result = parseKnowledgeMetadata(metadata);
    expect(result).toMatchObject({ code: snapshot.code, kind: 'qa', audience: 'grading_only' });
    expect(result).not.toHaveProperty('body'); expect(result).not.toHaveProperty('snapshot');
  });
  it.each([{ schemaVersion: 2 }, { audience: 'public' }, { purposes: ['unknown'] }, { roleCodes: null }, { body: [] }, { version: 1.5 }, { sources: [{ title: 'Bad', url: 'javascript:alert(1)' }] }])('rejects malformed or unsafe snapshots %#', override => {
    expect(() => parseKnowledgeSnapshot({ ...snapshot, ...override })).toThrow();
  });
  it('requires the current pointer and snapshot to agree, with a real integrity hash', () => {
    const document = { id: 'id', code: snapshot.code, version: 2, status: 'published', snapshot, sha256: 'a'.repeat(64) };
    expect(parseKnowledgeDocument(document).snapshot).toEqual(snapshot);
    expect(() => parseKnowledgeDocument({ ...document, version: 3 })).toThrow();
    expect(() => parseKnowledgeDocument({ ...document, sha256: 'missing' })).toThrow();
  });
  it('keeps lifecycle operations explicit and uses the server version without a client actor', async () => {
    transport.request.mockResolvedValue({});
    const draft = toKnowledgeDraft(parseKnowledgeSnapshot(snapshot));
    await createKnowledge(snapshot.code, draft);
    expect(transport.request).toHaveBeenLastCalledWith('/admin/knowledge', expect.any(Function), { method: 'POST', body: { code: snapshot.code, draft } });
    await updateKnowledge(snapshot.code, 2, draft);
    expect(transport.request).toHaveBeenLastCalledWith('/admin/knowledge/promise-errors', expect.any(Function), { method: 'PUT', body: { version: 2, draft } });
    for (const [operation, name] of [[publishKnowledge, 'publish'], [archiveKnowledge, 'archive']] as const) {
      await operation(snapshot.code, 2); expect(transport.request).toHaveBeenLastCalledWith(`/admin/knowledge/promise-errors/${name}`, expect.any(Function), { method: 'POST', body: { version: 2 } });
    }
    await restoreKnowledge(snapshot.code, 3, 1);
    expect(transport.request).toHaveBeenLastCalledWith('/admin/knowledge/promise-errors/restore', expect.any(Function), { method: 'POST', body: { version: 3, sourceVersion: 1 } });
  });
});
