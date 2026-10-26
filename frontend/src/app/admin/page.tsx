"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, getRoleStatus, type CurrentUser, type RoleStatus } from "@/lib/auth-api";
import { SiteHeader } from "@/components/site-header";

export default function AdminPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [roleStatus, setRoleStatus] = useState<RoleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentUser(), getRoleStatus()])
      .then(([userData, statusData]) => {
        setUser(userData);
        setRoleStatus(statusData);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="portal-container">
        <div className="portal-header">
          <span className="section-kicker">CỔNG QUẢN TRỊ</span>
          <h1>Bảng điều khiển hệ thống</h1>
          <p>Giám sát toàn bộ hoạt động người dùng, kiểm duyệt bài đăng và quản trị dữ liệu nền tảng.</p>
        </div>

        {loading ? (
          <p className="loading-copy">Đang kiểm tra quyền quản trị…</p>
        ) : !roleStatus?.is_admin ? (
          <div className="portal-empty-card">
            <div className="portal-empty-icon" aria-hidden="true" style={{ background: "#fde8e8", color: "#e02424" }}>
              ⛔
            </div>
            <span className="section-kicker" style={{ color: "#e02424", marginBottom: "8px" }}>403 FORBIDDEN</span>
            <h2>Từ chối truy cập</h2>
            <p>
              Tài khoản <strong>{user?.email}</strong> không có đặc quyền quản trị viên (`is_admin = true`). Nếu bạn là quản trị viên, vui lòng liên hệ bộ phận kỹ thuật để được cấp quyền.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <Link className="primary-button button-link" href="/">
                Quay về trang chủ
              </Link>
              <Link className="secondary-button button-link" href="/profile">
                Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        ) : (
          <div className="portal-active-card">
            <span className="portal-badge" style={{ background: "rgba(224, 36, 36, 0.1)", color: "#c81e1e" }}>
              Quản trị viên hệ thống
            </span>
            <h2>Tổng quan nền tảng rentOS</h2>
            <p>Chào mừng quản trị viên <strong>{user?.name}</strong>. Hệ thống cơ sở dữ liệu và xác thực đang hoạt động ổn định.</p>
            <div className="portal-stats-grid">
              <div className="portal-stat-box">
                <div className="portal-stat-value">Hoạt động</div>
                <div className="portal-stat-label">Trạng thái API Backend</div>
              </div>
              <div className="portal-stat-box">
                <div className="portal-stat-value">PostgreSQL 17</div>
                <div className="portal-stat-label">Cơ sở dữ liệu chính</div>
              </div>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link className="primary-button button-link" href="/">
                Về trang chủ
              </Link>
              <Link className="secondary-button button-link" href="/profile">
                Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        )}
      </main>
      <footer className="auth-footer">rentOS · Cổng Quản Trị Hệ Thống</footer>
    </div>
  );
}
