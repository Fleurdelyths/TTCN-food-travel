import BlogsClient from "./BlogsClient";
import { getBlogCategories, getPublishedBlogs } from "@/lib/blogs";

export const dynamic = "force-dynamic";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category_id?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const initialSearch = (params.search || "").trim();
  const rawCategory = (params.category_id || "").trim();
  const parsedCategoryId = Number(rawCategory || 0);
  const initialCategory =
    Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
      ? String(parsedCategoryId)
      : "";
  const initialPage = Math.max(1, Number(params.page || 1) || 1);

  const [categories, blogResult] = await Promise.all([
    getBlogCategories(),
    getPublishedBlogs({
      search: initialSearch,
      categoryId: parsedCategoryId > 0 ? parsedCategoryId : 0,
      page: initialPage,
      limit: 9,
    }),
  ]);

  return (
    <BlogsClient
      initialBlogs={blogResult.data}
      initialCategories={categories}
      initialTotal={blogResult.pagination.total}
      initialTotalPages={blogResult.pagination.totalPages}
      initialSearch={initialSearch}
      initialCategory={initialCategory}
      initialPage={initialPage}
    />
  );
}
