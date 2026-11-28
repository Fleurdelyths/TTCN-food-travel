"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { BlogCategory, BlogListItem } from "@/lib/blogs";

interface BlogsClientProps {
  initialBlogs: BlogListItem[];
  initialCategories: BlogCategory[];
  initialTotal: number;
  initialTotalPages: number;
  initialSearch: string;
  initialCategory: string;
  initialPage: number;
}

export default function BlogsClient({
  initialBlogs,
  initialCategories,
  initialTotal,
  initialTotalPages,
  initialSearch,
  initialCategory,
  initialPage,
}: BlogsClientProps) {
  const [blogs, setBlogs] = useState<BlogListItem[]>(initialBlogs);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.max(1, initialTotalPages));

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");

  // Bỏ qua lần fetch đầu tiên vì dữ liệu đã được render sẵn từ server
  const lastFetchedKey = useRef(
    `${initialSearch}|${initialCategory}|${initialPage}`
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce từ khóa tìm kiếm (350ms)
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === debouncedSearch) {
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, debouncedSearch]);

  // Đồng bộ URL và tải danh sách bài viết khi bộ lọc/trang thay đổi
  useEffect(() => {
    const currentKey = `${debouncedSearch}|${category}|${page}`;
    if (currentKey === lastFetchedKey.current) {
      return;
    }

    const urlParams = new URLSearchParams();
    if (debouncedSearch) urlParams.set("search", debouncedSearch);
    if (category) urlParams.set("category_id", category);
    if (page > 1) urlParams.set("page", String(page));

    const queryStr = urlParams.toString();
    window.history.replaceState(
      null,
      "",
      queryStr ? `/blogs?${queryStr}` : "/blogs"
    );

    const controller = new AbortController();

    async function loadBlogs() {
      setIsFetching(true);
      setError("");

      try {
        const apiParams = new URLSearchParams({
          page: String(page),
          limit: "9",
        });
        if (debouncedSearch) apiParams.set("search", debouncedSearch);
        if (category) apiParams.set("category_id", category);

        const res = await fetch(`/api/blogs?${apiParams.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Không thể tải bài viết.");
        }

        lastFetchedKey.current = currentKey;
        setBlogs(data.data);
        setTotal(Number(data.pagination?.total || 0));
        setTotalPages(Math.max(1, Number(data.pagination?.totalPages || 1)));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Không thể tải bài viết."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    }

    loadBlogs();

    return () => {
      controller.abort();
    };
  }, [page, debouncedSearch, category]);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setPage(1);
    setDebouncedSearch(search.trim());
  }

  function handleClearSearch() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  function handleCategoryChange(categoryId: string) {
    setCategory(categoryId);
    setPage(1);
  }

  function clearFilters() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setPage(1);
  }

  return (
    <div className="min-h-screen w-full pb-16 bg-linear-to-b from-[#090d16] via-[#4c1d95] to-[#831843] text-slate-100">
      {/* BANNER ĐỒNG BỘ VỚI HEADER BANNER DỰ ÁN */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-12 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Food &amp; Travel Stories
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Khám Phá Blog Ẩm Thực &amp; Du Lịch 🍜✍️
            </h1>
            <p className="text-slate-200 text-sm md:text-base max-w-2xl">
              Đọc review chân thực từ cộng đồng, khám phá những quán ăn ngon và hành trình đáng nhớ.
            </p>
          </div>

          <Link
            href="/blogs/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-orange-600 shrink-0 self-start md:self-auto"
          >
            + Chia sẻ trải nghiệm
          </Link>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* THANH TÌM KIẾM VÀ BỘ LỌC DANH MỤC */}
        <div className="bg-slate-900/95 rounded-2xl shadow-xl p-5 border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                Bài Viết Cộng Đồng ({total})
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Tìm kiếm theo tiêu đề, nội dung, tên quán, tác giả hoặc lọc theo chuyên mục
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex gap-2 w-full md:w-auto"
            >
              <div className="relative flex-1 md:w-80">
                <span
                  className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                >
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Tìm bài viết, quán ăn, tác giả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-400 text-sm"
                />

                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-xs"
                    title="Xóa từ khóa"
                    aria-label="Xóa từ khóa"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 font-semibold text-sm shadow-md shrink-0 transition-colors"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* BỘ LỌC THEO DANH MỤC */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => handleCategoryChange("")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                !category
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-orange-500/50 hover:text-orange-400"
              }`}
            >
              Tất cả
            </button>

            {initialCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => handleCategoryChange(String(c.id))}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  category === String(c.id)
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-orange-500/50 hover:text-orange-400"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* TRẠNG THÁI ĐANG CẬP NHẬT */}
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-orange-400 font-medium">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            Đang cập nhật bài viết...
          </div>
        )}

        {/* THÔNG BÁO LỖI */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/60 p-5 text-red-200">
            <p className="font-semibold">Không thể tải danh sách bài viết</p>
            <p className="mt-1 text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* KHÔNG TÌM THẤY BÀI VIẾT */}
        {!error && blogs.length === 0 && (
          <div className="text-center py-16 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <div className="text-4xl">🔎</div>
            <p className="text-slate-200 font-semibold text-base">
              Chưa tìm thấy bài viết phù hợp
            </p>
            <p className="text-slate-400 text-sm">
              Hãy thử từ khóa khác, chọn danh mục khác hoặc là người đầu tiên chia sẻ trải nghiệm.
            </p>
            {(debouncedSearch || category) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 inline-flex rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* DANH SÁCH BÀI VIẾT */}
        {!error && blogs.length > 0 && (
          <>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {blogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/blogs/${b.slug}`}
                  className="group flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:border-orange-500/50"
                >
                  {/* ẢNH BÀI VIẾT */}
                  <div className="h-48 w-full bg-slate-800 overflow-hidden relative shrink-0">
                    {b.thumbnail ? (
                      <img
                        src={b.thumbnail}
                        alt={b.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl bg-slate-800">
                        🍜
                      </div>
                    )}

                    {b.category_name && (
                      <span className="absolute top-3 left-3 bg-slate-950/90 text-orange-400 border border-slate-700/80 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {b.category_name}
                      </span>
                    )}

                    <span className="absolute bottom-2.5 left-3 text-slate-100 text-[11px] font-medium bg-slate-950/85 px-2 py-0.5 rounded-md max-w-[85%] truncate">
                      📍 {b.place_name}
                    </span>
                  </div>

                  {/* THÔNG TIN BÀI VIẾT */}
                  <div className="p-4 flex flex-col flex-grow justify-between gap-3 bg-slate-900">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-2">
                        {b.title}
                      </h3>

                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {b.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs text-slate-400">
                      <span className="max-w-[50%] truncate font-medium text-slate-300">
                        ✍️ {b.author_name}
                      </span>

                      <span className="flex items-center gap-2.5 tabular-nums">
                        <span>♡ {b.like_count}</span>
                        <span>👁 {b.view_count}</span>
                        <span>💬 {b.comment_count}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>

                <span className="text-sm font-medium text-slate-300">
                  Trang {page}/{totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
