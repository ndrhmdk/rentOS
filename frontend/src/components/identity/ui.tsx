"use client";

import Link from "next/link";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ApiError, errorMessage } from "@/lib/identity/api";
import { useIdentity, recoverCsrf } from "@/lib/identity/provider";

export function Field({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string[];
  hint?: string;
}) {
  const id = props.id ?? props.name;
  return (
    <div className="identity-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
      />
      {(error || hint) && (
        <small id={`${id}-hint`} className={error ? "field-error" : undefined}>
          {error?.join(" ") ?? hint}
        </small>
      )}
    </div>
  );
}
export function Feedback({
  error,
  success,
}: {
  error?: unknown;
  success?: string;
}) {
  return error ? (
    <div role="alert" className="identity-feedback error">
      {errorMessage(error)}
    </div>
  ) : success ? (
    <div role="status" className="identity-feedback success">
      {success}
    </div>
  ) : null;
}
export function IdentityGate({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { account, loading } = useIdentity();
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!account)
    return (
      <div className="identity-card">
        <h1>Vui lòng đăng nhập</h1>
        <Link href="/login">Đăng nhập để tiếp tục</Link>
      </div>
    );
  if (!account.email_verified)
    return (
      <div className="identity-card">
        <h1>Xác minh email của bạn</h1>
        <Link href="/verify-email">Kiểm tra trạng thái xác minh</Link>
      </div>
    );
  if (admin && !account.is_admin)
    return (
      <div className="identity-card">
        <h1>403</h1>
        <p>Bạn không có quyền truy cập khu vực này.</p>
        <Link href="/profile">Quay lại rentOS</Link>
      </div>
    );
  return children;
}
export function RecoveryNotice() {
  const { recoveryStatus, refresh } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  if (!recoveryStatus) return null;
  return (
    <div role="alert" className="identity-feedback error">
      {errorMessage(new ApiError(recoveryStatus))}{" "}
      <Link href="/login" target="_blank">
        Đăng nhập ở tab mới
      </Link>
      <button
        type="button"
        className="text-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailure("");
          try {
            await recoverCsrf();
            await refresh();
          } catch (error) {
            setFailure(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang khôi phục…" : "Khôi phục phiên"}
      </button>
      {failure && <p>{failure}</p>}
    </div>
  );
}
