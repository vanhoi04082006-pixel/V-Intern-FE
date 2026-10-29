import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

const VALID_ROLES = new Set(["intern", "instructor", "admin"]);

export async function POST(req: Request) {
  try {
    await ensureSeeded();

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role =
      typeof body?.role === "string" && VALID_ROLES.has(body.role) ? body.role : "intern";
    const university = typeof body?.university === "string" ? body.university.trim() : "";
    const major = typeof body?.major === "string" ? body.major.trim() : "";

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email có vẻ chưa đúng định dạng." },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu cần ít nhất 6 ký tự." },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email này đã có tài khoản rồi. Bạn đăng nhập nhé!" },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        university: university || null,
        major: major || null,
        bio: null,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          university: user.university,
          major: user.major,
          bio: user.bio,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "Có lỗi phía máy chủ. Bạn thử lại sau ít phút nhé." },
      { status: 500 },
    );
  }
}
