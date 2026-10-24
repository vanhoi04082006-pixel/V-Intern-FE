import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RepositoryMembers } from "../repository-members";
const member = (
  status: "pending" | "accepted" | "expired" | "failed" | "not_connected",
) => ({
  userId: status,
  displayName: `Người ${status}`,
  status,
  login: "student",
  invitationId: "50",
  invitedAt: "2026-10-25T00:00:00Z",
  expiresAt: "2026-11-01T00:00:00Z",
  lastCheckedAt: null,
  errorCode: null,
  acceptedAt: null,
});
describe("repository member access states", () => {
  it("distinguishes waiting from actual access with the matching invitation link", () => {
    render(
      <RepositoryMembers
        members={[member("pending"), member("accepted")]}
        owner="platform"
        repoName="vintern-demo"
        busy={false}
        manage={false}
        onInvite={vi.fn()}
        onCheck={vi.fn()}
      />,
    );
    expect(screen.getByText("Chờ chấp nhận")).toBeInTheDocument();
    expect(screen.getByText("Đã có quyền")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mở lời mời GitHub" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/platform/vintern-demo/invitations",
    );
    expect(
      screen.queryByRole("button", { name: /Mời lại/ }),
    ).not.toBeInTheDocument();
  });
  it("lets staff retry only failed/expired members, not pending/accepted or unconnected people", () => {
    const invite = vi.fn();
    render(
      <RepositoryMembers
        members={[
          "pending",
          "accepted",
          "expired",
          "failed",
          "not_connected",
        ].map((s) => member(s as Parameters<typeof member>[0]))}
        owner="platform"
        repoName="demo"
        busy={false}
        manage
        onInvite={invite}
        onCheck={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: /Mời lại cho/ })).toHaveLength(
      2,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Mời lại cho Người expired" }),
    );
    expect(invite).toHaveBeenCalledWith("expired");
    expect(
      screen.getByText(/Liên kết GitHub để nhận lời mời/),
    ).toBeInTheDocument();
  });
  it("disables commands while processing and exposes self-reconciliation without granting permissions", () => {
    render(
      <RepositoryMembers
        members={[member("failed")]}
        owner="platform"
        repoName="demo"
        busy
        manage={false}
        onInvite={vi.fn()}
        onCheck={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Kiểm tra quyền GitHub của tôi" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /Mời lại/ }),
    ).not.toBeInTheDocument();
  });
});
