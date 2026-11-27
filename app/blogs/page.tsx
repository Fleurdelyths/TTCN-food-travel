
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

// Kiểu dữ liệu bài viết
type Blog = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  like_count: number;
  view_count: number;
  comment_count: number;
  author_name: string;
  author_avatar: string | null;
  place_name: string;
  category_name: string | null;
  created_at: string;
};

// Kiểu dữ liệu danh mục
type Category = {
  id: number;
  name: string;
};

export default function BlogsPage() {
  // Danh sách bài viết
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // Danh sách danh mục
  const [categories, setCategories] = useState<Category[]>([]);

  // Từ khóa đang nhập
  const [search, setSearch] = useState("");

  // Từ khóa dùng để tìm kiếm sau 400ms
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Danh mục đang chọn
  const [category, setCategory] = useState("");

  // Trang hiện tại và tổng số trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Thông báo lỗi
  const [error, setError] = useState("");

  // ==========================================
  // 1. TẢI DANH MỤC
  // ==========================================
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/blog-categories");
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Không thể tải danh mục.");
        }

        setCategories(data.data);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    }

    loadCategories();
  }, []);

  // ==========================================
  // 2. CHỜ 400MS SAU KHI NGƯỜI DÙNG NGỪNG GÕ
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // ==========================================
  // 3. TẢI DANH SÁCH BÀI VIẾT
  // ==========================================
  useEffect(() => {
    const controller = new AbortController();

    async function loadBlogs() {
      setIsFetching(true);
      setError("");

      try {
        // Tạo tham số gửi lên API
        const params = new URLSearchParams({
          page: String(page),
          limit: "9",
        });

        // Thêm từ khóa tìm kiếm
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        // Thêm danh mục
        if (category) {
          params.set("category_id", category);
        }

        // Gọi API bài viết
        const res = await fetch(`/api/blogs?${params.toString()}`, {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Không thể tải bài viết.");
        }

        // Cập nhật danh sách bài viết
        setBlogs(data.data);

        // Cập nhật tổng số trang
        setTotalPages(data.pagination.totalPages || 1);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải bài viết."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    }

    loadBlogs();

    // Hủy request cũ khi điều kiện tìm kiếm thay đổi
    return () => {
      controller.abort();
    };
  }, [page, debouncedSearch, category]);

  // ==========================================
  // 4. XỬ LÝ TÌM KIẾM
  // ==========================================
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setPage(1);
    setDebouncedSearch(search.trim());
  }

  // ==========================================
  // 5. XỬ LÝ CHỌN DANH MỤC
  // ==========================================
  function handleCategoryChange(categoryId: string) {
    setCategory(categoryId);
    setPage(1);
  }

  // ==========================================
  // 6. XÓA BỘ LỌC
  // ==========================================
  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setPage(1);
  }

  // ==========================================
  // 7. GIAO DIỆN
  // ==========================================
  return (
    <div className="space-y-8">

      {/* BANNER GIỚI THIỆU */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-52 w-52 rounded-full bg-yellow-200/20 blur-3xl" />

        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-orange-100">
            Food & Travel Stories
          </p>

          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold sm:text-5xl">
            Chuyện ăn ngon, trải nghiệm thật.
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-orange-50">
            Đọc review từ cộng đồng, khám phá những quán ăn và hành trình đáng nhớ.
          </p>

          <Link
            href="/blogs/create"
            className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-orange-600 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-orange-50 hover:shadow-lg"
          >
            + Chia sẻ trải nghiệm
          </Link>
        </div>
      </section>

      {/* KHU VỰC DANH SÁCH BÀI VIẾT */}
      <section className="space-y-6">

        {/* TIÊU ĐỀ VÀ TÌM KIẾM */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Bài viết cộng đồng
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Những trải nghiệm được chia sẻ bởi thành viên Food & Travel.
            </p>
          </div>

          {/* FORM TÌM KIẾM */}
          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 md:max-w-md"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài viết, địa điểm..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none transition duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  title="Xóa từ khóa"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-5 font-semibold text-white transition duration-200 hover:bg-orange-600 active:scale-95"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* BỘ LỌC DANH MỤC */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
              !category
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            Tất cả
          </button>

          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => handleCategoryChange(String(c.id))}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
                category === String(c.id)
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* TRẠNG THÁI ĐANG TẢI */}
        {isFetching && !loading && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            Đang cập nhật bài viết...
          </div>
        )}

        {/* THÔNG BÁO LỖI */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">
              Không thể tải danh sách bài viết
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* SKELETON KHI TẢI LẦN ĐẦU */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="h-52 animate-pulse bg-gray-200" />

                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KHÔNG TÌM THẤY BÀI VIẾT */}
        {!loading && !error && blogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <div className="text-5xl">
              🔎
            </div>

            <p className="mt-4 text-lg font-semibold text-gray-800">
              Chưa tìm thấy bài viết phù hợp
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Hãy thử từ khóa khác hoặc là người đầu tiên chia sẻ trải nghiệm.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* DANH SÁCH BÀI VIẾT */}
        {!loading && !error && blogs.length > 0 && (
          <>
            <div
              className={`grid gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {blogs.map((b) => (
                <article
                  key={b.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* ẢNH BÀI VIẾT */}
                  <Link href={`/blogs/${b.slug}`}>
                    <div className="h-52 overflow-hidden bg-gray-100">
                      {b.thumbnail ? (
                        <img
                          src={b.thumbnail}
                          alt={b.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          🍜
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* THÔNG TIN BÀI VIẾT */}
                  <div className="space-y-3 p-5">
                    {b.category_name && (
                      <span className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                        {b.category_name}
                      </span>
                    )}

                    <Link href={`/blogs/${b.slug}`}>
                      <h3 className="line-clamp-2 text-lg font-bold leading-7 transition duration-200 hover:text-orange-600">
                        {b.title}
                      </h3>
                    </Link>

                    <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-600">
                      {b.excerpt}
                    </p>

                    <p className="text-xs text-gray-500">
                      📍 {b.place_name}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span className="max-w-[45%] truncate">
                        {b.author_name}
                      </span>

                      <span>
                        ♡ {b.like_count}　◉ {b.view_count}　▤ {b.comment_count}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border bg-white px-4 py-2 transition hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>

                <span className="text-sm font-medium text-gray-600">
                  Trang {page}/{totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border bg-white px-4 py-2 transition hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}

      </section>
    </div>
  );
}
