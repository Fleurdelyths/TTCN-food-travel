import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 });
    }

    // Không truy vấn hoặc trả về trường password.
    const [users] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at DESC",
    );
    return NextResponse.json({ success: true, data: { users } });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ success: false, message: "Không thể tải danh sách người dùng." }, { status: 500 });
  }
}
