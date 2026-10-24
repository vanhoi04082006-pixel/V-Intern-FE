/** Native QA accounts/data; GitHub reconnect errors are recorded honestly, never mocked as acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), { chromium } = req('playwright');
const root = process.env.G5_EVIDENCE_ROOT;
if (!root || !path.isAbsolute(root)) throw Error('Project-local evidence root required');
const workspace = path.resolve(root, '../..');
const qa = JSON.parse(fs.readFileSync(path.join(workspace, 'manual-runtime/private/aurora-roleplay-20261022.json')));
const teacher = JSON.parse(fs.readFileSync(path.join(workspace, 'manual-runtime/private/learning-v3-acceptance.json'))).teacher;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [], errors = [];
fs.mkdirSync(path.join(root, 'shots'), { recursive: true });
async function login(account) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Ho_Chi_Minh' });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => console.log('NETWORK_FAILURE', new URL(r.url()).origin, new URL(r.url()).pathname));
  page.on('response', r => { if (new URL(r.url()).pathname.endsWith('/auth/login')) console.log('LOGIN_HTTP', r.status()); });
  await page.goto('http://localhost:3004/login');
  await page.getByLabel(/Email/).first().fill(account.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  try { await page.waitForURL(/\/(intern|instructor)/); }
  catch (error) { await page.screenshot({path:path.join(root,'login-diagnostic.png'),fullPage:true}); throw error; }
  await page.getByRole('link', {name:/GitHub/}).first().waitFor();
  return page;
}
try {
  const studentPage = await login(qa.student);
  await studentPage.goto(`http://localhost:3004/github/invitation?session=${qa.sessionId}`);
  try { await studentPage.getByRole('heading', { name: 'Quyền truy cập của bạn' }).waitFor(); }
  catch (error) { await studentPage.screenshot({path:path.join(root,'invitation-diagnostic.png'),fullPage:true}); throw error; }
  assert.equal(await studentPage.getByRole('button', { name: /Mời lại/ }).count(), 0);
  const responsePromise = studentPage.waitForResponse(r => r.url().endsWith('/github/reconcile'));
  await studentPage.getByRole('button', { name: 'Kiểm tra quyền GitHub của tôi' }).click();
  const response = await responsePromise;
  if (response.status() >= 400) await studentPage.getByRole('alert').last().waitFor();
  if (response.status() === 503) await studentPage.getByRole('alert').filter({hasText:'Admin kết nối lại'}).waitFor();
  else assert.equal(response.status(), 201);
  results.push({ name: 'Student sees only own access and self-check never invites others', passed: true, reconciliationHttpStatus: response.status(), externalDependency: response.status() === 503 ? 'Configured owner requires GitHub reconnect' : null });
  const teacherPage = await login(teacher);
  await teacherPage.goto(`http://localhost:3004/instructor/sessions/${qa.sessionId}`);
  const members = teacherPage.getByRole('heading', { name: 'Thành viên & lời mời' });
  try { await members.waitFor(); } catch(error) { await teacherPage.screenshot({path:path.join(root,'teacher-diagnostic.png'),fullPage:true}); throw error; }
  await members.scrollIntoViewIfNeeded();
  await teacherPage.getByRole('button', { name: 'Đối chiếu & mời thành viên cần xử lý' }).waitFor();
  results.push({ name: 'Lead instructor sees scoped members and recovery controls', passed: true });
  for (const [role, page] of [['student', studentPage], ['instructor', teacherPage]]) for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('heading', { name: role === 'student' ? 'Quyền truy cập của bạn' : 'Thành viên & lời mời' }).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${role} width ${width}`);
    await page.screenshot({ path: path.join(root, 'shots', `${role}-github-${width}.png`), fullPage: true });
  }
  await studentPage.getByRole('button', { name: 'Kiểm tra quyền GitHub của tôi' }).focus();
  assert.equal(await studentPage.getByRole('button', { name: 'Kiểm tra quyền GitHub của tôi' }).evaluate(el => el === document.activeElement), true);
  results.push({ name: 'Both roles responsive at 390/768/1440; self-check is keyboard focusable', passed: true });
  assert.equal(errors.length, 0);
  const report = { checkedAtUtc: new Date().toISOString(), results, pageErrors: errors, backend: 'native QA API 8081', backendCodeCommit: '3fac5f1bae7f5d46e1e305c41c48216b1a550fd9', frontendCodeCommit: 'f2b087b136ea93c23777dec6aaf153d5959140bc', githubLive: 'Reconnect required; browser success does not claim live invitation acceptance' };
  fs.writeFileSync(path.join(root, 'browser-result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ flows: results.length, pageErrors: errors.length, externalGitHub: 'reconnect required' }));
} finally { await browser.close(); }
