import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  marketingPanel = false,
  wide = false,
  welcomeTitle,
  welcomeCopy,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  marketingPanel?: boolean;
  wide?: boolean;
  welcomeTitle?: string;
  welcomeCopy?: string;
}) {
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-main">
        <section className={`auth-card${marketingPanel ? " auth-card-split" : wide ? " auth-card-wide" : ""}`} aria-labelledby="auth-title">
          {marketingPanel && (
            <aside className="auth-welcome" aria-label="Thông tin về rentOS">
              <div className="welcome-kicker"><span aria-hidden="true">⌂</span> NƠI ĐỂ Ở. CHỐN ĐỂ THUỘC VỀ.</div>
              <div className="welcome-copy">
                <h2>{welcomeTitle}</h2>
                <p>{welcomeCopy}</p>
                <span className="welcome-rule" />
                <small>Bình yên bắt đầu từ một nơi gọi là nhà.</small>
              </div>
            </aside>
          )}
          <div className="auth-form-panel">
            <div className="auth-eyebrow">{eyebrow}</div>
            <h1 id="auth-title">{title}</h1>
            <p className="auth-description">{description}</p>
            {children}
          </div>
        </section>
      </main>
      <footer className="auth-footer"><span>© 2026 rentOS. Nơi để ở. Chốn để thuộc về.</span><nav aria-label="Liên kết chân trang"><Link href="/">Trợ giúp</Link><Link href="/">Riêng tư</Link><Link href="/">Điều khoản</Link></nav></footer>
    </div>
  );
}

export function FormMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <p className={error ? "form-message form-message-error" : "form-message"} role="status">{message}</p>;
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? <span id={id} className="field-error">{message}</span> : null;
}
