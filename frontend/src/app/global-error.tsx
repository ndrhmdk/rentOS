"use client";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  const reference = error.digest?.trim() || null;

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
          background: "black",
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
            }}
          >
            Đã có lỗi. Vui lòng thử lại!
          </h1>
          {reference ? (
            <p
              style={{
                margin: "16px 0 0",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #dce5ef",
                background: "#ffffff",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 12,
                color: "#52636c",
                wordBreak: "break-all",
              }}
            >
              Mã tham chiếu: {reference}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 28,
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
        </main>
      </body>
    </html>
  );
}
