
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

// ==================== LẤY CHI TIẾT BÀI VIẾT ====================

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    const [rows]: any = await pool.execute(
      `SELECT
        b.id,
        b.user_id,
        b.place_id,
        b.category_id,
        b.title,
        b.slug,
        b.excerpt,
        b.content,
        b.thumbnail,
        b.like_count,
        b.view_count,
        b.status,
        b.created_at,
        b.updated_at,
        b.published_at,
        u.name AS author_name,
        u.avatar AS author_avatar,
        p.name AS place_name,
        p.address AS place_address,
        c.name AS category_name
      FROM blogs b
      JOIN users u ON u.id = b.user_id
      JOIN places p ON p.id = b.place_id
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.id = ? OR b.slug = ?
      LIMIT 1`,
      [id, id]
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy bài viết.",
        },
        { status: 404 }
      );
    }

    const blog = rows[0];

    const isOwner = user?.id === Number(blog.user_id);
    const isAdmin = user?.role === "ADMIN";

    if (
      blog.status !== "published" &&
      !isOwner &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bài viết chưa được công khai.",
        },
        { status: 404 }
      );
    }

    // ==================== KIỂM TRA LƯỢT XEM ====================
    // Tang luot xem sau moi 30p =========================================>>>>>
    // const cookieName = `blog_view_${blog.id}`;

    // const cookieHeader = request.headers.get("cookie") || "";

    // const hasViewed = cookieHeader
    //   .split(";")
    //   .some((cookie) => cookie.trim() === `${cookieName}=1`);

    // let shouldCountView = false;

    // // Chỉ tăng lượt xem nếu bài viết đã xuất bản
    // // và trình duyệt chưa xem bài viết trong 30 phút gần nhất
    // if (blog.status === "published" && !hasViewed) {
    //   await pool.execute(
    //     "UPDATE blogs SET view_count = view_count + 1 WHERE id = ?",
    //     [blog.id]
    //   );

    //   shouldCountView = true;
    // }


    // ==================== TĂNG LƯỢT XEM ====================

// Mỗi lần gọi API chi tiết bài viết đã xuất bản sẽ tăng 1 lượt xem
if (blog.status === "published") {
  await pool.execute(
    "UPDATE blogs SET view_count = view_count + 1 WHERE id = ?",
    [blog.id]
  );
}
    // ==================== LẤY HÌNH ẢNH ====================

    const [images]: any = await pool.execute(
      `SELECT id, image_url
       FROM blog_images
       WHERE blog_id = ?
       ORDER BY id`,
      [blog.id]
    );

    // ==================== KIỂM TRA ĐÃ THÍCH CHƯA ====================

    let liked = false;

    if (user) {
      const [likes]: any = await pool.execute(
        `SELECT id
         FROM blog_likes
         WHERE blog_id = ? AND user_id = ?
         LIMIT 1`,
        [blog.id, user.id]
      );

      liked = likes.length > 0;
    }

    // ==================== LẤY BÀI VIẾT LIÊN QUAN ====================

    const [related]: any = await pool.execute(
      `SELECT id, title, slug, thumbnail
       FROM blogs
       WHERE status = 'published'
         AND place_id = ?
         AND id <> ?
       ORDER BY published_at DESC
       LIMIT 3`,
      [blog.place_id, blog.id]
    );

    // ==================== TRẢ VỀ KẾT QUẢ ====================

    const response = NextResponse.json({
      success: true,
      data: {
        ...blog,
        view_count:
  Number(blog.view_count || 0) +
  (blog.status === "published" ? 1 : 0),
        images,
        liked,
        related,
        is_owner: isOwner,
      },
    });

    // Đánh dấu trình duyệt đã xem bài viết trong 30 phút
    // if (shouldCountView) {
    //   response.cookies.set(cookieName, "1", {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "lax",
    //     path: "/api/blogs",
    //     maxAge: 30 * 60,
    //   });
    // }

    return response;
  } catch (error) {
    console.error("GET blog detail:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tải bài viết.",
      },
      { status: 500 }
    );
  }
}

// ==================== CẬP NHẬT BÀI VIẾT ====================

export async function PATCH(
  request: Request,
  context: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const [rows]: any = await pool.execute(
      "SELECT id, user_id, status FROM blogs WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy bài viết.",
        },
        { status: 404 }
      );
    }

    const blog = rows[0];

    if (
      Number(blog.user_id) !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bạn không có quyền sửa bài viết này.",
        },
        { status: 403 }
      );
    }

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const placeId = Number(body.place_id);

    const categoryId = body.category_id
      ? Number(body.category_id)
      : null;

    const thumbnail = body.thumbnail
      ? String(body.thumbnail)
      : null;

    const excerpt = String(body.excerpt || "")
      .trim()
      .slice(0, 500);

    if (
      title.length < 5 ||
      title.length > 200 ||
      content.length < 30 ||
      !Number.isInteger(placeId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Vui lòng kiểm tra tiêu đề, nội dung và địa điểm.",
        },
        { status: 400 }
      );
    }

    const [places]: any = await pool.execute(
      "SELECT id FROM places WHERE id = ?",
      [placeId]
    );

    if (!places.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Địa điểm không tồn tại.",
        },
        { status: 400 }
      );
    }

    const nextStatus =
      user.role === "ADMIN" && body.status === "published"
        ? "published"
        : body.action === "draft"
          ? "draft"
          : "pending";

    await pool.execute(
      `UPDATE blogs
       SET
         title = ?,
         excerpt = ?,
         content = ?,
         place_id = ?,
         category_id = ?,
         thumbnail = ?,
         status = ?,
         published_at = IF(
           ? = 'published',
           COALESCE(published_at, NOW()),
           NULL
         )
       WHERE id = ?`,
      [
        title,
        excerpt || content.slice(0, 220),
        content,
        placeId,
        categoryId,
        thumbnail,
        nextStatus,
        nextStatus,
        id,
      ]
    );

    // ==================== CẬP NHẬT HÌNH ẢNH ====================

    if (Array.isArray(body.images)) {
      await pool.execute(
        "DELETE FROM blog_images WHERE blog_id = ?",
        [id]
      );

      for (const image of body.images.slice(0, 10)) {
        if (
          typeof image === "string" &&
          image.startsWith("/uploads/blogs/")
        ) {
          await pool.execute(
            `INSERT INTO blog_images (blog_id, image_url)
             VALUES (?, ?)`,
            [id, image]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        nextStatus === "draft"
          ? "Đã lưu bản nháp."
          : "Đã cập nhật bài viết và gửi duyệt.",
      data: {
        status: nextStatus,
      },
    });
  } catch (error) {
    console.error("PATCH blog:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật bài viết.",
      },
      { status: 500 }
    );
  }
}

// ==================== XÓA BÀI VIẾT ====================

export async function DELETE(
  _request: Request,
  context: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const [rows]: any = await pool.execute(
      "SELECT user_id FROM blogs WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy bài viết.",
        },
        { status: 404 }
      );
    }

    if (
      Number(rows[0].user_id) !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bạn không có quyền xóa bài viết này.",
        },
        { status: 403 }
      );
    }

    await pool.execute(
      "DELETE FROM blogs WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Đã xóa bài viết.",
    });
  } catch (error) {
    console.error("DELETE blog:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể xóa bài viết.",
      },
      { status: 500 }
    );
  }
}
