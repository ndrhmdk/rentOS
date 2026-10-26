"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, login, registerAccount } from "@/lib/auth-api";
import { FieldError, FormMessage } from "./auth-shell";
import { GoogleAuthButton } from "./google-auth-button";

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
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key, messages[0] ?? ""])));
      } else {
        setMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-5">
        <GoogleAuthButton mode={mode} />
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative bg-surface-card px-3 text-xs text-muted font-medium select-none">
            {isRegister ? "hoặc đăng ký bằng email" : "hoặc đăng nhập bằng email"}
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <label className="block space-y-1.5 text-xs font-semibold text-primary">
            <span>Họ và tên</span>
            <input
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              name="name"
              autoComplete="name"
              required
              maxLength={255}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-md border border-border-strong text-primary text-sm focus:border-action-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <FieldError id="name-error" message={errors.name} />
          </label>
        )}
        <label className="block space-y-1.5 text-xs font-semibold text-primary">
          <span>Email</span>
          <input
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-md border border-border-strong text-primary text-sm focus:border-action-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          <FieldError id="email-error" message={errors.email} />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-primary">
          <span>Mật khẩu</span>
          <input
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-md border border-border-strong text-primary text-sm focus:border-action-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          <FieldError id="password-error" message={errors.password} />
        </label>
        {isRegister && (
          <label className="block space-y-1.5 text-xs font-semibold text-primary">
            <span>Nhập lại mật khẩu</span>
            <input
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-md border border-border-strong text-primary text-sm focus:border-action-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </label>
        )}
        {message && <FormMessage message={message} error />}
        <button
          className="w-full min-h-[46px] flex items-center justify-center rounded-md bg-action-primary hover:bg-[#006194] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 mt-2"
          type="submit"
          disabled={busy}
        >
          {busy ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-secondary">
        {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link href={isRegister ? "/login" : "/register"} className="text-action-primary font-semibold hover:underline">
          {isRegister ? "Đăng nhập" : "Tạo tài khoản"}
        </Link>
      </p>
    </>
  );
}
