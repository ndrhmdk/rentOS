import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http/client";
import { listNotifications, markNotificationRead } from "@/lib/notifications/api";
import type { InboxNotification, NotificationPage } from "@/lib/notifications/types";
import { getQueryClient, QueryProvider } from "@/lib/query-provider";
import { AllNotifications } from "./all-notifications";
import { NotificationInbox } from "./notification-inbox";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/notifications/api", () => ({ listNotifications: vi.fn(), markNotificationRead: vi.fn() }));

function notification(overrides: Partial<InboxNotification>): InboxNotification {
  return {
    id: "n-1",
    actor_id: null,
    audience: "OWNER",
    title: "Yêu cầu thuê mới",
    body: "Mai muốn thuê Phòng 101.",
    resource_type: "rental_request",
    resource_id: "request-1",
    read_at: null,
    created_at: "2026-11-24T08:00:00Z",
    ...overrides,
  };
}

function page(data: InboxNotification[], meta: Partial<NotificationPage["meta"]> = {}): NotificationPage {
  return {
    data,
    unread_count: data.filter((item) => item.read_at == null).length,
    unread_by_audience: {},
    meta: { current_page: 1, last_page: 1, per_page: 20, total: data.length, ...meta },
  };
}

function signedIn() {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: { id: "user-1", name: "Linh" } as NonNullable<ReturnType<typeof useAuth>["user"]>,
    refreshUser: vi.fn(),
    signOut: vi.fn(),
  });
}

function withQueries(node: ReactNode) {
  return render(<QueryProvider>{node}</QueryProvider>);
}

const ownerItems = [
  notification({ id: "n-1" }),
  notification({ id: "n-2", title: "Hợp đồng đã xác nhận", resource_type: "tenancy", resource_id: "tenancy-1", read_at: "2026-11-24T09:00:00Z" }),
  notification({ id: "n-3", title: "Tin đăng đã duyệt", resource_type: "listing", resource_id: "listing-1" }),
  notification({ id: "n-4", title: "Thông báo hệ thống", resource_type: null, resource_id: null, read_at: "2026-11-24T09:00:00Z" }),
];

beforeEach(() => {
  vi.resetAllMocks();
  signedIn();
});
afterEach(() => {
  cleanup();
  getQueryClient().clear();
});

describe("NotificationInbox", () => {
  it("lists notifications with links to the right screen for the audience", async () => {
    vi.mocked(listNotifications).mockResolvedValue(page(ownerItems));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    expect(screen.getByLabelText("Đang tải thông báo")).toBeTruthy();
    expect(await screen.findByText("Yêu cầu thuê mới")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xem yêu cầu thuê" }).getAttribute("href")).toBe("/owner/requests/request-1");
    expect(screen.getByRole("link", { name: "Xem kỳ thuê" }).getAttribute("href")).toBe("/owner/tenancies/tenancy-1");
    expect(screen.getByRole("link", { name: "Xem tin đăng" }).getAttribute("href")).toBe("/owner/listings/listing-1");
    expect(screen.getAllByRole("button", { name: "Đánh dấu đã đọc" })).toHaveLength(2);
    expect(listNotifications).toHaveBeenCalledWith(["OWNER"], 1);
  });

  it("links tenant and admin notifications to their own screens", async () => {
    vi.mocked(listNotifications).mockResolvedValue(page([
      notification({ id: "t-1", audience: "TENANT", resource_type: "rental_request", resource_id: "request-2" }),
      notification({ id: "t-2", audience: "TENANT", resource_type: "tenancy", resource_id: "tenancy-2", title: "Kỳ thuê" }),
      notification({ id: "a-1", audience: "ADMIN", resource_type: "listing", resource_id: "listing-2", title: "Tin chờ duyệt" }),
    ]));
    withQueries(<NotificationInbox audience="TENANT" headingId="tenant-notifications" />);

    expect((await screen.findByRole("link", { name: "Xem yêu cầu thuê" })).getAttribute("href")).toBe("/tenant/requests/request-2");
    expect(screen.getByRole("link", { name: "Xem kỳ thuê" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-2");
    expect(screen.getByRole("link", { name: "Xem hồ sơ duyệt" }).getAttribute("href")).toBe("/admin/review-queue/listing-2");
  });

  it("filters to unread items and shows an empty state", async () => {
    const user = userEvent.setup();
    vi.mocked(listNotifications).mockResolvedValue(page([notification({ read_at: "2026-11-24T09:00:00Z" })]));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    await screen.findByText("Yêu cầu thuê mới");
    await user.click(screen.getByRole("tab", { name: /Chưa đọc/ }));
    expect(screen.getByText("Không có thông báo chưa đọc trên trang này.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Chưa đọc/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("says when there are no notifications at all", async () => {
    vi.mocked(listNotifications).mockResolvedValue(page([]));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    expect(await screen.findByText("Bạn chưa có thông báo.")).toBeTruthy();
  });

  it("marks a notification read and lowers the unread count", async () => {
    const user = userEvent.setup();
    const first = notification({ id: "n-1" });
    vi.mocked(listNotifications)
      .mockResolvedValueOnce(page([first, notification({ id: "n-9", title: "Khác" })]))
      .mockResolvedValue(page([{ ...first, read_at: "2026-11-24T10:00:00Z" }, notification({ id: "n-9", title: "Khác" })]));
    vi.mocked(markNotificationRead).mockResolvedValue({ ...first, read_at: "2026-11-24T10:00:00Z" });
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    await screen.findByText("Yêu cầu thuê mới");
    expect(screen.getByRole("tab", { name: /Chưa đọc/ }).textContent).toContain("2");
    await user.click(screen.getAllByRole("button", { name: "Đánh dấu đã đọc" })[0]);

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Đánh dấu đã đọc" })).toHaveLength(1));
    expect(markNotificationRead).toHaveBeenCalledWith("n-1");
    expect(screen.getByRole("tab", { name: /Chưa đọc/ }).textContent).toContain("1");
  });

  it("shows why marking as read failed", async () => {
    const user = userEvent.setup();
    vi.mocked(listNotifications).mockResolvedValue(page([notification({})]));
    vi.mocked(markNotificationRead).mockRejectedValue(new ApiError(403, "Thông báo này không thuộc về bạn."));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    await user.click(await screen.findByRole("button", { name: "Đánh dấu đã đọc" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Thông báo này không thuộc về bạn.");
  });

  it("pages through older notifications", async () => {
    const user = userEvent.setup();
    vi.mocked(listNotifications).mockImplementation(async (_audiences, pageNumber) =>
      page([notification({ id: `p-${pageNumber}`, title: `Trang ${pageNumber}` })], { current_page: pageNumber, last_page: 2 }));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    await screen.findByText("Trang 1");
    expect((screen.getByRole("button", { name: "Trang trước" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(await screen.findByText("Trang 2")).toBeTruthy();
    expect(screen.getByText("2/2")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Trang sau" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers a retry when the inbox cannot load", async () => {
    const user = userEvent.setup();
    vi.mocked(listNotifications)
      .mockRejectedValueOnce(new ApiError(503, "Dịch vụ thông báo đang bận."))
      .mockRejectedValueOnce(new ApiError(503, "Dịch vụ thông báo đang bận."))
      .mockResolvedValue(page([notification({})]));
    withQueries(<NotificationInbox audience="OWNER" headingId="owner-notifications" />);

    expect(await screen.findByText("Dịch vụ thông báo đang bận.", {}, { timeout: 4000 })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Yêu cầu thuê mới")).toBeTruthy();
  });
});

describe("AllNotifications", () => {
  it("combines owner and tenant notifications and labels where each came from", async () => {
    vi.mocked(listNotifications).mockResolvedValue(page([
      notification({ id: "o-1", audience: "OWNER", title: "Cho chủ nhà" }),
      notification({ id: "t-1", audience: "TENANT", title: "Cho cư dân", resource_type: "tenancy", resource_id: "tenancy-3" }),
    ]));
    withQueries(<AllNotifications />);

    const list = await screen.findByText("Cho chủ nhà");
    expect(screen.getByText("Cho cư dân")).toBeTruthy();
    expect(within(list.closest("li") ?? document.body).getByText("Chủ nhà")).toBeTruthy();
    expect(listNotifications).toHaveBeenCalledWith(["OWNER", "TENANT"], 1);
  });

  it("marks a combined notification read with its own audience", async () => {
    const user = userEvent.setup();
    const item = notification({ id: "t-1", audience: "TENANT" });
    vi.mocked(listNotifications).mockResolvedValue(page([item]));
    vi.mocked(markNotificationRead).mockRejectedValue(new Error("offline"));
    withQueries(<AllNotifications />);

    await user.click(await screen.findByRole("button", { name: "Đánh dấu đã đọc" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Không đánh dấu được thông báo. Vui lòng thử lại.");
    expect(markNotificationRead).toHaveBeenCalledWith("t-1");
  });

  it("sends a guest to login", async () => {
    vi.mocked(useAuth).mockReturnValue({ status: "guest", user: null, refreshUser: vi.fn(), signOut: vi.fn() });
    withQueries(<AllNotifications />);

    expect(screen.getByLabelText("Đang tải thông báo")).toBeTruthy();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
