import { describe, it, expect, vi } from "vitest";
import {
  parseConversation,
  parseConversationPage,
  parseMentorDetail,
  sendMentorMessage,
} from "../mentor";
import { request } from "../client";
vi.mock("../client", () => ({ request: vi.fn() }));
const conversation = {
  id: "c",
  title: null,
  status: "active",
  createdAt: "2026-10-08",
  updatedAt: "2026-10-08",
  lastMessageAt: null,
};
describe("Mentor actual Nest contract", () => {
  it("accepts missing title and activity", () =>
    expect(parseConversation(conversation).title).toBeNull());
  it("parses the explicit items pagination exception", () => {
    const page = parseConversationPage({
      items: [conversation],
      total: 21,
      page: 1,
      pageSize: 20,
    });
    expect(page.totalPages).toBe(2);
  });
  it("rejects fake role and archived status drift", () =>
    expect(() =>
      parseConversation({ ...conversation, status: "deleted" }),
    ).toThrow());
  it("never silently presents an invalid assistant reply", () =>
    expect(() =>
      parseMentorDetail({
        conversation,
        messages: [
          {
            id: "m",
            role: "system",
            content: "private prompt",
            aiRunId: null,
            createdAt: "date",
          },
        ],
      }),
    ).toThrow());
  it("sends only content to own conversation endpoint", async () => {
    await sendMentorMessage("c", "Giúp tôi với task");
    expect(request).toHaveBeenCalledWith(
      "/intern/me/ai-mentor/conversations/c/messages",
      expect.any(Function),
      { method: "POST", body: { content: "Giúp tôi với task" } },
    );
  });
});
