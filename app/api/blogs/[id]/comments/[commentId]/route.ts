import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export async function DELETE(_request: Request, context: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    const { id, commentId } = await context.params;
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT user_id FROM blog_comments WHERE id=? AND blog_id=?", [commentId, id]);
    if (!rows.length) return NextResponse.json({ success: false, message: "Không tìm thấy bình luận." }, { status: 404 });
    if (Number(rows[0].user_id) !== user.id && user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Bạn không có quyền xóa bình luận này." }, { status: 403 });
    await pool.execute("UPDATE blog_comments SET status='hidden' WHERE id=?", [commentId]);
    return NextResponse.json({ success: true, message: "Đã ẩn bình luận." });
  } catch (error) {
    console.error("Delete comment:", error);
    return NextResponse.json({ success: false, message: "Không thể xóa bình luận." }, { status: 500 });
  }
}
