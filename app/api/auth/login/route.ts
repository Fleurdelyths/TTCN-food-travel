import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authCookieOptions, comparePassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      "SELECT id, name, email, password, role, avatar FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Email hoặc mật khẩu không chính xác." }, { status: 401 });
    }

    const user = rows[0];
    const passwordIsValid = await comparePassword(password, user.password);
    if (!passwordIsValid) {
      return NextResponse.json({ success: false, message: "Email hoặc mật khẩu không chính xác." }, { status: 401 });
    }

    const token = generateToken({ id: Number(user.id) });
    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
    response.cookies.set("ttcn_auth_token", token, authCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Không thể đăng nhập lúc này. Vui lòng thử lại." }, { status: 500 });
  }
}
