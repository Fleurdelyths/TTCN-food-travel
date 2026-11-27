"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapStop } from "@/components/routes/RouteMap";

const RouteMap = dynamic(() => import("@/components/routes/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-sm text-slate-400">
      Đang tải bản đồ trực quan...
    </div>
  ),
});

type MealGroup = "MAIN" | "DESSERT" | "SNACK";

interface RoutePlace {
  id: number;
  title: string;
  address_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  avg_rating: number | string | null;
  category_id?: number | null;
  category_name: string | null;
  province_name: string | null;
  primary_image?: string | null;
  meal_group?: MealGroup;
  distance_km?: number;
}

interface SuggestResponse {
  anchor: RoutePlace;
  radius_km: number;
  recommended_order: MealGroup[];
  suggestions: Record<MealGroup, RoutePlace[]>;
}

const GROUP_LABELS: Record<MealGroup, { label: string; badge: string }> = {
  MAIN: { label: "Món chính", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  DESSERT: { label: "Tráng miệng & Cà phê", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  SNACK: { label: "Ăn vặt", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
};

function formatGoogleMapsStop(stop: MapStop): string {
  if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) {
    return `${stop.latitude},${stop.longitude}`;
  }
  return [stop.title, stop.address_detail].filter(Boolean).join(", ");
}

function buildGoogleMapsUrl(stops: MapStop[]): string | null {
  if (stops.length < 2) return null;
  const origin = formatGoogleMapsStop(stops[0]);
  const destination = formatGoogleMapsStop(stops[stops.length - 1]);
  const waypoints = stops.slice(1, -1).map(formatGoogleMapsStop).join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function RoutesPage() {
  const [allPlaces, setAllPlaces] = useState<RoutePlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);

  const [selectedStartId, setSelectedStartId] = useState<number | null>(null);
  const [suggestData, setSuggestData] = useState<SuggestResponse | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [activeGroup, setActiveGroup] = useState<MealGroup>("DESSERT");

  const [itineraryStops, setItineraryStops] = useState<RoutePlace[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/places")
      .then((res) => res.json())
      .then((result) => {
        if (!active || !result.success || !Array.isArray(result.data)) return;
        const validPlaces = (result.data as RoutePlace[]).filter(
          (p) => p.latitude !== null && p.longitude !== null,
        );
        setAllPlaces(validPlaces);

        const startParam = Number(
          new URLSearchParams(window.location.search).get("startId"),
        );
        const initialPlace =
          validPlaces.find((p) => p.id === startParam) || validPlaces[0];
        if (initialPlace) {
          setLoadingSuggest(true);
          setSelectedStartId(initialPlace.id);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingPlaces(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedStartId) return;
    let active = true;

    fetch(`/api/routes/suggest?placeId=${selectedStartId}&radiusKm=${radiusKm}`)
      .then(async (res) => ({ ok: res.ok, result: await res.json() }))
      .then(({ ok, result }) => {
        if (!active) return;
        if (!ok || !result.success) {
          setSuggestError(result.message || "Không thể tìm quán xung quanh.");
          setSuggestData(null);
          return;
        }
        const data: SuggestResponse = result.data;
        setSuggestError("");
        setSuggestData(data);
        setActiveGroup(data.recommended_order[0] || "DESSERT");
        setItineraryStops((prev) => {
          if (prev.length > 0 && prev[0].id === data.anchor.id) return prev;
          return [data.anchor];
        });
      })
      .catch(() => {
        if (active) setSuggestError("Lỗi kết nối khi tìm quán gần nhất.");
      })
      .finally(() => {
        if (active) setLoadingSuggest(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStartId, radiusKm]);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allPlaces;
    return allPlaces.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.address_detail || "").toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q),
    );
  }, [allPlaces, searchQuery]);

  const mapStops: MapStop[] = useMemo(
    () =>
      itineraryStops
        .filter((s) => s.latitude !== null && s.longitude !== null)
        .map((s) => ({
          id: s.id,
          title: s.title,
          address_detail: s.address_detail,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          meal_group: s.meal_group,
          distance_km: s.distance_km,
        })),
    [itineraryStops],
  );

  const googleMapsUrl = useMemo(() => buildGoogleMapsUrl(mapStops), [mapStops]);

  function handleSelectStart(place: RoutePlace) {
    setLoadingSuggest(true);
    setSuggestError("");
    setSelectedStartId(place.id);
    setItineraryStops([place]);
    setRouteInfo(null);
  }

  function toggleStop(place: RoutePlace) {
    setItineraryStops((prev) => {
      const exists = prev.some((item) => item.id === place.id);
      if (exists) {
        if (prev[0]?.id === place.id) return prev;
        return prev.filter((item) => item.id !== place.id);
      }
      return [...prev, place];
    });
  }

  const anchorGroup = suggestData?.anchor.meal_group || "MAIN";
  const orderedTabs = suggestData?.recommended_order || ["DESSERT", "SNACK", "MAIN"];
  const currentSuggestions = suggestData?.suggestions[activeGroup] || [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
              Workflow Gợi Ý Lộ Trình Thông Minh
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              Chọn Quán Gốc &amp; Khám Phá Điểm Dừng Gần Nhất
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Chọn quán muốn ăn trước, hệ thống tự tìm quán tráng miệng, ăn vặt hoặc món chính gần nhất xung quanh và vẽ đường đi trực quan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="radius" className="text-sm font-medium text-slate-300">
              Bán kính tìm:
            </label>
            <select
              id="radius"
              value={radiusKm}
              onChange={(e) => {
                if (selectedStartId) setLoadingSuggest(true);
                setRadiusKm(Number(e.target.value));
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột trái: Bước 1 & Bước 2 */}
          <div className="space-y-6 lg:col-span-5">
            {/* Bước 1 */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  1. Chọn quán muốn ăn đầu tiên
                </h2>
                <span className="text-xs text-slate-400">
                  {filteredPlaces.length} địa điểm
                </span>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên quán, địa chỉ, danh mục..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-orange-500"
              />

              {loadingPlaces ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Đang tải danh sách quán...
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredPlaces.map((place) => {
                    const isSelected = place.id === selectedStartId;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => handleSelectStart(place)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-white line-clamp-1">
                            {place.title}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-amber-400">
                            ★ {place.avg_rating ? Number(place.avg_rating).toFixed(1) : "0.0"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                          {place.category_name || "Ẩm thực"} · {place.address_detail || "Chưa có địa chỉ"}
                        </p>
                      </button>
                    );
                  })}
                  {filteredPlaces.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Không tìm thấy quán phù hợp.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Bước 2 */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-white">
                    2. Gợi ý quán gần nhất xung quanh
                  </h2>
                  {suggestData && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${GROUP_LABELS[anchorGroup].badge}`}
                    >
                      Quán gốc: {GROUP_LABELS[anchorGroup].label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Chọn thêm điểm dừng để nối vào lộ trình trên bản đồ.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {orderedTabs.map((group) => {
                  const count = suggestData?.suggestions[group]?.length ?? 0;
                  const active = activeGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setActiveGroup(group)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-orange-500 text-white"
                          : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {GROUP_LABELS[group].label} ({count})
                    </button>
                  );
                })}
              </div>

              {loadingSuggest ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Đang tìm các quán gần nhất...
                </div>
              ) : suggestError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {suggestError}
                </div>
              ) : currentSuggestions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
                  Không có quán {GROUP_LABELS[activeGroup].label.toLowerCase()} nào trong bán kính {radiusKm} km. Thử tăng bán kính lên nhé!
                </div>
              ) : (
                <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
                  {currentSuggestions.map((place) => {
                    const added = itineraryStops.some((s) => s.id === place.id);
                    return (
                      <div
                        key={place.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-white">
                              {place.title}
                            </span>
                            <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
                              {place.distance_km} km
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            ★ {place.avg_rating ? Number(place.avg_rating).toFixed(1) : "0.0"} · {place.address_detail}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStop(place)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            added
                              ? "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                              : "bg-orange-500 text-white hover:bg-orange-600"
                          }`}
                        >
                          {added ? "Bỏ chọn" : "+ Thêm"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Cột phải: Bước 3 - Bản đồ & Danh sách chặng */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    3. Bản đồ lộ trình trực quan ({itineraryStops.length} điểm)
                  </h2>
                  {routeInfo ? (
                    <p className="mt-0.5 text-xs text-emerald-400 font-medium">
                      Tổng quãng đường thực tế: ~{routeInfo.distanceKm} km · Di chuyển khoảng {routeInfo.durationMin} phút
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Chọn thêm ít nhất 1 quán ở Bước 2 để vẽ đường đi giữa các điểm.
                    </p>
                  )}
                </div>

                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                  >
                    Mở chỉ đường Google Maps ↗
                  </a>
                )}
              </div>

              <RouteMap stops={mapStops} onRouteInfo={setRouteInfo} />

              {/* Danh sách các chặng trong lộ trình */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thứ tự các chặng
                </h3>
                {itineraryStops.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có điểm nào trong lộ trình.</p>
                ) : (
                  <div className="space-y-2">
                    {itineraryStops.map((stop, idx) => (
                      <div
                        key={stop.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                              idx === 0 ? "bg-orange-600" : "bg-slate-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/places/${stop.id}`}
                              className="block truncate text-sm font-semibold text-white hover:text-orange-400"
                            >
                              {stop.title}
                            </Link>
                            <p className="truncate text-xs text-slate-400">
                              {stop.address_detail}
                              {stop.distance_km ? ` · Cách điểm gốc ${stop.distance_km} km` : " · Điểm xuất phát"}
                            </p>
                          </div>
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleStop(stop)}
                            className="shrink-0 text-xs font-medium text-slate-400 hover:text-red-400"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
