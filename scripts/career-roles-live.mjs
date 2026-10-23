/** Real catalog UI + SQL acceptance. External providers remain explicit harness fixtures. */
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const be = path.resolve(process.env.LIVE_BE_ROOT || '../V-INTERN-BE'), req = createRequire(path.join(be, 'package.json'));
if (process.env.NODE_ENV !== 'test' || !process.env.DB_NAME?.startsWith('VIntern_Phase715_')) throw Error('Owned disposable full-stack database required.');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, 'index.mjs')).href : 'playwright');
const ds = req(path.join(be, 'dist/database/data-source.js')).default;
const api = process.env.LIVE_API_URL || 'http://localhost:8080/api/v1', base = process.env.LIVE_FRONTEND_URL || 'http://localhost:3001';
const code = `career_${Date.now().toString(36)}`, name = `Phân tích dữ liệu ${code}`;
const evidence = path.resolve('phase7-evidence/career-roles'), errors = [], viewports = [];
fs.mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
async function login(page, email) {
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.LIVE_PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL(url => !url.pathname.startsWith('/login'));
}
async function mutation(suffix, method, status, action) {
  const [response] = await Promise.all([page.waitForResponse(r => r.url().endsWith(suffix) && r.request().method() === method), action()]);
  assert.equal(response.status(), status, `${method} ${suffix}`);
  return response.json();
}
try {
  await ds.initialize();
  await login(page, 'admin@phase715.test');
  await page.goto(`${base}/admin/career-roles`);
  await page.getByRole('heading', { name: 'Thư viện nghề nghiệp', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thêm nghề nghiệp', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã nghề nghiệp', { exact: true }).fill(code);
  await dialog.getByLabel('Tên nghề nghiệp', { exact: true }).fill(name);
  await dialog.getByLabel('Mô tả', { exact: true }).fill('Phân tích dữ liệu SQL nhỏ, giải thích kết quả và trình bày bằng chứng kiểm thử.');
  await dialog.getByLabel('Kỹ năng bắt buộc', { exact: true }).fill('SQL');
  await dialog.getByLabel('Kỹ năng tùy chọn', { exact: true }).fill('Python');
  await dialog.getByLabel('Trọng số SQL (%)', { exact: true }).fill('100');
  const draft = await mutation('/admin/career-roles', 'POST', 201, () => dialog.getByRole('button', { name: 'Tạo bản nháp', exact: true }).click());
  assert.equal(draft.status, 'draft'); assert.equal(draft.acceptingApplications, false);
  await dialog.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: `Chỉnh sửa ${name}`, exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Trạng thái xuất bản', { exact: true }).selectOption('published');
  await dialog.getByRole('checkbox', { name: 'Đang nhận hồ sơ', exact: true }).check();
  const published = await mutation(`/admin/career-roles/${code}`, 'PUT', 200, () => dialog.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click());
  assert.equal(published.version, 2); assert.equal(published.acceptingApplications, true);
  await dialog.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: `Lịch sử ${name}`, exact: true }).click();
  await page.getByRole('heading', { name: 'Phiên bản 2 · Đã xuất bản', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Phiên bản 1 · Bản nháp', exact: true }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `Horizontal overflow at ${width}`);
    await page.screenshot({ path: path.join(evidence, `admin-${width}.png`), fullPage: true, animations: 'disabled' });
    viewports.push({ width, overflow });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/admin/questions`);
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Thêm câu hỏi', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: 'Vai trò', exact: true }).selectOption(code);
    const phase = i < 2 ? 'introduction' : i < 8 ? 'technical' : 'english';
    await dialog.getByRole('combobox', { name: 'Nhóm câu hỏi', exact: true }).selectOption(phase);
    await dialog.getByLabel('Nội dung câu hỏi', { exact: true }).fill(`Career ${code}, question ${i}: Explain a concrete SQL example and its limitations.`);
    await dialog.getByLabel('Đáp án mẫu / hướng trả lời', { exact: true }).fill('Explain the query, its expected results and a repeatable test with data.');
    await dialog.getByLabel('Hướng dẫn chấm điểm', { exact: true }).fill('Assess correctness, evidence, assumptions and explanation of limitations.');
    await dialog.getByLabel('Ý chính mong đợi (mỗi dòng một ý)', { exact: true }).fill('SQL\nEvidence');
    await dialog.getByLabel('Gợi ý hỏi tiếp (mỗi dòng một gợi ý)', { exact: true }).fill('How would you check an empty data set?');
    const question = await mutation('/admin/question-bank', 'POST', 201, () => dialog.getByRole('button', { name: 'Lưu câu hỏi', exact: true }).click());
    assert.equal(question.roleCode, code); if (phase === 'english') assert.equal(question.language, 'en');
    await dialog.waitFor({ state: 'hidden' });
  }
  const [bank] = await ds.query('SELECT COUNT(*) count FROM interview_questions WHERE roleCode=@0 AND isActive=1', [code]);
  assert.equal(bank.count, 10);
  const email = `${code}@phase715.test`;
  const registered = await fetch(`${api}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: `Career student ${code}`, email, password: process.env.LIVE_PASSWORD, acceptedTerms: true }) });
  assert.equal(registered.status, 201);
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), student = await studentContext.newPage();
  student.on('pageerror', error => errors.push(error.message));
  await login(student, email);
  await student.goto(`${base}/intern/onboarding/role`);
  const choice = student.getByRole('radio', { name: new RegExp(name) });
  await student.getByText(name, { exact: true }).click();
  assert.equal(await choice.isChecked(), true);
  const [startedResponse] = await Promise.all([student.waitForResponse(r => r.url().endsWith('/recruitment/me/interviews') && r.request().method() === 'POST'), student.getByRole('button', { name: 'Bắt đầu phỏng vấn', exact: true }).click()]);
  assert.equal(startedResponse.status(), 201);
  const started = await startedResponse.json();
  assert.equal(started.session.roleCode, code); assert.equal(started.session.questionCount, 10);
  await student.waitForURL('**/intern/onboarding/interview');
  const [snapshots] = await ds.query('SELECT COUNT(*) count FROM interview_session_questions WHERE sessionId=@0', [started.session.id]);
  assert.equal(snapshots.count, 10);
  await student.screenshot({ path: path.join(evidence, 'student-interview.png'), fullPage: true, animations: 'disabled' });
  await page.goto(`${base}/admin/career-roles`);
  await page.getByRole('button', { name: `Lưu trữ ${name}`, exact: true }).click();
  const archived = await mutation(`/admin/career-roles/${code}/archive`, 'POST', 201, () => page.getByRole('dialog').getByRole('button', { name: 'Xác nhận lưu trữ', exact: true }).click());
  assert.equal(archived.version, 3); assert.equal(archived.status, 'archived');
  await student.reload();
  await student.getByLabel('Thời gian còn lại').waitFor();
  for (let i = 0; i < 10; i++) {
    await student.getByLabel('Tin nhắn của bạn').fill(`I explain the SQL query, expected results, empty data, boundary cases and repeatable tests with concrete examples. Answer ${i}.`);
    await student.getByRole('button', { name: 'Gửi câu trả lời', exact: true }).click();
    await student.getByText(`${i + 1}/10 câu ·`, { exact: false }).waitFor();
  }
  await student.getByRole('button', { name: 'Kết thúc và chờ kết quả', exact: true }).click();
  await student.waitForURL('**/intern/onboarding/result');
  await student.getByRole('heading', { name: 'Bạn đã trúng tuyển', exact: true }).waitFor();
  const [assessment] = await ds.query('SELECT decision,overallScore,promptVersion FROM recruitment_results WHERE sessionId=@0', [started.session.id]);
  const [answers] = await ds.query('SELECT COUNT(*) count FROM interview_answers WHERE sessionId=@0', [started.session.id]);
  assert.equal(answers.count, 10); assert.equal(assessment.decision, 'passed');
  assert.equal(Number(assessment.overallScore), 81.1, 'Explicit harness fixture score, never a live-model quality assertion');
  const { RECRUITMENT_EVALUATION_PROMPT_VERSION } = req(path.join(be, 'dist/recruitment/recruitment-prompt.js'));
  assert.equal(assessment.promptVersion, RECRUITMENT_EVALUATION_PROMPT_VERSION);
  await student.screenshot({ path: path.join(evidence, 'student-result.png'), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({ passed: true, code, questions: bank.count, snapshots: snapshots.count, answers: answers.count, assessment, viewports, pageErrors: errors, externalProviders: 'explicit harness fixtures' }, null, 2));
  console.log('Career-role browser acceptance passed: draft, publish, revisions, 10 authored questions, 10 submitted answers, persisted grade, archive, five responsive widths.');
} finally { await browser.close(); if (ds.isInitialized) await ds.destroy(); }
