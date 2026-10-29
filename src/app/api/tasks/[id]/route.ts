import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const STATUSES = new Set(["todo", "in_progress", "review", "done"]);

/** PATCH /api/tasks/:id — cập nhật trạng thái nhiệm vụ (kéo thẻ kanban). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const status = typeof body?.status === "string" ? body.status : "";

    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Không tìm thấy nhiệm vụ." }, { status: 404 });
    }

    const updated = await db.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      task: {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        point: updated.point,
        dueDate: updated.dueDate?.toISOString() ?? null,
        order: updated.order,
        sprintId: updated.sprintId,
      },
    });
  } catch (err) {
    console.error("[tasks:update]", err);
    return NextResponse.json(
      { error: "Không cập nhật được nhiệm vụ." },
      { status: 500 },
    );
  }
}
