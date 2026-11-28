import { NextResponse } from "next/server";
import { getBlogCategories } from "@/lib/blogs";

export async function GET() {
  try {
    const rows = await getBlogCategories();
    return NextResponse.json(
      { success: true, data: rows },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Blog categories:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh mục." },
      { status: 500 }
    );
  }
}
