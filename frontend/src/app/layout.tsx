import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "rentOS — Tìm nơi ở phù hợp",
  description: "Một tài khoản cho người thuê và chủ nhà trên rentOS.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
