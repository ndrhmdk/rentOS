"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, getCurrentUser, logout, updatePassword, updateProfile, type CurrentUser } from "@/lib/auth-api";
import { FieldError, FormMessage } from "./auth-shell";

export function ProfilePanel() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getCurrentUser().then(setUser).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
      } else {
        setLoadError("Không thể tải hồ sơ. Vui lòng tải lại trang để thử lại.");
      }
    });
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError(false);
    setProfileMessage("");
    const values = new FormData(event.currentTarget);
    try {
      const updated = await updateProfile({
        name: String(values.get("name") ?? ""),
        phone: String(values.get("phone") ?? "").trim() || null,
      });
      setUser(updated);
      setProfileMessage("Hồ sơ đã được cập nhật.");
    } catch (error) {
      setProfileMessage(error instanceof ApiError ? error.message : "Không thể cập nhật hồ sơ.");
      setProfileError(true);
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError(false);
    setPasswordMessage("");
    setPasswordFieldErrors({});
    const values = new FormData(event.currentTarget);
    try {
      await updatePassword({
        current_password: String(values.get("current_password") ?? ""),
        password: String(values.get("password") ?? ""),
        password_confirmation: String(values.get("password_confirmation") ?? ""),
      });
      setPasswordMessage("Mật khẩu đã đổi. Hãy đăng nhập lại bằng mật khẩu mới.");
      setUser(null);
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordMessage(error.message);
        setPasswordFieldErrors(error.errors);
      } else {
        setPasswordMessage("Không thể đổi mật khẩu lúc này.");
      }
      setPasswordError(true);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function signOut() {
    setLogoutBusy(true);
    try {
      await logout();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      setProfileMessage(error instanceof ApiError ? error.message : "Đăng xuất chưa hoàn tất. Vui lòng thử lại.");
      setProfileError(true);
      setLogoutBusy(false);
    }
  }

  if (loadError) return <FormMessage message={loadError} error />;

  if (!user) return <p className="loading-copy">Đang tải hồ sơ…</p>;

  return (
    <div className="profile-grid">
      <section className="settings-card">
        <div className="section-heading">
          <span className="section-kicker">Thông tin tài khoản</span>
          <h2>Hồ sơ của bạn</h2>
        </div>
        <form className="account-form" onSubmit={saveProfile}>
          <label className="field">
            <span>Họ và tên</span>
            <input name="name" defaultValue={user.name} required maxLength={255} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={user.email} readOnly aria-describedby="email-status" />
            <small id="email-status">{user.email_verified_at ? "Email đã xác minh" : "Email chưa xác minh"}</small>
          </label>
          <label className="field">
            <span>Số điện thoại liên hệ</span>
            <input name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" maxLength={64} />
            <small>Số điện thoại là thông tin liên hệ, chưa được xác minh.</small>
          </label>
          {profileMessage && <FormMessage message={profileMessage} error={profileError} />}
          <button className="primary-button" type="submit" disabled={profileBusy}>
            {profileBusy ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </form>
        <button className="text-button signout-button" onClick={signOut} disabled={logoutBusy}>
          {logoutBusy ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
      </section>

      <section className="settings-card">
        <div className="section-heading">
          <span className="section-kicker">Bảo mật</span>
          <h2>Đổi mật khẩu</h2>
          <p>Nhập mật khẩu hiện tại để xác nhận thay đổi. Sau khi đổi, mọi phiên đăng nhập sẽ bị thu hồi và bạn cần đăng nhập lại.</p>
        </div>
        <form className="account-form" onSubmit={savePassword}>
          <label className="field">
            <span>Mật khẩu hiện tại</span>
            <input aria-invalid={Boolean(passwordFieldErrors.current_password)} aria-describedby={passwordFieldErrors.current_password ? "current-password-error" : undefined} name="current_password" type="password" autoComplete="current-password" required />
            <FieldError id="current-password-error" message={passwordFieldErrors.current_password?.[0]} />
          </label>
          <label className="field">
            <span>Mật khẩu mới</span>
            <input aria-invalid={Boolean(passwordFieldErrors.password)} aria-describedby={passwordFieldErrors.password ? "new-password-error" : undefined} name="password" type="password" autoComplete="new-password" required />
            <FieldError id="new-password-error" message={passwordFieldErrors.password?.[0]} />
          </label>
          <label className="field">
            <span>Xác nhận mật khẩu mới</span>
            <input name="password_confirmation" type="password" autoComplete="new-password" required />
          </label>
          {passwordMessage && <FormMessage message={passwordMessage} error={passwordError} />}
          <button className="primary-button" type="submit" disabled={passwordBusy}>
            {passwordBusy ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
          </button>
        </form>
      </section>
    </div>
  );
}
