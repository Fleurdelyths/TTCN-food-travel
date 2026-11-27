
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Kiểu dữ liệu của bài viết Blog
type Blog = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  like_count: number;
  view_count: number;
  author_name: string;
  place_name: string;
};

// Các tab lọc trạng thái bài viết
const tabs = [
  { id: "all", name: "Tất cả" },
  { id: "pending", name: "Chờ duyệt" },
  { id: "published", name: "Đã đăng" },
  { id: "rejected", name: "Từ chối" },
  { id: "draft", name: "Nháp" },
];

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Lấy danh sách bài viết theo trạng thái
  async function load() {
    setLoading(true);

    try {
      const r = await fetch(`/api/admin/blogs?status=${tab}`);
      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message);
      }

      setBlogs(d.data);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Không thể tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }

  // Tải lại danh sách khi thay đổi tab
  useEffect(() => {
    let active = true;

    fetch(`/api/admin/blogs?status=${tab}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          throw new Error(d.message);
        }
        return d;
      })
      .then((d) => {
        if (active) {
          setBlogs(d.data);
        }
      })
      .catch((e) => {
        if (active) {
          setMessage(
            e instanceof Error ? e.message : "Không thể tải dữ liệu."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [tab]);

  // Cập nhật trạng thái bài viết
  async function update(id: number, status: string) {
    const r = await fetch("/api/admin/blogs", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        status,
      }),
    });

    const d = await r.json();

    if (!r.ok) {
      setMessage(d.message);
      return;
    }

    setMessage(d.message);
    load();
  }

  // Xóa bài viết
  async function remove(id: number) {
    if (!confirm("Xóa vĩnh viễn bài viết này?")) {
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

    load();
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-orange-600"
        >
          ← Quản trị
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          Quản lý bài viết Blog
        </h1>

        <p className="mt-2 text-gray-500">
          Duyệt nội dung trước khi công khai và kiểm soát bài viết trong cộng đồng.
        </p>
      </div>

      {/* Các tab lọc bài viết */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setLoading(true);
              setTab(t.id);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Thông báo */}
      {message && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
          {message}
        </p>
      )}

      {/* Nội dung danh sách bài viết */}
      {loading ? (
        <p className="py-12 text-center text-gray-500">
          Đang tải...
        </p>
      ) : blogs.length === 0 ? (
        <div className="rounded-xl border bg-white py-12 text-center text-gray-500">
          Không có bài viết trong mục này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            {/* Tiêu đề bảng */}
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">Bài viết</th>
                <th className="p-4">Tác giả</th>
                <th className="p-4">Địa điểm</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>

            {/* Danh sách bài viết */}
            <tbody>
              {blogs.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="max-w-xs p-4">
                    <Link
                      href={`/blogs/${b.id}`}
                      className="font-semibold hover:text-orange-600"
                    >
                      {b.title}
                    </Link>

                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(b.created_at).toLocaleString("vi-VN")}
                      {" · "}♥ {b.like_count}
                      {" · "}◉ {b.view_count}
                    </p>
                  </td>

                  <td className="p-4">
                    {b.author_name}
                  </td>

                  <td className="p-4">
                    {b.place_name}
                  </td>

                  <td className="p-4">
                    {b.status}
                  </td>

                  {/* Các nút xử lý bài viết */}
                  <td className="p-4">
                    <div className="flex gap-2">
                      {b.status !== "published" && (
                        <button
                          onClick={() => update(b.id, "published")}
                          className="rounded-md bg-green-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Duyệt
                        </button>
                      )}

                      {b.status !== "rejected" && (
                        <button
                          onClick={() => update(b.id, "rejected")}
                          className="rounded-md bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800"
                        >
                          Từ chối
                        </button>
                      )}

                      <button
                        onClick={() => remove(b.id)}
                        className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
