import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 sm:p-12 text-white text-center shadow-lg">
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
    </div>
  );
}
