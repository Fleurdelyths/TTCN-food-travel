"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Place {
  id: number;
  title: string;
  address: string;
  avg_rating: number;
  category_name: string;
  primary_image?: string;
}

interface Itinerary {
  id: string;
  title: string;
  main_food: Place;
  dessert: Place;
}

export default function RoutesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [provinceId, setProvinceId] = useState("1"); // Mặc định ID 1 (TP.HCM)

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/routes?province_id=${provinceId}`);
      const data = await res.json();
      if (data.success) {
        setItineraries(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy lộ trình:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, [provinceId]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header & Thanh lọc */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gợi Ý Lộ Trình Ăn Uống
            </h1>
            <p className="text-gray-500 text-sm">
              Tự động kết hợp điểm ăn chính và trà sữa/cà phê mượt mà
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Khu vực:
            </label>
            <select
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="1">TP. Hồ Chí Minh</option>
              <option value="2">Hà Nội</option>
            </select>
          </div>
        </div>

        {/* Danh sách các lộ trình */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Đang tính toán lộ trình tối ưu...
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Chưa đủ dữ liệu địa điểm để tạo lộ trình cho khu vực này.
          </div>
        ) : (
          <div className="space-y-6">
            {itineraries.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                  🗺️ {route.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  {/* Điểm 1: Món ăn chính */}
                  <div className="border border-gray-100 bg-orange-50/30 rounded-xl p-4 flex gap-4 items-center">
                    <img
                      src={
                        route.main_food.primary_image ||
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                      }
                      alt={route.main_food.title}
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-xs bg-orange-500 text-white font-bold px-2 py-0.5 rounded">
                        1. Bữa Chính
                      </span>
                      <h3 className="font-bold text-gray-900 line-clamp-1">
                        {route.main_food.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        📍 {route.main_food.address}
                      </p>
                      <Link
                        href={`/places/${route.main_food.id}`}
                        className="text-xs text-orange-600 hover:underline inline-block font-medium"
                      >
                        Xem chi tiết &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Điểm 2: Cà phê / Tráng miệng */}
                  <div className="border border-gray-100 bg-amber-50/30 rounded-xl p-4 flex gap-4 items-center">
                    <img
                      src={
                        route.dessert.primary_image ||
                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd"
                      }
                      alt={route.dessert.title}
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded">
                        2. Cà Phê / Tráng Miệng
                      </span>
                      <h3 className="font-bold text-gray-900 line-clamp-1">
                        {route.dessert.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        📍 {route.dessert.address}
                      </p>
                      <Link
                        href={`/places/${route.dessert.id}`}
                        className="text-xs text-amber-600 hover:underline inline-block font-medium"
                      >
                        Xem chi tiết &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
