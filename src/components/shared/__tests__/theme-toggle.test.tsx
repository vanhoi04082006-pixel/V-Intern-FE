import { afterEach, beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeToggle } from "../theme-toggle";

beforeEach(() => { localStorage.removeItem("vintern-theme"); document.documentElement.classList.remove("dark"); });
afterEach(() => { localStorage.removeItem("vintern-theme"); document.documentElement.classList.remove("dark"); });

it("changes the selected theme and keyboard focus with arrows, Home and End", () => {
  render(<ThemeToggle />);
  const system = screen.getByRole("radio", { name: "Chủ đề Theo máy" });
  const light = screen.getByRole("radio", { name: "Chủ đề Sáng" });
  const dark = screen.getByRole("radio", { name: "Chủ đề Tối" });
  system.focus();
  fireEvent.keyDown(system, { key: "ArrowLeft" });
  expect(dark).toHaveAttribute("aria-checked", "true");
  expect(dark).toHaveFocus();
  expect(document.documentElement).toHaveClass("dark");
  fireEvent.keyDown(dark, { key: "Home" });
  expect(light).toHaveFocus();
  expect(document.documentElement).not.toHaveClass("dark");
  fireEvent.keyDown(light, { key: "ArrowUp" });
  expect(system).toHaveFocus();
  fireEvent.keyDown(system, { key: "ArrowDown" });
  expect(light).toHaveFocus();
  fireEvent.keyDown(light, { key: "End" });
  expect(system).toHaveFocus();
  expect(localStorage.getItem("vintern-theme")).toBe("system");
});

it("keeps mounted desktop and drawer theme choices synchronized", () => {
  render(<><section aria-label="Desktop"><ThemeToggle /></section><section aria-label="Drawer"><ThemeToggle /></section></>);
  fireEvent.click(within(screen.getByRole("region", { name: "Drawer" })).getByRole("radio", { name: "Chủ đề Tối" }));
  expect(within(screen.getByRole("region", { name: "Desktop" })).getByRole("radio", { name: "Chủ đề Tối" })).toHaveAttribute("aria-checked", "true");
  expect(localStorage.getItem("vintern-theme")).toBe("dark");
});
