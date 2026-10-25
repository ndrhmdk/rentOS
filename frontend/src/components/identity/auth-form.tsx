/* eslint-disable @next/next/no-img-element -- Exact local Figma action icon. */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, api, initializeCsrf } from "@/lib/identity/api";
import { useIdentity } from "@/lib/identity/provider";
import { Feedback, Field } from "./ui";

export type AuthMode = "login" | "register" | "forgot" | "reset";
const headings: Record<AuthMode, string> = {
  login: "Đăng nhập",
  register: "Tạo tài khoản",
  forgot: "Quên mật khẩu?",
  reset: "Đặt lại mật khẩu",
};
export function AuthForm({
  mode,
  token = "",
  initialEmail = "",
}: {
  mode: AuthMode;
  token?: string;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState("");
  const sending = useRef(false);
  const router = useRouter();
  const { refresh, clearPrivate } = useIdentity();
  const fields = error instanceof ApiError ? error.errors : {};
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    setSuccess("");
    try {
      await initializeCsrf();
      if (["login", "register"].includes(mode)) await clearPrivate();
      const paths = {
        login: "/login",
        register: "/register",
        forgot: "/forgot-password",
        reset: "/reset-password",
      };
      const body = {
        email,
        ...(mode === "register" ? { name } : {}),
        ...(mode !== "forgot" ? { password } : {}),
        ...(["register", "reset"].includes(mode)
          ? { password_confirmation: confirmation }
          : {}),
        ...(mode === "reset" ? { token } : {}),
      };
      await api(paths[mode], { method: "POST", body });
      if (mode === "login" || mode === "register") {
        await refresh();
        router.push(mode === "register" ? "/verify-email" : "/profile");
      } else
        setSuccess(
          mode === "forgot"
            ? "Nếu tài khoản phù hợp tồn tại, liên kết đặt lại mật khẩu sẽ được gửi tới email của bạn."
            : "Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.",
        );
    } catch (caught) {
      setError(caught);
    } finally {
      setPassword("");
      setConfirmation("");
      setBusy(false);
      sending.current = false;
    }
  }
  return (
    <>
      <div>
        <h1>{headings[mode]}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Tiếp tục hành trình của bạn cùng rentOS."
            : mode === "register"
              ? "Một tài khoản để tìm nhà và quản lý cho thuê."
              : "Khôi phục quyền truy cập tài khoản của bạn."}
        </p>
      </div>
      {["login", "register"].includes(mode) && (
        <>
          <button className="social-soon" disabled>
            G · Tiếp tục với Google · sắp ra mắt
          </button>
          <div className="auth-divider">
            <span />
            hoặc dùng email
            <span />
          </div>
        </>
      )}
      <Feedback error={error} success={success} />
      <form onSubmit={submit} className="identity-form">
        {mode === "register" && (
          <Field
            label="Họ và tên"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            error={fields.name}
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          error={fields.email}
        />
        {mode !== "forgot" && (
          <Field
            label="Mật khẩu"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            error={fields.password}
            hint={
              mode === "login"
                ? undefined
                : "Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường và số."
            }
          />
        )}
        {["register", "reset"].includes(mode) && (
          <Field
            label="Nhập lại mật khẩu"
            name="password_confirmation"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
            error={fields.password_confirmation}
          />
        )}
        {mode === "login" && (
          <div className="auth-options">
            <label>
              <input type="checkbox" disabled /> Ghi nhớ đăng nhập{" "}
              <small>(sắp ra mắt)</small>
            </label>
            <Link href="/forgot-password">Quên mật khẩu?</Link>
          </div>
        )}
        <button
          className="primary-button full-width"
          disabled={busy || (mode === "reset" && !token)}
        >
          {busy ? "Đang gửi…" : headings[mode]}
          <img src="/identity/arrow-white.svg" width="14" height="14" alt="" />
        </button>
      </form>
      {mode === "login" ? (
        <p className="auth-bottom">
          Chưa có tài khoản? <Link href="/register">Tạo tài khoản</Link>
        </p>
      ) : (
        <p className="auth-bottom">
          <Link href="/login">Quay lại đăng nhập</Link>
        </p>
      )}
    </>
  );
}
