import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssigneeSelector } from "../assignee-selector";

const page1 = [
  { userId: "u1", displayName: "Nguyễn Văn A", email: "a@x.edu", status: "passed" },
  { userId: "u2", displayName: "Trần Thị B", email: "b@x.edu", status: "failed" },
];
const page2 = [
  { userId: "u3", displayName: "Lê Văn C", email: "c@x.edu", status: "passed" },
];

function mockList(pages: (typeof page1)[]) {
  return vi.fn(async (page: number) => ({
    items: pages[page - 1] ?? [],
    total: pages.flat().length,
    page,
    pageSize: 20,
    totalPages: pages.length,
  }));
}

describe("AssigneeSelector", () => {
  it("loads the first page and filters by name without paging UI", async () => {
    const list = mockList([page1, page2]);
    render(<AssigneeSelector value="" onChange={vi.fn()} listCandidates={list} />);
    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /phân trang/i })).toBeNull();
    fireEvent.change(screen.getByLabelText(/tìm theo tên hoặc email/i), { target: { value: "trần" } });
    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
    expect(screen.queryByText("Nguyễn Văn A")).toBeNull();
  });
  it("matches by email too", async () => {
    const list = mockList([page1]);
    render(<AssigneeSelector value="" onChange={vi.fn()} listCandidates={list} />);
    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tìm theo tên hoặc email/i), { target: { value: "b@x.edu" } });
    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
  });
  it("fetches further pages progressively when nothing matches yet", async () => {
    const list = mockList([page1, page2]);
    render(<AssigneeSelector value="" onChange={vi.fn()} listCandidates={list} />);
    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tìm theo tên hoặc email/i), { target: { value: "lê văn c" } });
    expect(await screen.findByText("Lê Văn C")).toBeInTheDocument();
    expect(list.mock.calls.some(([p]) => p === 2)).toBe(true);
  });
  it("shows an empty state and stops after all pages", async () => {
    const list = mockList([page1]);
    render(<AssigneeSelector value="" onChange={vi.fn()} listCandidates={list} />);
    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tìm theo tên hoặc email/i), { target: { value: "không tồn tại" } });
    expect(await screen.findByText(/không tìm thấy ứng viên/i)).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(1);
  });
  it("supports keyboard selection and multi-select", async () => {
    const onChange = vi.fn();
    const list = mockList([page1]);
    const { rerender } = render(
      <AssigneeSelector value="" onChange={onChange} listCandidates={list} />,
    );
    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    const search = screen.getByLabelText(/tìm theo tên hoặc email/i);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowUp" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("u1");
    rerender(
      <AssigneeSelector value={["u1"]} multiple onChange={onChange} listCandidates={list} />,
    );
    expect(await screen.findAllByText("Nguyễn Văn A")).toHaveLength(2);
    fireEvent.click(screen.getByRole("checkbox", { name: /nguyễn văn a/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
