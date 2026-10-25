"use client";

import { useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/identity/api";
import { useIdentity } from "@/lib/identity/provider";
import { Feedback, Field, IdentityGate } from "./ui";
import type { Account } from "@/lib/identity/types";

type ContactDraft = { userId: string; name: string; phone: string };
function ContactForm({
  account,
  draft,
  onDraft,
}: {
  account: Account;
  draft: ContactDraft | null;
  onDraft: (draft: ContactDraft | null) => void;
}) {
  const { refresh, logout } = useIdentity();
  const [name, setName] = useState(
    draft?.userId === account.id ? draft.name : account.name,
  );
  const [phone, setPhone] = useState(
    draft?.userId === account.id ? draft.phone : (account.phone ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState("");
  const fields = error instanceof ApiError ? error.errors : {};
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    setSuccess("");
    try {
      await api("/api/v1/profile", {
        method: "PATCH",
        body: { name, phone: phone || null },
      });
      await refresh();
      onDraft(null);
      setSuccess("Đã lưu thay đổi.");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError(undefined);
    try {
      await logout();
      onDraft(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="identity-card identity-form" onSubmit={submit}>
      <Feedback error={error} success={success} />
      <Field
        label="Họ và tên"
        name="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          onDraft({ userId: account.id, name: event.target.value, phone });
        }}
        autoComplete="name"
        required
        error={fields.name}
      />
      <Field
        label="Số điện thoại"
        name="phone"
        type="tel"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          onDraft({ userId: account.id, name, phone: event.target.value });
        }}
        autoComplete="tel"
        error={fields.phone}
        hint="Số liên hệ, chưa xác minh. Chủ nhà sẽ liên lạc với bạn qua số này."
      />
      <Field
        label="Email"
        name="email"
        value={account.email}
        disabled
        hint="Email đăng nhập, không thể thay đổi tại đây."
      />
      <div className="form-actions">
        <button
          type="button"
          className="danger-button"
          disabled={busy}
          onClick={signOut}
        >
          Đăng xuất
        </button>
        <button className="primary-button" disabled={busy}>
          {busy ? "Đang xử lý…" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
export function Profile() {
  const { account } = useIdentity();
  const [draft, setDraft] = useState<ContactDraft | null>(null);
  return (
    <>
      <h1>Hồ sơ cá nhân</h1>
      <IdentityGate>
        {account && (
          <ContactForm
            key={account.id}
            account={account}
            draft={draft}
            onDraft={setDraft}
          />
        )}
      </IdentityGate>
    </>
  );
}
export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const fields = error instanceof ApiError ? error.errors : {};
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await api("/user/password", {
        method: "PUT",
        body: {
          current_password: current,
          password,
          password_confirmation: confirmation,
        },
      });
      // Server already ended this browser session; refresh local state without a second logout write.
      window.dispatchEvent(new Event("identity:password-changed"));
      setSuccess(
        "Mật khẩu đã đổi. Các phiên và API token đã bị thu hồi. Vui lòng đăng nhập lại.",
      );
    } catch (caught) {
      setError(caught);
    } finally {
      setCurrent("");
      setPassword("");
      setConfirmation("");
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Đổi mật khẩu</h1>
      <Feedback success={success} />
      <IdentityGate>
        <form className="identity-card identity-form" onSubmit={submit}>
          <p>
            Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên mọi thiết bị. Tất
            cả API token sẽ bị thu hồi.
          </p>
          <Feedback error={error} />
          <Field
            label="Mật khẩu hiện tại"
            name="current_password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            error={fields.current_password}
          />
          <Field
            label="Mật khẩu mới"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={fields.password}
            hint="Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường và số."
          />
          <Field
            label="Nhập lại mật khẩu"
            name="password_confirmation"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button className="primary-button" disabled={busy}>
            {busy ? "Đang xử lý…" : "Đổi mật khẩu và đăng nhập lại"}
          </button>
        </form>
      </IdentityGate>
    </>
  );
}
