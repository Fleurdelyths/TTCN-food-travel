
"use client";

import Link from "next/link";
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

// ==================== KIỂU DỮ LIỆU BÌNH LUẬN ====================

type Comment = {
  id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
};

// ==================== KIỂU DỮ LIỆU BÀI VIẾT BLOG ====================

type Blog = {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string | null;
  like_count: number;
  view_count: number;
  status: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  place_id: number;
  place_name: string;
  place_address: string;
  category_name: string | null;
  images: {
    id: number;
    image_url: string;
  }[];
  liked: boolean;
  is_owner: boolean;
  related: {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
  }[];
};

// ==================== COMPONENT TRANG CHI TIẾT BLOG ====================

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const loadedBlogId = useRef<string | null>(null);

  // ==================== KHỞI TẠO STATE ====================

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [user, setUser] = useState<{
    id: number;
    name: string;
    role: "USER" | "ADMIN";
  } | null>(null);

  const [content, setContent] = useState("");
  const [replyId, setReplyId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // ==================== TẢI DANH SÁCH BÌNH LUẬN ====================

  const loadComments = useCallback(async (blogId: number) => {
    const r = await fetch(`/api/blogs/${blogId}/comments`);
    const d = await r.json();

    if (d.success) {
      setComments(d.data);
    }
  }, []);

  // ==================== TẢI THÔNG TIN BÀI VIẾT ====================

  useEffect(() => {
  if (loadedBlogId.current === id) return;

  loadedBlogId.current = id;

  async function load() {
    try {
      const [r, me] = await Promise.all([
        fetch(`/api/blogs/${id}`),
        fetch("/api/auth/me"),
      ]);

      const d = await r.json();
      const m = await me.json();

      if (d.success) {
        setBlog(d.data);
        await loadComments(Number(d.data.id));
      } else {
        setMessage(d.message);
      }

      setUser(m?.data?.user || null);
    } catch {
      setMessage("Không thể tải bài viết.");
    } finally {
      setLoading(false);
    }
  }

  load();
}, [id, loadComments]);

  // ==================== THÍCH HOẶC BỎ THÍCH BÀI VIẾT ====================

  async function toggleLike() {
    if (!user) {
      setMessage("Vui lòng đăng nhập để thích bài viết.");
      return;
    }

    if (!blog) return;

    setBusy(true);

    try {
      const r = await fetch(`/api/blogs/${blog.id}/like`, {
        method: "POST",
      });

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message);
      }

      setBlog({
        ...blog,
        liked: d.data.liked,
        like_count: d.data.like_count,
      });
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Không thể thích bài viết."
      );
    } finally {
      setBusy(false);
    }
  }

  // ==================== XÓA HOẶC ẨN BÌNH LUẬN ====================

  async function removeComment(commentId: number) {
    if (!confirm("Bạn có muốn ẩn bình luận này?")) {
      return;
    }

    try {
      const r = await fetch(
        `/api/blogs/${id}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message);
      }

      // Tải lại danh sách bình luận sau khi xóa
      if (blog) {
        await loadComments(blog.id);
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Không thể xóa bình luận."
      );
    }
  }

  // ==================== GỬI BÌNH LUẬN HOẶC TRẢ LỜI ====================

  async function submitComment(e: FormEvent) {
    e.preventDefault();

    if (!content.trim()) return;

    if (!user) {
      setMessage("Vui lòng đăng nhập để bình luận.");
      return;
    }

    if (!blog) return;

    setBusy(true);

    try {
      const r = await fetch(`/api/blogs/${blog.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          parent_id: replyId,
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.message);
      }

      setContent("");
      setReplyId(null);

      // Tải lại danh sách bình luận sau khi gửi
      await loadComments(blog.id);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Gửi bình luận thất bại."
      );
    } finally {
      setBusy(false);
    }
  }

  // ==================== HIỂN THỊ KHI ĐANG TẢI ====================

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        Đang tải bài viết...
      </div>
    );
  }

  // ==================== HIỂN THỊ KHI KHÔNG TÌM THẤY BÀI VIẾT ====================

  if (!blog) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">
          {message || "Không tìm thấy bài viết."}
        </p>

        <Link
          href="/blogs"
          className="mt-4 inline-block text-orange-600"
        >
          ← Quay lại Blog
        </Link>
      </div>
    );
  }

  // ==================== LỌC BÌNH LUẬN GỐC VÀ BÌNH LUẬN TRẢ LỜI ====================

  const roots = comments.filter((c) => !c.parent_id);

  const replies = (parent: number) =>
    comments.filter((c) => c.parent_id === parent);

  // ==================== GIAO DIỆN CHI TIẾT BÀI VIẾT ====================

  return (
    <article className="mx-auto max-w-4xl space-y-8">

      {/* Thanh điều hướng và chỉnh sửa bài viết */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/blogs"
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          ← Tất cả bài viết
        </Link>

        {blog.is_owner && (
          <Link
            href={`/blogs/edit/${blog.id}`}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Chỉnh sửa bài viết
          </Link>
        )}
      </div>

      {/* Tiêu đề và thông tin tác giả */}
      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {blog.category_name && (
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              {blog.category_name}
            </span>
          )}

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            Review địa điểm
          </span>
        </div>

        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
          {blog.title}
        </h1>

        <p className="text-lg leading-8 text-gray-600">
          {blog.excerpt}
        </p>

        {/* Thông tin người đăng */}
        <div className="flex flex-wrap items-center gap-3 border-y border-gray-200 py-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-100 font-bold text-orange-700">
            {blog.author_avatar ? (
              <img
                src={blog.author_avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              blog.author_name.slice(0, 1)
            )}
          </div>

          <div>
            <p className="text-sm font-semibold">
              {blog.author_name}
            </p>

            <p className="text-xs text-gray-500">
              {new Date(blog.created_at).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <span className="ml-auto text-sm text-gray-500">
            ◉ {blog.view_count} lượt xem
          </span>
        </div>
      </header>

      {/* Ảnh đại diện bài viết */}
      {blog.thumbnail && (
        <img
          src={blog.thumbnail}
          alt={blog.title}
          className="max-h-[520px] w-full rounded-2xl object-cover"
        />
      )}

      {/* Nội dung bài viết */}
      <section className="prose prose-lg max-w-none whitespace-pre-wrap break-words leading-8 text-gray-800">
        {blog.content}
      </section>

      {/* Bộ sưu tập hình ảnh */}
      {blog.images?.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {blog.images.map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt="Ảnh trong bài viết"
              className="max-h-96 w-full rounded-xl object-cover"
            />
          ))}
        </section>
      )}

      {/* Địa điểm được review */}
      <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Địa điểm được review
        </p>

        <Link
          href={`/places/${blog.place_id}`}
          className="mt-1 block text-lg font-bold text-gray-900 hover:text-orange-600"
        >
          📍 {blog.place_name}
        </Link>

        <p className="mt-1 text-sm text-gray-600">
          {blog.place_address}
        </p>

        <Link
          href={`/places/${blog.place_id}`}
          className="mt-3 inline-block text-sm font-semibold text-orange-700"
        >
          Xem thông tin địa điểm →
        </Link>
      </section>

      {/* Thích bài viết và số lượng bình luận */}
      <div className="flex flex-wrap items-center gap-3 border-y py-4">
        <button
          disabled={busy}
          onClick={toggleLike}
          className={`rounded-xl px-5 py-3 font-semibold ${
            blog.liked
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-orange-50"
          }`}
        >
          {blog.liked ? "♥ Đã thích" : "♡ Thích bài viết"} ·{" "}
          {blog.like_count}
        </button>

        <span className="text-sm text-gray-500">
          {comments.length} bình luận
        </span>
      </div>

      {/* Thông báo */}
      {message && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
          {message}
        </p>
      )}

      {/* ==================== KHU VỰC BÌNH LUẬN ==================== */}

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">
            Bình luận
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Chia sẻ ý kiến lịch sự và hữu ích với cộng đồng.
          </p>
        </div>

        {/* Form viết bình luận */}
        <form
          onSubmit={submitComment}
          className="space-y-3 rounded-2xl border bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">
              {replyId
                ? "Trả lời bình luận"
                : "Viết bình luận"}
            </label>

            {replyId && (
              <button
                type="button"
                onClick={() => setReplyId(null)}
                className="text-xs text-gray-500 underline"
              >
                Hủy trả lời
              </button>
            )}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Bạn nghĩ gì về trải nghiệm này?"
            className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-orange-500"
          />

          <div className="flex justify-end">
            <button
              disabled={busy || content.trim().length < 2}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Gửi bình luận
            </button>
          </div>
        </form>

        {/* Danh sách bình luận */}
        <div className="space-y-5">
          {roots.length === 0 ? (
            <p className="py-5 text-center text-sm text-gray-500">
              Chưa có bình luận. Hãy là người đầu tiên!
            </p>
          ) : (
            roots.map((c) => (
              <div key={c.id} className="space-y-3">

                {/* Bình luận gốc */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {c.user_name}
                    </p>

                    <time className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString("vi-VN")}
                    </time>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {c.content}
                  </p>

                  <div className="mt-2 flex gap-4">
                    {/* Nút trả lời */}
                    <button
                      onClick={() => {
                        setReplyId(c.id);
                        setContent("");

                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }}
                      className="text-xs font-semibold text-orange-600"
                    >
                      Trả lời
                    </button>

                    {/* Nút xóa bình luận */}
                    {(user?.id === c.user_id ||
                      user?.role === "ADMIN") && (
                      <button
                        onClick={() => removeComment(c.id)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                {/* Các bình luận trả lời */}
                {replies(c.id).map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-6 rounded-xl border border-orange-100 p-4 sm:ml-10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {reply.user_name}
                      </p>

                      <time className="text-xs text-gray-400">
                        {new Date(reply.created_at).toLocaleString("vi-VN")}
                      </time>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {reply.content}
                    </p>

                    {/* Nút xóa bình luận trả lời */}
                    {(user?.id === reply.user_id ||
                      user?.role === "ADMIN") && (
                      <button
                        onClick={() => removeComment(reply.id)}
                        className="mt-2 text-xs font-semibold text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ==================== CÁC BÀI VIẾT LIÊN QUAN ==================== */}

      {blog.related?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            Bài viết cùng địa điểm
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {blog.related.map((r) => (
              <Link
                key={r.id}
                href={`/blogs/${r.slug}`}
                className="rounded-xl border bg-white p-3 font-semibold hover:border-orange-300 hover:text-orange-600"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
