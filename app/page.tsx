import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950 text-slate-100 p-6 sm:p-10 space-y-12">
      {/* Hero Banner Cam */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 sm:p-12 text-white text-center shadow-2xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
          Khám Phá Món Ngon & Lộ Trình Du Lịch
        </h1>
        <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
          Gợi ý thông minh các quán ăn gần nhất dành cho bạn.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/route"
            className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow"
          >
            Tạo Lộ Trình Ngay
          </Link>
          <Link
            href="/places"
            className="bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Xem Quán Ăn
          </Link>
        </div>
      </section>

      {/* Thêm các Section khác bên dưới nếu có... */}
    </div>
  );
}
