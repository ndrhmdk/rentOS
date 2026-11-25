import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "@/lib/http/client";
import {
  registerAccount,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updatePassword,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "./api";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles registerAccount", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);
    await registerAccount({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      password_confirmation: "password123",
    });

    expect(client.request).toHaveBeenCalledWith("/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        password_confirmation: "password123",
      }),
    });
  });

  it("handles login", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);
    await login({
      email: "alice@example.com",
      password: "password123",
      remember: true,
    });

    expect(client.request).toHaveBeenCalledWith("/login", {
      method: "POST",
      body: JSON.stringify({
        email: "alice@example.com",
        password: "password123",
        remember: true,
      }),
    });
  });

  it("handles logout", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);
    await logout();
    expect(client.request).toHaveBeenCalledWith("/logout", {
      method: "POST",
      body: "{}",
    });
  });

  it("handles getCurrentUser", async () => {
    const user = { id: 1, name: "Alice", email: "alice@example.com", role: "tenant" };
    vi.mocked(client.request).mockResolvedValueOnce(user);
    const res = await getCurrentUser();
    expect(client.request).toHaveBeenCalledWith("/api/v1/me");
    expect(res).toEqual(user);
  });

  it("handles updateProfile", async () => {
    const updated = { id: 1, name: "Alice New", email: "alice@example.com", role: "tenant", phone: "0901234567" };
    vi.mocked(client.request).mockResolvedValueOnce(updated);
    const res = await updateProfile({ name: "Alice New", phone: "0901234567" });
    expect(client.request).toHaveBeenCalledWith("/api/v1/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Alice New", phone: "0901234567" }),
    });
    expect(res).toEqual(updated);
  });

  it("handles updatePassword", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);
    await updatePassword({
      current_password: "old",
      password: "new",
      password_confirmation: "new",
    });
    expect(client.request).toHaveBeenCalledWith("/user/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: "old",
        password: "new",
        password_confirmation: "new",
      }),
    });
  });

  it("handles resendVerification", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);
    await resendVerification();
    expect(client.request).toHaveBeenCalledWith("/email/verification-notification", {
      method: "POST",
      body: "{}",
    });
  });

  it("handles forgotPassword", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ message: "Link sent" });
    const res = await forgotPassword({ email: "alice@example.com" });
    expect(client.request).toHaveBeenCalledWith("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "alice@example.com" }),
    });
    expect(res).toEqual({ message: "Link sent" });
  });

  it("handles resetPassword", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ message: "Password reset successfully" });
    const res = await resetPassword({
      token: "tok-1",
      email: "alice@example.com",
      password: "newpass",
      password_confirmation: "newpass",
    });
    expect(client.request).toHaveBeenCalledWith("/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: "tok-1",
        email: "alice@example.com",
        password: "newpass",
        password_confirmation: "newpass",
      }),
    });
    expect(res).toEqual({ message: "Password reset successfully" });
  });
});
