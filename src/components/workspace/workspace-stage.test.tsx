import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceStage } from "./workspace-stage";

const location = vi.hoisted(() => ({ path: "/intern/work" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.path }));
beforeEach(() => { location.path = "/intern/work"; });

describe("Workspace contextual views", () => {
  it("keeps unavailable workflow views hidden for an unassigned student", () => {
    render(<WorkspaceStage role="intern" workAvailable={false} resultsAvailable={false}>Nội dung hiện có</WorkspaceStage>);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByText("Nội dung hiện có")).toBeInTheDocument();
  });
  it("keeps unavailable outcome views hidden", () => {
    location.path = "/intern/performance";
    render(<WorkspaceStage role="intern" resultsAvailable={false}>Kết quả</WorkspaceStage>);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
  it("retains historical results without exposing assignment-dependent recommendations", () => {
    location.path = "/intern/certificates/old-certificate";
    render(<WorkspaceStage role="intern" workAvailable={false} resultsAvailable>Chứng nhận cũ</WorkspaceStage>);
    expect(screen.getByRole("link", { name: "Chứng nhận" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Phát triển" })).not.toBeInTheDocument();
  });
  it("marks the workflow view for an instructor task detail and keeps links in role", () => {
    location.path = "/instructor/tasks/task-one";
    render(<WorkspaceStage role="instructor">Chi tiết</WorkspaceStage>);
    const nav = screen.getByRole("navigation", { name: "Các trang trong khu vực" });
    expect(within(nav).getByRole("link", { name: "Sprint & Task" })).toHaveAttribute("aria-current", "page");
    for (const link of within(nav).getAllByRole("link")) expect(link.getAttribute("href")).toMatch(/^\/instructor\//);
  });
});
