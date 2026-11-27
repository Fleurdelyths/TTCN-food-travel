import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminBlogsClient from "./AdminBlogsClient";
export default async function AdminBlogsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  return <AdminBlogsClient />;
}
