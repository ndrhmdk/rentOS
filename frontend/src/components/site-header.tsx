"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NotificationIcon } from "@/config/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNotificationUnread } from "@/lib/notification-inbox";

function subscribeToHydration() {
  return () => {};
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center whitespace-nowrap text-[15px] leading-[22.5px] transition-colors hover:text-[#8FBCD0] ${active ? "font-bold text-[#8FBCD0]" : "font-medium text-[#E4E9F0]"}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, status: authStatus, signOut } = useAuth();
  // Keep the first client render identical to the server, even if auth is cached.
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const status = hydrated ? authStatus : "loading";
  const unread = useNotificationUnread(user?.id);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const onHome = pathname === "/";

  useEffect(() => {
    if (!onHome) return;
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [onHome]);

  // Close on outside pointerdown instead of blur — Safari often leaves
  // relatedTarget null on button/link click, which made blur-close eat the click.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      for (const root of [accountMenuRef.current, mobileMenuRef.current]) {
        if (!root?.open) continue;
        if (event.target instanceof Node && root.contains(event.target)) continue;
        root.open = false;
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const transparent = onHome && !scrolled;

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
    } catch {
      setError("Đăng xuất chưa hoàn tất. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header
      className={`z-50 flex items-center justify-between gap-3 px-4 text-[#E4E9F0] transition-colors sm:gap-6 sm:px-6 lg:px-10 ${onHome ? "fixed inset-x-0 top-0 h-16 min-h-16 sm:h-[75px] sm:min-h-[75px]" : "sticky top-0 h-[75px] min-h-[75px]"} ${transparent ? "border-b border-transparent bg-transparent shadow-none" : "border-b border-white/10 bg-[#091216] shadow-sm"}`}
    >
      <Link
        href="/"
        className="inline-flex items-center min-h-[44px] shrink-0"
        aria-label="rentOS - trang chủ"
      >
        <Image
          src="/images/rentos-logo.png"
          alt="rentOS"
          width={120}
          height={30}
          loading="eager"
          className={`${onHome ? "w-24" : "w-[110px]"} h-auto object-contain sm:w-[120px]`}
        />
      </Link>
      <nav
        className={`${onHome ? "hidden xl:flex" : "flex"} items-center gap-4 overflow-x-auto py-1 sm:gap-6 lg:gap-8`}
        aria-label="Điều hướng chính"
      >
        <NavLink href="/listings" active={pathname.startsWith("/listings")}>
          Tìm nhà cho bạn
        </NavLink>
        <NavLink href="/guide" active={pathname.startsWith("/guide")}>
          Hướng dẫn
        </NavLink>
        <Link
          href="/#cau-hoi"
          className="text-[15px] font-medium leading-[22.5px] text-[#E4E9F0] hover:text-[#8FBCD0] transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center"
          onClick={(event) => {
            if (pathname !== "/") return;
            const section = document.getElementById("cau-hoi");
            if (!section) return;
            event.preventDefault();
            const top =
              section.getBoundingClientRect().top + window.scrollY - 91;
            window.scrollTo({ top, behavior: "smooth" });
            window.history.replaceState(null, "", "/#cau-hoi");
          }}
        >
          FAQ
        </Link>
        <NavLink href="/tenant" active={pathname.startsWith("/tenant")}>
          Cổng cư dân
        </NavLink>
        <NavLink href="/owner" active={pathname.startsWith("/owner")}>
          Cổng chủ nhà
        </NavLink>
        {user?.is_admin && (
          <NavLink href="/admin" active={pathname.startsWith("/admin")}>
            Cổng quản trị
          </NavLink>
        )}
      </nav>
      <div
        className={`${onHome ? "ml-auto xl:ml-0" : ""} flex shrink-0 items-center gap-3 sm:gap-4`}
        suppressHydrationWarning
      >
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
              className={`${onHome ? "hidden sm:inline-flex" : "inline-flex"} min-h-[40px] items-center gap-1 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#091216] shadow-sm transition-all hover:bg-slate-100 sm:px-5`}
              href="/register"
            >
              <span>Đăng ký</span>
              <span aria-hidden="true" className="text-xs">
                ↗
              </span>
            </Link>
          </div>
        )}
        {status === "authenticated" && user && (
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative inline-flex rounded-full p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              aria-label={
                unread > 0
                  ? `Thông báo, ${unread} chưa đọc`
                  : "Thông báo"
              }
              aria-current={
                pathname.startsWith("/notifications") ? "page" : undefined
              }
            >
              <NotificationIcon className="h-5 w-5">
                {unread > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[#091216] bg-[#d93b30] px-1 text-[10px] font-bold text-white"
                  >
                    {unread}
                  </span>
                )}
              </NotificationIcon>
            </Link>

            <details
              ref={accountMenuRef}
              className="relative shrink-0 select-none"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
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
                <svg
                  className="w-4 h-4 text-white shrink-0 opacity-80"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                {user.is_admin ? (
                  <Link
                    href="/admin"
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left min-h-[38px]"
                  >
                    Quản lý
                  </Link>
                ) : null}
                <Link
                  href="/profile"
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
      {onHome && (
        <details
          ref={mobileMenuRef}
          className="group shrink-0 xl:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Menu điều hướng" className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/30 bg-[#091216]/40 text-white [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-6 group-open:hidden" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="hidden size-6 group-open:block" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </summary>
          <nav
            aria-label="Điều hướng trên điện thoại"
            className="fixed inset-x-4 top-[72px] grid max-h-[calc(100dvh-6rem)] gap-1 overflow-y-auto rounded-2xl border border-white/15 bg-[#091216] p-3 shadow-xl sm:top-[83px]"
          >
            {[
              { href: "/listings", label: "Tìm nhà cho bạn" },
              { href: "/guide", label: "Hướng dẫn" },
              { href: "/#cau-hoi", label: "FAQ" },
              { href: "/tenant", label: "Cổng cư dân" },
              { href: "/owner", label: "Cổng chủ nhà" },
              ...(user?.is_admin ? [{ href: "/admin", label: "Cổng quản trị" }] : []),
              ...(status === "guest" ? [{ href: "/register", label: "Đăng ký tài khoản" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-white hover:bg-white/10 focus-visible:bg-white/10"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  if (item.href === "/#cau-hoi") {
                    const section = document.getElementById("cau-hoi");
                    if (!section) return;
                    event.preventDefault();
                    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
                    window.history.replaceState(null, "", "/#cau-hoi");
                  }
                }}
              >{item.label}</Link>
            ))}
          </nav>
        </details>
      )}
    </header>
  );
}
