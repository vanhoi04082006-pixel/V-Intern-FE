import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SessionSetup } from "../session-setup";
import { setProjectSlots } from "@/lib/api/academic";

/* Master prompt V6 (Phase E): BE có PUT /projects/:id/slots (projects.manage,
 * audited, REPLACE toàn bộ danh sách) nhưng FE chưa từng có UI — mentor không
 * thể mở rộng/thu hẹp sức chứa vai trò của dự án. Regression: slot editor gửi
 * đúng contract { slots: [{roleCode, requiredCount 1..50}] }. */

vi.mock("@/lib/api/academic", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/academic")>();
  return {
    ...mod,
    getAcademic: vi.fn(),
    getProjectSlots: vi.fn(),
    getMembers: vi.fn(),
    setProjectSlots: vi.fn(),
    transitionSession: vi.fn(),
  };
});
vi.mock("@/lib/api/templates", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/templates")>();
  return { ...mod, getTemplateContext: vi.fn().mockResolvedValue(null) };
});
vi.mock("@/lib/auth/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/components/auth/can", () => ({ Can: ({ children }: { children: React.ReactNode }) => children }));

import { getAcademic, getProjectSlots, getMembers } from "@/lib/api/academic";
import { getSessionUser } from "@/lib/auth/session";

const session = {
  id: "session-1",
  code: "SS-UI",
  name: "Phiên UI",
  status: "upcoming",
  startDate: null,
  endDate: null,
} as never;
const project = { id: "project-1", code: "PRJ-UI", name: "Dự án UI", status: "draft", description: null, startDate: null, endDate: null, leadInstructorId: null } as never;
const slots = [
  { roleCode: "backend", requiredCount: 2, filledCount: 1, members: [{ userId: "u1", displayName: "SV Một" }] },
  { roleCode: "qa", requiredCount: 1, filledCount: 0, members: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAcademic).mockImplementation(async (kind: string) =>
    (kind === "sessions" ? session : project) as never,
  );
  vi.mocked(getProjectSlots).mockResolvedValue(slots);
  vi.mocked(getMembers).mockResolvedValue([
    { userId: "u1", displayName: "SV Một", email: "sv1@x.test", assignmentStatus: "active" },
  ]);
  vi.mocked(getSessionUser).mockReturnValue({
    id: "mentor-1", email: "mentor@test", displayName: "Mentor", roles: ["instructor"], permissions: ["projects.manage"],
  });
  vi.mocked(setProjectSlots).mockResolvedValue(slots);
});

describe("project role slot editor (PUT /projects/:id/slots)", () => {
  it("renders the slot editor with current required counts and a disabled save until changed", async () => {
    render(<SessionSetup sessionId="session-1" projectId="project-1" />);
    expect(await screen.findByText("Điều chỉnh vị trí vai trò (thay toàn bộ)")).toBeInTheDocument();
    expect(screen.getByLabelText("Số vị trí vai trò backend")).toHaveValue(2);
    const save = screen.getByRole("button", { name: "Lưu vị trí vai trò" });
    expect(save).toBeDisabled();
    expect(vi.mocked(setProjectSlots)).not.toHaveBeenCalled();
  });

  it("sends a full REPLACE payload after editing a required count", async () => {
    render(<SessionSetup sessionId="session-1" projectId="project-1" />);
    await screen.findByText("Điều chỉnh vị trí vai trò (thay toàn bộ)");
    fireEvent.change(screen.getByLabelText("Số vị trí vai trò backend"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vị trí vai trò" }));
    await waitFor(() => expect(vi.mocked(setProjectSlots)).toHaveBeenCalledOnce());
    expect(vi.mocked(setProjectSlots).mock.calls[0][0]).toBe("project-1");
    expect(vi.mocked(setProjectSlots).mock.calls[0][1]).toEqual([
      { roleCode: "backend", requiredCount: 3 },
      { roleCode: "qa", requiredCount: 1 },
    ]);
    expect(await screen.findByText(/Đã lưu cấu hình vị trí vai trò/)).toBeInTheDocument();
  });

  it("rejects duplicate role codes and out-of-range counts before any request", async () => {
    render(<SessionSetup sessionId="session-1" projectId="project-1" />);
    await screen.findByText("Điều chỉnh vị trí vai trò (thay toàn bộ)");
    fireEvent.change(screen.getByLabelText("Số vị trí vai trò backend"), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: "Lưu vị trí vai trò" })).toBeDisabled();
    expect(
      screen.getAllByRole("alert").some((el) => /1–50/.test(el.textContent ?? "")),
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Số vị trí vai trò backend"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Thêm vai trò mới (mã)"), { target: { value: "BACKEND" } });
    expect(screen.getByRole("button", { name: "Thêm vào danh sách" })).toBeDisabled();
    expect(vi.mocked(setProjectSlots)).not.toHaveBeenCalled();
  });

  it("appends a new role slot and replaces the whole list including it", async () => {
    render(<SessionSetup sessionId="session-1" projectId="project-1" />);
    await screen.findByText("Điều chỉnh vị trí vai trò (thay toàn bộ)");
    fireEvent.change(screen.getByLabelText("Thêm vai trò mới (mã)"), { target: { value: "devops" } });
    fireEvent.change(screen.getByLabelText("Số vị trí vai trò mới"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm vào danh sách" }));
    await screen.findByLabelText("Số vị trí vai trò devops");
    fireEvent.click(screen.getByRole("button", { name: "Lưu vị trí vai trò" }));
    await waitFor(() => expect(vi.mocked(setProjectSlots)).toHaveBeenCalledOnce());
    expect(vi.mocked(setProjectSlots).mock.calls[0][1]).toEqual([
      { roleCode: "backend", requiredCount: 2 },
      { roleCode: "qa", requiredCount: 1 },
      { roleCode: "devops", requiredCount: 2 },
    ]);
  });
});
