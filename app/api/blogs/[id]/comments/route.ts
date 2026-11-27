import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const [rows]: any = await pool.execute(
      `SELECT c.id,c.blog_id,c.user_id,c.parent_id,c.content,c.created_at,u.name AS user_name,u.avatar AS user_avatar
       FROM blog_comments c JOIN users u ON u.id=c.user_id JOIN blogs b ON b.id=c.blog_id
       WHERE c.blog_id=? AND c.status='visible' AND b.status='published' ORDER BY c.created_at ASC`, [id]);
    return NextResponse.json({ success:true,data:rows });
  } catch (error) { console.error("Get comments:",error); return NextResponse.json({success:false,message:"Không thể tải bình luận."},{status:500}); }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({success:false,message:"Đăng nhập để bình luận."},{status:401});
    const { id } = await context.params;
    const body = await request.json();
    const content = String(body.content || "").trim();
    const parentId = body.parent_id ? Number(body.parent_id) : null;
    if (content.length < 2 || content.length > 2000) return NextResponse.json({success:false,message:"Bình luận phải từ 2 đến 2.000 ký tự."},{status:400});
    const [blogs]: any = await pool.execute("SELECT id FROM blogs WHERE id=? AND status='published'",[id]);
    if (!blogs.length) return NextResponse.json({success:false,message:"Bài viết không tồn tại."},{status:404});
    if (parentId) { const [parents]: any = await pool.execute("SELECT id FROM blog_comments WHERE id=? AND blog_id=? AND parent_id IS NULL AND status='visible'",[parentId,id]); if (!parents.length) return NextResponse.json({success:false,message:"Bình luận cha không hợp lệ."},{status:400}); }
    const [result]: any = await pool.execute("INSERT INTO blog_comments (blog_id,user_id,parent_id,content) VALUES (?,?,?,?)",[id,user.id,parentId,content]);
    return NextResponse.json({success:true,message:"Đã gửi bình luận.",data:{id:result.insertId}},{status:201});
  } catch (error) { console.error("Create comment:",error); return NextResponse.json({success:false,message:"Không thể gửi bình luận."},{status:500}); }
}
