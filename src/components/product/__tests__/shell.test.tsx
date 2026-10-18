import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductShell } from "../shell";
import { clearSession, setSession } from "@/lib/auth/session";

const location = vi.hoisted(() => ({ path: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.path, useRouter: () => ({ replace: vi.fn() }) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open"); };
});
beforeEach(() => {
  setSession("test-token", { id: "u", email: "local@example.test", displayName: "Người dùng local", roles: [], permissions: [] });
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  // jsdom lacks native modal focus and cancel behavior; exercise application
  // handlers using a minimal implementation of the browser's dialog contract.
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function(this: HTMLDialogElement) {
    this.setAttribute("open", ""); this.querySelector<HTMLElement>("button")?.focus();
  });
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function(this: HTMLDialogElement) { this.removeAttribute("open"); });
});
afterEach(() => { vi.restoreAllMocks(); clearSession(); });

describe.each(["admin", "instructor"] as const)("Current %s shell", role => {
  beforeEach(() => { location.path = `/${role}`; });

  it("marks the correct root link and uses the signed-in identity", () => {
    render(<ProductShell role={role}><h1>Local workspace</h1></ProductShell>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng workspace" });
    expect(within(nav).getByRole("link", { name: "Tổng quan" })).toHaveAttribute("href", `/${role}`);
    expect(within(nav).getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Người dùng local")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Thông báo" })) {
      expect(link).toHaveAttribute("href", `/${role}/notifications`);
    }
  });

  it("keeps detail navigation inside the current role", () => {
    location.path = `/${role}/sessions/one`;
    render(<ProductShell role={role}>Detail</ProductShell>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng workspace" });
    expect(within(nav).getByRole("link", { name: "Phiên thực tập" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getAllByRole("link").every(link => link.getAttribute("href")?.startsWith(`/${role}`))).toBe(true);
  });

  it("wraps keyboard focus in the current mobile menu and responds to cancellation", async () => {
    render(<ProductShell role={role}>Content</ProductShell>);
    await userEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu workspace" });
    const first = within(dialog).getByRole("button", { name: "Đóng menu" });
    const last = within(dialog).getByRole("link", { name: "Hồ sơ" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("closes the mobile menu after selecting a route", async () => {
    render(<div onClick={event => event.preventDefault()}><ProductShell role={role}>Content</ProductShell></div>);
    await userEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu workspace" });
    await userEvent.click(within(dialog).getByRole("link", { name: "Phiên thực tập" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});
