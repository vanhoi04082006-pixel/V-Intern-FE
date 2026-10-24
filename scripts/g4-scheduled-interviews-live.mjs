/** G4 admission acceptance; invoked by g3-applications-live with explicit isolated clock hooks. */
import assert from "node:assert/strict";
import path from "node:path";
const localDate = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
export async function verifyScheduledInterviews({
  teacher,
  candidate,
  base,
  api,
  root,
  email,
  check,
}) {
  const hook = async (route, params = {}) => {
    const response = await fetch(
      `${api}/__g4/${route}?${new URLSearchParams({ email, ...params })}`,
      { method: "POST" },
    );
    assert.equal(response.status, 200);
  };
  await teacher.setViewportSize({ width: 1440, height: 1000 });
  await check(
    "G4 assigned career and waiting room block early start on desktop/mobile",
    async () => {
      await candidate.goto(base + "/login");
      await candidate.getByLabel(/Email/).first().fill(email);
      await candidate
        .getByLabel("Mật khẩu", { exact: true })
        .fill("Changed-Local-Fixture-123!");
      await candidate
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await candidate.waitForURL(/\/intern\/onboarding/);
      await candidate.goto(base + "/intern/onboarding/role");
      await candidate
        .getByRole("heading", { name: "Sẵn sàng cho bước tiếp theo" })
        .waitFor();
      assert.equal(
        await candidate
          .getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(await candidate.getByRole("radio").count(), 0);
      for (const width of [390, 768, 1440]) {
        await candidate.setViewportSize({ width, height: 1000 });
        assert.equal(
          await candidate.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        await candidate.screenshot({
          path: path.join(root, `shots/g4-waiting-${width}.png`),
          fullPage: true,
        });
      }
    },
  );
  await check(
    "G4 starts at T+14:59 and resumes the persisted session after T+15",
    async () => {
      await hook("clock", { offset: "899000" });
      await candidate.reload();
      const start = candidate.getByRole("button", {
        name: "Bắt đầu phỏng vấn",
        exact: true,
      });
      await start.waitFor();
      assert.equal(await start.isEnabled(), true);
      await start.click();
      await candidate.waitForURL("**/intern/onboarding/interview");
      await candidate
        .getByText("Chào bạn. Câu hỏi nghiệm thu local", { exact: true })
        .waitFor();
      const before = await candidate.locator("textarea").count();
      assert.ok(before > 0);
      await hook("clock", { offset: "1200000" });
      await hook("sweep");
      await candidate.reload();
      await candidate
        .getByText("Chào bạn. Câu hỏi nghiệm thu local", { exact: true })
        .waitFor();
      assert.ok((await candidate.locator("textarea").count()) > 0);
    },
  );
  await check(
    "G4 instructor rebooks an expired attempt through a reasoned audited command",
    async () => {
      await hook("expire-session");
      await candidate.reload();
      await candidate
        .getByRole("link", { name: "Xem lịch phỏng vấn tiếp theo" })
        .waitFor();
      await hook("clock", { reset: "true" });
      await teacher.getByRole("tab", { name: "Khung giờ phỏng vấn" }).click();
      await teacher.getByRole("button", { name: "Thêm khung giờ" }).click();
      const dialog = teacher.getByRole("dialog");
      await dialog.getByLabel("Nghề đang tuyển").selectOption("g3-browser");
      await dialog
        .getByLabel("Bắt đầu (giờ máy của bạn)", { exact: true })
        .fill(localDate(new Date(Date.now() + 6 * 3600000)));
      await dialog
        .getByLabel("Kết thúc (giờ máy của bạn)")
        .fill(localDate(new Date(Date.now() + 7 * 3600000)));
      await dialog.getByRole("button", { name: "Mở khung giờ" }).click();
      await dialog.waitFor({ state: "hidden" });
      await teacher.getByRole("tab", { name: "Hồ sơ ứng tuyển" }).click();
      await teacher.getByRole("button", { name: "Xem hồ sơ" }).click();
      const rebook = teacher.getByRole("button", {
        name: "Hẹn phỏng vấn lại",
        exact: true,
      });
      await rebook.waitFor();
      assert.equal(await rebook.isEnabled(), true);
      await rebook.click();
      const select = dialog.getByRole("combobox", { name: "Khung giờ mới" });
      const count = await select.locator("option").count();
      assert.ok(count > 1);
      await select.selectOption({ index: count - 1 });
      await dialog
        .getByLabel("Lý do hẹn lại / ngoại lệ")
        .fill(
          "Giảng viên xác nhận lịch mới sau phiên trước hết hạn trong nghiệm thu local.",
        );
      await dialog.getByRole("button", { name: "Xác nhận hẹn lại" }).click();
      await teacher
        .getByText(
          "Đã hẹn lại và ghi lý do. Không đặt lại mật khẩu hoặc số lượt.",
          { exact: true },
        )
        .waitFor();
      await fetch(api + "/__g3/advance", { method: "POST" });
      await candidate.goto(base + "/intern/onboarding/role");
      await candidate
        .getByRole("heading", { name: "Sẵn sàng cho bước tiếp theo" })
        .waitFor();
      assert.equal(
        await candidate
          .getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true })
          .isDisabled(),
        true,
      );
    },
  );
  await check(
    "G4 T+15 no-show blocks start and lets the candidate leave only their tracking capability",
    async () => {
      await hook("clock", { offset: "900000" });
      await hook("sweep");
      await candidate.reload();
      await candidate.getByText(/Hồ sơ chờ đợt tiếp theo/).waitFor();
      assert.equal(
        await candidate
          .getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true })
          .isDisabled(),
        true,
      );
      await candidate.goto(base + "/apply");
      await candidate
        .getByRole("button", { name: "Nộp hồ sơ đợt khác" })
        .click();
      await candidate.getByLabel("Họ và tên").waitFor();
      await teacher
        .getByRole("button", { name: "Làm mới", exact: true })
        .click();
      await teacher.getByText(email, { exact: true }).waitFor();
      await hook("clock", { reset: "true" });
    },
  );
}
