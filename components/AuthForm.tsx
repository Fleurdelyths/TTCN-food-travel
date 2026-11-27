"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthFormProps = { mode: "login" | "register" };

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = isRegister
        ? { name, email, password, confirmPassword }
        : { email, password };
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }
      if (isRegister) {
        router.push("/login?registered=1");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
        <p className="mt-2 text-sm text-gray-500">{isRegister ? "Tham gia cộng đồng Food & Travel" : "Đăng nhập để tiếp tục sử dụng dịch vụ"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" placeholder="Nguyễn Văn A" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={100} autoComplete="email" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" placeholder="email@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isRegister ? 8 : 1} maxLength={72} autoComplete={isRegister ? "new-password" : "current-password"} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" placeholder={isRegister ? "Ít nhất 8 ký tự" : "Nhập mật khẩu"} />
        </div>
        {isRegister && (
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" placeholder="Nhập lại mật khẩu" />
          </div>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-orange-600 hover:underline">{isRegister ? "Đăng nhập" : "Đăng ký ngay"}</Link>
      </p>
    </div>
  );
}
