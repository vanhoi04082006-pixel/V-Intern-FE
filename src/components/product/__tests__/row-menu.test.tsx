import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RowMenu } from "../instructor-dashboard";

it("opens an accessible top-layer menu inside a scrolling table and closes after an action", () => {
  const edit = vi.fn();
  render(<div style={{ overflow: "auto" }}><RowMenu label="Thao tác T-1" items={[{ label: "Sửa nhiệm vụ", onSelect: edit }, { label: "Xóa nhiệm vụ", onSelect: vi.fn() }]} /></div>);
  const trigger = screen.getByLabelText("Thao tác T-1");
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu");
  expect(menu).toHaveAttribute("popover", "auto");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  const editItem = screen.getByRole("menuitem", { name: "Sửa nhiệm vụ" });
  expect(editItem).toHaveFocus();
  fireEvent.click(editItem);
  expect(edit).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("supports arrow navigation, Home, End and Escape with focus returned to the trigger", () => {
  render(<RowMenu label="Thao tác T-2" items={[{ label: "Sửa", onSelect: vi.fn() }, { label: "Xóa", onSelect: vi.fn() }]} />);
  const trigger = screen.getByLabelText("Thao tác T-2");
  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  const edit = screen.getByRole("menuitem", { name: "Sửa" });
  const remove = screen.getByRole("menuitem", { name: "Xóa" });
  expect(remove).toHaveFocus();
  fireEvent.keyDown(remove, { key: "ArrowDown" });
  expect(edit).toHaveFocus();
  fireEvent.keyDown(edit, { key: "End" });
  expect(remove).toHaveFocus();
  fireEvent.keyDown(remove, { key: "Home" });
  expect(edit).toHaveFocus();
  fireEvent.keyDown(edit, { key: "Escape" });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("closes on an outside pointer action and retains link destinations", () => {
  render(<><button>Ngoài menu</button><RowMenu label="Thao tác T-3" href="/admin/tasks/t3" /></>);
  fireEvent.click(screen.getByLabelText("Thao tác T-3"));
  expect(screen.getByRole("menuitem", { name: "Mở chi tiết" })).toHaveAttribute("href", "/admin/tasks/t3");
  fireEvent.pointerDown(screen.getByRole("button", { name: "Ngoài menu" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

it("closes on Tab before normal page navigation continues", () => {
  render(<RowMenu label="Thao tác T-4" onOpen={vi.fn()} />);
  const trigger = screen.getByLabelText("Thao tác T-4");
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getByRole("menuitem", { name: "Mở chi tiết" }), { key: "Tab" });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
