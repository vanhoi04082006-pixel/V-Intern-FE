import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

/**
 * GET /api/workspace?userId=...
 * Trả dữ liệu workspace theo role:
 * - intern: nhiệm vụ của mình + sprint + thống kê cá nhân
 * - instructor / admin: danh sách sinh viên + tổng quan toàn bộ nhiệm vụ
 */
export async function GET(req: Request) {
  try {
    await ensureSeeded();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const sprints = await db.sprint.findMany({
      orderBy: { order: "asc" },
      include: { tasks: { include: { assignee: true } } },
    });

    const publicUser = (u: {
      id: string;
      name: string;
      email: string;
      role: string;
      university: string | null;
      major: string | null;
      bio: string | null;
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      university: u.university,
      major: u.major,
      bio: u.bio,
    });

    if (user.role === "intern") {
      const myTasks = sprints.flatMap((s) =>
        s.tasks
          .filter((t) => t.assigneeId === user.id)
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            point: t.point,
            dueDate: t.dueDate?.toISOString() ?? null,
            order: t.order,
            sprintId: t.sprintId,
            sprintName: s.name,
          })),
      );

      const members = await db.user.findMany({
        where: { role: "intern" },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        me: publicUser(user),
        role: "intern",
        sprints: sprints.map((s) => ({
          id: s.id,
          name: s.name,
          goal: s.goal,
          status: s.status,
          order: s.order,
          startDate: s.startDate.toISOString(),
          endDate: s.endDate.toISOString(),
          total: s.tasks.length,
          done: s.tasks.filter((t) => t.status === "done").length,
        })),
        tasks: myTasks,
        teammates: members.map(publicUser),
      });
    }

    // ---- instructor / admin ----
    const interns = await db.user.findMany({
      where: { role: "intern" },
      orderBy: { name: "asc" },
    });

    const allTasks = sprints.flatMap((s) =>
      s.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        point: t.point,
        dueDate: t.dueDate?.toISOString() ?? null,
        order: t.order,
        sprintId: t.sprintId,
        sprintName: s.name,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.name ?? "Chưa gán",
      })),
    );

    const roster = interns.map((i) => {
      const mine = allTasks.filter((t) => t.assigneeId === i.id);
      const done = mine.filter((t) => t.status === "done");
      const overdue = mine.filter(
        (t) =>
          t.status !== "done" &&
          t.dueDate !== null &&
          new Date(t.dueDate).getTime() < Date.now(),
      );
      const completion = mine.length ? Math.round((done.length / mine.length) * 100) : 0;
      // điểm đánh giá mock dựa trên tiến độ — công thức minh bạch, thuần dữ liệu
      const quality = Math.min(
        100,
        Math.round(completion * 0.6 + (mine.length ? 40 : 30)),
      );
      return {
        ...publicUser(i),
        taskCount: mine.length,
        doneCount: done.length,
        overdueCount: overdue.length,
        completion,
        quality,
      };
    });

    return NextResponse.json({
      me: publicUser(user),
      role: user.role,
      sprints: sprints.map((s) => ({
        id: s.id,
        name: s.name,
        goal: s.goal,
        status: s.status,
        order: s.order,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        total: s.tasks.length,
        done: s.tasks.filter((t) => t.status === "done").length,
      })),
      tasks: allTasks,
      roster,
    });
  } catch (err) {
    console.error("[workspace]", err);
    return NextResponse.json(
      { error: "Không tải được dữ liệu workspace." },
      { status: 500 },
    );
  }
}
