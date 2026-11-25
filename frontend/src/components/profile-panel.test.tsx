import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resendVerification, updatePassword, updateProfile } from "@/lib/auth/api";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http/client";
import { ProfilePanel } from "./profile-panel";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace, push: vi.fn() };
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/auth/api", () => ({
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  resendVerification: vi.fn(),
}));

const refreshUser = vi.fn();
type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;

function signedInAs(user: Partial<AuthUser> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: {
      id: "user-1",
      name: "Mai Nguyễn",
      email: "mai@example.test",
      phone: "0901234567",
      email_verified_at: "2026-11-01T00:00:00Z",
      ...user,
    } as AuthUser,
    refreshUser,
    signOut: vi.fn(),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  query = "";
  refreshUser.mockResolvedValue(undefined);
  signedInAs();
});
afterEach(cleanup);

describe("ProfilePanel", () => {
  it("shows the account and saves a trimmed name and phone", async () => {
    const user = userEvent.setup();
    vi.mocked(updateProfile).mockResolvedValue({ name: "Mai Trần", phone: null } as Awaited<ReturnType<typeof updateProfile>>);
    render(<ProfilePanel />);

    expect(screen.getByText("MN")).toBeTruthy();
    expect(screen.getByText("Email đã xác minh")).toBeTruthy();
    expect((screen.getByDisplayValue("mai@example.test") as HTMLInputElement).disabled).toBe(true);

    const name = screen.getByDisplayValue("Mai Nguyễn");
    await user.clear(name);
    await user.type(name, "  Mai Trần  ");
    await user.clear(screen.getByDisplayValue("0901234567"));
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect((await screen.findByRole("status")).textContent).toBe("Hồ sơ đã được cập nhật.");
    expect(updateProfile).toHaveBeenCalledWith({ name: "Mai Trần", phone: null });
    expect(refreshUser).toHaveBeenCalled();
    expect(screen.getByDisplayValue("Mai Trần")).toBeTruthy();
  });

  it("shows the API message when the profile cannot be saved", async () => {
    const user = userEvent.setup();
    vi.mocked(updateProfile).mockRejectedValue(new ApiError(422, "Số điện thoại không hợp lệ."));
    render(<ProfilePanel />);

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect((await screen.findByRole("status")).textContent).toBe("Số điện thoại không hợp lệ.");
  });

  it("lets an unverified user resend the verification email and reports failures", async () => {
    const user = userEvent.setup();
    signedInAs({ email_verified_at: null });
    vi.mocked(resendVerification)
      .mockResolvedValueOnce(undefined as never)
      .mockRejectedValueOnce(new Error("offline"));
    render(<ProfilePanel />);

    expect(screen.getByText("Email chưa xác nhận")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Gửi lại email xác thực" }));
    expect(await screen.findByText("Đã gửi lại liên kết xác minh. Vui lòng kiểm tra hộp thư của bạn.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Gửi lại email xác thực" }));
    expect(await screen.findByText("Chưa thể gửi email xác minh lúc này.")).toBeTruthy();
  });

  it("changes the password in a dialog and keeps the user signed in", async () => {
    const user = userEvent.setup();
    vi.mocked(updatePassword).mockResolvedValue(undefined as never);
    render(<ProfilePanel />);

    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
    const dialog = screen.getByRole("dialog", { name: "Cập nhật mật khẩu" });
    await user.type(within(dialog).getByLabelText("Mật khẩu hiện tại"), "old-secret");
    await user.type(within(dialog).getByLabelText("Mật khẩu mới"), "new-secret-123");
    await user.type(within(dialog).getByLabelText("Xác nhận mật khẩu mới"), "new-secret-123");
    await user.click(within(dialog).getByRole("button", { name: "Cập nhật mật khẩu" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updatePassword).toHaveBeenCalledWith({
      current_password: "old-secret",
      password: "new-secret-123",
      password_confirmation: "new-secret-123",
    });
    expect(screen.getByRole("status").textContent).toBe("Mật khẩu đã được cập nhật. Bạn vẫn đang đăng nhập.");
  });

  it("marks the wrong current password on its field and can be cancelled", async () => {
    const user = userEvent.setup();
    vi.mocked(updatePassword).mockRejectedValue(new ApiError(422, "Mật khẩu không đúng.", { current_password: ["Mật khẩu hiện tại không đúng."] }));
    render(<ProfilePanel />);

    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
    const dialog = screen.getByRole("dialog", { name: "Cập nhật mật khẩu" });
    await user.type(within(dialog).getByLabelText("Mật khẩu hiện tại"), "wrong");
    await user.type(within(dialog).getByLabelText("Mật khẩu mới"), "new-secret-123");
    await user.type(within(dialog).getByLabelText("Xác nhận mật khẩu mới"), "new-secret-123");
    await user.click(within(dialog).getByRole("button", { name: "Cập nhật mật khẩu" }));

    expect(await within(dialog).findByText("Mật khẩu hiện tại không đúng.")).toBeTruthy();
    expect(within(dialog).getByLabelText(/^Mật khẩu hiện tại/).getAttribute("aria-invalid")).toBe("true");
    expect(within(dialog).getByRole("status").textContent).toBe("Mật khẩu không đúng.");

    await user.click(within(dialog).getByRole("button", { name: "Hủy" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("confirms email verification from the link and lets the banner be closed", async () => {
    const user = userEvent.setup();
    query = "verified=1";
    render(<ProfilePanel />);

    expect(screen.getByText("Email của bạn đã được xác minh thành công.")).toBeTruthy();
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByText("Email của bạn đã được xác minh thành công.")).toBeNull();
  });

  it("sends a guest to login", async () => {
    vi.mocked(useAuth).mockReturnValue({ status: "guest", user: null, refreshUser, signOut: vi.fn() });
    render(<ProfilePanel />);

    expect(screen.getByText("Đang tải hồ sơ…")).toBeTruthy();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
