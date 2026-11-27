
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

// ==================== KHAI BÁO KIỂU DỮ LIỆU ====================

type Option = {
  id: number;
  name: string;
};

type BlogData = {
  title: string;
  excerpt: string;
  content: string;
  place_id: number;
  category_id: number | null;
  thumbnail: string | null;
  images: {
    image_url: string;
  }[];
};

// ==================== COMPONENT BLOG EDITOR ====================

export default function BlogEditor({ blogId }: { blogId?: string }) {
  const router = useRouter();

  // ==================== QUẢN LÝ STATE ====================

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [places, setPlaces] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  const [loading, setLoading] = useState(Boolean(blogId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ==================== TẢI DỮ LIỆU BAN ĐẦU ====================

  useEffect(() => {
    async function load() {
      try {
        const [placeRes, categoryRes] = await Promise.all([
          fetch("/api/places"),
          fetch("/api/blog-categories"),
        ]);

        const placeData = await placeRes.json();
        const categoryData = await categoryRes.json();

        if (placeData.success) {
          setPlaces(
            placeData.data.map((p: any) => ({
              id: Number(p.id),
              name: p.title,
            }))
          );
        }

        if (categoryData.success) {
          setCategories(categoryData.data);
        }

        // Nếu có blogId thì tải dữ liệu bài viết cần chỉnh sửa
        if (blogId) {
          const res = await fetch(`/api/blogs/${blogId}`);
          const data = await res.json();

          if (!data.success) {
            setMessage(data.message || "Không tải được bài viết.");
            return;
          }

          const b: BlogData = data.data;

          setTitle(b.title);
          setExcerpt(b.excerpt || "");
          setContent(b.content);
          setPlaceId(String(b.place_id));
          setCategoryId(
            b.category_id ? String(b.category_id) : ""
          );
          setThumbnail(b.thumbnail || "");

          setImages(
            (b.images || []).map((x) => x.image_url)
          );
        }
      } catch {
        setMessage("Không thể tải dữ liệu biểu mẫu.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [blogId]);

  // ==================== TẢI ẢNH LÊN MÁY CHỦ ====================

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/blogs/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Tải ảnh thất bại.");
    }

    return data.data.url as string;
  }

  // ==================== XỬ LÝ CHỌN NHIỀU ẢNH ====================

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    try {
      setMessage("Đang tải ảnh...");

      const urls: string[] = [];

      for (const file of files.slice(0, 10 - images.length)) {
        urls.push(await upload(file));
      }

      setImages((old) => [...old, ...urls]);

      if (!thumbnail && urls[0]) {
        setThumbnail(urls[0]);
      }

      setMessage("Đã tải ảnh lên.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải ảnh thất bại."
      );
    }

    event.target.value = "";
  }

  // ==================== XỬ LÝ LƯU BÀI VIẾT ====================

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: "draft" | "submit"
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const body = {
        title,
        excerpt,
        content,
        place_id: Number(placeId),
        category_id: categoryId ? Number(categoryId) : null,
        thumbnail: thumbnail || null,
        images,
        action,
      };

      const res = await fetch(
        blogId ? `/api/blogs/${blogId}` : "/api/blogs",
        {
          method: blogId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message || "Lưu bài viết thất bại.");
        return;
      }

      setMessage(data.message);

      router.push("/my-blogs");
      router.refresh();
    } catch {
      setMessage("Không thể kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  // ==================== TRẠNG THÁI ĐANG TẢI ====================

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Đang tải biểu mẫu...
      </div>
    );
  }

  // ==================== STYLE DÙNG CHUNG ====================

  const field =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  // ==================== GIAO DIỆN FORM ====================

  return (
    <form
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
      onSubmit={(e) => submit(e, "submit")}
    >
      {/* Tiêu đề bài viết */}
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Tiêu đề bài viết *
        </label>

        <input
          className={field}
          minLength={5}
          maxLength={200}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Một ngày khám phá ẩm thực Hội An"
        />
      </div>

      {/* Mô tả ngắn */}
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Mô tả ngắn
        </label>

        <textarea
          className={field}
          rows={2}
          maxLength={500}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Tóm tắt nội dung để hiển thị ở danh sách bài viết..."
        />
      </div>

      {/* Chọn địa điểm và danh mục */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Địa điểm được review *
          </label>

          <select
            className={field}
            required
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            <option value="">-- Chọn địa điểm --</option>

            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Danh mục
          </label>

          <select
            className={field}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">-- Chưa phân loại --</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Nội dung bài viết *
        </label>

        <textarea
          className={`${field} min-h-72 leading-7`}
          required
          minLength={30}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ trải nghiệm, món ăn, giá cả, không gian, dịch vụ và lời khuyên của bạn..."
        />

        <p className="mt-1 text-right text-xs text-gray-500">
          {content.length} ký tự
        </p>
      </div>

      {/* Tải ảnh bài viết */}
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Ảnh bài viết (tối đa 10 ảnh, mỗi ảnh 5MB)
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFiles}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:font-semibold file:text-orange-700"
        />

        {/* Danh sách ảnh đã tải lên */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Ảnh ${i + 1}`}
                  className="h-28 w-full rounded-lg object-cover"
                />

                {/* Nút xóa ảnh */}
                <button
                  type="button"
                  onClick={() => {
                    setImages((old) =>
                      old.filter((x) => x !== url)
                    );

                    if (thumbnail === url) {
                      setThumbnail("");
                    }
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
                >
                  Xóa
                </button>

                {/* Chọn ảnh đại diện */}
                <button
                  type="button"
                  onClick={() => setThumbnail(url)}
                  className={`mt-1 w-full rounded-md px-2 py-1 text-xs ${
                    thumbnail === url
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {thumbnail === url
                    ? "Ảnh đại diện"
                    : "Chọn làm ảnh đại diện"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thông báo */}
      {message && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
          {message}
        </p>
      )}

      {/* Các nút thao tác */}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <button
          type="button"
          disabled={saving}
          onClick={(e) =>
            submit(
              e as unknown as FormEvent<HTMLFormElement>,
              "draft"
            )
          }
          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Lưu bản nháp
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Gửi duyệt bài viết"}
        </button>
      </div>

      {/* Ghi chú */}
      <p className="text-xs leading-5 text-gray-500">
        Bài gửi duyệt sẽ ở trạng thái chờ quản trị viên xét duyệt
        trước khi hiển thị công khai.
      </p>
    </form>
  );
}
