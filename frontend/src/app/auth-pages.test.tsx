import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/lib/auth-context";
import ForgotPasswordPage from "./forgot-password/page";
import SignInPage from "./login/page";
import RegisterPage from "./register/page";
import ResetPasswordPage from "./reset-password/page";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace, push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams("token=abc&email=mai%40example.test"),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/auth/api", () => ({
  login: vi.fn(),
  registerAccount: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

type Auth = ReturnType<typeof useAuth>;

function authAs(status: Auth["status"], user: Auth["user"] = null) {
  vi.mocked(useAuth).mockReturnValue({ status, user, refreshUser: vi.fn(), signOut: vi.fn() });
}

beforeEach(() => {
  vi.resetAllMocks();
  authAs("guest");
});
afterEach(cleanup);

describe("account pages", () => {
  it("shows the sign-in form beside the welcome panel", () => {
    render(<SignInPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Đăng nhập" })).toBeTruthy();
    const panel = screen.getByRole("complementary", { name: "Thông tin về rentOS" });
    expect(panel.textContent).toContain("Chào mừng bạn trở về.");
    expect(panel.textContent).toContain("Một tài khoản dùng cho cả tìm nhà và quản lý cho thuê.");
    expect(screen.getByRole("img", { name: "Không gian sống rentOS" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("shows registration with its eyebrow and the default panel footer", () => {
    render(<RegisterPage />);

    expect(screen.getByText("BẮT ĐẦU CÙNG RENTOS")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Tạo tài khoản" })).toBeTruthy();
    expect(screen.getByText("Một tài khoản. Nhiều khởi đầu mới.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeTruthy();
  });

  it("shows the password recovery pages", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Quên mật khẩu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" })).toBeTruthy();
    cleanup();

    render(<ResetPasswordPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Đặt lại mật khẩu" })).toBeTruthy();
    expect(screen.getByDisplayValue("mai@example.test")).toBeTruthy();
  });

  it("waits while the session is checked", () => {
    authAs("loading");
    render(<SignInPage />);

    expect(screen.getByRole("status").textContent).toBe("Đang kiểm tra phiên làm việc…");
    expect(screen.queryByRole("heading", { name: "Đăng nhập" })).toBeNull();
  });

  it("sends a signed-in user away from the account pages", async () => {
    authAs("authenticated", { id: "u1", email_verified_at: null } as Auth["user"]);
    render(<RegisterPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"));

    cleanup();
    authAs("authenticated", { id: "u1", email_verified_at: "2026-11-01T00:00:00Z" } as Auth["user"]);
    render(<SignInPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenLastCalledWith("/"));
  });
});
