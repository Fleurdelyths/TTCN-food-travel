import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!name || name.length > 100) {
      return NextResponse.json({ success: false, message: "Họ tên không được để trống và tối đa 100 ký tự." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      return NextResponse.json({ success: false, message: "Email không hợp lệ." }, { status: 400 });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json({ success: false, message: "Mật khẩu phải có từ 8 đến 72 ký tự." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Mật khẩu xác nhận không khớp." }, { status: 400 });
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Email này đã được đăng ký." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    // Không nhận role từ client: mọi tài khoản tự đăng ký đều là USER.
    await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'USER')",
      [name, email, hashedPassword],
    );

    return NextResponse.json({ success: true, message: "Đăng ký thành công. Bạn có thể đăng nhập." }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json({ success: false, message: "Email này đã được đăng ký." }, { status: 409 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ success: false, message: "Không thể đăng ký lúc này. Vui lòng thử lại." }, { status: 500 });
  }
}
