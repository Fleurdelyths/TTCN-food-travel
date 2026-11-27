import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  created_at: string | Date;
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [rows] = await pool.execute<UserRow[]>(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC",
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản trị người dùng</h1>
        <p className="mt-1 text-sm text-gray-500">Xin chào quản trị viên {user.name}. Danh sách tài khoản trong hệ thống.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Ngày tạo</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.id}</td><td className="px-4 py-3">{item.name}</td><td className="px-4 py-3">{item.email}</td><td className="px-4 py-3">{item.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleString("vi-VN")}</td></tr>)}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-gray-500">Chưa có tài khoản.</p>}
      </div>
    </section>
  );
}
