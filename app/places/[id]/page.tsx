"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface PlaceDetail {
  id: number;
  title: string;
  address_detail: string;
  price_min: number;
  price_max: number;
  avg_rating: number;
  category_name: string;
  province_name: string;
  district_name?: string;
  description?: string;
  opening_hours?: string;
  phone_number?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const placeId = resolvedParams.id;

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/places/${placeId}`);
        const data = await res.json();
        if (data.success) {
          setPlace(data.data);
          if (data.data.images && data.data.images.length > 0) {
            setSelectedImage(data.data.images[0].image_url);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [placeId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Đang tải thông tin địa điểm...
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500 text-lg">
          Không tìm thấy thông tin địa điểm này.
        </p>
        <Link href="/places" className="text-orange-500 hover:underline">
          &larr; Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Link
        href="/places"
        className="inline-flex items-center text-sm text-gray-600 hover:text-orange-500 font-medium"
      >
        &larr; Trở lại danh sách địa điểm
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
            {place.category_name}
          </span>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            ⭐ {place.avg_rating || "N/A"}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{place.title}</h1>
        <p className="text-gray-600">
          📍 {place.address_detail},{" "}
          {place.district_name ? `${place.district_name}, ` : ""}
          {place.province_name}
        </p>
      </div>

      <div className="space-y-4">
        <div className="h-96 w-full bg-gray-100 rounded-2xl overflow-hidden border">
          <img
            src={
              selectedImage ||
              "https://via.placeholder.com/800x400?text=No+Image"
            }
            alt={place.title}
            className="w-full h-full object-cover"
          />
        </div>

        {place.images && place.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {place.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img.image_url)}
                className={`w-24 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  selectedImage === img.image_url
                    ? "border-orange-500 scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img.image_url}
                  alt="sub"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Mô tả địa điểm
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {place.description ||
                "Chưa có thông tin mô tả chi tiết cho địa điểm này."}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border space-y-4 h-fit">
          <h3 className="font-bold text-gray-800 border-b pb-2">
            Thông tin liên hệ & Giá
          </h3>

          <div>
            <span className="text-xs text-gray-400 block uppercase">
              Khoảng giá
            </span>
            <span className="text-lg font-bold text-orange-600">
              {place.price_min?.toLocaleString("vi-VN")} -{" "}
              {place.price_max?.toLocaleString("vi-VN")} VNĐ
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase">
              Giờ mở cửa
            </span>
            <span className="text-sm font-medium text-gray-700">
              {place.opening_hours || "Chưa cập nhật"}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase">
              Số điện thoại
            </span>
            <span className="text-sm font-medium text-gray-700">
              {place.phone_number || "Chưa cập nhật"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
