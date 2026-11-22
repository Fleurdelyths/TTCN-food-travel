
"use client";

import { useState, useEffect, useCallback } from "react";
import HeaderBanner from "@/components/places/HeaderBanner";
import PlaceCard, { Place } from "@/components/places/PlaceCard";

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);

  // Lấy danh sách địa điểm theo từ khóa
  const fetchPlaces = useCallback(async (searchValue: string) => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/places?search=${encodeURIComponent(searchValue.trim())}`
      );

      const data = await res.json();

      if (data.success) {
        setPlaces(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách địa điểm:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Đọc từ khóa tìm kiếm từ URL khi mở trang
  useEffect(() => {
    const initialSearch =
      new URLSearchParams(window.location.search).get("search") || "";

    setSearch(initialSearch);
    fetchPlaces(initialSearch);
  }, [fetchPlaces]);

  // Xử lý tìm kiếm bằng nút hoặc phím Enter
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();

    window.history.replaceState(
      null,
      "",
      query ? `/places?search=${encodeURIComponent(query)}` : "/places"
    );

    fetchPlaces(query);
  };

  // Xử lý yêu thích địa điểm
  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen w-full pb-16 bg-gradient-to-b from-[#090d16] via-[#1e1b4b] via-[#4c1d95] to-[#831843] text-slate-100">
      <HeaderBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        <div className="bg-slate-900/95 rounded-2xl shadow-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              Danh Sách Địa Điểm ({places.length})
            </h2>

            <p className="text-slate-400 text-xs">
              Nhập từ khóa để tra cứu theo tên món, tên quán hoặc địa chỉ
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-80">
              <span className="absolute left-3.5 top-2.5 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                placeholder="Tìm tên quán, địa chỉ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-400 text-sm"
              />
            </div>

            <button
              type="submit"
              className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 font-semibold text-sm shadow-md shrink-0 transition-colors"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-900/90 rounded-2xl p-4 shadow-sm border border-slate-800 animate-pulse space-y-3"
              >
                <div className="w-full h-48 bg-slate-800 rounded-xl" />
                <div className="h-5 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <span className="text-4xl">🔍</span>
            <p className="text-slate-400 font-medium">
              Chưa tìm thấy địa điểm nào phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isFavorite={favorites.includes(place.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
