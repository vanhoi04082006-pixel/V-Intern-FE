import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * GET  /api/ai/chat?userId=...  — lấy lịch sử hội thoại
 * POST /api/ai/chat             — gửi tin nhắn, nhận phản hồi từ AI Mentor
 */
export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 60,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[ai-chat:history]", err);
    return NextResponse.json(
      { error: "Không tải được lịch sử hội thoại." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!userId || !message) {
      return NextResponse.json(
        { error: "Thiếu thông tin tin nhắn." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    // Bối cảnh: nhiệm vụ đang làm của người dùng (nếu là intern)
    let contextBlock = "";
    if (user.role === "intern") {
      const tasks = await db.task.findMany({
        where: { assigneeId: user.id, status: { in: ["todo", "in_progress", "review"] } },
        orderBy: { dueDate: "asc" },
        take: 5,
      });
      if (tasks.length) {
        contextBlock =
          "\n\nNhiệm vụ đang mở của sinh viên này:\n" +
          tasks
            .map(
              (t) =>
                `- "${t.title}" (trạng thái: ${t.status}, độ ưu tiên: ${t.priority}, hạn: ${
                  t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "không rõ"
                })`,
            )
            .join("\n");
      }
    }

    const systemPrompt = [
      "Bạn là AI Mentor của nền tảng thực tập ảo V-Intern.",
      "Giọng điệu: thân thiện, gần gũi, lạc quan như một người anh/chị đồng nghiệp tận tâm — KHÔNG máy móc, KHÔNG trả lời dài dòng lý thuyết suông.",
      "Nguyên tắc:",
      "1. Luôn trả lời bằng tiếng Việt.",
      "2. Câu trả lời ngắn gọn, đi thẳng vào việc; dùng gạch đầu dòng khi cần liệt kê bước.",
      "3. Ưu tiên gợi ý hành động cụ thể (chia nhỏ nhiệm vụ, kỹ thuật pomodoro, cách viết commit message, review checklist...).",
      "4. Khi sinh viên tâm sự/áp lực — động viên chân thành trước, gợi ý sau.",
      "5. Nếu câu hỏi ngoài phạm vi lập việc/học tập, vẫn trả lời tử tế rồi khéo léo kéo về hành trình thực tập.",
      "6. Không bịa số liệu về nền tảng; nếu không chắc, nói thẳng không chắc.",
      `Thông tin sinh viên: tên ${user.name}, vai trò ${user.role}.`,
      contextBlock,
    ].join("\n");

    // Lấy lịch sử gần nhất để AI nhớ ngữ cảnh hội thoại
    const history = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    const messages = [
      { role: "assistant" as const, content: systemPrompt },
      ...history
        .slice()
        .reverse()
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
      { role: "user" as const, content: message },
    ];

    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Hmm, mình chưa xử lý được câu này. Bạn thử hỏi lại theo cách khác nhé!";

    // Lưu cả hai tin vào lịch sử
    await db.chatMessage.createMany({
      data: [
        { userId, role: "user", content: message },
        { userId, role: "assistant", content: reply },
      ],
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[ai-chat]", err);
    return NextResponse.json(
      { error: "AI Mentor đang bận. Bạn thử lại sau vài giây nhé!" },
      { status: 500 },
    );
  }
}
