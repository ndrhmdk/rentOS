"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, login, registerAccount } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { FieldError, FormMessage } from "./auth-shell";
import { GoogleAuthButton } from "./google-auth-button";

type AuthMode = "login" | "register";

export function AccountForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
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
        await refreshUser();
        router.push("/profile");
        return;
      }

      await login({
        email: String(values.get("email") ?? ""),
        password: String(values.get("password") ?? ""),
      });
      await refreshUser();
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
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative bg-white px-3 text-xs text-slate-400 font-medium select-none">
            hoặc dùng email
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
            <span>Họ và tên</span>
            <input
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              name="name"
              autoComplete="name"
              placeholder="Nhập họ và tên của bạn"
              required
              maxLength={255}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:border-[#3368a0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <FieldError id="name-error" message={errors.name} />
          </label>
        )}
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
          <span>Email</span>
          <input
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={isRegister ? "Nhập địa chỉ email của bạn" : "mai.nguyen@email.com"}
            required
            maxLength={255}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:border-[#3368a0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          <FieldError id="email-error" message={errors.email} />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
          <span>Mật khẩu</span>
          <input
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:border-[#3368a0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          <FieldError id="password-error" message={errors.password} />
          {isRegister && (
            <span className="block text-[11px] text-slate-500 font-normal mt-1">
              Ít nhất 8 ký tự, bao gồm chữ và số.
            </span>
          )}
        </label>
        {isRegister && (
          <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
            <span>Xác nhận mật khẩu</span>
            <input
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:border-[#3368a0] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </label>
        )}

        {/* Remember me & Forgot password for Login */}
        {!isRegister && (
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
              <input
                type="checkbox"
                name="remember"
                className="w-4 h-4 rounded border-slate-300 text-[#3368a0] focus:ring-[#3368a0]"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link
              href="/login"
              className="text-[#3368a0] hover:text-[#285584] font-medium hover:underline transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
        )}

        {/* Terms of Service Checkbox & Role Note for Register */}
        {isRegister && (
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 leading-snug">
              <input
                type="checkbox"
                required
                defaultChecked
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#3368a0] focus:ring-[#3368a0]"
              />
              <span>
                Tôi đồng ý với Điều khoản sử dụng và Chính sách riêng tư của rentOS.
              </span>
            </label>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <p>
                Không cần chọn vai trò khi đăng ký. Bạn trở thành người thuê khi bắt đầu thuê nhà, và trở thành chủ nhà khi bắt đầu đăng tin cho thuê. Cùng một tài khoản cho cả hai.
              </p>
            </div>
          </div>
        )}

        {message && <FormMessage message={message} error />}

        <button
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 mt-3"
          type="submit"
          disabled={busy}
        >
          <span>{busy ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}</span>
          <span aria-hidden="true" className="text-base font-normal">&rarr;</span>
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link href={isRegister ? "/login" : "/register"} className="text-[#3368a0] font-semibold hover:underline">
          {isRegister ? "Đăng nhập" : "Tạo tài khoản"}
        </Link>
      </p>
    </>
  );
}
