import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InternEntry } from "@/components/product/intern-entry";
import { useInternWorkspaceContext } from "../intern-workspace-context";
import { active, principal } from "@/test/nest-fixtures";
import { clearSession, setSession } from "@/lib/auth/session";

let pathname = "/intern/work";
let data = active;
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/auth/workspace-guard", () => ({
  WorkspaceGuard: ({ children }: { children: React.ReactNode }) => children,
}));
// The topbar bell polls the unread-count endpoint; keep it out of the
// global fetch call-count assertions below.
vi.mock("@/lib/api/outcomes", () => ({
  fetchUnreadCount: async () => 0,
}));

function Content() {
  const context = useInternWorkspaceContext()!;
  return (
    <div>
      <p>Tổng việc: {context.workspace.taskSummary.total}</p>
      <label>
        Bản nháp
        <input aria-label="Bản nháp" defaultValue="" />
      </label>
      <button onClick={context.reload}>Đồng bộ tổng quan</button>
    </div>
  );
}

beforeEach(() => {
  pathname = "/intern/work";
  data = active;
  setSession("test-token", principal);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(data))),
  );
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("revalidates the persistent workspace on navigation while keeping the same shell", async () => {
  const view = render(
    <InternEntry>
      <Content />
    </InternEntry>,
  );
  await screen.findByText("Tổng việc: 7");
  const navigation = screen.getByRole("navigation", {
    name: "Điều hướng thực tập sinh",
  });
  data = {
    ...active,
    taskSummary: {
      ...active.taskSummary,
      total: 8,
      todo: active.taskSummary.todo + 1,
    },
  };
  pathname = "/intern";
  view.rerender(
    <InternEntry>
      <Content />
    </InternEntry>,
  );
  await screen.findByText("Tổng việc: 8");
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    screen.getByRole("navigation", { name: "Điều hướng thực tập sinh" }),
  ).toBe(navigation);
});

it("retains the shell, focused field and draft while the same workspace refreshes", async () => {
  render(
    <InternEntry>
      <Content />
    </InternEntry>,
  );
  await screen.findByText("Tổng việc: 7");
  const input = screen.getByRole("textbox", { name: "Bản nháp" });
  fireEvent.change(input, { target: { value: "Nội dung đang viết" } });
  input.focus();
  const navigation = screen.getByRole("navigation", {
    name: "Điều hướng thực tập sinh",
  });
  let complete!: (value: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        complete = resolve;
      }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Đồng bộ tổng quan" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("textbox", { name: "Bản nháp" })).toBe(input);
  expect(input).toHaveValue("Nội dung đang viết");
  expect(input).toHaveFocus();
  complete(
    new Response(
      JSON.stringify({
        ...active,
        taskSummary: {
          ...active.taskSummary,
          total: 8,
          todo: active.taskSummary.todo + 1,
        },
      }),
    ),
  );
  await screen.findByText("Tổng việc: 8");
  expect(
    screen.getByRole("navigation", { name: "Điều hướng thực tập sinh" }),
  ).toBe(navigation);
  expect(input).toHaveValue("Nội dung đang viết");
});
