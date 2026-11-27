import Link from "next/link";
import BlogEditor from "@/components/BlogEditor";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function EditBlogPage({params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) redirect("/login"); const {id}=await params;
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href="/my-blogs" className="text-sm font-medium text-orange-600 hover:underline">← Bài viết của tôi</Link><h1 className="mt-3 text-3xl font-bold">Chỉnh sửa bài viết</h1></div><BlogEditor blogId={id}/></div>;
}
