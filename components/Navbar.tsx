
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Kiểm tra trạng thái đăng nhập khi chuyển trang
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (active) {
          setUser(result?.data?.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    }

    checkAuth();
    return () => {
      active = false;
    };
  }, [pathname]);

  // Xử lý đăng xuất
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
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Food & Travel
            </span>
          </Link>

          {/* Menu chính */}
          <div className="hidden md:flex space-x-8 font-medium text-white">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Trang chủ
            </Link>

            <Link
              href="/places"
              className="hover:text-orange-500 transition-colors"
            >
              Địa điểm
            </Link>

            <Link
              href="/routes"
              className="hover:text-orange-500 transition-colors"
            >
              Gợi ý lộ trình
            </Link>

            <Link
              href="/blogs"
              className="hover:text-orange-500 transition-colors"
            >
              Blog
            </Link>
          </div>

          {/* Khu vực tài khoản */}
          <div className="flex items-center gap-3">
            {!checked ? (
              <span className="text-sm text-white">Đang tải...</span>
            ) : user ? (
              <>
                <span className="hidden text-sm font-medium text-white sm:inline">
                  Xin chào, {user.name}
                </span>

                {/* Người dùng đã đăng nhập */}
                <Link
                  href="/my-blogs"
                  className="text-sm font-medium text-white hover:text-orange-400"
                >
                  Bài viết của tôi
                </Link>

                {/* Chỉ ADMIN mới thấy */}
                {user?.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin/blogs"
                      className="text-sm font-semibold text-orange-400 hover:underline"
                    >
                      Duyệt Blog
                    </Link>

                    <Link
                      href="/admin"
                      className="text-sm font-semibold text-orange-400 hover:underline"
                    >
                      Quản trị
                    </Link>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {loggingOut ? "Đang thoát..." : "Đăng xuất"}
                </button>
              </>
            ) : (
              <>
                {/* Người dùng chưa đăng nhập */}
                <Link
                  href="/login"
                  className="px-2 py-2 font-medium text-white hover:text-orange-400"
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
