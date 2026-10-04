import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RECRUITMENT_RESULT_FAIL, RECRUITMENT_RESULT_PASS, resolveRecruitmentResult } from "@/components/intern/onboarding/data/recruitment-mock-data";
import { InterviewStep } from "@/components/intern/onboarding/interview-step";
import { parseInternResultPreviewParam } from "@/components/intern/onboarding/onboarding-preview";
import { RoleSelectionStep } from "@/components/intern/onboarding/role-selection-step";
import { RecruitmentProvider } from "@/components/intern/onboarding/recruitment-provider";
import { RecruitmentResult } from "@/components/intern/onboarding/recruitment-result";
import { WelcomeStep } from "@/components/intern/onboarding/welcome-step";

/**
 * Test 5 màn onboarding ở tầng component (giống intern-workspace.test.tsx
 * — không qua page/guard; auth được cover bởi onboarding-guard.test.tsx).
 * Tránh test pixel — tập trung nội dung, ARIA, derive số liệu và flow.
 * next/image mock rỗng theo convention hero.test.tsx (không phụ thuộc ảnh).
 */

vi.mock("next/image", () => ({
  default: () => null,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<RecruitmentProvider>{ui}</RecruitmentProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Onboarding màn 1 — Welcome", () => {
  it("render tiêu đề chào mừng + Bước 1/4 + breadcrumb", () => {
    renderWithProvider(<WelcomeStep />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Chào mừng bạn đến với V-Intern!",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Bước 1 / 4")).toBeInTheDocument();
    expect(screen.getByText("Student Entry")).toBeInTheDocument();
    expect(screen.getByText("Onboarding")).toBeInTheDocument();
  });

  it("stepper ngang hiển thị đủ 4 bước, bước 1 đang active", () => {
    renderWithProvider(<WelcomeStep />);

    const stepper = screen.getByRole("navigation", {
      name: "Tiến trình onboarding",
    });
    const steps = within(stepper).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(steps[1]).not.toHaveAttribute("aria-current");
    expect(within(stepper).getByText("Chào mừng")).toBeInTheDocument();
    expect(within(stepper).getByText("Chọn vai trò")).toBeInTheDocument();
    expect(
      within(stepper).getByText("Phỏng vấn AI Recruiter")
    ).toBeInTheDocument();
    expect(within(stepper).getByText("Nhận kết quả")).toBeInTheDocument();
  });

  it("4 khối giải thích 'Bạn sắp trải qua điều gì?'", () => {
    renderWithProvider(<WelcomeStep />);

    const section = screen.getByRole("region", {
      name: "Bạn sắp trải qua điều gì?",
    });
    expect(
      within(section).getByRole("heading", {
        name: "Khám phá môi trường V-Intern",
      })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Chọn vị trí ứng tuyển" })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Hoàn thành phỏng vấn đánh giá",
      })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Nhận kết quả tuyển dụng" })
    ).toBeInTheDocument();
  });

  it("'Bắt đầu' là Link tới /intern/onboarding/role", () => {
    renderWithProvider(<WelcomeStep />);

    expect(screen.getByRole("link", { name: /Bắt đầu/ })).toHaveAttribute(
      "href",
      "/intern/onboarding/role"
    );
  });

  it("'Xem hướng dẫn' mở/t đóng panel hướng dẫn (aria-expanded)", async () => {
    const user = userEvent.setup();
    renderWithProvider(<WelcomeStep />);

    const toggle = screen.getByRole("button", { name: /Xem hướng dẫn/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText("Hướng dẫn nhanh")
    ).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hướng dẫn nhanh")).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hướng dẫn nhanh")).not.toBeInTheDocument();
  });
});

describe("Onboarding màn 2 — Chọn vị trí ứng tuyển", () => {
  it("render Bước 2/4 + 4 lựa chọn vai trò (radio), mặc định chọn Frontend", () => {
    renderWithProvider(<RoleSelectionStep />);

    expect(screen.getByText("Bước 2 / 4")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Chọn vị trí ứng tuyển" })
    ).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
    expect(
      screen.getByRole("radio", { name: /Frontend Developer/ })
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: /Backend Developer/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /QA \/ Tester/ })).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Business Analyst/ })
    ).not.toBeChecked();
  });

  it("chọn vai trò khác cập nhật trạng thái selected (chỉ 1 vai trò được chọn)", async () => {
    const user = userEvent.setup();
    renderWithProvider(<RoleSelectionStep />);

    await user.click(screen.getByRole("radio", { name: /QA \/ Tester/ }));

    expect(screen.getByRole("radio", { name: /QA \/ Tester/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Frontend Developer/ })
    ).not.toBeChecked();
  });

  it("'Quay lại' → /intern/onboarding, 'Tiếp tục' → /intern/onboarding/interview", () => {
    renderWithProvider(<RoleSelectionStep />);

    expect(screen.getByRole("link", { name: /Quay lại/ })).toHaveAttribute(
      "href",
      "/intern/onboarding"
    );
    expect(screen.getByTestId("role-continue")).toHaveAttribute(
      "href",
      "/intern/onboarding/interview"
    );
  });

  it("khu giải thích nêu đúng công thức 70/30", () => {
    renderWithProvider(<RoleSelectionStep />);

    expect(
      screen.getByText(
        "Điểm Overall được tính = 70% Technical + 30% Soft Skill."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bạn có thể thay đổi lựa chọn vai trò trước khi bắt đầu phỏng vấn."
      )
    ).toBeInTheDocument();
  });
});

describe("Onboarding màn 3 — Phỏng vấn AI Recruiter", () => {
  it("render Bước 3/4 + vai trò đang ứng tuyển + tags", () => {
    renderWithProvider(<InterviewStep />);

    expect(screen.getByText("Bước 3 / 4")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Phỏng vấn cùng AI Recruiter" })
    ).toBeInTheDocument();
    // Vai trò xuất hiện ở cả header pill lẫn lời chào của AI Recruiter
    expect(screen.getAllByText("Frontend Developer").length).toBeGreaterThan(0);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("mock story: đang ở câu 3/8 (Technical), Q1–Q2 đã trả lời, timer tĩnh 18:24", () => {
    renderWithProvider(<InterviewStep />);

    expect(
      screen.getByRole("heading", { name: /Câu 3 \/ 8/ })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
    // Prompt xuất hiện ở card hiện tại lẫn danh sách câu hỏi bên phải
    expect(
      screen.getAllByText(
        /xử lý validation ở client và server như thế nào/
      ).length
    ).toBeGreaterThan(0);

    const progressbar = screen.getByRole("progressbar", {
      name: /Tiến độ phỏng vấn/,
    });
    expect(progressbar).toHaveAttribute("aria-valuenow", "38"); // round(3/8*100)
    expect(screen.getByText("3/8")).toBeInTheDocument();
    expect(screen.getByText("18:24")).toBeInTheDocument();
    expect(screen.getByText(/Tổng thời gian 30 phút/)).toBeInTheDocument();

    // Danh sách câu hỏi đủ 8 câu, câu hiện tại được đánh dấu aria-current
    const questionList = screen.getByRole("navigation", {
      name: "Danh sách câu hỏi phỏng vấn",
    });
    expect(within(questionList).getAllByRole("listitem")).toHaveLength(8);
    const currentItems = within(questionList).getAllByRole("listitem", {
      current: "step",
    });
    expect(currentItems).toHaveLength(1);
    expect(
      within(currentItems[0]).getByText(/validation/)
    ).toBeInTheDocument();
  });

  it("gửi câu trả lời → ghi nhận và chuyển sang câu 4/8, tiến độ derive 4/8 = 50%", async () => {
    const user = userEvent.setup();
    renderWithProvider(<InterviewStep />);

    const textarea = screen.getByLabelText(/Câu trả lời của bạn cho câu 3/);
    const submit = screen.getByRole("button", { name: /Gửi câu trả lời/ });
    expect(submit).toBeDisabled();

    await user.type(textarea, "Client dùng để UX tức thời, server là ranh giới an toàn cuối cùng.");
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(
      screen.getByRole("heading", { name: /Câu 4 \/ 8/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /Tiến độ phỏng vấn/ })
    ).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("4/8")).toBeInTheDocument();
  });

  it("tab Giọng nói là mock rõ ràng: hiển thị note mô phỏng và không ghi âm thật", async () => {
    const user = userEvent.setup();
    renderWithProvider(<InterviewStep />);

    await user.click(screen.getByRole("button", { name: /Giọng nói/ }));

    expect(
      screen.getByText(/chỉ mô phỏng giao diện/)
    ).toBeInTheDocument();
    // Quay lại tab Văn bản hoạt động (nút trong note có label riêng)
    await user.click(
      screen.getByRole("button", { name: "Chuyển về chế độ Văn bản" })
    );
    expect(screen.getByLabelText(/Câu trả lời của bạn cho câu 3/)).toBeInTheDocument();
  });

  it("'Rời phỏng vấn' là link về màn Welcome", () => {
    renderWithProvider(<InterviewStep />);

    expect(screen.getByRole("link", { name: "Rời phỏng vấn" })).toHaveAttribute(
      "href",
      "/intern/onboarding"
    );
  });

  it("đính kèm tệp bị vô hiệu và nói rõ là mô phỏng", () => {
    renderWithProvider(<InterviewStep />);

    const attach = screen.getByRole("button", { name: /Đính kèm tệp/ });
    expect(attach).toBeDisabled();
    expect(attach).toHaveAttribute(
      "title",
      expect.stringContaining("chưa được kết nối")
    );
  });
});

describe("Onboarding màn 4 — Kết quả (dùng chung Đạt/Chưa đạt)", () => {
  it("PASS: Chúc mừng, Frontend Developer, 85/72/81.1, Đạt yêu cầu, CTA Vào Workspace", () => {
    renderWithProvider(<RecruitmentResult result={RECRUITMENT_RESULT_PASS} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Chúc mừng bạn!" })
    ).toBeInTheDocument();
    expect(screen.getByText("Đạt yêu cầu")).toBeInTheDocument();

    // Điểm: donut + hàng Overall = 81.1 (derive, không phải 81.2)
    expect(screen.getAllByText("81.1").length).toBeGreaterThan(0);
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.getByText("72/100")).toBeInTheDocument();
    expect(screen.getByText("81.1/100")).toBeInTheDocument();
    expect(
      screen.getByText("Overall = 70% × Technical + 30% × Soft Skill")
    ).toBeInTheDocument();

    expect(screen.getAllByText("Frontend Developer").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: "Vị trí đã tuyển dụng" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Chưa có Project nào được phân công/).length
    ).toBeGreaterThan(0);

    // Không có card đề xuất khi pass
    expect(
      screen.queryByRole("region", { name: /Đề xuất từ AI Recruiter/ })
    ).not.toBeInTheDocument();

    // CTA
    expect(
      screen.getByRole("link", { name: /Xem chi tiết bài làm/ })
    ).toHaveAttribute("href", "/intern/onboarding/interview");
    expect(screen.getByRole("link", { name: /Vào Workspace/ })).toHaveAttribute(
      "href",
      "/intern"
    );
  });

  it("FAIL: Kết quả tuyển dụng, 58/72/62.2, Chưa đạt, đề xuất QA / Tester", () => {
    renderWithProvider(<RecruitmentResult result={RECRUITMENT_RESULT_FAIL} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Kết quả tuyển dụng" })
    ).toBeInTheDocument();
    expect(screen.getByText("Chưa đạt")).toBeInTheDocument();
    expect(screen.getAllByText("62.2").length).toBeGreaterThan(0);
    expect(screen.getByText("58/100")).toBeInTheDocument();
    expect(screen.getByText("72/100")).toBeInTheDocument();
    expect(screen.getByText("62.2/100")).toBeInTheDocument();

    // Card đề xuất (rail): QA / Tester + tags + lý do — KHÔNG còn full-width dưới main
    const recommendation = screen.getByRole("region", {
      name: /Đề xuất từ AI Recruiter/,
    });
    expect(within(recommendation).getAllByText("QA / Tester").length).toBeGreaterThan(0);
    // CTA chính nằm ở hàng CTA của cột chính (giống reference) — KHÔNG nhân bản trong card
    expect(
      screen.getByRole("button", { name: "Tiếp tục với QA / Tester" })
    ).toBeInTheDocument();

    // CTA fail: không có "Vào Workspace", có "Xem lại tiêu chí đánh giá"
    expect(
      screen.queryByRole("link", { name: /Vào Workspace/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem lại tiêu chí đánh giá" })
    ).toHaveAttribute("href", "/intern/onboarding/role");
  });

  it("CTA 'Tiếp tục với QA / Tester' chỉ cập nhật mock state + điều hướng role", async () => {
    const user = userEvent.setup();
    let observedRoleId = "";

    // Probe đọc selectedRoleId từ context để assert state đổi đúng
    const { RoleObserver } = await import(
      "@/components/intern/onboarding/recruitment-provider"
    ).then((module) => ({
      RoleObserver: function RoleObserverInner() {
        const flow = module.useRecruitmentFlow();
        observedRoleId = flow.selectedRoleId;
        return null;
      },
    }));

    renderWithProvider(
      <>
        <RecruitmentResult result={RECRUITMENT_RESULT_FAIL} />
        <RoleObserver />
      </>
    );

    expect(observedRoleId).toBe("frontend-developer");

    await user.click(
      screen.getByRole("button", { name: "Tiếp tục với QA / Tester" })
    );

    // Mock state đổi sang vai trò đề xuất + reset phỏng vấn (answers rỗng)
    expect(observedRoleId).toBe("qa-tester");
    // Điều hướng về bước Chọn vị trí — không tạo phân công server nào
    expect(push).toHaveBeenCalledWith("/intern/onboarding/role");
  });
});

describe("Onboarding a11y — trạng thái steps đọc được", () => {
  it("aria-current xuất hiện đúng 1 lần trên mỗi màn stepper", () => {
    renderWithProvider(<WelcomeStep />);
    expect(
      screen.getAllByRole("listitem", { current: "step" })
    ).toHaveLength(1);
  });

  it("progress có text equivalent (không chỉ thanh màu)", () => {
    renderWithProvider(<InterviewStep />);
    expect(
      screen.getByText(/Hoàn thành 38% \(3 trên 8 câu hỏi\)/)
    ).toBeInTheDocument();
  });

  it("progressbar giá trị qua waitFor sau khi chuyển câu", async () => {
    const user = userEvent.setup();
    renderWithProvider(<InterviewStep />);

    await user.type(
      screen.getByLabelText(/Câu trả lời của bạn cho câu 3/),
      "Trả lời mẫu"
    );
    await user.click(screen.getByRole("button", { name: /Gửi câu trả lời/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: /Tiến độ phỏng vấn/ })
      ).toHaveAttribute("aria-valuenow", "50");
    });
  });
});

describe("Round 3 — cấu trúc desktop (1 viewport, không duplicate stepper)", () => {
  it("PASS: main không render stepper ngang — chỉ stepper dọc ở shell; rail đủ 3 card", () => {
    renderWithProvider(<RecruitmentResult result={RECRUITMENT_RESULT_PASS} />);

    // Duplicate stepper (trước đây có cả ngang trong main) đã bị bỏ
    expect(
      screen.queryByRole("navigation", { name: "Tiến trình onboarding" })
    ).not.toBeInTheDocument();

    // Rail pass đúng thứ tự reference: Bước tiếp theo → Vị trí đã tuyển dụng → Lưu ý
    expect(
      screen.getByRole("region", { name: "Bước tiếp theo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Vị trí đã tuyển dụng" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Lưu ý" })
    ).toBeInTheDocument();
  });

  it("FAIL: đề xuất QA / Tester ở rail + không stepper ngang; next steps + lưu ý đầy đủ", () => {
    renderWithProvider(<RecruitmentResult result={RECRUITMENT_RESULT_FAIL} />);

    expect(
      screen.queryByRole("navigation", { name: "Tiến trình onboarding" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /Đề xuất từ AI Recruiter/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Bước tiếp theo" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Lưu ý" })
    ).toBeInTheDocument();
  });

  it("Interview rail: danh sách câu hỏi dùng shortTitle compact 1 dòng", () => {
    renderWithProvider(<InterviewStep />);

    const questionList = screen.getByRole("navigation", {
      name: "Danh sách câu hỏi phỏng vấn",
    });
    expect(
      within(questionList).getByText("Xử lý validation form")
    ).toBeInTheDocument();
    expect(
      within(questionList).getByText("Định hướng nghề nghiệp")
    ).toBeInTheDocument();
  });
});

describe("Preview kết quả ?_preview=pass|fail — dev-only, không phải auth switch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("dev: ?_preview=pass → dataset PASS → 85/72/81.1 + Đạt yêu cầu, không redirect login", () => {
    vi.stubEnv("NODE_ENV", "development");

    const preview = parseInternResultPreviewParam("pass");
    expect(preview).toBe("pass");

    const result = resolveRecruitmentResult(preview);
    expect(result.overall).toBe(81.1);
    expect(result.passed).toBe(true);

    renderWithProvider(<RecruitmentResult result={result} />);

    expect(screen.getByText("Đạt yêu cầu")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.getByText("72/100")).toBeInTheDocument();
    expect(screen.getByText("81.1/100")).toBeInTheDocument();
    // Render trực tiếp dataset mock — không qua trạng thái checking của guard
    expect(
      screen.queryByText("Đang kiểm tra phiên đăng nhập...")
    ).not.toBeInTheDocument();
  });

  it("dev: ?_preview=fail → dataset FAIL → 58/72/62.2 + Chưa đạt + QA / Tester", () => {
    vi.stubEnv("NODE_ENV", "development");

    const preview = parseInternResultPreviewParam("fail");
    expect(preview).toBe("fail");

    const result = resolveRecruitmentResult(preview);
    expect(result.overall).toBe(62.2);
    expect(result.passed).toBe(false);

    renderWithProvider(<RecruitmentResult result={result} />);

    expect(screen.getByText("Chưa đạt")).toBeInTheDocument();
    expect(screen.getByText("58/100")).toBeInTheDocument();
    expect(screen.getByText("62.2/100")).toBeInTheDocument();

    const recommendation = screen.getByRole("region", {
      name: /Đề xuất từ AI Recruiter/,
    });
    expect(
      within(recommendation).getAllByText("QA / Tester").length
    ).toBeGreaterThan(0);
  });

  it("production: _preview bị bỏ qua hoàn toàn (chỉ là mock data, không phải auth bypass)", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(parseInternResultPreviewParam("pass")).toBeNull();
    expect(parseInternResultPreviewParam("fail")).toBeNull();

    // null → dataset mặc định của flow (pass) — không bao giờ rơi vào fail
    const result = resolveRecruitmentResult(null);
    expect(result.overall).toBe(81.1);
    expect(result.passed).toBe(true);
  });

  it("giá trị lạ/không hợp lệ → null (dù dev hay production)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(parseInternResultPreviewParam("admin")).toBeNull();
    expect(parseInternResultPreviewParam(undefined)).toBeNull();
    expect(parseInternResultPreviewParam(["pass"])).toBeNull();
  });
});
