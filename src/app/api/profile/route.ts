import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/profile — cập nhật hồ sơ cá nhân. */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const university =
      typeof body?.university === "string" ? body.university.trim() : "";
    const major = typeof body?.major === "string" ? body.major.trim() : "";
    const bio = typeof body?.bio === "string" ? body.bio.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Tên hiển thị không được để trống." },
        { status: 400 },
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        name,
        university: university || null,
        major: major || null,
        bio: bio || null,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        university: user.university,
        major: user.major,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("[profile]", err);
    return NextResponse.json(
      { error: "Không cập nhật được hồ sơ." },
      { status: 500 },
    );
  }
}
