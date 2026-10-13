import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActivateButton, OnboardingChecklist } from "../instructor-onboarding";

vi.mock("@/lib/api/use-resource", () => ({
  useResource: (fn: (signal: AbortSignal) => Promise<unknown>) => {
    const controller = new AbortController();
    let data: unknown;
    let error: unknown;
    const promise = fn(controller.signal);
    if (typeof (promise as Promise<unknown>).then === "function") {
      (promise as Promise<unknown>).then(
        (d) => { data = d; },
        (e) => { error = e; },
      );
    }
    return { data, error, loading: false, reload: vi.fn() };
  },
}));

describe("ActivateButton", () => {
  it("hides itself for terminal or already-active statuses", () => {
    const { rerender } = render(
      <ActivateButton kind="projects" id="p1" status="active" onChanged={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /kích hoạt/i })).toBeNull();
    rerender(<ActivateButton kind="projects" id="p1" status="archived" onChanged={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /kích hoạt/i })).toBeNull();
  });
  it("activates a draft project and refetches", async () => {
    const activate = vi.fn(async () => ({ status: "active" }));
    const onChanged = vi.fn();
    render(
      <ActivateButton kind="projects" id="p1" status="draft" onChanged={onChanged} deps={{ patch: activate }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /kích hoạt/i }));
    await waitFor(() => expect(activate).toHaveBeenCalledTimes(1));
    expect(activate).toHaveBeenCalledWith("projects", "p1", { status: "active" });
    expect(onChanged).toHaveBeenCalled();
  });
  it("ignores rapid double clicks and shows backend errors", async () => {
    const activate = vi.fn(async () => {
      throw new Error("PROJECT_CAPACITY_FULL");
    });
    render(
      <ActivateButton kind="projects" id="p1" status="draft" onChanged={vi.fn()} deps={{ patch: activate }} />,
    );
    const btn = screen.getByRole("button", { name: /kích hoạt/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(activate).toHaveBeenCalledTimes(1);
  });
  it("activates a planned sprint through the transition", async () => {
    const transition = vi.fn(async () => ({ status: "active" }));
    const patch = vi.fn();
    const onChanged = vi.fn();
    render(
      <ActivateButton kind="sprints" id="s1" status="planned" onChanged={onChanged} deps={{ patch, transition }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /kích hoạt/i }));
    await waitFor(() => expect(transition).toHaveBeenCalledWith("s1", "active"));
    expect(patch).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });
});

describe("OnboardingChecklist", () => {
  it("renders five steps with real completion", () => {
    render(
      <OnboardingChecklist
        steps={[
          { key: "session", label: "Tạo phiên thực tập", hint: "", done: true, href: "/instructor/sessions" },
          { key: "project", label: "Tạo hoặc kích hoạt dự án", hint: "", done: false, href: "/instructor/projects" },
          { key: "assign", label: "Phân công sinh viên", hint: "", done: false, href: "/instructor" },
          { key: "sprint", label: "Tạo Sprint", hint: "", done: false, href: "/instructor/sprints" },
          { key: "task", label: "Tạo nhiệm vụ đầu tiên", hint: "", done: false, href: "/instructor/sprints" },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Tạo phiên thực tập").closest("li")).toHaveAttribute("data-done", "true");
  });
  it("collapses to a done line when everything is complete", () => {
    render(
      <OnboardingChecklist
        steps={[
          { key: "session", label: "A", hint: "", done: true, href: "/x" },
          { key: "project", label: "B", hint: "", done: true, href: "/x" },
          { key: "assign", label: "C", hint: "", done: true, href: "/x" },
          { key: "sprint", label: "D", hint: "", done: true, href: "/x" },
          { key: "task", label: "E", hint: "", done: true, href: "/x" },
        ]}
      />,
    );
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText(/hoàn tất thiết lập/i)).toBeInTheDocument();
  });
});
