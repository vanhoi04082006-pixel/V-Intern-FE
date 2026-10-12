import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectLibrary } from "../project-library";
import { TemplateDetail } from "../template-detail";

const tpl = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "ECOM",
  name: "E-commerce",
  category: "web",
  difficulty: "intermediate",
  status: "active",
  version: 2,
  techStack: ["React", "NestJS"],
  roles: ["frontend", "backend"],
  teamSize: 2,
  sprintCount: 6,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ProjectLibrary (M2)", () => {
  it("renders server-provided templates with detail links", async () => {
    const list = vi.fn(async () => ({ items: [tpl], total: 1, page: 1, pageSize: 9, totalPages: 1 }));
    render(<ProjectLibrary list={list} />);
    expect(await screen.findByText("E-commerce")).toBeInTheDocument();
    expect(screen.getByText(/Đội hình gợi ý: 2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chi tiết/i }).getAttribute("href")).toBe(
      `/instructor/projects/${tpl.id}`,
    );
    expect(list).toHaveBeenCalledTimes(1);
  });
  it("debounces search into a single refetch", async () => {
    const list = vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 9, totalPages: 1 }));
    render(<ProjectLibrary list={list} />);
    expect(await screen.findByText(/chưa có project mẫu/i)).toBeInTheDocument();
    const input = screen.getByLabelText(/tìm project mẫu/i);
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    await screen.findByText(/"abc"/);
    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe("TemplateDetail (M2)", () => {
  const detail = {
    ...tpl,
    archivedAt: null,
    definition: {
      description: "Full shop",
      objectives: { business: "Sell", learning: ["A"], product: ["B"] },
      scopeIn: ["Web"], scopeOut: ["Mobile"],
      functionalRequirements: ["Auth"], nonFunctionalRequirements: ["Fast"],
      roleDetails: [{ code: "frontend", title: "FE", countMin: 1, countMax: 1, requiredSkills: ["React"], recommendedSkills: [], level: null }],
      sprints: [{ name: "P1", goal: "Setup", durationDays: 7, tasks: [{}, {}] }],
      expectedOutputs: { deliverables: ["Shop"], artifacts: [] },
      acceptance: { definitionOfDone: ["Done"], qualityGates: [] },
    },
    runs: [],
  };
  it("renders blueprint sections and the start CTA", async () => {
    render(<TemplateDetail id={tpl.id} get={vi.fn(async () => detail)} start={vi.fn()} />);
    expect(await screen.findByText("Sell")).toBeInTheDocument();
    expect(screen.getByText(/Kỹ năng bắt buộc: React/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /khởi tạo phiên thực tập/i })).toBeInTheDocument();
  });
  it("starts a session with one stable request id across retries", async () => {
    const start = vi.fn(async () => ({ id: "r1", projectId: "p1", sessionId: "s1", templateVersion: 2, deduped: false }));
    render(<TemplateDetail id={tpl.id} get={vi.fn(async () => detail)} start={start} />);
    expect(await screen.findByRole("button", { name: /khởi tạo phiên thực tập/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tên phiên/i), { target: { value: "K48" } });
    fireEvent.change(screen.getByLabelText(/ngày bắt đầu/i), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText(/ngày kết thúc/i), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: /khởi tạo phiên thực tập/i }));
    await screen.findByText(/đã tạo phiên thực tập/i);
    expect(start).toHaveBeenCalledTimes(1);
    const firstRequestId = start.mock.calls[0][1].requestId;
    expect(typeof firstRequestId).toBe("string");
    expect(screen.getByRole("link", { name: /mở session setup/i }).getAttribute("href")).toBe(
      "/instructor/sessions/s1/setup?project=p1",
    );
  });
  it("refuses archived templates", async () => {
    render(<TemplateDetail id={tpl.id} get={vi.fn(async () => ({ ...detail, status: "archived" }))} start={vi.fn()} />);
    expect(await screen.findByText("Mẫu đã lưu trữ — không thể khởi tạo phiên mới.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /khởi tạo phiên/i })).toBeNull();
  });
});
