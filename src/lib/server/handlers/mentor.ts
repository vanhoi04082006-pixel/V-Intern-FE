/**
 * AI Mentor (intern): conversations + messages gọi LLM thật qua z-ai-web-dev-sdk.
 * Timeout 20s, lỗi/thất bại → fallback canned hợp lý.
 */

import ZAI from "z-ai-web-dev-sdk";
import type { MentorConversation, MentorMessage } from "../types";
import { activeAssignmentOf } from "../store";
import { includesNoAccent, nowIso, randomId } from "../util";
import { conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";

const LLM_TIMEOUT_MS = 20000;

function convPublic(c: MentorConversation): Record<string, unknown> {
  return {
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    lastMessageAt: c.lastMessageAt,
    messageCount: c.messageCount,
    status: c.status,
  };
}

function msgPublic(m: MentorMessage): Record<string, unknown> {
  return { id: m.id, role: m.role, content: m.content, at: m.at, taskId: m.taskId };
}

function myConversations(ctx: Ctx): MentorConversation[] {
  return ctx.store.mentorConversations
    .filter((c) => c.userId === ctx.user!.id)
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
}

function getConversation(ctx: Ctx, id: string): MentorConversation {
  const c = ctx.store.mentorConversations.find((x) => x.id === id && x.userId === ctx.user!.id);
  if (!c) throw notFound("Không tìm thấy cuộc trò chuyện.");
  return c;
}

/* ------------------------------- handlers ------------------------------- */

async function listConversations(ctx: Ctx): Promise<unknown> {
  const status = ctx.query.get("status");
  let items = myConversations(ctx);
  if (status === "active" || status === "archived") items = items.filter((c) => c.status === status);
  return pageOf(items.map(convPublic), ctx.query);
}

async function createConversation(ctx: Ctx): Promise<unknown> {
  const title = typeof ctx.body?.title === "string" && ctx.body.title.trim() ? ctx.body.title.trim() : "Cuộc trò chuyện mới";
  const conv: MentorConversation = {
    id: randomId("cnv"),
    userId: ctx.user!.id,
    title,
    createdAt: nowIso(),
    lastMessageAt: nowIso(),
    messageCount: 0,
    status: "active",
  };
  ctx.store.mentorConversations.push(conv);
  return convPublic(conv);
}

async function getConversationDetail(ctx: Ctx): Promise<unknown> {
  const conv = getConversation(ctx, ctx.params.id);
  const messages = ctx.store.mentorMessages
    .filter((m) => m.conversationId === conv.id)
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    .map(msgPublic);
  return { conversation: convPublic(conv), messages };
}

async function archiveConversation(ctx: Ctx): Promise<unknown> {
  const conv = getConversation(ctx, ctx.params.id);
  if (conv.status === "archived") throw conflict("Cuộc trò chuyện đã được lưu trữ.");
  conv.status = "archived";
  return convPublic(conv);
}

/* ------------------------------ LLM + fallback ------------------------------ */

function buildSystemPrompt(ctx: Ctx): string {
  const user = ctx.user!;
  const assignment = activeAssignmentOf(user.id);
  const project = assignment ? ctx.store.projects.find((p) => p.id === assignment.projectId) : undefined;
  const session = assignment ? ctx.store.sessions.find((s) => s.id === assignment.sessionId) : undefined;
  const context = assignment
    ? `Bạn đang cố vấn cho ${user.displayName} — thực tập sinh vai trò ${assignment.role}, dự án ${project?.name ?? "đang chờ phân công"}${
        session ? ` (phiên ${session.name})` : ""
      }.`
    : `Bạn đang cố vấn cho ${user.displayName} — thực tập sinh chưa được gán vào dự án (giai đoạn onboarding/phỏng vấn).`;

  return [
    "Bạn là Mentor AI của V-Intern — một kỹ sư phần mềm dày dạn kinh nghiệm, thân thiện và thực chiến.",
    context,
    "Nguyên tắc trả lời:",
    "- Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề (tối đa ~180 từ).",
    "- Ưu tiên giải pháp thực chiến đã kiểm chứng; khi hợp lý kèm ví dụ code ngắn trong markdown.",
    "- Nếu câu hỏi thiếu ngữ cảnh, đưa câu trả lời tốt nhất có thể kèm 1 câu hỏi làm rõ cuối.",
    "- Khích lệ nhưng thẳng thắn, chỉ rõ rủi ro/trở ngại nếu có.",
  ].join("\n");
}

interface FallbackAnswer {
  match: (text: string) => boolean;
  answer: string;
}

const FALLBACKS: FallbackAnswer[] = [
  {
    match: (t) => includesNoAccent(t, "render") || includesNoAccent(t, "giật") || includesNoAccent(t, "hiệu năng") || includesNoAccent(t, "performance"),
    answer:
      "Với vấn đề hiệu năng render, em làm theo thứ tự sau:\n1. Dùng React DevTools Profiler xác nhận chỗ chậm trước khi tối ưu.\n2. `React.memo` cho component item trong danh sách (chỉ re-render khi props đổi).\n3. Đảm bảo `key` là id ổn định, không dùng index.\n4. Nếu danh sách > 200 item, dùng `react-window` để virtualize.\n\nVí dụ: `const MemoCard = React.memo(ProductCard)` — nhớ đo lại sau mỗi bước nhé.",
  },
  {
    match: (t) => includesNoAccent(t, "state") || includesNoAccent(t, "store") || includesNoAccent(t, "zustand") || includesNoAccent(t, "hook"),
    answer:
      "Nguyên tắc quản lý state: store giữ **dữ liệu gốc**, giá trị dẫn xuất (tổng tiền, danh sách lọc) tính bằng selector.\n\n```ts\nconst total = useCartStore(s => s.items.reduce((t, i) => t + i.price * i.qty, 0));\n```\n\nNếu selector trả object thì dùng `useShallow` để tránh re-render thừa. Chỉ lưu sẵn giá trị dẫn xuất khi phép tính cực đắt — và khi đó phải update trong cùng 1 action.",
  },
  {
    match: (t) => includesNoAccent(t, "test") || includesNoAccent(t, "kiểm thử") || includesNoAccent(t, "bug") || includesNoAccent(t, "lỗi"),
    answer:
      "Với bug/test, em nên: 1) Tái hiện lỗi ổn định và ghi lại bước; 2) Viết test thất bại (failing test) trước; 3) Sửa code tới khi test xanh; 4) Thêm regression test cho edge case lân cận.\n\nNếu là lỗi hydration (SSR): kiểm tra `Date`, `Math.random()`, `window` render khác nhau giữa server/client — thay bằng định dạng cố định như `format(date, 'dd/MM/yyyy')`.",
  },
  {
    match: (t) => includesNoAccent(t, "api") || includesNoAccent(t, "backend") || includesNoAccent(t, "rest") || includesNoAccent(t, "sql"),
    answer:
      "Khi thiết kế API: 1) Đặt resource rõ ràng (`/api/orders/:id`), dùng đúng method (GET/POST/PATCH/DELETE); 2) Status code chuẩn — 200 đọc, 201 tạo, 204 xóa, 400 lỗi validate, 401/403 phân quyền, 404 không thấy; 3) Validate đầu vào ở server, không tin client; 4) Truy vấn nặng thì thêm index + phân trang (limit/offset hoặc cursor).",
  },
  {
    match: (t) => includesNoAccent(t, "học") || includesNoAccent(t, "lộ trình") || includesNoAccent(t, "nghề") || includesNoAccent(t, "sau thực tập"),
    answer:
      "Lộ trình em nên đi: 1) Vững gốc JS/TS (event loop, closure, type hệ thống); 2) Một framework chủ lực sâu (Next.js: caching, server components); 3) Testing (Vitest + Playwright); 4) Đọc source 1-2 thư viện nhỏ.\n\nQuan trọng nhất: gom sản phẩm kỳ thực tập thành portfolio có demo online + 3 case study khó điểm kỹ thuật đã giải quyết.",
  },
  {
    match: () => true,
    answer:
      "Câu hỏi hay! Gợi ý cách tiếp cận tổng quát:\n1. Xác định rõ kết quả mong muốn và ràng buộc (thời gian, công nghệ).\n2. Chia vấn đề thành phần nhỏ, giải phần chắc chắn trước.\n3. Với mỗi phần, chọn giải pháp đơn giản nhất hoạt động được, rồi mới tối ưu.\n\nEm có thể cho mentor biết thêm ngữ cảnh (task đang làm, đoạn code lỗi) để mình tư vấn cụ thể hơn nhé.",
  },
];

function fallbackAnswer(content: string): string {
  const norm = content.toLowerCase();
  const hit = FALLBACKS.find((f) => f.match(norm));
  return hit?.answer ?? FALLBACKS[FALLBACKS.length - 1].answer;
}

function buildFollowUps(content: string): string[] {
  const pools: { match: (t: string) => boolean; ups: string[] }[] = [
    {
      match: (t) => includesNoAccent(t, "render") || includesNoAccent(t, "hiệu năng"),
      ups: ["Khi nào nên dùng useMemo thay vì React.memo?", "Virtualize ảnh hưởng gì đến SEO?", "Đo hiệu năng bằng công cụ nào khác ngoài Profiler?"],
    },
    {
      match: (t) => includesNoAccent(t, "state") || includesNoAccent(t, "store"),
      ups: ["Khi nào nên dùng Context thay vì Zustand?", "Làm sao test một store Zustand?", "Persist store vào localStorage thế nào?"],
    },
    {
      match: (t) => includesNoAccent(t, "test") || includesNoAccent(t, "bug"),
      ups: ["Viết test E2E bằng Playwright bắt đầu từ đâu?", "Mock API call trong test thế nào?", "Coverage bao nhiêu là đủ cho dự án nhỏ?"],
    },
    {
      match: (t) => includesNoAccent(t, "api") || includesNoAccent(t, "backend"),
      ups: ["Phân trang cursor khác offset chỗ nào?", "Khi nào nên dùng cache Redis?", "Viết tài liệu API (OpenAPI) ra sao?"],
    },
  ];
  const norm = content.toLowerCase();
  const pool = pools.find((p) => p.match(norm))?.ups;
  if (pool) return pool;
  return [
    "Cho mình ví dụ code cụ thể được không?",
    "Cách này có rủi ro gì cần chú ý?",
    "Có tài liệu nào nên đọc trước không?",
  ];
}

async function callLlm(systemPrompt: string, history: { role: "user" | "assistant"; content: string }[], content: string): Promise<string> {
  const zai = await ZAI.create();
  const completion = await Promise.race([
    zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ],
      thinking: { type: "disabled" },
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("LLM_TIMEOUT")), LLM_TIMEOUT_MS)),
  ]);
  const text = completion?.choices?.[0]?.message?.content;
  if (typeof text === "string" && text.trim()) return text.trim();
  throw new Error("EMPTY_LLM_RESPONSE");
}

async function postMessage(ctx: Ctx): Promise<unknown> {
  const conv = getConversation(ctx, ctx.params.id);
  if (conv.status === "archived") throw conflict("Cuộc trò chuyện đã lưu trữ — mở lại trước khi nhắn.");

  const content = typeof ctx.body?.content === "string" ? ctx.body.content.trim() : "";
  if (!content) throw conflict("Nội dung tin nhắn không được để trống.");
  const taskId = typeof ctx.body?.taskId === "string" && ctx.body.taskId ? ctx.body.taskId : null;

  const userMessage: MentorMessage = {
    id: randomId("mmsg"),
    conversationId: conv.id,
    role: "user",
    content,
    at: nowIso(),
    taskId,
  };
  ctx.store.mentorMessages.push(userMessage);

  // 10 tin gần nhất làm ngữ cảnh
  const history = ctx.store.mentorMessages
    .filter((m) => m.conversationId === conv.id)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }) as { role: "user" | "assistant"; content: string });

  // Sinh câu trả lời: LLM thật, fallback canned nếu lỗi/timeout
  let reply: string;
  try {
    reply = await callLlm(buildSystemPrompt(ctx), history, content);
  } catch {
    reply = fallbackAnswer(content);
  }
  ctx.store.aiRuns += 1;

  const assistantMessage: MentorMessage = {
    id: randomId("mmsg"),
    conversationId: conv.id,
    role: "assistant",
    content: reply,
    at: nowIso(),
    taskId: null,
  };
  ctx.store.mentorMessages.push(assistantMessage);

  conv.messageCount += 2;
  conv.lastMessageAt = nowIso();
  if (conv.title === "Cuộc trò chuyện mới" && conv.messageCount <= 2) {
    conv.title = content.length > 48 ? content.slice(0, 45) + "…" : content;
  }

  return {
    userMessage: msgPublic(userMessage),
    assistantMessage: msgPublic(assistantMessage),
    followUps: buildFollowUps(content),
  };
}

export const mentorRoutes: RouteDef[] = [
  route("GET", "/intern/me/ai-mentor/conversations", "intern", listConversations),
  route("POST", "/intern/me/ai-mentor/conversations", "intern", createConversation),
  route("GET", "/intern/me/ai-mentor/conversations/:id", "intern", getConversationDetail),
  route("POST", "/intern/me/ai-mentor/conversations/:id/messages", "intern", postMessage),
  route("POST", "/intern/me/ai-mentor/conversations/:id/archive", "intern", archiveConversation),
];
