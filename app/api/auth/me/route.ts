import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ success: false, message: "Không thể kiểm tra trạng thái đăng nhập." }, { status: 500 });
  }
}
