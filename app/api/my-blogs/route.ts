import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({success:false,message:"Vui lòng đăng nhập."},{status:401});
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT b.id,b.title,b.slug,b.excerpt,b.thumbnail,b.status,b.like_count,b.view_count,b.created_at,b.updated_at,p.name AS place_name,
       (SELECT COUNT(*) FROM blog_comments c WHERE c.blog_id=b.id AND c.status='visible') AS comment_count
       FROM blogs b JOIN places p ON p.id=b.place_id WHERE b.user_id=? ORDER BY b.updated_at DESC`,[user.id]);
    return NextResponse.json({success:true,data:rows});
  } catch (error) { console.error("My blogs:",error); return NextResponse.json({success:false,message:"Không thể tải bài viết của bạn."},{status:500}); }
}
