"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, status } = useAuth();

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center my-auto">
      <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        CHÀO MỪNG ĐẾN VỚI RENTOS
      </span>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
        Tìm nơi ở phù hợp.
        <br />
        Quản lý an tâm.
      </h1>
      <p className="max-w-xl text-base sm:text-lg text-slate-600 mb-8">
        Một tài khoản cho hành trình thuê nhà và quản lý bất động sản của bạn.
      </p>

      {status === "loading" ? (
        <div className="min-h-[46px] w-full flex items-center justify-center" aria-hidden="true">
          <div className="h-2.5 w-24 bg-slate-200 rounded-full animate-pulse" />
        </div>
      ) : status === "authenticated" && user ? (
        <div className="text-center mt-2">
          <p className="mb-6 text-sm text-slate-500">
            Xin chào trở lại, <strong className="text-slate-800">{user.name}</strong>!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 rounded-xl bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
              href="/profile"
            >
              Hồ sơ của bạn
            </Link>
            <Link
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              href="/tenant"
            >
              Cổng Cư Dân
            </Link>
            <Link
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              href="/owner"
            >
              Cổng Chủ Nhà
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            className="inline-flex items-center justify-center min-h-[46px] px-7 py-2.5 rounded-xl bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
            href="/register"
          >
            Tạo tài khoản
          </Link>
          <Link
            className="inline-flex items-center justify-center min-h-[46px] px-7 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
            href="/login"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </div>
  );
}
