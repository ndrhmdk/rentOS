"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, getRoleStatus, type CurrentUser, type RoleStatus } from "@/lib/auth-api";
import { PortalEmptyState } from "@/components/portal-empty-state";
import { SiteHeader } from "@/components/site-header";

export default function OwnerPortalPage() {
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
          <span className="section-kicker">CỔNG CHỦ NHÀ</span>
          <h1>Quản lý tài sản và người thuê</h1>
          <p>Kiểm soát danh mục căn hộ cho thuê, xét duyệt hợp đồng và tối ưu hóa doanh thu bất động sản.</p>
        </div>

        {loading ? (
          <p className="loading-copy">Đang tải thông tin chủ nhà…</p>
        ) : roleStatus?.is_owner ? (
          <div className="portal-active-card">
            <span className="portal-badge">Chủ nhà đối tác</span>
            <h2>Danh mục bất động sản của bạn</h2>
            <p>Xin chào, <strong>{user?.name}</strong>. Dưới đây là tình hình hoạt động của các bất động sản bạn đang quản lý.</p>
            <div className="portal-stats-grid">
              <div className="portal-stat-box">
                <div className="portal-stat-value">{roleStatus.properties_count}</div>
                <div className="portal-stat-label">Bất động sản đang quản lý</div>
              </div>
              <div className="portal-stat-box">
                <div className="portal-stat-value">Hoạt động</div>
                <div className="portal-stat-label">Trạng thái danh mục</div>
              </div>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={() => alert("Tính năng đăng tin mới đang được hoàn thiện.")}>
                Đăng tin cho thuê mới
              </button>
              <Link className="secondary-button button-link" href="/profile">
                Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        ) : (
          <PortalEmptyState
            icon="🏢"
            kicker="CHƯA CÓ BẤT ĐỘNG SẢN"
            title="Bạn chưa có bất động sản nào"
            description="Hãy đăng bài cho thuê căn hộ hoặc phòng trọ của bạn để tiếp cận hàng ngàn người thuê tiềm năng và trở thành chủ nhà đối tác trên rentOS!"
            ctaText="Đăng tin cho thuê"
            ctaHref="/"
            secondaryText="Quản lý hồ sơ"
            secondaryHref="/profile"
          />
        )}
      </main>
      <footer className="auth-footer">rentOS · Cổng Chủ Nhà</footer>
    </div>
  );
}
