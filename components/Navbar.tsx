import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Food & Travel
            </span>
          </Link>

          <div className="hidden md:flex space-x-8 font-medium text-gray-700">
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
              Bài viết Review
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-orange-500 font-medium px-3 py-2"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="bg-orange-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
