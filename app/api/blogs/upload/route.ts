import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ success: false, message: "Chưa chọn ảnh." }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ success: false, message: "Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: "Ảnh tối đa 5MB." }, { status: 400 });
    const ext = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" } as Record<string,string>)[file.type];
    const folder = path.join(process.cwd(), "public", "uploads", "blogs");
    await mkdir(folder, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ success: true, data: { url: `/uploads/blogs/${filename}` } });
  } catch (error) {
    console.error("Upload blog image:", error);
    return NextResponse.json({ success: false, message: "Tải ảnh thất bại." }, { status: 500 });
  }
}
