import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Đăng nhập để thích bài viết." }, { status: 401 });
    const { id } = await context.params;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [blogs]: any = await connection.execute("SELECT id,status FROM blogs WHERE id=? FOR UPDATE", [id]);
      if (!blogs.length || blogs[0].status !== "published") { await connection.rollback(); return NextResponse.json({ success: false, message: "Bài viết không tồn tại." }, { status: 404 }); }
      const [likes]: any = await connection.execute("SELECT id FROM blog_likes WHERE blog_id=? AND user_id=?", [id,user.id]);
      let liked = false;
      if (likes.length) await connection.execute("DELETE FROM blog_likes WHERE blog_id=? AND user_id=?", [id,user.id]);
      else { await connection.execute("INSERT INTO blog_likes (blog_id,user_id) VALUES (?,?)", [id,user.id]); liked = true; }
      await connection.execute("UPDATE blogs SET like_count=(SELECT COUNT(*) FROM blog_likes WHERE blog_id=?) WHERE id=?", [id,id]);
      const [counts]: any = await connection.execute("SELECT like_count FROM blogs WHERE id=?", [id]);
      await connection.commit();
      return NextResponse.json({ success: true, data: { liked, like_count: counts[0].like_count } });
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  } catch (error) { console.error("Like blog:",error); return NextResponse.json({ success:false,message:"Không thể cập nhật lượt thích."},{status:500}); }
}
