import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgotPassword, resetPassword } from "@/lib/auth/api";
import { ApiError } from "@/lib/http/client";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

let query = "";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query) }));
vi.mock("@/lib/auth/api", () => ({ forgotPassword: vi.fn(), resetPassword: vi.fn() }));

function input(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!element) throw new Error(`Missing input ${name}`);
  return element;
}

beforeEach(() => {
  vi.resetAllMocks();
  query = "";
});
afterEach(cleanup);

describe("ForgotPasswordForm", () => {
  it("validates the email before sending anything", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const submit = screen.getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" });

    await user.click(submit);
    expect(screen.getByText("Vui lòng nhập địa chỉ email của bạn.")).toBeTruthy();

    input("email").removeAttribute("type");
    await user.type(input("email"), "mai@");
    await user.click(submit);
    expect(screen.getByText("Địa chỉ email không phù hợp (ví dụ: name@example.com).")).toBeTruthy();
    expect(input("email").getAttribute("aria-invalid")).toBe("true");
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("sends the request and shows the confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue({ message: "" } as Awaited<ReturnType<typeof forgotPassword>>);
    render(<ForgotPasswordForm />);

    await user.type(input("email"), "  mai@example.test ");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" }));

    expect(await screen.findByText("Đã gửi hướng dẫn khôi phục")).toBeTruthy();
    expect(screen.getByText("Hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.")).toBeTruthy();
    expect(forgotPassword).toHaveBeenCalledWith({ email: "mai@example.test" });
  });

  it.each([
    ["rate limiting", new ApiError(429, "Too many"), "Bạn thao tác quá nhanh. Vui lòng chờ 1 phút rồi thử lại."],
    ["a field error", new ApiError(422, "Invalid", { email: ["Email chưa được đăng ký."] }), "Email chưa được đăng ký."],
    ["another API error", new ApiError(500, "Máy chủ đang bảo trì."), "Máy chủ đang bảo trì."],
    ["a network failure", new TypeError("Failed to fetch"), "Không thể kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng."],
  ])("explains %s", async (_case, failure, message) => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockRejectedValue(failure);
    render(<ForgotPasswordForm />);

    await user.type(input("email"), "mai@example.test");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" }));

    expect(await screen.findByText(message)).toBeTruthy();
  });
});

describe("ResetPasswordForm", () => {
  it("rejects a link without a token or email", () => {
    query = "token=abc";
    render(<ResetPasswordForm />);

    expect(screen.getByText("Liên kết không hợp lệ hoặc thiếu thông tin")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Yêu cầu liên kết mới" }).getAttribute("href")).toBe("/forgot-password");
  });

  it.each([
    ["", "", "Vui lòng nhập mật khẩu mới."],
    ["short1", "short1", "Mật khẩu phải có ít nhất 8 ký tự."],
    ["onlyletters", "onlyletters", "Mật khẩu phải bao gồm cả chữ cái và chữ số."],
    ["secret123", "secret124", "Mật khẩu xác nhận không khớp."],
  ])("validates %j / %j before submitting", async (password, confirmation, message) => {
    const user = userEvent.setup();
    query = "token=abc&email=mai%40example.test";
    render(<ResetPasswordForm />);

    if (password) await user.type(input("password"), password);
    if (confirmation) await user.type(input("password_confirmation"), confirmation);
    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lại mật khẩu" }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password and points to login", async () => {
    const user = userEvent.setup();
    query = "token=abc&email=mai%40example.test";
    vi.mocked(resetPassword).mockResolvedValue(undefined as never);
    render(<ResetPasswordForm />);

    expect(screen.getByDisplayValue("mai@example.test")).toBeTruthy();
    await user.type(input("password"), "secret123");
    await user.type(input("password_confirmation"), "secret123");
    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lại mật khẩu" }));

    expect(await screen.findByText("Đặt lại mật khẩu thành công")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Đăng nhập bằng mật khẩu mới/ }).getAttribute("href")).toBe("/login");
    expect(resetPassword).toHaveBeenCalledWith({
      token: "abc",
      email: "mai@example.test",
      password: "secret123",
      password_confirmation: "secret123",
    });
  });

  it("offers a new link when the token has expired", async () => {
    const user = userEvent.setup();
    query = "token=old&email=mai%40example.test";
    vi.mocked(resetPassword).mockRejectedValue(new ApiError(422, "", { email: ["Mã đặt lại không hợp lệ."] }));
    render(<ResetPasswordForm />);

    await user.type(input("password"), "secret123");
    await user.type(input("password_confirmation"), "secret123");
    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lại mật khẩu" }));

    expect(await screen.findByText("Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Yêu cầu liên kết đặt lại mật khẩu mới/ }).getAttribute("href")).toBe("/forgot-password");
  });

  it("explains a network failure", async () => {
    const user = userEvent.setup();
    query = "token=abc&email=mai%40example.test";
    vi.mocked(resetPassword).mockRejectedValue(new TypeError("Failed to fetch"));
    render(<ResetPasswordForm />);

    await user.type(input("password"), "secret123");
    await user.type(input("password_confirmation"), "secret123");
    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lại mật khẩu" }));

    expect(await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại sau.")).toBeTruthy();
  });
});
