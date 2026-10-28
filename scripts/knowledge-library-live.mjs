/** Admin authoring acceptance: real browser, Nest and disposable SQL. No route interception. */
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const be = path.resolve(process.env.LIVE_BE_ROOT || '../V-INTERN-BE'), req = createRequire(path.join(be, 'package.json'));
if (process.env.NODE_ENV !== 'test' || !/^VIntern_Phase715_/.test(process.env.DB_NAME ?? '')) throw Error('Owned disposable database required.');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, 'index.mjs')).href : 'playwright');
const ds = req(path.join(be, 'dist/database/data-source.js')).default;
const api = process.env.LIVE_API_URL || 'http://localhost:8080/api/v1', base = process.env.LIVE_FRONTEND_URL || 'http://localhost:3001';
const code = `knowledge_${Date.now().toString(36)}`, title = `Xử lý Promise ${code}`, evidence = path.resolve('phase7-evidence/knowledge-library');
fs.mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
const pageErrors = [], viewports = [], checks = [];
page.on('pageerror', error => pageErrors.push(error.message));
async function call(suffix, method = 'GET', body) {
  const login = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@phase715.test', password: process.env.LIVE_PASSWORD }) });
  assert.equal(login.status, 200);
  const session = await login.json();
  const response = await fetch(api + suffix, { method, headers: { authorization: `Bearer ${session.accessToken}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal(response.ok, true, `Admin API ${method} ${suffix}: ${response.status}`);
  return response.json();
}
async function mutation(suffix, method, status, action) {
  const [response] = await Promise.all([page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1${suffix}` && r.request().method() === method), action()]);
  assert.equal(response.status(), status, `${method} ${suffix}`);
  return response.json();
}
async function snapshot(label) {
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `${label} overflow at ${width}`);
    const dialog = page.getByRole('dialog');
    if (await dialog.count()) assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false, `${label} dialog overflow at ${width}`);
    await page.screenshot({ path: path.join(evidence, `${label}-${width}.png`), fullPage: true, animations: 'disabled' });
    viewports.push({ label, width, overflow });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
async function closeDialog() { await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click(); }
try {
  await ds.initialize();
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill('admin@phase715.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.LIVE_PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/admin');
  await page.getByRole('link', { name: 'Kho tri thức Agent', exact: true }).click();
  await page.getByRole('heading', { name: 'Kho tri thức Agent', exact: true }).waitFor();
  await snapshot('library');
  await page.getByRole('link', { name: 'Soạn tài liệu', exact: true }).click();
  await page.getByLabel('Mã tài liệu', { exact: true }).fill(code);
  await page.getByLabel('Tiêu đề', { exact: true }).fill(title);
  await page.getByLabel('Mô tả ngắn', { exact: true }).fill('Chấm khả năng kiểm soát lỗi Promise bằng ví dụ và bằng chứng kiểm thử.');
  await page.getByLabel('Loại tài liệu', { exact: true }).selectOption('qa');
  await page.getByRole('button', { name: 'Đổi loại và soạn lại nội dung', exact: true }).click();
  await page.getByLabel('Câu hỏi', { exact: true }).fill('Bạn kiểm soát lỗi Promise và phản hồi cho người dùng thế nào?');
  await page.getByRole('button', { name: 'Thêm ý chính mong đợi', exact: true }).click();
  await page.getByLabel('Ý chính mong đợi 1', { exact: true }).fill('Bắt lỗi và kiểm chứng phản hồi');
  await page.getByLabel('Cách trả lời đúng 1', { exact: true }).fill('Dùng async/await với try/catch.\nKiểm tra lỗi và phản hồi cho người dùng.');
  await page.getByLabel('Cách trả lời đúng 2', { exact: true }).fill('Dùng Promise.catch và finally để xử lý lỗi và kết thúc trạng thái tải.');
  await page.getByLabel('Câu trả lời minh họa', { exact: true }).fill('Dùng try/catch, hiển thị lỗi dễ hiểu và kiểm thử cả trường hợp API từ chối.');
  for (const [label, value] of [['Lỗi thường gặp', 'Nuốt lỗi khiến giao diện chờ mãi.'], ['Câu hỏi đào sâu', 'Bạn kiểm thử một Promise bị từ chối như thế nào?'], ['Ví dụ chưa đạt', 'Chỉ gọi await mà không bắt lỗi.']]) {
    await page.getByRole('button', { name: `Thêm ${label.toLowerCase()}`, exact: true }).click();
    await page.getByLabel(`${label} 1`, { exact: true }).fill(value);
  }
  await page.getByLabel('Tiêu chí 1', { exact: true }).fill('Kiểm soát lỗi');
  await page.getByLabel('Mô tả tiêu chí 1', { exact: true }).fill('Xác định điểm bắt lỗi, kiểm thử phản hồi và giải thích trạng thái giao diện.');
  await page.getByRole('button', { name: 'Thêm nguồn', exact: true }).click();
  await page.getByLabel('Tên nguồn 1', { exact: true }).fill('MDN Promise');
  await page.getByLabel('URL nguồn 1', { exact: true }).fill('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise');
  await snapshot('qa-editor');
  const draft = await mutation('/admin/knowledge', 'POST', 201, () => page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click());
  assert.equal(draft.version, 1); assert.equal(draft.snapshot.audience, 'grading_only');
  assert.match(draft.snapshot.body.validAnswers[0], /\n/);
  await page.waitForURL(`**/admin/knowledge/${code}`);
  await page.getByRole('button', { name: 'Kiểm tra & xuất bản', exact: true }).click();
  await page.getByText('Đã đủ cấu trúc xuất bản', { exact: true }).waitFor();
  const dialog = page.getByRole('dialog');
  await snapshot('publication');
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).focus();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]')), true, 'Focus stays inside native dialog');
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: 'Kiểm tra & xuất bản', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Kiểm tra & xuất bản', exact: true }).click();
  const published = await mutation(`/admin/knowledge/${code}/publish`, 'POST', 200, () => page.getByRole('button', { name: 'Xác nhận xuất bản', exact: true }).click());
  assert.equal(published.version, 2); assert.equal(published.status, 'published');
  checks.push('QA create/publish, multiline alternatives, sources, rubric, modal focus/Tab/Escape');

  await page.getByLabel('Tiêu đề', { exact: true }).fill(`${title} bản sửa`);
  const redraft = await mutation(`/admin/knowledge/${code}`, 'PUT', 200, () => page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click());
  assert.equal(redraft.version, 3); assert.equal(redraft.status, 'draft');
  const concurrent = await call(`/admin/knowledge/${code}`, 'PUT', { version: 3, draft: { ...redraft.snapshot, title: `${title} bản đồng thời`, schemaVersion: undefined, code: undefined, version: undefined, status: undefined } });
  assert.equal(concurrent.version, 4);
  await page.getByLabel('Tiêu đề', { exact: true }).fill(`${title} đang soạn`);
  await mutation(`/admin/knowledge/${code}`, 'PUT', 409, () => page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click());
  assert.equal(await page.getByLabel('Tiêu đề', { exact: true }).inputValue(), `${title} đang soạn`);
  await page.getByRole('button', { name: 'Đối chiếu bản mới', exact: true }).click();
  await page.getByRole('heading', { name: `${title} bản đồng thời`, exact: true }).waitFor();
  assert.equal(await page.getByLabel('Tiêu đề', { exact: true }).inputValue(), `${title} đang soạn`);
  await page.getByRole('button', { name: 'Bỏ phần chưa lưu và dùng bản này', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.getByLabel('Tiêu đề', { exact: true }).inputValue(), `${title} bản đồng thời`);
  checks.push('Published edit creates draft; real concurrent edit returns 409 and preserves draft until explicit replacement');

  await page.getByRole('button', { name: 'Lưu trữ', exact: true }).click();
  const archived = await mutation(`/admin/knowledge/${code}/archive`, 'POST', 200, () => page.getByRole('button', { name: 'Xác nhận lưu trữ', exact: true }).click());
  assert.equal(archived.version, 5); assert.equal(archived.status, 'archived');
  await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
  await page.getByRole('button', { name: 'Xem phiên bản 2', exact: true }).click();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Khôi phục phiên bản 2', exact: true }).click();
  const restored = await mutation(`/admin/knowledge/${code}/restore`, 'POST', 200, () => page.getByRole('button', { name: 'Xác nhận khôi phục', exact: true }).click());
  assert.equal(restored.version, 6); assert.equal(restored.status, 'draft');
  assert.equal(restored.snapshot.title, title);
  checks.push('Archive preserves history; historical published content restores as new draft');

  await page.goto(`${base}/admin/knowledge`);
  await page.getByLabel('Tìm tài liệu', { exact: true }).fill(code);
  await page.getByRole('button', { name: title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Đã xuất bản', exact: true }).click();
  await page.getByText('Không tìm thấy tài liệu', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Bản nháp', exact: true }).click();
  await page.getByRole('button', { name: title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Kiểm tra import', exact: true }).click();
  const [before] = await ds.query('SELECT COUNT(*) count FROM knowledge_revisions');
  const file = Buffer.from(JSON.stringify([{ code, draft: { ...draft.snapshot, schemaVersion: undefined, code: undefined, version: undefined, status: undefined } }]));
  await page.getByLabel('File JSON cần kiểm tra', { exact: true }).setInputFiles({ name: 'knowledge.json', mimeType: 'application/json', buffer: file });
  const dryRun = await mutation('/admin/knowledge/import/dry-run', 'POST', 200, () => page.getByRole('button', { name: 'Kiểm tra lô', exact: true }).click());
  assert.equal(dryRun.mutationsPerformed, 0); assert.equal(dryRun.items[0].exists, true);
  const [after] = await ds.query('SELECT COUNT(*) count FROM knowledge_revisions');
  assert.equal(after.count, before.count);
  await snapshot('import'); await closeDialog();
  checks.push('Search/status filters and file dry-run with SQL proof of zero revisions added');

  const history = await call(`/admin/knowledge/${code}/revisions`);
  assert.equal(history.total, 6);
  assert.equal(history.items.find(row => row.version === 2).sha256, published.sha256);
  const incomplete = await call('/admin/knowledge', 'POST', { code: `${code}_guide`, draft: { kind: 'guide', title: 'Hướng dẫn cần biên soạn', summary: '', language: 'vi', difficulty: null, audience: 'student_safe', purposes: ['mentoring'], roleCodes: [], tags: [], sources: [], body: { markdown: '' } } });
  await page.goto(`${base}/admin/knowledge/${incomplete.code}`);
  await page.getByRole('button', { name: 'Kiểm tra & xuất bản', exact: true }).click();
  await page.getByText('Cần hoàn thiện trước khi xuất bản', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Xác nhận xuất bản', exact: true }).isDisabled(), true);
  checks.push('Incomplete guide cannot publish; six immutable revisions and original published hash persist');
  assert.deepEqual(pageErrors, []);
  fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({ passed: true, code, checks, viewports, pageErrors, revisions: history.total, externalProviders: 'Not invoked by this authoring scenario' }, null, 2));
  console.log(`Knowledge browser acceptance passed: ${checks.length} scenario groups, ${viewports.length} viewport checks, six immutable revisions.`);
} finally { await browser.close(); if (ds.isInitialized) await ds.destroy(); }
