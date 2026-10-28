"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const initials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("vi") || "U";

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setError("Đăng xuất chưa hoàn tất. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 sm:gap-6 min-h-[75px] h-[75px] px-4 sm:px-6 lg:px-10 bg-[#091216] text-[#E4E9F0] border-b border-white/10 shadow-sm">
      <Link href="/" className="inline-flex items-center min-h-[44px] shrink-0" aria-label="rentOS - trang chủ">
        <Image
          src="/images/rentos-logo.png"
          alt="rentOS"
          width={120}
          height={30}
          priority
          className="w-[110px] sm:w-[120px] h-auto object-contain"
        />
      </Link>
      <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-1" aria-label="Điều hướng chính">
        <Link
          href="/listings"
          className="text-[15px] font-bold text-[#8FBCD0] hover:text-[#FFFFFF] transition-colors whitespace-nowrap"
        >
          Tìm nhà cho bạn
        </Link>
        <Link
          href="/tenant"
          className="text-[15px] font-medium text-[#E4E9F0] hover:text-[#8FBCD0] transition-colors whitespace-nowrap"
        >
          Cổng Cư Dân
        </Link>
        <Link
          href="/owner"
          className="text-[15px] font-medium text-[#E4E9F0] hover:text-[#8FBCD0] transition-colors whitespace-nowrap"
        >
          Cổng Chủ Nhà
        </Link>
      </nav>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Language Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-white text-sm font-semibold select-none px-2 py-1">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span className="text-xs font-semibold">VN</span>
        </div>

        {status === "loading" && (
          <div className="w-[100px] sm:w-[120px] h-[36px]" aria-hidden="true" />
        )}
        {status === "guest" && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="text-sm font-semibold text-white hover:text-[#8FBCD0] transition-colors px-3 py-2 min-h-[44px] inline-flex items-center whitespace-nowrap"
              href="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="text-sm font-semibold text-[#091216] bg-white hover:bg-slate-100 transition-all px-4 sm:px-5 py-2 rounded-full min-h-[40px] inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
              href="/register"
            >
              <span>Đăng ký</span>
              <span aria-hidden="true" className="text-xs">↗</span>
            </Link>
          </div>
        )}
        {status === "authenticated" && user && (
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Thông báo, 2 chưa đọc"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#d93b30] rounded-full border border-[#091216]">
                2
              </span>
            </button>

            <details
              className="relative shrink-0 select-none"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  event.currentTarget.open = false;
                }
              }}
            >
              <summary
                aria-label={`Tài khoản của ${user.name}`}
                className="flex items-center gap-2 cursor-pointer list-none min-h-[46px] select-none [&::-webkit-details-marker]:hidden py-1 px-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <span
                  className="shrink-0 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full border border-white/25 bg-[#14232c] text-white flex items-center justify-center text-sm font-semibold shadow-inner"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <svg className="w-4 h-4 text-white shrink-0 opacity-80" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </summary>
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 sm:w-64 max-w-[calc(100vw-32px)] p-2 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xl z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <strong className="block text-xs font-semibold text-slate-900 truncate break-all">
                    {user.name}
                  </strong>
                  <span className="block text-xs text-slate-500 truncate mt-0.5">
                    {user.email}
                  </span>
                </div>
                <Link
                  href={pathname.startsWith("/owner") ? "/owner/profile" : "/tenant/profile"}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left min-h-[38px]"
                >
                  Hồ sơ của bạn
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left disabled:opacity-50 min-h-[38px] mt-1 border-t border-slate-100 pt-2"
                >
                  {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
                </button>
                {error && (
                  <p role="alert" className="px-3 py-1.5 text-xs text-rose-600">
                    {error}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </header>
  );
}
