"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, getRoleStatus, type CurrentUser, type RoleStatus } from "@/lib/auth-api";
import { PortalEmptyState } from "@/components/portal-empty-state";
import { SiteHeader } from "@/components/site-header";

export default function TenantPortalPage() {
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
          <span className="section-kicker">CỔNG CƯ DÂN</span>
          <h1>Quản lý cuộc sống thuê nhà</h1>
          <p>Theo dõi hợp đồng, thanh toán tiền phòng và gửi yêu cầu hỗ trợ dịch vụ tiện ích.</p>
        </div>

        {loading ? (
          <p className="loading-copy">Đang tải thông tin cư dân…</p>
        ) : roleStatus?.is_tenant ? (
          <div className="portal-active-card">
            <span className="portal-badge">Cư dân chính thức</span>
            <h2>Không gian sống của bạn</h2>
            <p>Chào mừng bạn, <strong>{user?.name}</strong>. Dưới đây là thông tin về hợp đồng thuê nhà của bạn trên hệ thống rentOS.</p>
            <div className="portal-stats-grid">
              <div className="portal-stat-box">
                <div className="portal-stat-value">{roleStatus.tenancies_count}</div>
                <div className="portal-stat-label">Hợp đồng thuê đang kích hoạt</div>
              </div>
              <div className="portal-stat-box">
                <div className="portal-stat-value">Đang hoạt động</div>
                <div className="portal-stat-label">Trạng thái cư trú</div>
              </div>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link className="primary-button button-link" href="/">
                Khám phá thêm căn hộ
              </Link>
              <Link className="secondary-button button-link" href="/profile">
                Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        ) : (
          <PortalEmptyState
            icon="🔑"
            kicker="CHƯA CÓ HỢP ĐỒNG"
            title="Bạn chưa có hợp đồng thuê nhà nào"
            description="Hãy khám phá các căn hộ chất lượng cao đã được xác thực trên rentOS để tìm nơi ở phù hợp và trở thành cư dân rentOS ngay hôm nay!"
            ctaText="Tìm nơi ở phù hợp"
            ctaHref="/"
            secondaryText="Quản lý hồ sơ"
            secondaryHref="/profile"
          />
        )}
      </main>
      <footer className="auth-footer">rentOS · Cổng Cư Dân</footer>
    </div>
  );
}
