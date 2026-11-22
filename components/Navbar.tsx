"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = { id: number; name: string; email: string; role: "USER" | "ADMIN" };

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result) => setUser(result?.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-2xl font-bold text-transparent">Food &amp; Travel</span>
        </Link>

        <div className="hidden space-x-8 font-medium text-gray-700 md:flex">
          <Link href="/" className="transition-colors hover:text-orange-500">Trang chủ</Link>
          <Link href="/places" className="transition-colors hover:text-orange-500">Địa điểm</Link>
          <Link href="/routes" className="transition-colors hover:text-orange-500">Gợi ý lộ trình</Link>
          <Link href="/blogs" className="transition-colors hover:text-orange-500">Bài viết Review</Link>
        </div>

        <div className="flex items-center gap-3">
          {!checked ? null : user ? (
            <>
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">Xin chào, {user.name}</span>
              {user.role === "ADMIN" && <Link href="/admin" className="text-sm font-semibold text-orange-600 hover:underline">Quản trị</Link>}
              <button onClick={handleLogout} disabled={loggingOut} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">{loggingOut ? "Đang thoát..." : "Đăng xuất"}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-2 font-medium text-gray-600 hover:text-orange-500">Đăng nhập</Link>
              <Link href="/register" className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
