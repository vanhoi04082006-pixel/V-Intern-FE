import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Mentor } from "@/components/product/mentor";

const api = vi.hoisted(() => ({
  listConversations: vi.fn(),
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  sendMentorMessage: vi.fn(),
  archiveConversation: vi.fn(),
  listTasks: vi.fn(),
}));
vi.mock("@/lib/api/mentor", () => api);
vi.mock("@/lib/api/work", async (original) => ({
  ...(await original<typeof import("@/lib/api/work")>()),
  listTasks: api.listTasks,
}));
const conversation = {
  id: "conversation-1",
  title: "Gỡ lỗi",
  status: "active",
  createdAt: "2026-10-19T08:00:00Z",
  updatedAt: "2026-10-19T08:00:00Z",
  lastMessageAt: null,
};
const prompt = "Giúp tôi phân tích yêu cầu và chia nhỏ nhiệm vụ này.";
beforeEach(() => {
  vi.clearAllMocks();
  api.listConversations.mockResolvedValue({
    items: [conversation],
    page: 1,
    total: 1,
    totalPages: 1,
  });
  api.createConversation.mockResolvedValue(conversation);
  api.getConversation.mockResolvedValue({ conversation, messages: [] });
  api.listTasks.mockResolvedValue({
    items: [{ id: "task-1", code: "TASK-1", title: "Thiết kế dữ liệu" }],
  });
  api.sendMentorMessage.mockResolvedValue({});
});
it("fills a starter prompt, focuses the composer and waits for the student's explicit send", async () => {
  const user = userEvent.setup();
  render(<Mentor />);
  await user.click(await screen.findByRole("button", { name: /Gỡ lỗi/ }));
  await user.click(await screen.findByRole("button", { name: prompt }));
  const composer = screen.getByRole("textbox", { name: "Câu hỏi của bạn" });
  expect(composer).toHaveValue(prompt);
  expect(composer).toHaveFocus();
  expect(api.sendMentorMessage).not.toHaveBeenCalled();
  await user.click(
    screen.getByText("Thêm ngữ cảnh công việc (không bắt buộc)"),
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Ngữ cảnh công việc" }),
    "task-1",
  );
  await user.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));
  await waitFor(() =>
    expect(api.sendMentorMessage).toHaveBeenCalledWith(
      "conversation-1",
      prompt,
      "task-1",
    ),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Câu hỏi của bạn" }),
    ).toHaveValue(""),
  );
});
it("retains the question and explains checking history when AI send fails", async () => {
  api.sendMentorMessage.mockRejectedValue(new Error("AI unavailable"));
  const user = userEvent.setup();
  render(<Mentor />);
  await user.click(await screen.findByRole("button", { name: /Gỡ lỗi/ }));
  await user.click(await screen.findByRole("button", { name: prompt }));
  await user.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Kiểm tra lịch sử trước khi gửi lại",
  );
  expect(screen.getByRole("textbox", { name: "Câu hỏi của bạn" })).toHaveValue(
    prompt,
  );
  expect(api.sendMentorMessage).toHaveBeenCalledTimes(1);
});
it("archived conversations have no composer or starter buttons", async () => {
  api.getConversation.mockResolvedValue({
    conversation: { ...conversation, status: "archived" },
    messages: [],
  });
  const user = userEvent.setup();
  render(<Mentor />);
  await user.click(await screen.findByRole("button", { name: /Gỡ lỗi/ }));
  await screen.findByText(
    "Cuộc trò chuyện đã lưu trữ. Tạo cuộc trò chuyện mới để tiếp tục.",
  );
  expect(
    screen.queryByRole("textbox", { name: "Câu hỏi của bạn" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: prompt }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /^Lưu trữ$/ }),
  ).toBeDisabled();
});
