import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthForm } from "./auth-form";
import { TokenSettings } from "./api-tokens";
import { Profile } from "./profile";
import { IdentityGate } from "./ui";
import { ApiError } from "@/lib/identity/api";

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  csrf: vi.fn(),
  refresh: vi.fn(),
  clear: vi.fn(),
  logout: vi.fn(),
  push: vi.fn(),
  account: {
    id: "user-a",
    name: "User A",
    email: "a@example.com",
    phone: null,
    email_verified: true,
    is_admin: false,
  },
}));
vi.mock("@/lib/identity/api", async (original) => ({
  ...(await original<object>()),
  api: mocks.api,
  initializeCsrf: mocks.csrf,
}));
vi.mock("@/lib/identity/provider", async (original) => ({
  ...(await original<object>()),
  useIdentity: () => ({
    account: mocks.account,
    loading: false,
    recoveryStatus: null,
    refresh: mocks.refresh,
    clearPrivate: mocks.clear,
    logout: mocks.logout,
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
function tokens() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <TokenSettings userId="user-a" />
    </QueryClientProvider>,
  );
  return { client, ...view };
}
beforeEach(() => {
  mocks.api.mockReset();
  mocks.csrf.mockResolvedValue(undefined);
  mocks.refresh.mockResolvedValue(undefined);
  mocks.clear.mockResolvedValue(undefined);
  mocks.logout.mockResolvedValue(undefined);
});

describe("auth and recovery", () => {
  it("shows admin denial for a normal user without rendering protected content", () => {
    render(
      <IdentityGate admin>
        <p>Private admin content</p>
      </IdentityGate>,
    );
    expect(screen.getByRole("heading", { name: "403" })).toBeVisible();
    expect(screen.queryByText("Private admin content")).not.toBeInTheDocument();
  });

  it("logs in after CSRF initialization and clears private data before switching accounts", async () => {
    mocks.api.mockResolvedValue(undefined);
    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText("Email"), "hien@example.com");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/profile"));
    expect(mocks.csrf).toHaveBeenCalledOnce();
    expect(mocks.clear.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.api.mock.invocationCallOrder[0],
    );
    expect(mocks.api).toHaveBeenCalledWith("/login", {
      method: "POST",
      body: { email: "hien@example.com", password: "Password123" },
    });
  });
  it("retains safe email after 419, clears password and requires explicit resubmission", async () => {
    mocks.api.mockRejectedValue(new ApiError(419));
    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText("Email"), "hien@example.com");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Phiên bảo mật đã hết hạn",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("hien@example.com");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("");
    expect(mocks.api).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("shows server field errors on registration", async () => {
    mocks.api.mockRejectedValue(
      new ApiError(422, { email: ["Email đã được sử dụng"] }),
    );
    render(<AuthForm mode="register" />);
    await userEvent.type(screen.getByLabelText("Họ và tên"), "Hien");
    await userEvent.type(screen.getByLabelText("Email"), "hien@example.com");
    await userEvent.type(
      screen.getByLabelText("Mật khẩu"),
      "StrongPassword123",
    );
    await userEvent.type(
      screen.getByLabelText("Nhập lại mật khẩu"),
      "StrongPassword123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Tạo tài khoản" }),
    );
    expect(await screen.findByText("Email đã được sử dụng")).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
  it("does not claim logout succeeded when the server request fails", async () => {
    mocks.logout.mockRejectedValue(new Error("network"));
    render(<Profile />);
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không nhận được phản hồi",
    );
    expect(screen.getByLabelText("Họ và tên")).toHaveValue("User A");
  });
});
describe("one-time API tokens", () => {
  const metadata = {
    id: "1",
    name: "Tool",
    abilities: ["account:read"],
    created_at: "2026-10-24T00:00:00Z",
    last_used_at: null,
    expires_at: "2026-10-31T00:00:00Z",
    status: "active",
  };
  it("shows/copies plaintext only locally, clears it on leaving, and never caches it", async () => {
    const persist = vi.fn();
    vi.stubGlobal("localStorage", { setItem: persist });
    const clipboard = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: clipboard },
      configurable: true,
    });
    mocks.api.mockImplementation(
      async (path: string, options?: { method?: string }) =>
        options?.method === "POST" && path.endsWith("api-tokens")
          ? { data: metadata, plain_text_token: "1|one-time-secret" }
          : { data: [metadata], meta: { current_page: 1, last_page: 1 } },
    );
    const { client } = tokens();
    await userEvent.type(screen.getByLabelText("Tên token"), "Tool");
    await userEvent.click(screen.getByRole("button", { name: "Tạo token" }));
    expect(await screen.findByText("1|one-time-secret")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Sao chép token" }),
    );
    expect(clipboard).toHaveBeenCalledWith("1|one-time-secret");
    expect(
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      ),
    ).not.toContain("one-time-secret");
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(persist).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(screen.queryByText("1|one-time-secret")).not.toBeInTheDocument();
  });
  it("does not replay a lost creation response and guides the user to refresh/revoke", async () => {
    mocks.api.mockImplementation(
      async (_path: string, options?: { method?: string }) => {
        if (options?.method === "POST") throw new TypeError("network");
        return { data: [], meta: { current_page: 1, last_page: 1 } };
      },
    );
    tokens();
    await userEvent.type(screen.getByLabelText("Tên token"), "Lost response");
    await userEvent.click(screen.getByRole("button", { name: "Tạo token" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Phản hồi tạo token có thể đã bị mất",
    );
    expect(
      mocks.api.mock.calls.filter(([, options]) => options?.method === "POST"),
    ).toHaveLength(1);
  });
  it("requires explicit confirmation before revocation and then updates the metadata list", async () => {
    mocks.api.mockImplementation(
      async (_path: string, options?: { method?: string }) =>
        options?.method === "DELETE"
          ? undefined
          : { data: [metadata], meta: { current_page: 1, last_page: 1 } },
    );
    tokens();
    await userEvent.click(
      await screen.findByRole("button", { name: "Thu hồi" }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      mocks.api.mock.calls.some(([, options]) => options?.method === "DELETE"),
    ).toBe(false);
    await userEvent.click(
      screen.getByRole("button", { name: "Xác nhận thu hồi" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(mocks.api).toHaveBeenCalledWith("/api/v1/account/api-tokens/1", {
      method: "DELETE",
    });
  });
  it("clears a displayed secret when the session fails", async () => {
    mocks.api.mockImplementation(
      async (_path: string, options?: { method?: string }) =>
        options?.method === "POST"
          ? { data: metadata, plain_text_token: "1|private" }
          : { data: [], meta: { current_page: 1, last_page: 1 } },
    );
    tokens();
    fireEvent.change(screen.getByLabelText("Tên token"), {
      target: { value: "Tool" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Tạo token" }));
    expect(await screen.findByText("1|private")).toBeVisible();
    act(() => {
      window.dispatchEvent(new Event("identity:clear-secret"));
    });
    expect(screen.queryByText("1|private")).not.toBeInTheDocument();
  });
});
