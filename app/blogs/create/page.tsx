import Link from "next/link";
import BlogEditor from "@/components/BlogEditor";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function CreateBlogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href="/blogs" className="text-sm font-medium text-orange-600 hover:underline">← Quay lại Blog</Link><h1 className="mt-3 text-3xl font-bold text-gray-900">Viết bài review</h1><p className="mt-2 text-gray-500">Chia sẻ trải nghiệm ẩm thực và địa điểm bạn đã khám phá.</p></div><BlogEditor /></div>;
}
