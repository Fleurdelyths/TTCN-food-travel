
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Lấy danh sách bài viết dành cho quản trị viên
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Không có quyền quản trị.",
        },
        { status: 403 }
      );
    }

    // Lấy trạng thái bài viết từ URL
    const status =
      new URL(request.url).searchParams.get("status") || "all";

    // Các trạng thái bài viết hợp lệ
    const valid = [
      "all",
      "draft",
      "pending",
      "published",
      "rejected",
    ];

    // Truy vấn danh sách bài viết
    const [rows] =
      status === "all" || !valid.includes(status)
        ? await pool.query<RowDataPacket[]>(
            `SELECT
              b.id,
              b.title,
              b.status,
              b.created_at,
              b.like_count,
              b.view_count,
              u.name AS author_name,
              p.name AS place_name
            FROM blogs b
            JOIN users u ON u.id = b.user_id
            JOIN places p ON p.id = b.place_id
            ORDER BY b.created_at DESC`
          )
        : await pool.execute<RowDataPacket[]>(
            `SELECT
              b.id,
              b.title,
              b.status,
              b.created_at,
              b.like_count,
              b.view_count,
              u.name AS author_name,
              p.name AS place_name
            FROM blogs b
            JOIN users u ON u.id = b.user_id
            JOIN places p ON p.id = b.place_id
            WHERE b.status = ?
            ORDER BY b.created_at DESC`,
            [status]
          );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Admin blogs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tải danh sách quản trị.",
      },
      { status: 500 }
    );
  }
}

// Cập nhật trạng thái bài viết
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Không có quyền quản trị.",
        },
        { status: 403 }
      );
    }

    // Lấy dữ liệu gửi lên từ client
    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status || "");

    // Kiểm tra dữ liệu đầu vào
    if (
      !Number.isInteger(id) ||
      !["published", "rejected", "pending", "draft"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái bài viết trong database
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE blogs SET status=?,published_at=IF(?='published',COALESCE(published_at,NOW()),NULL) WHERE id=?",
      [status, status, id]
    );

    // Kiểm tra bài viết có tồn tại hay không
    if (!result.affectedRows) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy bài viết.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật trạng thái bài viết.",
    });
  } catch (error) {
    console.error("Moderate blog:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật trạng thái.",
      },
      { status: 500 }
    );
  }
}
