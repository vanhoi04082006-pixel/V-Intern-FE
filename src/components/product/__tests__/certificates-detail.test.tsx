import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Certificates } from "../outcomes";

const mocks = vi.hoisted(() => ({
  getCertificate: vi.fn(),
  getCertificates: vi.fn(),
}));

vi.mock("@/lib/api/outcomes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/outcomes")>();
  return {
    ...actual,
    getCertificate: mocks.getCertificate,
    getCertificates: mocks.getCertificates,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/intern/certificates/cert-1",
}));

const certificate = {
  id: "cert-1",
  certificateNumber: "VINT-2026-00000001",
  verificationCode: "VINT-VERIFY-ABC",
  status: "issued" as const,
  issuedAt: "2026-10-15T00:00:00Z",
  completedAt: "2026-10-15T00:00:00Z",
  projectName: "Dự án nghiệm thu chứng nhận",
  sessionName: "Đợt hoàn thành thực tập",
  revokedAt: null,
  revokeReason: null,
  policyCode: "V-INTERN-COMPLETE",
  policyVersion: 1,
};

describe("certificate detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCertificate.mockResolvedValue(certificate);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows verification information and real actions", async () => {
    render(<Certificates id="cert-1" />);
    expect(
      await screen.findByRole("heading", { name: "Chi tiết chứng nhận" }),
    ).toBeInTheDocument();
    expect(screen.getByText("VINT-2026-00000001")).toBeInTheDocument();
    expect(screen.getByText("VINT-VERIFY-ABC")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Thông tin xác minh" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Quay lại danh sách/ }),
    ).toHaveAttribute("href", "/intern/certificates");
    expect(
      screen.getByRole("link", { name: /Xác minh công khai/ }),
    ).toHaveAttribute("href", "/verify?code=VINT-VERIFY-ABC");
    // The download CTA is surfaced twice by design: once in the page header
    // (primary placement) and once in the "Tệp chính thức" panel.
    const downloadButtons = screen.getAllByRole("button", { name: /Tải PDF/ });
    expect(downloadButtons).toHaveLength(2);
    for (const button of downloadButtons) expect(button).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: "Chi tiết" }),
    ).not.toBeInTheDocument();
  });

  it("copies the verification code and announces the result", async () => {
    render(<Certificates id="cert-1" />);
    await screen.findByText("VINT-VERIFY-ABC");
    fireEvent.click(screen.getByRole("button", { name: /Sao chép mã/ }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "VINT-VERIFY-ABC",
    );
    expect(
      await screen.findByRole("button", { name: /Đã sao chép/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đã sao chép mã xác minh",
    );
  });
});
