import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

export type MealGroup = "MAIN" | "DESSERT" | "SNACK";

interface RawPlaceRow {
  id: number;
  title: string;
  address_detail: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  avg_rating: number | string | null;
  category_id: number | null;
  province_id: number | null;
  category_name: string | null;
  province_name: string | null;
  primary_image: string | null;
  distance_km?: number | string | null;
}

function classifyMealGroup(
  categoryId: number | null,
  categoryName: string | null,
  placeTitle: string,
): MealGroup {
  const text = `${categoryName ?? ""} ${placeTitle}`.toLowerCase();

  if (
    /cà phê|cafe|coffee|trà sữa|chè|kem|bánh ngọt|tráng miệng|dessert|sinh tố|matcha/.test(
      text,
    )
  ) {
    return "DESSERT";
  }

  if (
    /ăn vặt|ốc|bánh mì|xiên|gà rán|snack|tokbokki|nem chua|trà chanh/.test(
      text,
    )
  ) {
    return "SNACK";
  }

  if (categoryId === 6 || categoryId === 7 || categoryId === 10) {
    return "DESSERT";
  }
  if (categoryId === 3 || categoryId === 5) {
    return "SNACK";
  }
  return "MAIN";
}

function getRecommendedOrder(anchorGroup: MealGroup): MealGroup[] {
  if (anchorGroup === "MAIN") return ["DESSERT", "SNACK", "MAIN"];
  if (anchorGroup === "DESSERT") return ["MAIN", "SNACK", "DESSERT"];
  return ["DESSERT", "MAIN", "SNACK"];
}

function formatPlace(row: RawPlaceRow) {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  const dist =
    row.distance_km !== undefined && row.distance_km !== null
      ? Number(Number(row.distance_km).toFixed(2))
      : undefined;

  return {
    id: Number(row.id),
    title: row.title,
    address_detail: row.address_detail,
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    avg_rating: row.avg_rating !== null ? Number(row.avg_rating) : 0,
    category_id: row.category_id,
    category_name: row.category_name,
    province_name: row.province_name,
    primary_image: row.primary_image,
    meal_group: classifyMealGroup(row.category_id, row.category_name, row.title),
    ...(dist !== undefined ? { distance_km: dist } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = Number(searchParams.get("placeId"));
    const rawRadius = Number(searchParams.get("radiusKm") || 5);
    const radiusKm = Number.isFinite(rawRadius)
      ? Math.min(Math.max(rawRadius, 0.5), 50)
      : 5;

    if (!Number.isInteger(placeId) || placeId <= 0) {
      return NextResponse.json(
        { success: false, message: "Vui lòng chọn một địa điểm hợp lệ." },
        { status: 400 },
      );
    }

    const [anchorRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        p.id,
        p.name AS title,
        p.address AS address_detail,
        p.latitude,
        p.longitude,
        p.rating_average AS avg_rating,
        p.category_id,
        p.province_id,
        c.name AS category_name,
        pr.name AS province_name,
        pi.image_url AS primary_image
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN provinces pr ON p.province_id = pr.id
      LEFT JOIN place_images pi ON p.id = pi.place_id AND pi.is_primary = TRUE
      WHERE p.id = ?
      LIMIT 1`,
      [placeId],
    );

    if (!anchorRows || anchorRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy địa điểm đã chọn." },
        { status: 404 },
      );
    }

    const anchor = formatPlace(anchorRows[0] as RawPlaceRow);
    if (anchor.latitude === null || anchor.longitude === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Địa điểm này chưa có tọa độ để tìm kiếm xung quanh.",
        },
        { status: 400 },
      );
    }

    const [nearbyRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        p.id,
        p.name AS title,
        p.address AS address_detail,
        p.latitude,
        p.longitude,
        p.rating_average AS avg_rating,
        p.category_id,
        p.province_id,
        c.name AS category_name,
        pr.name AS province_name,
        pi.image_url AS primary_image,
        ST_Distance_Sphere(
          POINT(p.longitude, p.latitude),
          POINT(?, ?)
        ) / 1000 AS distance_km
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN provinces pr ON p.province_id = pr.id
      LEFT JOIN place_images pi ON p.id = pi.place_id AND pi.is_primary = TRUE
      WHERE p.id != ?
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
      HAVING distance_km <= ?
      ORDER BY distance_km ASC, p.rating_average DESC
      LIMIT 30`,
      [anchor.longitude, anchor.latitude, anchor.id, radiusKm],
    );

    const grouped: Record<MealGroup, ReturnType<typeof formatPlace>[]> = {
      MAIN: [],
      DESSERT: [],
      SNACK: [],
    };

    for (const row of nearbyRows as RawPlaceRow[]) {
      const formatted = formatPlace(row);
      grouped[formatted.meal_group].push(formatted);
    }

    return NextResponse.json({
      success: true,
      data: {
        anchor,
        radius_km: radiusKm,
        recommended_order: getRecommendedOrder(anchor.meal_group),
        suggestions: grouped,
      },
    });
  } catch (error) {
    console.error("Route suggest error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể gợi ý lộ trình lúc này." },
      { status: 500 },
    );
  }
}
