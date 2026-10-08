import { request } from "./client";
import { array, nullable, number, oneOf, record, string } from "./parse";
export function parseConversation(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    title: nullable(v.title, string),
    status: oneOf(v.status, ["active", "archived"]),
    createdAt: string(v.createdAt),
    updatedAt: string(v.updatedAt),
    lastMessageAt: nullable(v.lastMessageAt, string),
  };
}
export function parseMessage(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    role: oneOf(v.role, ["user", "assistant"]),
    content: string(v.content),
    aiRunId: nullable(v.aiRunId, string),
    createdAt: string(v.createdAt),
  };
}
export function parseConversationPage(value: unknown) {
  const v = record(value);
  const total = number(v.total),
    pageSize = number(v.pageSize);
  return {
    items: array(v.items, parseConversation),
    total,
    page: number(v.page),
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
export function parseMentorDetail(value: unknown) {
  const v = record(value);
  return {
    conversation: parseConversation(v.conversation),
    messages: array(v.messages, parseMessage),
  };
}
const base = "/intern/me/ai-mentor/conversations";
export const listConversations = (
  page: number,
  status: "active" | "archived",
  signal?: AbortSignal,
) =>
  request(
    `${base}?page=${page}&pageSize=20&status=${status}`,
    parseConversationPage,
    { signal },
  );
export const createConversation = (title?: string) =>
  request(base, parseConversation, {
    method: "POST",
    body: title ? { title } : {},
  });
export const getConversation = (id: string, signal?: AbortSignal) =>
  request(`${base}/${encodeURIComponent(id)}`, parseMentorDetail, { signal });
export const archiveConversation = (id: string) =>
  request(`${base}/${encodeURIComponent(id)}/archive`, parseConversation, {
    method: "POST",
  });
export const sendMentorMessage = (id: string, content: string) =>
  request(
    `${base}/${encodeURIComponent(id)}/messages`,
    (value) => {
      const v = record(value);
      return {
        conversation: parseConversation(v.conversation),
        userMessage: parseMessage(v.userMessage),
        assistantMessage: parseMessage(v.assistantMessage),
        summary: string(v.summary),
        followUps: array(v.followUps, string),
      };
    },
    { method: "POST", body: { content } },
  );
