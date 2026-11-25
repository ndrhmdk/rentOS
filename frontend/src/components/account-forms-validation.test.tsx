import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, registerAccount } from "@/lib/auth/api";
import { ApiError } from "@/lib/http/client";
import { AccountForm } from "./account-forms";

const mockPush = vi.fn();
const refreshUser = vi.fn();
const mockRouter = { push: mockPush, replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ refreshUser }) }));
vi.mock("@/lib/auth/api", () => ({ login: vi.fn(), registerAccount: vi.fn() }));

function field(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!element) throw new Error(`Missing input ${name}`);
  element.removeAttribute("required");
  element.removeAttribute("type");
  return element;
}

async function fillRegister(user: ReturnType<typeof userEvent.setup>, values: Partial<Record<"name" | "email" | "password" | "password_confirmation", string>>) {
  for (const [name, value] of Object.entries(values)) {
    if (value) await user.type(field(name), value);
  }
  for (const name of ["name", "email", "password", "password_confirmation"]) field(name);
  await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

describe("register form", () => {
  it.each([
    [{}, ["Vui lòng nhập họ và tên của bạn.", "Vui lòng nhập địa chỉ email.", "Vui lòng nhập mật khẩu.", "Vui lòng nhập lại mật khẩu xác nhận."]],
    [{ name: "Mai", email: "mai@", password: "short1", password_confirmation: "short1" }, ["Địa chỉ email không phù hợp (ví dụ: name@example.com).", "Mật khẩu phải có ít nhất 8 ký tự."]],
    [{ name: "Mai", email: "mai@example.test", password: "onlyletters", password_confirmation: "other" }, ["Mật khẩu không phù hợp. Phải bao gồm cả chữ cái và chữ số.", "Mật khẩu không trùng nhau. Vui lòng kiểm tra lại."]],
  ])("checks %j before calling the API", async (values, messages) => {
    const user = userEvent.setup();
    render(<AccountForm mode="register" />);

    await fillRegister(user, values);

    for (const message of messages) expect(screen.getByText(message)).toBeTruthy();
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it("clears a field error once the user edits that field", async () => {
    const user = userEvent.setup();
    render(<AccountForm mode="register" />);
    await fillRegister(user, {});

    expect(screen.getByText("Vui lòng nhập họ và tên của bạn.")).toBeTruthy();
    await user.type(field("name"), "M");
    expect(screen.queryByText("Vui lòng nhập họ và tên của bạn.")).toBeNull();
    expect(screen.getByText("Vui lòng nhập địa chỉ email.")).toBeTruthy();
  });

  it("creates the account and opens the profile", async () => {
    const user = userEvent.setup();
    vi.mocked(registerAccount).mockResolvedValue(undefined as never);
    render(<AccountForm mode="register" />);

    await fillRegister(user, { name: "  Mai Nguyễn ", email: " mai@example.test ", password: "secret123", password_confirmation: "secret123" });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/profile"));
    expect(registerAccount).toHaveBeenCalledWith({ name: "Mai Nguyễn", email: "mai@example.test", password: "secret123", password_confirmation: "secret123" });
    expect(refreshUser).toHaveBeenCalled();
  });

  it("translates the API's field errors", async () => {
    const user = userEvent.setup();
    vi.mocked(registerAccount).mockRejectedValue(new ApiError(422, "Invalid", {
      email: ["The email has already been taken."],
      password_confirmation: ["The password confirmation does not match."],
      password: ["The password must be at least 8 characters."],
      name: ["Tên quá dài."],
    }));
    render(<AccountForm mode="register" />);

    await fillRegister(user, { name: "Mai", email: "mai@example.test", password: "secret123", password_confirmation: "secret123" });

    expect(await screen.findByText("Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.")).toBeTruthy();
    expect(screen.getByText("Mật khẩu không trùng nhau. Vui lòng kiểm tra lại.")).toBeTruthy();
    expect(screen.getByText("Mật khẩu phải có ít nhất 8 ký tự.")).toBeTruthy();
    expect(screen.getByText("Tên quá dài.")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("login form", () => {
  async function submitLogin(email = "mai@example.test", password = "secret") {
    const user = userEvent.setup();
    render(<AccountForm mode="login" />);
    if (email) await user.type(field("email"), email);
    if (password) await user.type(field("password"), password);
    field("email");
    field("password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
  }

  it("requires an email and password", async () => {
    await submitLogin("", "");
    expect(screen.getByText("Vui lòng nhập địa chỉ email.")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it("sends a verified user home and an unverified user to the profile", async () => {
    vi.mocked(login).mockResolvedValue(undefined as never);
    refreshUser.mockResolvedValueOnce({ email_verified_at: "2026-11-01T00:00:00Z" });
    await submitLogin();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));

    cleanup();
    refreshUser.mockResolvedValueOnce({ email_verified_at: null });
    await submitLogin();
    await waitFor(() => expect(mockPush).toHaveBeenLastCalledWith("/profile"));
  });

  it.each([
    ["wrong credentials", new ApiError(401, "Unauthenticated"), "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."],
    ["Fortify's credential message", new ApiError(422, "These credentials do not match our records."), "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."],
    ["another API error", new ApiError(429, "Quá nhiều lần thử. Vui lòng chờ."), "Quá nhiều lần thử. Vui lòng chờ."],
    ["a network failure", new TypeError("Failed to fetch"), "Không thể kết nối máy chủ. Vui lòng thử lại."],
  ])("explains %s", async (_case, failure, message) => {
    vi.mocked(login).mockRejectedValue(failure);
    await submitLogin();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
