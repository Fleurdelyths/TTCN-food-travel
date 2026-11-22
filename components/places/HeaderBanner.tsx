interface HeaderBannerProps {
  title?: string;
  description?: string;
}

export default function HeaderBanner({
  title = "Khám Phá Địa Điểm Ẩm Thực & Du Lịch 🍕☕",
  description = "Bộ sưu tập các nhà hàng, quán ăn và tiệm cà phê hot nhất được đánh giá cao.",
}: HeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-12 px-6 shadow-md">
      <div className="max-w-7xl mx-auto space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-slate-200 text-sm md:text-base max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}
