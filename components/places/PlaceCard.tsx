import Link from "next/link";

export interface Place {
  id: number;
  title: string;
  address_detail: string;
  avg_rating: number;
  category_name: string;
  province_name: string;
  primary_image: string;
}

interface PlaceCardProps {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
}

export default function PlaceCard({
  place,
  isFavorite,
  onToggleFavorite,
}: PlaceCardProps) {
  return (
    <Link
      href={`/places/${place.id}`}
      className="group flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:border-orange-500/50 relative"
    >
      {/* Khung Ảnh */}
      <div className="h-48 w-full bg-slate-800 overflow-hidden relative shrink-0">
        <img
          src={
            place.primary_image ||
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=75"
          }
          alt={place.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Đã bỏ backdrop-blur để không tụt FPS khi cuộn */}
        <span className="absolute top-3 left-3 bg-slate-950/90 text-orange-400 border border-slate-700/80 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
          {place.category_name || "Địa điểm"}
        </span>

        <button
          onClick={(e) => onToggleFavorite(place.id, e)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/85 border border-slate-700/80 flex items-center justify-center text-sm shadow hover:bg-slate-800 transition-colors"
        >
          {isFavorite ? "❤" : "🤍"}
        </button>

        <span className="absolute bottom-2.5 left-3 text-slate-100 text-[11px] font-medium bg-slate-950/85 px-2 py-0.5 rounded-md">
          📍 {place.province_name || "Khác"}
        </span>
      </div>

      {/* Thông tin địa điểm */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3 bg-slate-900">
        <div className="space-y-1.5">
          <h3 className="font-bold text-base text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-1">
            {place.title}
          </h3>
          <p className="text-slate-400 text-xs line-clamp-1">
            {place.address_detail}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
          <div className="flex items-center bg-amber-500/10 text-amber-400 font-bold text-xs px-2 py-0.5 rounded-md border border-amber-500/30">
            <span className="mr-1">⭐</span>
            {place.avg_rating ? Number(place.avg_rating).toFixed(1) : "0.0"}
          </div>

          <span className="text-xs font-semibold text-orange-400 flex items-center gap-0.5">
            Xem chi tiết &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
