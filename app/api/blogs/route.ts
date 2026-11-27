import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Lấy từ khóa tìm kiếm
    const search = (searchParams.get("search") || "").trim();

    // Tách từ khóa thành từng từ
    const keywords = search
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // Lấy danh mục được chọn
    const categoryId = Number(searchParams.get("category_id") || 0);

    // Phân trang
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      18,
      Math.max(1, Number(searchParams.get("limit") || 9))
    );
    const offset = (page - 1) * limit;

    // Điều kiện mặc định: chỉ lấy bài đã xuất bản
    const where: string[] = ["b.status = 'published'"];
    const params: (string | number)[] = [];

    // Tìm kiếm từng từ khóa
    // Mỗi từ có thể nằm ở tiêu đề, mô tả, nội dung hoặc địa điểm
    for (const word of keywords) {
      where.push(`
        (
          b.title LIKE ?
          OR b.excerpt LIKE ?
          OR b.content LIKE ?
          OR p.name LIKE ?
        )
      `);

      const keyword = `%${word}%`;

      params.push(
        keyword,
        keyword,
        keyword,
        keyword
      );
    }

    // Lọc theo danh mục
    if (categoryId > 0) {
      where.push("b.category_id = ?");
      params.push(categoryId);
    }

    const whereSql = where.join(" AND ");

    // Đếm tổng số bài viết phù hợp
    const [countRows]: any = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM blogs b
        JOIN places p ON p.id = b.place_id
        WHERE ${whereSql}
      `,
      params
    );

    // Lấy danh sách bài viết
    const [rows]: any = await pool.execute(
      `
        SELECT
          b.id,
          b.title,
          b.slug,
          b.excerpt,
          b.thumbnail,
          b.like_count,
          b.view_count,
          b.created_at,
          b.published_at,

          u.id AS author_id,
          u.name AS author_name,
          u.avatar AS author_avatar,

          p.id AS place_id,
          p.name AS place_name,

          c.id AS category_id,
          c.name AS category_name,

          (
            SELECT COUNT(*)
            FROM blog_comments bc
            WHERE bc.blog_id = b.id
              AND bc.status = 'visible'
          ) AS comment_count

        FROM blogs b
        JOIN users u ON u.id = b.user_id
        JOIN places p ON p.id = b.place_id
        LEFT JOIN categories c ON c.id = b.category_id

        WHERE ${whereSql}

        ORDER BY
          COALESCE(b.published_at, b.created_at) DESC

        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const total = Number(countRows[0]?.total || 0);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/blogs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tải danh sách bài viết.",
      },
      { status: 500 }
    );
  }
}


function makeSlug(title: string) {
  const base = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 75) || "bai-viet";
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để viết bài." }, { status: 401 });
    const body = await request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const placeId = Number(body.place_id);
    const categoryId = body.category_id ? Number(body.category_id) : null;
    const thumbnail = body.thumbnail ? String(body.thumbnail) : null;
    const excerpt = String(body.excerpt || "").trim().slice(0, 500);
    const status = body.action === "draft" ? "draft" : "pending";
    const imageUrls = Array.isArray(body.images) ? body.images.map((x: unknown) => String(x)).filter((x: string) => x.startsWith("/uploads/blogs/")).slice(0, 10) : [];
    if (title.length < 5 || title.length > 200) return NextResponse.json({ success: false, message: "Tiêu đề phải từ 5 đến 200 ký tự." }, { status: 400 });
    if (content.length < 30) return NextResponse.json({ success: false, message: "Nội dung cần ít nhất 30 ký tự." }, { status: 400 });
    if (!Number.isInteger(placeId) || placeId <= 0) return NextResponse.json({ success: false, message: "Vui lòng chọn địa điểm được review." }, { status: 400 });
    const [places]: any = await pool.execute("SELECT id FROM places WHERE id=? LIMIT 1", [placeId]);
    if (!places.length) return NextResponse.json({ success: false, message: "Địa điểm không tồn tại." }, { status: 400 });
    const slug = makeSlug(title);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result]: any = await connection.execute(
        "INSERT INTO blogs (user_id,place_id,category_id,title,slug,excerpt,content,thumbnail,status) VALUES (?,?,?,?,?,?,?,?,?)",
        [user.id, placeId, categoryId, title, slug, excerpt || content.slice(0, 220), content, thumbnail, status],
      );
      for (const image of imageUrls) await connection.execute("INSERT INTO blog_images (blog_id,image_url) VALUES (?,?)", [result.insertId, image]);
      await connection.commit();
      return NextResponse.json({ success: true, message: status === "draft" ? "Đã lưu bản nháp." : "Bài viết đã được gửi để duyệt.", data: { id: result.insertId, slug, status } }, { status: 201 });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) {
    console.error("POST /api/blogs:", error);
    return NextResponse.json({ success: false, message: "Không thể tạo bài viết." }, { status: 500 });
  }
}
