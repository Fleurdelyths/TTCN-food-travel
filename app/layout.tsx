import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Food & Travel Recommendation",
  description: "Khám phá ẩm thực và gợi ý lộ trình du lịch thông minh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      {/* 1. Đã sửa màu nền tổng của body thành bg-slate-950 màu tối sang trọng */}
      <body className="bg-slate-950 min-h-screen flex flex-col text-slate-100 antialiased">
        <Navbar />
        {/* 2. Đã bỏ max-w-7xl ở thẻ main để background phủ kín 100% màn hình */}
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
