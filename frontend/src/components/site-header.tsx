"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ApiError, getCurrentUser, logout, type CurrentUser } from "@/lib/auth-api";
import "./site-header.css";

type AccountState =
  | { status: "loading" | "guest" | "error" }
  | { status: "authenticated"; user: CurrentUser };

export function HeaderView({ account, onRetry, onSignOut, signingOut = false, error = "" }: {
  account: AccountState;
  onRetry?: () => void;
  onSignOut?: () => void;
  signingOut?: boolean;
  error?: string;
}) {
  const user = account.status === "authenticated" ? account.user : null;
  const initials = user?.name.trim().split(/\s+/).slice(-2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("vi") || "U";

  return (
    <header className="rentos-header-header">
      <Link href="/" className="rentos-header-logo" aria-label="rentOS - trang chủ">
        <Image src="/rentos-logo-dark.png" alt="rentOS" width={130} height={33} priority />
      </Link>
      <nav className="rentos-header-navigation" aria-label="Điều hướng chính">
        <Link href="/">Tìm nhà cho bạn</Link>
        <Link href="/tenant">Cổng Cư Dân</Link>
        <Link href="/owner">Cổng Chủ Nhà</Link>
        <button type="button" disabled title="Sắp ra mắt">Hướng dẫn</button>
        <button type="button" disabled title="Sắp ra mắt">FAQ</button>
      </nav>
      <div className="rentos-header-actions">
        <span className="rentos-header-language" aria-label="Ngôn ngữ: Tiếng Việt">
          <Image src="/header/globe.svg" alt="" width={22} height={22} /> VN
        </span>
        {account.status === "loading" && <span className="rentos-header-loading" role="status">Đang tải…</span>}
        {account.status === "error" && <button className="rentos-header-retry" onClick={onRetry}>Thử lại tài khoản</button>}
        {account.status === "guest" && <>
          <Link className="rentos-header-login" href="/login">Đăng nhập</Link>
          <Link className="rentos-header-register" href="/register">Đăng ký <span aria-hidden="true">↗</span></Link>
        </>}
        {user && <>
          <button type="button" className="rentos-header-notifications" disabled aria-label="Thông báo — sắp ra mắt" title="Thông báo — sắp ra mắt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          </button>
          <details className="rentos-header-account" onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
          }}>
            <summary aria-label={`Tài khoản của ${user.name}`}>
              <span className="rentos-header-avatar" aria-hidden="true">{initials}</span>
              <span className="rentos-header-name" title={user.name}>{user.name}</span>
              <Image src="/header/chevron-down.svg" alt="" width={15} height={15} />
            </summary>
            <div className="rentos-header-dropdown">
              <strong>{user.name}</strong>
              <Link href="/profile">Hồ sơ của bạn</Link>
              <Link href="/tenant">Cổng Cư Dân</Link>
              <Link href="/owner">Cổng Chủ Nhà</Link>
              <Link href="/admin">Cổng Quản Trị</Link>
              <button type="button" onClick={onSignOut} disabled={signingOut}>{signingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button>
              {error && <p role="alert">{error}</p>}
            </div>
          </details>
        </>}
      </div>
    </header>
  );
}

function ConnectedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<{ path: string; account: AccountState } | null>(null);
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const request = ++generation.current;
      try {
        const user = await getCurrentUser();
        if (active && request === generation.current) setSnapshot({ path: pathname, account: { status: "authenticated", user } });
      } catch (error) {
        if (active && request === generation.current) setSnapshot({ path: pathname, account: {
          status: error instanceof ApiError && error.status === 401 ? "guest" : "error",
        } });
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [pathname, retry]);

  async function signOut() {
    setSigningOut(true);
    setError("");
    ++generation.current;
    try {
      await logout();
      ++generation.current;
      setSnapshot({ path: pathname, account: { status: "guest" } });
      router.replace("/login");
    } catch {
      setError("Đăng xuất chưa hoàn tất. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  return <HeaderView account={snapshot?.path === pathname ? snapshot.account : { status: "loading" }}
    onRetry={() => setRetry((value) => value + 1)} onSignOut={signOut} signingOut={signingOut} error={error} />;
}

export function SiteHeader() {
  return <Suspense fallback={<HeaderView account={{ status: "loading" }} />}><ConnectedHeader /></Suspense>;
}
