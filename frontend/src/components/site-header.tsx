"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const router = useRouter();
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
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 sm:gap-6 min-h-[72px] lg:min-h-[94px] px-4 sm:px-6 lg:px-12 bg-surface-nav-dark text-on-dark border-b border-white/10 shadow-sm">
      <Link href="/" className="inline-flex items-center min-h-[44px] shrink-0" aria-label="rentOS - trang chủ">
        <Image
          src="/rentos-logo-dark.png"
          alt="rentOS"
          width={130}
          height={33}
          priority
          className="w-[110px] sm:w-[130px] h-auto object-contain"
        />
      </Link>
      <nav className="flex items-center gap-3 sm:gap-6 lg:gap-8 overflow-x-auto py-1" aria-label="Điều hướng chính">
        <Link
          href="/"
          className="text-xs sm:text-sm font-medium text-on-dark-muted hover:text-action-secondary transition-colors whitespace-nowrap"
        >
          Tìm nhà cho bạn
        </Link>
        <Link
          href="/tenant"
          className="text-xs sm:text-sm font-medium text-on-dark-muted hover:text-action-secondary transition-colors whitespace-nowrap"
        >
          Cổng Cư Dân
        </Link>
        <Link
          href="/owner"
          className="text-xs sm:text-sm font-medium text-on-dark-muted hover:text-action-secondary transition-colors whitespace-nowrap"
        >
          Cổng Chủ Nhà
        </Link>
        {status === "authenticated" && Boolean(user?.is_admin) && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center text-xs sm:text-sm font-semibold text-action-secondary hover:text-white transition-colors whitespace-nowrap gap-1"
          >
            <span>Cổng Quản Trị</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-xs bg-navy-800 text-on-dark">
              Admin
            </span>
          </Link>
        )}
      </nav>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {status === "loading" && (
          <div className="w-[100px] sm:w-[120px] h-[36px]" aria-hidden="true" />
        )}
        {status === "guest" && (
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              className="text-xs sm:text-sm font-semibold text-on-dark hover:text-action-secondary transition-colors px-2.5 sm:px-3 py-2 min-h-[44px] inline-flex items-center whitespace-nowrap"
              href="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="text-xs sm:text-sm font-semibold text-primary bg-white hover:bg-slate-100 transition-all px-4 sm:px-5 py-2 sm:py-2.5 rounded-pill min-h-[40px] sm:min-h-[44px] inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              href="/register"
            >
              <span>Đăng ký</span>
              <span aria-hidden="true" className="text-xs">↗</span>
            </Link>
          </div>
        )}
        {status === "authenticated" && user && (
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
              className="flex items-center gap-2 cursor-pointer list-none min-h-[44px] select-none [&::-webkit-details-marker]:hidden py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white/40 bg-navy-800 text-on-dark flex items-center justify-center text-xs sm:text-sm font-semibold"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span
                className="max-w-[90px] sm:max-w-[140px] truncate text-xs sm:text-sm font-semibold text-on-dark hidden sm:inline"
                title={user.name}
              >
                {user.name}
              </span>
              <Image
                src="/header/chevron-down.svg"
                alt=""
                width={14}
                height={14}
                className="opacity-80"
              />
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] w-56 sm:w-64 max-w-[calc(100vw-32px)] p-2 bg-surface-card text-primary rounded-xl border border-border-default shadow-xl z-50">
              <div className="px-3 py-2 border-b border-border-default mb-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="block text-xs font-semibold text-heading truncate break-all">
                    {user.name}
                  </strong>
                  {Boolean(user.is_admin) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-navy-800 text-on-dark shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <span className="block text-xs text-secondary truncate mt-0.5">
                  {user.email}
                </span>
              </div>
              <Link
                href="/profile"
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary hover:text-heading hover:bg-slate-100 rounded-lg transition-colors text-left min-h-[38px]"
              >
                Hồ sơ của bạn
              </Link>
              {Boolean(user.is_admin) && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-action-primary hover:bg-slate-100 rounded-lg transition-colors text-left min-h-[38px]"
                >
                  <span>Cổng Quản Trị</span>
                  <span className="text-xs text-muted">↗</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left disabled:opacity-50 min-h-[38px] mt-1 border-t border-border-default/60 pt-2"
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
        )}
      </div>
    </header>
  );
}
