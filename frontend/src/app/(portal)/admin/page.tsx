"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AdminPortalPage() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <p className="text-center py-12 text-slate-500">Đang tải thông tin…</p>
      </div>
    );
  }

  const isAdmin = Boolean(user?.is_admin);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="mb-8">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">CỔNG QUẢN TRỊ</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Bảng điều khiển hệ thống</h1>
        <p className="text-sm text-slate-600">Khu vực dành riêng cho quản trị viên rentOS.</p>
      </div>

      {!isAdmin ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center shadow-sm max-w-2xl mx-auto w-full">
          <div
            className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mb-4"
            aria-hidden="true"
          >
            ⛔
          </div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-2">
            403 FORBIDDEN
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Từ chối truy cập</h2>
          <p className="max-w-md text-sm text-slate-600 leading-relaxed mb-6">
            Tài khoản <strong>{user?.email}</strong> không có quyền truy cập vào cổng quản trị này.
            Nếu bạn cần quyền truy cập, vui lòng liên hệ quản trị viên hệ thống.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
              href="/"
            >
              Quay về trang chủ
            </Link>
            <Link
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              href="/profile"
            >
              Hồ sơ cá nhân
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-3">
            Quản trị viên
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Chào mừng quản trị viên</h2>
          <p className="text-sm text-slate-600">
            Xin chào, <strong>{user?.name}</strong>. Bạn đang truy cập vào bảng điều khiển quản trị viên hệ thống rentOS.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
              href="/profile"
            >
              Quản lý tài khoản
            </Link>
            <Link
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              href="/"
            >
              Xem trang chủ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
