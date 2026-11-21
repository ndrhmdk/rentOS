"use client";

import Link from "next/link";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  void error;

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          background: "#f1f6f8",
          color: "#102337",
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ width: "100%", maxWidth: 512, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "#3368A0",
            }}
          >
            rentOS
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: 28,
              lineHeight: 1.25,
              fontWeight: 700,
              color: "#102337",
            }}
          >
            Đã có lỗi. Vui lòng thử lại!
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#52636c",
            }}
          >
            Ứng dụng gặp sự cố tạm thời. Hãy thử lại hoặc về trang chủ.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                padding: "0 24px",
                border: 0,
                borderRadius: 999,
                background: "#3368A0",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                padding: "0 24px",
                borderRadius: 999,
                border: "1px solid #dce5ef",
                background: "#ffffff",
                color: "#102337",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Về trang chủ
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
