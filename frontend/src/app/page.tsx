import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="welcome-main">
        <span className="auth-eyebrow">CHÀO MỪNG ĐẾN VỚI RENTOS</span>
        <h1>Tìm nơi ở phù hợp.<br />Quản lý an tâm.</h1>
        <p>Một tài khoản cho hành trình thuê nhà và quản lý bất động sản của bạn.</p>
        <div className="welcome-actions">
          <Link className="primary-button button-link" href="/register">Tạo tài khoản</Link>
          <Link className="secondary-button button-link" href="/login">Đăng nhập</Link>
        </div>
      </main>
      <footer className="auth-footer">rentOS · Tìm nơi ở phù hợp, quản lý an tâm</footer>
    </div>
  );
}
