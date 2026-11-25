import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/lib/auth-context";
import { listNotifications } from "@/lib/notifications/api";
import type { NotificationPage } from "@/lib/notifications/types";
import { getQueryClient, QueryProvider } from "@/lib/query-provider";
import { PortalSidebar } from "./portal-sidebar";
import { SiteHeader } from "./site-header";

let pathname = "/";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/notifications/api", () => ({ listNotifications: vi.fn(), markNotificationRead: vi.fn() }));

type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;
const signOut = vi.fn();

function signedInAs(user: Partial<AuthUser> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: { id: "user-1", name: "Mai Thị Nguyễn", email: "mai@example.test", is_admin: false, ...user } as AuthUser,
    refreshUser: vi.fn(),
    signOut,
  });
}

function page(unread: number): NotificationPage {
  return { data: [], unread_count: unread, unread_by_audience: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

function withQueries(node: ReactNode) {
  return render(<QueryProvider>{node}</QueryProvider>);
}

beforeEach(() => {
  vi.resetAllMocks();
  pathname = "/";
  vi.mocked(listNotifications).mockResolvedValue(page(0));
});
afterEach(() => {
  cleanup();
  getQueryClient().clear();
});

describe("SiteHeader", () => {
  it("offers sign-in and registration to guests", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "guest", user: null, refreshUser: vi.fn(), signOut });
    pathname = "/listings";
    withQueries(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Đăng nhập" }).getAttribute("href")).toBe("/login");
    expect(screen.getAllByRole("link", { name: /Đăng ký/ }).length).toBeGreaterThan(0);
    const main = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(main.querySelector('[aria-current="page"]')?.textContent).toBe("Tìm nhà cho bạn");
    expect(listNotifications).not.toHaveBeenCalled();
  });

  it("shows the account menu, unread count and admin link for a signed-in admin", async () => {
    signedInAs({ is_admin: true });
    vi.mocked(listNotifications).mockResolvedValue(page(3));
    withQueries(<SiteHeader />);

    expect(await screen.findByRole("link", { name: "Thông báo, 3 chưa đọc" })).toBeTruthy();
    expect(screen.getByLabelText("Tài khoản của Mai Thị Nguyễn")).toBeTruthy();
    expect(screen.getAllByText("TN").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Quản lý" }).getAttribute("href")).toBe("/admin");
    expect(screen.getByRole("link", { name: "Hồ sơ của bạn" }).getAttribute("href")).toBe("/profile");
    expect(listNotifications).toHaveBeenCalledWith(["OWNER", "TENANT"], 1);
  });

  it("hides the admin link for regular users and reports a failed sign-out", async () => {
    const user = userEvent.setup();
    signedInAs();
    signOut.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    withQueries(<SiteHeader />);

    expect(screen.queryByRole("link", { name: "Quản lý" })).toBeNull();
    expect(await screen.findByRole("link", { name: "Thông báo" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Đăng xuất chưa hoàn tất. Vui lòng thử lại.");

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it("lists the same destinations in the mobile menu", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "guest", user: null, refreshUser: vi.fn(), signOut });
    withQueries(<SiteHeader />);

    const mobile = screen.getByRole("navigation", { name: "Điều hướng trên điện thoại" });
    const labels = Array.from(mobile.querySelectorAll("a")).map((link) => link.textContent);
    expect(labels).toEqual(expect.arrayContaining(["Tìm nhà cho bạn", "Hướng dẫn", "FAQ", "Cổng cư dân", "Cổng chủ nhà", "Đăng ký tài khoản"]));
  });
});

describe("PortalSidebar", () => {
  it("shows the tenant portal with a live unread badge on notifications only", async () => {
    signedInAs();
    pathname = "/tenant/requests";
    vi.mocked(listNotifications).mockResolvedValue(page(5));
    withQueries(<PortalSidebar />);

    const nav = screen.getAllByRole("navigation", { name: "Điều hướng các Cổng" })[0];
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toContain("Yêu cầu thuê");
    await waitFor(() => expect(nav.textContent).toContain("5"));
    expect(listNotifications).toHaveBeenCalledWith(["TENANT"], 1);
    expect(screen.getAllByRole("link", { name: /Sang Cổng Chủ Nhà/ })[0].getAttribute("href")).toBe("/owner");
  });

  it("switches to the owner portal and opens the mobile menu", async () => {
    const user = userEvent.setup();
    signedInAs();
    pathname = "/owner/properties";
    withQueries(<PortalSidebar />);

    const nav = screen.getAllByRole("navigation", { name: "Điều hướng các Cổng" })[0];
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toContain("Bất động sản");
    await waitFor(() => expect(listNotifications).toHaveBeenCalledWith(["OWNER"], 1));

    const toggle = screen.getByRole("button", { name: "Mở menu chuyển Cổng" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Đóng menu" }));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
