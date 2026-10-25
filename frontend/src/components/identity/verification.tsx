"use client";

import Link from "next/link";
import { useState } from "react";
import { api, initializeCsrf } from "@/lib/identity/api";
import { useIdentity } from "@/lib/identity/provider";
import { Feedback } from "./ui";

export function Verification() {
  const { account, loading, refresh } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState("");
  async function resend() {
    setBusy(true);
    setError(undefined);
    try {
      await initializeCsrf();
      await api("/email/verification-notification", { method: "POST" });
      setSuccess("Đã gửi liên kết xác minh. Hãy kiểm tra hộp thư của bạn.");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>
        {account?.email_verified
          ? "Email đã được xác minh"
          : "Kiểm tra email của bạn"}
      </h1>
      <p>
        Liên kết xác minh được gửi tới email tài khoản. Mở liên kết trong cùng
        trình duyệt đã đăng nhập.
      </p>
      <Feedback error={error} success={success} />
      {loading ? (
        <p role="status">Đang kiểm tra…</p>
      ) : !account ? (
        <Link href="/login">Đăng nhập để xác minh</Link>
      ) : account.email_verified ? (
        <Link className="primary-button" href="/profile">
          Đến hồ sơ của bạn
        </Link>
      ) : (
        <>
          <p>{account.email}</p>
          <button className="primary-button" disabled={busy} onClick={resend}>
            {busy ? "Đang gửi…" : "Gửi lại email xác minh"}
          </button>
          <button
            className="text-button"
            onClick={() => {
              void refresh();
            }}
          >
            Tôi đã mở liên kết, kiểm tra lại
          </button>
        </>
      )}
    </>
  );
}
