"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, login, registerAccount } from "@/lib/auth-api";
import { FieldError, FormMessage } from "./auth-shell";

type AuthMode = "login" | "register";

export function AccountForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrors({});
    const values = new FormData(event.currentTarget);

    try {
      if (isRegister) {
        await registerAccount({
          name: String(values.get("name") ?? ""),
          email: String(values.get("email") ?? ""),
          password: String(values.get("password") ?? ""),
          password_confirmation: String(values.get("password_confirmation") ?? ""),
        });
        router.push("/profile");
        return;
      }

      await login({
        email: String(values.get("email") ?? ""),
        password: String(values.get("password") ?? ""),
      });
      router.push("/profile");
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key, messages[0] ?? ""] )));
      } else {
        setMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="account-form" onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <label className="field">
            <span>Họ và tên</span>
            <input aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} name="name" autoComplete="name" required maxLength={255} />
            <FieldError id="name-error" message={errors.name} />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} name="email" type="email" autoComplete="email" required maxLength={255} />
          <FieldError id="email-error" message={errors.email} />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required />
          <FieldError id="password-error" message={errors.password} />
        </label>
        {isRegister && (
          <label className="field">
            <span>Nhập lại mật khẩu</span>
            <input name="password_confirmation" type="password" autoComplete="new-password" required />
          </label>
        )}
        {message && <FormMessage message={message} error />}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
      <p className="form-switch">
        {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Đăng nhập" : "Tạo tài khoản"}</Link>
      </p>
    </>
  );
}
