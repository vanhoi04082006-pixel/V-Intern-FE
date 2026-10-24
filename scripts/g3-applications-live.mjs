/** Real-browser G3 flow. Requires the explicitly isolated G3 Nest/SQL/SMTP harness. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const root = process.env.G3_EVIDENCE_ROOT;
if (!root || !path.isAbsolute(root))
  throw Error("Project-local evidence root required");
const fixtures = JSON.parse(
    fs.readFileSync(path.join(root, "private-fixtures.json")),
  ),
  req = createRequire(import.meta.url),
  { chromium } = req("playwright");
const beRequire = createRequire(path.resolve("../V-INTERN-BE/package.json")),
  PDF = beRequire("pdfkit");
const base = "http://localhost:3007",
  api = "http://localhost:8083";
const roundName = `G3 · React internship ${Date.now()}`;
fs.mkdirSync(path.join(root, "shots"), { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  errors = [];
const localDate = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "Asia/Ho_Chi_Minh",
  }),
  teacher = await context.newPage();
teacher.on("pageerror", (error) => errors.push(error.message));
const check = async (name, action) => {
  await action();
  results.push({ name, passed: true });
  console.log("PASS", name);
};
const messages = async (recipient) =>
  (await (await fetch("http://localhost:8026/messages")).json()).filter(
    (m) => m.recipient.toLowerCase() === recipient.toLowerCase(),
  );
function decode(raw) {
  const parts = [
    Buffer.from(
      raw
        .replace(/=\r\n/g, "")
        .replace(/=([a-f0-9]{2})/gi, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16)),
        ),
      "latin1",
    ).toString("utf8"),
    raw,
  ];
  for (const match of raw.matchAll(
    /Content-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)(?=\r\n--|$)/g,
  ))
    parts.push(
      Buffer.from(match[1].replace(/\s/g, ""), "base64").toString("utf8"),
    );
  return parts.join("\n");
}
try {
  await check(
    "Instructor creates recruitment round and capacity-constrained slot via UI",
    async () => {
      await teacher.goto(base + "/login");
      await teacher.getByLabel(/Email/).first().fill(fixtures.instructor.email);
      await teacher
        .getByLabel("Mật khẩu", { exact: true })
        .fill(fixtures.instructor.password);
      await teacher
        .getByRole("button", { name: /Đăng nhập/, exact: true })
        .click();
      await teacher.waitForURL("**/instructor");
      await teacher
        .getByRole("link", { name: "Hồ sơ CV & lịch tuyển", exact: true })
        .click();
      await teacher
        .getByRole("button", { name: "Tạo đợt tuyển", exact: true })
        .click();
      const dialog = teacher.getByRole("dialog");
      await dialog.getByLabel("Tên đợt tuyển").fill(roundName);
      await dialog
        .getByLabel("Bắt đầu nhận CV (giờ máy của bạn)")
        .fill(localDate(new Date(Date.now() - 3600000)));
      await dialog
        .getByLabel("Hạn nhận CV (giờ máy của bạn)")
        .fill(localDate(new Date(Date.now() + 86400000)));
      await dialog.getByRole("button", { name: "Tạo bản nháp" }).click();
      await teacher.getByRole("button", { name: "Thêm khung giờ" }).click();
      await dialog.getByLabel("Nghề đang tuyển").selectOption("g3-browser");
      await dialog
        .getByLabel("Bắt đầu (giờ máy của bạn)", { exact: true })
        .fill(localDate(new Date(Date.now() + 3 * 3600000)));
      await dialog
        .getByLabel("Kết thúc (giờ máy của bạn)")
        .fill(localDate(new Date(Date.now() + 4 * 3600000)));
      await dialog.getByLabel("Số ứng viên tối đa").fill("2");
      await dialog.getByRole("button", { name: "Mở khung giờ" }).click();
      await teacher
        .getByRole("button", { name: "Mở nhận CV", exact: true })
        .click();
      await teacher.getByText("Đang nhận CV", { exact: true }).waitFor();
      await teacher.screenshot({
        path: path.join(root, "shots/instructor-round.png"),
        fullPage: true,
      });
    },
  );
  const candidateContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: "Asia/Ho_Chi_Minh",
    }),
    candidate = await candidateContext.newPage();
  candidate.on("pageerror", (error) => errors.push(error.message));
  candidate.on("response", async (response) => {
    if (
      response.url().includes("/api/v1/applications") &&
      response.status() >= 400
    ) {
      const data = await response.json().catch(() => ({}));
      console.log(
        "Candidate API issue",
        new URL(response.url()).pathname,
        response.status(),
        data.code,
      );
    }
  });
  const email = `g3-candidate-${randomUUID().slice(0, 8)}@vintern.test`;
  const pdf = await new Promise((resolve) => {
    const doc = new PDF(),
      chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.text(
      "I built a React and TypeScript website with SQL queries and automated tests.",
    );
    doc.end();
  });
  await check(
    "Unauthenticated candidate submits actual PDF and consent through multipart form",
    async () => {
      await candidate.goto(base + "/apply");
      await candidate
        .getByLabel("Đợt ứng tuyển")
        .selectOption({
          label: await candidate
            .getByRole("option")
            .filter({ hasText: roundName })
            .innerText(),
        });
      await candidate.getByLabel("Họ và tên").fill("Ứng viên nghiệm thu G3");
      await candidate.getByLabel("Email nhận lịch").fill(email);
      await candidate.getByLabel("CV của bạn", { exact: false }).setInputFiles({
        name: "cv.pdf",
        mimeType: "application/pdf",
        buffer: pdf,
      });
      await candidate.getByRole("checkbox").check();
      await candidate
        .getByRole("button", { name: "Nộp CV & nhận email xác minh" })
        .click();
      await candidate
        .getByRole("status")
        .filter({ hasText: "Đã tiếp nhận yêu cầu" })
        .waitFor();
      assert.equal(
        (await messages(email)).length,
        0,
        "No fake sent acknowledgement before SMTP dispatch",
      );
      await fetch(api + "/__g3/advance", { method: "POST" });
      const mail = (await messages(email))[0],
        token = decode(mail.raw).match(/#verify=([\w-]+)/)?.[1];
      assert.ok(token);
      await candidate.goto(base + "/apply#verify=" + token);
      try {
        await candidate.getByText("Chờ phân tích", { exact: true }).waitFor();
      } catch (error) {
        await candidate.screenshot({
          path: path.join(root, "shots/verification-error.png"),
          fullPage: true,
        });
        console.log(
          "Candidate screen:",
          (await candidate.locator("main").innerText()).slice(0, 1800),
        );
        throw error;
      }
      assert.equal(new URL(candidate.url()).hash, "");
    },
  );
  await check(
    "Three real Agent graphs book an opened slot; SMTP receives schedule and credentials separately",
    async () => {
      const advance = await fetch(api + "/__g3/advance", { method: "POST" });
      assert.equal(advance.status, 200);
      await candidate
        .getByRole("button", { name: "Cập nhật tiến trình" })
        .click();
      await candidate
        .getByText("Đã có lịch phỏng vấn", { exact: true })
        .waitFor();
      assert.equal(
        (await messages(email)).length,
        2,
        "Only verification + schedule are due now",
      );
      await candidate.screenshot({
        path: path.join(root, "shots/candidate-booked.png"),
        fullPage: true,
      });
      await fetch(api + "/__g3/credentials-due", { method: "POST" });
      const all = await messages(email);
      assert.equal(all.length, 3);
      const credentials = all
        .map((m) => decode(m.raw))
        .find((raw) => raw.includes("Mật khẩu tạm:"));
      assert.ok(credentials);
      const temporary = credentials.match(/Mật khẩu tạm: ([\w-]+)/)?.[1];
      assert.ok(temporary);
      await candidate.goto(base + "/login");
      await candidate.getByLabel(/Email/).first().fill(email);
      await candidate.getByLabel("Mật khẩu", { exact: true }).fill(temporary);
      await candidate
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await candidate.waitForURL("**/change-password");
      await candidate.getByLabel("Mật khẩu hiện tại").fill(temporary);
      await candidate
        .getByLabel("Mật khẩu mới", { exact: true })
        .fill("Changed-Local-Fixture-123!");
      await candidate
        .getByLabel("Nhập lại mật khẩu mới")
        .fill("Changed-Local-Fixture-123!");
      await candidate
        .getByRole("button", { name: "Đổi mật khẩu & đăng nhập lại" })
        .click();
      await candidate.waitForURL("**/login?password=changed");
    },
  );
  await check(
    "Instructor reviews verified candidate and downloads private CV",
    async () => {
      await teacher.getByRole("tab", { name: "Hồ sơ ứng tuyển" }).click();
      await teacher.getByRole("button", { name: "Xem hồ sơ" }).click();
      await teacher
        .getByRole("heading", { name: "Ứng viên nghiệm thu G3" })
        .waitFor();
      const download = teacher.waitForEvent("download");
      await teacher.getByRole("button", { name: "Tải CV riêng tư" }).click();
      assert.ok((await download).suggestedFilename());
    },
  );
  await check(
    "Instructor sees literal CV evidence and can dismiss credential resend with keyboard and restored focus",
    async () => {
      await teacher
        .getByText("Phân tích CV & bằng chứng của Agent", { exact: true })
        .click();
      await teacher
        .getByText("React and TypeScript", { exact: true })
        .waitFor();
      assert.equal(
        await teacher.getByRole("link", { name: /đăng nhập/i }).count(),
        0,
      );
      const resend = teacher.getByRole("button", {
        name: "Gửi lại email đăng nhập",
        exact: true,
      });
      await resend.click();
      const modal = teacher.getByRole("dialog", {
        name: "Gửi lại email đăng nhập của lịch này",
      });
      await modal.waitFor();
      assert.equal(await modal.getByRole("checkbox").isChecked(), false);
      await teacher.keyboard.press("Escape");
      await modal.waitFor({ state: "hidden" });
      assert.equal(
        await resend.evaluate((element) => element === document.activeElement),
        true,
      );
    },
  );
  await check(
    "Candidate/public and instructor layouts remain usable at 390/768/1440px",
    async () => {
      await candidate.goto(base + "/apply");
      for (const width of [390, 768, 1440])
        for (const [name, page] of [
          ["candidate", candidate],
          ["instructor", teacher],
        ]) {
          await page.setViewportSize({ width, height: 1000 });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            ),
            false,
          );
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: path.join(root, `shots/${name}-${width}.png`),
            fullPage: true,
          });
        }
    },
  );
  await check(
    "Admin previews HTML/text and protected credentials remain redacted on desktop/mobile",
    async () => {
      const adminContext = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const admin = await adminContext.newPage();
      await admin.goto(base + "/login");
      await admin.getByLabel(/Email/).first().fill(fixtures.admin.email);
      await admin
        .getByLabel("Mật khẩu", { exact: true })
        .fill(fixtures.admin.password);
      await admin
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await admin.waitForURL("**/admin");
      await admin.goto(base + "/admin/communications");
      const schedule = admin
        .getByRole("listitem")
        .filter({ hasText: "Lịch phỏng vấn" })
        .first();
      await schedule.getByRole("button", { name: "Xem nội dung" }).click();
      await admin.getByTitle("Email HTML an toàn").waitFor();
      for (const width of [390, 1440]) {
        await admin.setViewportSize({ width, height: 1000 });
        assert.equal(
          await admin.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        await admin.locator("iframe").scrollIntoViewIfNeeded();
        await admin.screenshot({
          path: path.join(root, `shots/email-preview-${width}.png`),
        });
      }
      await admin
        .getByRole("listitem")
        .filter({ hasText: "Đăng nhập" })
        .first()
        .getByRole("button", { name: "Xem nội dung" })
        .click();
      await admin
        .getByText(
          "Nội dung có liên kết riêng/mật khẩu được bảo vệ và không hiển thị.",
        )
        .waitFor();
      await adminContext.close();
    },
  );
  if (process.env.G4_ACCEPTANCE === "true") {
    const { verifyScheduledInterviews } =
      await import("./g4-scheduled-interviews-live.mjs");
    await verifyScheduledInterviews({
      teacher,
      candidate,
      base,
      api,
      root,
      email,
      check,
      errors,
    });
  }
  assert.deepEqual(errors, []);
} finally {
  fs.writeFileSync(
    path.join(root, "browser-result.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        stage: process.env.G4_ACCEPTANCE === "true" ? "G4" : "G3",
        results,
        pageErrors: errors,
        model: "explicit deterministic transport; real Agent graphs and SQL",
        smtp: "real SMTP protocol to local-only sink, not inbox delivery",
      },
      null,
      2,
    ),
  );
  await browser.close();
}
