
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Kiểu dữ liệu bài viết của người dùng
type Blog = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending" | "published" | "rejected";
  place_name: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  updated_at: string;
};

// Tên hiển thị tương ứng với từng trạng thái
const statusLabel: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đã đăng",
  rejected: "Bị từ chối",
};

export default function MyBlogsPage() {
  // Khởi tạo state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Tải danh sách bài viết của người dùng
  async function load() {
    try {
      const r = await fetch("/api/my-blogs");
      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message);
      }

      setBlogs(d.data);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Không thể tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }

  // Tải dữ liệu khi mở trang
  useEffect(() => {
    load();
  }, []);

  // Xóa bài viết
  async function remove(id: number) {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) {
      return;
    }

    const r = await fetch(`/api/blogs/${id}`, {
      method: "DELETE",
    });

    const d = await r.json();

    if (!r.ok) {
      setMessage(d.message);
      return;
    }

    // Cập nhật danh sách sau khi xóa
    setBlogs((old) => old.filter((b) => b.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Tiêu đề và nút viết bài mới */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            Bài viết của tôi
          </h1>

          <p className="mt-2 text-gray-500">
            Theo dõi và quản lý các bài review bạn đã tạo.
          </p>
        </div>

        <Link
          href="/blogs/create"
          className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
        >
          + Viết bài mới
        </Link>
      </div>

      {/* Thông báo */}
      {message && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
          {message}
        </p>
      )}

      {/* Hiển thị trạng thái tải dữ liệu */}
      {loading ? (
        <p className="py-16 text-center text-gray-500">
          Đang tải...
        </p>
      ) : blogs.length === 0 ? (
        // Hiển thị khi chưa có bài viết
        <div className="rounded-2xl border border-dashed bg-white py-16 text-center">
          <p className="font-semibold">
            Bạn chưa có bài viết nào.
          </p>

          <Link
            href="/blogs/create"
            className="mt-3 inline-block text-orange-600"
          >
            Bắt đầu viết bài →
          </Link>
        </div>
      ) : (
        // Danh sách bài viết của người dùng
        <div className="overflow-hidden rounded-2xl border bg-white">
          {blogs.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-4 border-b p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Thông tin bài viết */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">
                    {b.title}
                  </h2>

                  {/* Trạng thái bài viết */}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.status === "published"
                        ? "bg-green-50 text-green-700"
                        : b.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : b.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusLabel[b.status]}
                  </span>
                </div>

                {/* Địa điểm và lượt tương tác */}
                <p className="mt-1 text-sm text-gray-500">
                  📍 {b.place_name} · ♥ {b.like_count} · ◉{" "}
                  {b.view_count} · {b.comment_count} bình luận
                </p>

                {/* Thời gian cập nhật */}
                <p className="mt-1 text-xs text-gray-400">
                  Cập nhật:{" "}
                  {new Date(b.updated_at).toLocaleString("vi-VN")}
                </p>
              </div>

              {/* Các nút thao tác */}
              <div className="flex shrink-0 gap-2">
                {b.status === "published" && (
                  <Link
                    href={`/blogs/${b.slug}`}
                    className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    Xem
                  </Link>
                )}

                <Link
                  href={`/blogs/edit/${b.id}`}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Sửa
                </Link>

                <button
                  onClick={() => remove(b.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
