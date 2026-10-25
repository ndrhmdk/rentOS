/* eslint-disable @next/next/no-img-element -- Local Figma assets retain their exact rendered geometry. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useIdentity } from "@/lib/identity/provider";
import { RecoveryNotice } from "./ui";

export function IdentityHeader() {
  const { account } = useIdentity();
  return (
    <header className="identity-header">
      <Link href="/" aria-label="rentOS trang chủ">
        <img src="/identity/logo.png" width="120" height="30" alt="rentOS" />
      </Link>
      <nav aria-label="Điều hướng chính">
        <Link href="/">Tìm nhà cho bạn</Link>
        <Link href="/tenant">Quản lý thuê</Link>
      </nav>
      <div className="header-account">
        <span className="locale">
          <img src="/identity/globe.svg" width="18" height="18" alt="" />
          VN
        </span>
        {account ? (
          <Link href="/profile">{account.name}</Link>
        ) : (
          <>
            <Link href="/login">Đăng nhập</Link>
            <Link className="header-register" href="/register">
              Đăng ký{" "}
              <img
                src="/identity/arrow-dark.svg"
                width="14"
                height="14"
                alt=""
              />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="identity-app auth-page" lang="vi">
      <IdentityHeader />
      <main className="auth-main">
        <div className="auth-card">
          <aside className="auth-art">
            <img
              src="/identity/auth-home.png"
              alt="Không gian sống với ánh sáng tự nhiên"
            />
            <span className="brand-eyebrow">Nơi để ở. Chọn để thuộc về.</span>
            <div className="auth-story">
              <h2>Chào mừng bạn trở về.</h2>
              <p>
                Những ngôi nhà bạn quan tâm và các hợp đồng đang chờ, luôn ở đây
                chờ bạn.
              </p>
              <i />
              <small>
                Một tài khoản dùng cho cả tìm nhà và quản lý cho thuê.
              </small>
            </div>
          </aside>
          <section className="auth-content">
            <RecoveryNotice />
            {children}
          </section>
        </div>
      </main>
      <footer className="identity-footer">
        <span>© 2026 rentOS. Nơi để ở. Chọn để thuộc về.</span>
        <span>Cần hỗ trợ? Liên hệ rentOS</span>
      </footer>
    </div>
  );
}
export function AccountShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { account } = useIdentity();
  return (
    <div className="identity-app" lang="vi">
      <IdentityHeader />
      <div className="account-layout">
        <aside className="account-sidebar">
          <small>TRANG CỦA BẠN</small>
          <div className="mode-switch">
            <Link
              className={!path.startsWith("/owner") ? "selected" : ""}
              href="/tenant"
            >
              Người thuê
            </Link>
            <Link
              className={path.startsWith("/owner") ? "selected" : ""}
              href="/owner"
            >
              Chủ nhà
            </Link>
          </div>
          <nav aria-label="Tài khoản">
            <Link href="/tenant">Trang chính</Link>
            <Link
              className={path === "/profile" ? "selected" : ""}
              href="/profile"
            >
              Hồ sơ cá nhân
            </Link>
            <Link
              className={path.includes("api-tokens") ? "selected" : ""}
              href="/settings/api-tokens"
            >
              API tokens
            </Link>
            <Link href="/change-password">Đổi mật khẩu</Link>
            {account?.is_admin && <Link href="/admin">Quản trị</Link>}
          </nav>
          <div className="dual-account">
            <strong>Một tài khoản, hai vai trò.</strong>
            <p>
              Dễ dàng chuyển giữa tìm nhà và quản lý bất động sản cho thuê của
              bạn.
            </p>
          </div>
        </aside>
        <main className="account-main">
          <RecoveryNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
