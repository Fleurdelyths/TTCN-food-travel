import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = `
      SELECT 
        p.id,
        p.name AS title,
        p.address AS address_detail,
        p.rating_average AS avg_rating,
        c.name AS category_name,
        pr.name AS province_name,
        pi.image_url AS primary_image
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN provinces pr ON p.province_id = pr.id
      LEFT JOIN place_images pi ON p.id = pi.place_id AND pi.is_primary = TRUE
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.address LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.id DESC`;

    const [rows] = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi server khi lấy danh sách địa điểm",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
