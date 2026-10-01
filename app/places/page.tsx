"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Place {
  id: number;
  title: string;
  address_detail: string;
  avg_rating: number;
  category_name: string;
  province_name: string;
  primary_image: string;
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places?search=${encodeURIComponent(search)}`,
      );
      const data = await res.json();
      if (data.success) {
        setPlaces(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Thanh tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Danh Sách Địa Điểm Ăn Uống
            </h1>
            <p className="text-gray-500 text-sm">
              Khám phá các địa điểm ẩm thực hấp dẫn
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm tên quán, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white w-64"
            />
            <button
              onClick={fetchPlaces}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Danh sách thẻ địa điểm */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Đang tải danh sách địa điểm...
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Chưa có địa điểm nào trong cơ sở dữ liệu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 transform-gpu"
              >
                <div className="h-48 w-full bg-gray-100 overflow-hidden relative shrink-0">
                  <img
                    src={
                      place.primary_image ||
                      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                    }
                    alt={place.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow">
                    {place.category_name}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-grow justify-between gap-2 bg-white">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">
                      {place.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-1 mt-1">
                      📍 {place.address_detail}, {place.province_name}
                    </p>
                  </div>
                  <div className="flex justify-end items-center pt-2 text-sm border-t border-gray-100 mt-2">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                      ⭐ {place.avg_rating || "0.0"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
