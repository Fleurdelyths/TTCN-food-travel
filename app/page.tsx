"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

type Place = {
  id: number;
  title: string;
  address_detail?: string | null;
  address?: string | null;
  avg_rating?: number | string | null;
  category_name?: string | null;
  province_name?: string | null;
  primary_image?: string | null;
};

type Itinerary = {
  id: string;
  title: string;
  main_food: Place;
  dessert: Place;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85",
];

function imageFor(place: Place, index: number) {
  return place.primary_image || fallbackImages[index % fallbackImages.length];
}

function ratingFor(place: Place) {
  const rating = Number(place.avg_rating);
  return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null;
}

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/places")
      .then((response) => {
        if (!response.ok) throw new Error("Không thể tải địa điểm");
        return response.json();
      })
      .then((result) => {
        if (!active) return;
        if (result.success && Array.isArray(result.data)) {
          setPlaces(result.data);
        } else {
          setError("Dữ liệu địa điểm hiện chưa sẵn sàng.");
        }
      })
      .catch(() => {
        if (active) setError("Không thể kết nối dữ liệu địa điểm. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (active) setLoadingPlaces(false);
      });

    fetch("/api/routes?province_id=1")
      .then((response) => response.json())
      .then((result) => {
        if (active && result.success && Array.isArray(result.data)) {
          setItineraries(result.data.slice(0, 2));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingRoutes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    places.forEach((place) => {
      const name = place.category_name?.trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries()).slice(0, 6);
  }, [places]);

  const featuredPlaces = places.slice(0, 6);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    window.location.href = query
      ? `/places?search=${encodeURIComponent(query)}`
      : "/places";
  }

  return (
    <div className="home-page -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="home-hero">
        <div className="home-hero-shade" />
        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 lg:min-h-[600px]">
          <div className="max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              FOOD &amp; TRAVEL · KHÁM PHÁ THEO CÁCH CỦA BẠN
            </span>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Mỗi món ngon,
              <br />
              <span className="text-amber-300">một hành trình</span> đáng nhớ.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Tìm những địa điểm đáng thử, khám phá hương vị quanh bạn và kết
              nối thành chuyến đi ẩm thực tiếp theo.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-xl text-orange-500" aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Bạn muốn tìm món ngon hay địa điểm nào?"
                  aria-label="Tìm món ngon hoặc địa điểm"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
                />
              </label>
              <button
                type="submit"
                className="h-12 rounded-xl bg-orange-500 px-7 font-bold text-white transition hover:bg-orange-600"
              >
                Khám phá ngay
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/85">
              <Link href="/places" className="transition hover:text-amber-300">Khám phá địa điểm ↗</Link>
              <Link href="/routes" className="transition hover:text-amber-300">Tìm lộ trình ăn uống ↗</Link>
              <Link href="/register" className="transition hover:text-amber-300">Tham gia cộng đồng ↗</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 h-20 bg-gradient-to-t from-[#fffdfa] to-transparent" />
      </section>
      <div className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 lg:space-y-24 lg:py-20">
        <section>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="home-eyebrow">BẮT ĐẦU TỪ SỞ THÍCH</p>
              <h2 className="home-section-title">Khám phá theo khẩu vị</h2>
              <p className="mt-2 text-slate-500">Chọn một danh mục và tìm điểm dừng chân tiếp theo.</p>
            </div>
            <Link href="/places" className="home-text-link">Tất cả địa điểm <span aria-hidden="true">→</span></Link>
          </div>

          {loadingPlaces ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-orange-50" />)}
            </div>
          ) : categories.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map(([name], index) => (
                <Link
                  key={name}
                  href={`/places?search=${encodeURIComponent(name)}`}
                  className="group rounded-2xl border border-orange-100 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl transition group-hover:bg-orange-100">
                    {["🍜", "🍲", "☕", "🥐", "🍰", "🥗"][index % 6]}
                  </span>
                  <span className="block font-bold text-slate-800">{name}</span>
                  <span className="mt-1 block text-xs text-slate-500">Xem địa điểm <span aria-hidden="true">↗</span></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-7 text-center text-sm text-slate-500">
              Danh mục sẽ hiển thị khi cơ sở dữ liệu có địa điểm.
            </div>
          )}
        </section>

        <section>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="home-eyebrow">ĐƯỢC LẤY TỪ DỮ LIỆU THỰC</p>
              <h2 className="home-section-title">Điểm đến đáng khám phá</h2>
              <p className="mt-2 text-slate-500">Những địa điểm đang có trong hệ thống Food &amp; Travel.</p>
            </div>
            <Link href="/places" className="home-text-link">Khám phá tất cả <span aria-hidden="true">→</span></Link>
          </div>

          {loadingPlaces ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-3xl bg-orange-50" />)}
            </div>
          ) : featuredPlaces.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPlaces.map((place, index) => {
                const rating = ratingFor(place);
                return (
                  <Link
                    href={`/places/${place.id}`}
                    key={place.id}
                    className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="relative h-56 overflow-hidden bg-orange-50">
                      <img
                        src={imageFor(place, index)}
                        alt={place.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm">
                        {place.category_name || "Địa điểm ẩm thực"}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 transition group-hover:text-orange-600">{place.title}</h3>
                        {rating && <span className="shrink-0 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">★ {rating}</span>}
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                        {[place.address_detail || place.address, place.province_name].filter(Boolean).join(", ") || "Thông tin địa chỉ đang được cập nhật"}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                        <span className="font-semibold text-slate-600">Xem thông tin địa điểm</span>
                        <span className="font-bold text-orange-500 transition group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-8 text-center">
              <p className="font-semibold text-slate-700">Chưa có địa điểm để hiển thị</p>
              <p className="mt-1 text-sm text-slate-500">{error || "Khi có dữ liệu trong MySQL, các địa điểm sẽ tự động xuất hiện tại đây."}</p>
              <Link href="/places" className="mt-4 inline-flex font-bold text-orange-600 hover:underline">Mở danh sách địa điểm →</Link>
            </div>
          )}
          {error && featuredPlaces.length > 0 && <p className="mt-3 text-sm text-amber-700">{error}</p>}
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-[#172a25] text-white">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
              <p className="mb-3 text-xs font-extrabold tracking-[0.2em] text-amber-300">ĐI ĂN CÓ KẾ HOẠCH</p>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">Một buổi đi chơi, nhiều điểm ngon.</h2>
              <p className="mt-4 max-w-md leading-7 text-white/70">
                Khám phá gợi ý kết hợp địa điểm ăn chính và điểm cà phê hoặc tráng miệng từ dữ liệu địa điểm của hệ thống.
              </p>
              <Link href="/routes" className="mt-7 inline-flex w-fit items-center gap-3 rounded-xl bg-amber-300 px-5 py-3 font-extrabold text-slate-900 transition hover:bg-amber-200">
                Xem gợi ý lộ trình <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="relative min-h-[300px] overflow-hidden bg-[#263d35] p-6 sm:p-8">
              <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[36px] border-white/5" />
              {loadingRoutes ? (
                <div className="relative grid h-full gap-3">
                  <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ) : itineraries.length ? (
                <div className="relative space-y-3">
                  {itineraries.map((route, index) => (
                    <div key={route.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Gợi ý {index + 1}</span>
                        <span className="text-xs text-white/50">Lộ trình ăn uống</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-white/55">ĐIỂM DỪNG 01</p>
                          <p className="mt-1 line-clamp-2 text-sm font-bold">{route.main_food.title}</p>
                        </div>
                        <span className="text-amber-300">→</span>
                        <div className="min-w-0 text-right">
                          <p className="text-[11px] text-white/55">ĐIỂM DỪNG 02</p>
                          <p className="mt-1 line-clamp-2 text-sm font-bold">{route.dessert.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                  <span className="text-5xl">🥢</span>
                  <p className="mt-4 font-bold">Lộ trình tiếp theo đang chờ bạn</p>
                  <p className="mt-1 max-w-xs text-sm text-white/60">Mở trang lộ trình để xem các gợi ý hiện có theo khu vực.</p>
                  <Link href="/routes" className="mt-4 text-sm font-bold text-amber-300 hover:underline">Khám phá lộ trình →</Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-extrabold text-slate-800">Food <span className="text-orange-500">&amp;</span> Travel</span>
          <span>Khám phá ẩm thực · Kết nối hành trình</span>
          <div className="flex gap-5"><Link href="/places" className="hover:text-orange-600">Địa điểm</Link><Link href="/routes" className="hover:text-orange-600">Lộ trình</Link><Link href="/register" className="hover:text-orange-600">Đăng ký</Link></div>
        </div>
      </footer>
    </div>
  );
}
