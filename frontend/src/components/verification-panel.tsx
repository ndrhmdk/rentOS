"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, resendVerification } from "@/lib/auth-api";
import { FormMessage } from "./auth-shell";

export function VerificationPanel() {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEmail(user.email);
        setVerified(Boolean(user.email_verified_at));
      })
      .catch((error) => {
        setIsError(true);
        setNeedsLogin(error instanceof ApiError && error.status === 401);
        setMessage(error instanceof ApiError && error.status === 401
          ? "Đăng nhập để xem trạng thái xác minh hoặc gửi lại liên kết."
          : "Không thể kiểm tra trạng thái. Vui lòng tải lại trang để thử lại.");
      });
  }, []);

  async function handleResend() {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      await resendVerification();
      setMessage("Đã gửi lại email xác minh. Hãy kiểm tra hộp thư của bạn.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Không thể gửi email lúc này.");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="verification-panel">
      {verified ? (
        <>
          <div className="status-mark" aria-hidden="true">✓</div>
          <h2>Email đã được xác minh</h2>
          <p>Bạn có thể tiếp tục sử dụng các tính năng của rentOS.</p>
          <Link className="primary-button button-link" href="/profile">Đi đến hồ sơ</Link>
        </>
      ) : email ? (
        <>
          <div className="status-mark" aria-hidden="true">✉</div>
          <h2>Kiểm tra hộp thư</h2>
          <p>Chúng tôi đã gửi liên kết xác minh đến <strong>{email}</strong>. Mở liên kết để xác nhận địa chỉ email của bạn.</p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button className="secondary-button" onClick={handleResend} disabled={busy}>
              {busy ? "Đang gửi…" : "Gửi lại email xác minh"}
            </button>
            <Link className="text-button" href="/profile">Quay về hồ sơ &rarr;</Link>
          </div>
          {message && <FormMessage message={message} error={isError} />}
        </>
      ) : (
        <>
          <h2>{isError ? needsLogin ? "Đăng nhập để tiếp tục" : "Chưa thể tải trạng thái" : "Đang kiểm tra trạng thái…"}</h2>
          {needsLogin && <Link className="primary-button button-link" href="/login">Đăng nhập</Link>}
          {message && <FormMessage message={message} error={isError} />}
        </>
      )}
    </div>
  );
}
