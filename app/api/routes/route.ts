import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get("province_id");
    const districtId = searchParams.get("district_id");

    if (!provinceId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng chọn Tỉnh/Thành phố" },
        { status: 400 },
      );
    }

    let filterQuery = `WHERE p.province_id = ?`;
    const queryParams: any[] = [provinceId];

    if (districtId) {
      filterQuery += ` AND p.district_id = ?`;
      queryParams.push(districtId);
    }

    // Lấy danh sách địa điểm theo Tỉnh/Huyện kèm tên danh mục và ảnh đại diện
    const [places]: any = await pool.query(
      `SELECT 
        p.id,
        p.name AS title,
        p.address,
        p.rating_average AS avg_rating,
        p.category_id,
        c.name AS category_name,
        pi.image_url AS primary_image
       FROM places p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN place_images pi ON p.id = pi.place_id AND pi.is_primary = TRUE
       ${filterQuery}
       ORDER BY p.rating_average DESC`,
      queryParams,
    );

    // Tách địa điểm ăn chính và tráng miệng/cà phê
    // Giả định category_id = 1 là Ăn chính, category_id = 2 (hoặc khác 1) là Cà phê/Tráng miệng
    const mainFoods = places.filter((p: any) => p.category_id === 1);
    const desserts = places.filter((p: any) => p.category_id !== 1);

    // Tạo các cặp lộ trình (Ăn chính + Cà phê/Tráng miệng)
    const itineraries = [];
    const minLength = Math.min(mainFoods.length, desserts.length);

    for (let i = 0; i < minLength; i++) {
      itineraries.push({
        id: `route-${i + 1}`,
        title: `Lộ trình ${i + 1}: Thưởng thức Ẩm thực & Cà phê`,
        main_food: mainFoods[i],
        dessert: desserts[i],
      });
    }

    return NextResponse.json({
      success: true,
      data: itineraries,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi server khi tạo lộ trình",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
