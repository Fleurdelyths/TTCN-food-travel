import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
export async function GET() {
  try { const [rows] = await pool.query<RowDataPacket[]>("SELECT id,name FROM categories ORDER BY name"); return NextResponse.json({success:true,data:rows}); }
  catch(error) { console.error("Blog categories:",error); return NextResponse.json({success:false,message:"Không thể tải danh mục."},{status:500}); }
}
