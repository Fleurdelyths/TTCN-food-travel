import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

export type BlogListItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  like_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  published_at: string | null;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  place_id: number;
  place_name: string;
  category_id: number | null;
  category_name: string | null;
};

export type BlogCategory = {
  id: number;
  name: string;
};

export type BlogListResult = {
  data: BlogListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name FROM categories ORDER BY name"
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
  }));
}

export async function getPublishedBlogs(options?: {
  search?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
}): Promise<BlogListResult> {
  const search = (options?.search || "").trim();
  const keywords = search.split(/\s+/).filter((word) => word.length > 0);
  const categoryId = Number(options?.categoryId || 0);
  const page = Math.max(1, Number(options?.page || 1) || 1);
  const limit = Math.min(18, Math.max(1, Number(options?.limit || 9) || 9));
  const offset = (page - 1) * limit;

  // Fallback về category của địa điểm khi bài viết chưa gán category_id riêng
  const effectiveCategoryExpr = "COALESCE(b.category_id, p.category_id)";

  const where: string[] = ["b.status = 'published'"];
  const params: (string | number)[] = [];

  if (categoryId > 0) {
    where.push(`${effectiveCategoryExpr} = ?`);
    params.push(categoryId);
  }

  for (const word of keywords) {
    where.push(`
      (
        b.title LIKE ?
        OR b.excerpt LIKE ?
        OR b.content LIKE ?
        OR p.name LIKE ?
        OR p.address LIKE ?
        OR c.name LIKE ?
        OR u.name LIKE ?
      )
    `);
    const keyword = `%${escapeLike(word)}%`;
    params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword);
  }

  const whereSql = where.join(" AND ");
  const needsExtraJoinsInCount = keywords.length > 0;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM blogs b
    JOIN places p ON p.id = b.place_id
    ${needsExtraJoinsInCount ? "JOIN users u ON u.id = b.user_id" : ""}
    ${needsExtraJoinsInCount ? `LEFT JOIN categories c ON c.id = ${effectiveCategoryExpr}` : ""}
    WHERE ${whereSql}
  `;

  const dataSql = `
    SELECT
      b.id,
      b.title,
      b.slug,
      b.excerpt,
      b.thumbnail,
      b.like_count,
      b.view_count,
      b.created_at,
      b.published_at,

      u.id AS author_id,
      u.name AS author_name,
      u.avatar AS author_avatar,

      p.id AS place_id,
      p.name AS place_name,

      c.id AS category_id,
      c.name AS category_name,

      COALESCE(cm.comment_count, 0) AS comment_count

    FROM blogs b
    JOIN users u ON u.id = b.user_id
    JOIN places p ON p.id = b.place_id
    LEFT JOIN categories c ON c.id = ${effectiveCategoryExpr}
    LEFT JOIN (
      SELECT blog_id, COUNT(*) AS comment_count
      FROM blog_comments
      WHERE status = 'visible'
      GROUP BY blog_id
    ) cm ON cm.blog_id = b.id

    WHERE ${whereSql}

    ORDER BY
      COALESCE(b.published_at, b.created_at) DESC

    LIMIT ? OFFSET ?
  `;

  const [[countRows], [rows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(countSql, params),
    pool.query<RowDataPacket[]>(dataSql, [...params, limit, offset]),
  ]);

  const total = Number(countRows[0]?.total || 0);

  const data: BlogListItem[] = rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt || ""),
    thumbnail: row.thumbnail ? String(row.thumbnail) : null,
    like_count: Number(row.like_count || 0),
    view_count: Number(row.view_count || 0),
    comment_count: Number(row.comment_count || 0),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    published_at: row.published_at
      ? row.published_at instanceof Date
        ? row.published_at.toISOString()
        : String(row.published_at)
      : null,
    author_id: Number(row.author_id),
    author_name: String(row.author_name),
    author_avatar: row.author_avatar ? String(row.author_avatar) : null,
    place_id: Number(row.place_id),
    place_name: String(row.place_name),
    category_id: row.category_id ? Number(row.category_id) : null,
    category_name: row.category_name ? String(row.category_name) : null,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
