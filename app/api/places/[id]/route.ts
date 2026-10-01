import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const placeId = resolvedParams.id;

    const [places]: any = await pool.query(
      `SELECT p.*, 
              p.name AS title,
              p.address AS address_detail,
              p.rating_average AS avg_rating,
              p.phone AS phone_number,
              c.name AS category_name, 
              pr.name AS province_name, 
              d.name AS district_name
       FROM places p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN provinces pr ON p.province_id = pr.id
       LEFT JOIN districts d ON p.district_id = d.id
       WHERE p.id = ?`,
      [placeId],
    );

    if (places.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy địa điểm" },
        { status: 404 },
      );
    }

    const [images] = await pool.query(
      `SELECT * FROM place_images WHERE place_id = ? ORDER BY is_primary DESC`,
      [placeId],
    );

    return NextResponse.json({
      success: true,
      data: {
        ...places[0],
        images,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Lỗi server", error: error.message },
      { status: 500 },
    );
  }
}
