import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { useAuth } from "@/lib/auth-context";
import { getTenantSummary, type TenantSummary } from "@/lib/tenant-summary-api";
import TenantPortalPage from "./page";

vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/tenant-summary-api", () => ({ getTenantSummary: vi.fn() }));

const emptySummary: TenantSummary = {
  counts: { tenancies: 0, pending_rental_requests: 0, awaiting_confirmation: 0, unread_notifications: 0 },
  pending_actions: [],
  upcoming_tenancy: null,
  renewal_href: null,
  recent_requests: [],
  recent_notifications: [],
};

function signedInAs(id: string, name: string) {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: { id, name, email: id + "@example.test", email_verified_at: "2026-11-18", is_admin: false, phone: null },
    refreshUser: vi.fn(),
    signOut: vi.fn(),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  signedInAs("tenant-1", "Mai");
});
afterEach(cleanup);

it("links current proposals, agreed terms, requests and notifications to their existing screens", async () => {
  vi.mocked(getTenantSummary).mockResolvedValue({
    counts: { tenancies: 2, pending_rental_requests: 0, awaiting_confirmation: 1, unread_notifications: 1 },
    pending_actions: [{
      id: "tenancy-1", kind: "contract", title: "Studio Mỹ Khê", href: "/tenant/tenancies/tenancy-1",
      rental_request_id: "request-1", unit_label: "S201", version: 2, expires_at: "2030-11-20T12:00:00Z",
      start_date: "2030-12-01", end_date: "2031-05-31", monthly_rent: "3800000", photo_url: null,
    }],
    upcoming_tenancy: {
      id: "tenancy-2", title: "Căn hộ A", href: "/tenant/tenancies/tenancy-2", ward: "Hải Châu", city: "Đà Nẵng",
      unit_label: "A101", bedrooms: 2, area_m2: "68", version: 1, start_date: "2030-12-01", end_date: "2031-05-31",
      monthly_rent: "5800000", photo_url: "/property-cover.jpg",
    },
    renewal_href: "/tenant/tenancies/tenancy-2",
    recent_requests: [{
      id: "request-1", title: "Studio Mỹ Khê", href: "/tenant/requests/request-1", status: "ACCEPTED",
      created_at: "2030-11-18T12:00:00Z", desired_move_in_date: "2030-12-01", desired_end_date: "2031-05-31",
      preferred_unit: "S201", photo_url: null,
    }],
    recent_notifications: [{ id: "notice", title: "Có đề xuất hợp đồng", read_at: null, created_at: "2030-11-18T12:00:00Z" }],
  });
  render(<TenantPortalPage />);

  expect(screen.getByText("Đang tải tổng quan người thuê…")).toBeTruthy();
  const due = await screen.findByRole("region", { name: /Cần bạn xử lý/ });
  expect(within(due).getByText("Phiên bản 2 · Bản gốc")).toBeTruthy();
  expect(within(due).getByRole("link", { name: "Xem xét và xác nhận" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-1");
  expect(screen.getByRole("link", { name: /Kỳ thuê, 2/ }).getAttribute("href")).toBe("/tenant/contracts");
  const upcoming = screen.getByRole("region", { name: "Kỳ thuê sắp tới" });
  expect(within(upcoming).getByText(/5\.800\.000/)).toBeTruthy();
  expect(within(upcoming).getByRole("link", { name: "Xem hợp đồng" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-2");
  expect(screen.getByRole("link", { name: "Yêu cầu gia hạn kỳ thuê" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-2");
  expect(screen.getByRole("link", { name: "Studio Mỹ Khê" }).getAttribute("href")).toBe("/tenant/requests/request-1");
  expect(screen.getByRole("link", { name: "Chưa đọc: Có đề xuất hợp đồng" }).getAttribute("href")).toBe("/tenant/notifications");
});

it("keeps existing navigation visible and can retry a failed load into an empty summary", async () => {
  const user = userEvent.setup();
  vi.mocked(getTenantSummary).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(emptySummary);
  render(<TenantPortalPage />);

  const message = await screen.findByRole("alert");
  expect(message.textContent).toContain("Không thể tải tổng quan người thuê.");
  expect(screen.getByRole("link", { name: "Xem yêu cầu của tôi" }).getAttribute("href")).toBe("/tenant/requests");
  await user.click(within(message).getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("Bạn chưa gửi yêu cầu thuê nào.")).toBeTruthy();
  expect(screen.getByText("Bạn chưa có kỳ thuê sắp tới đã xác nhận.")).toBeTruthy();
  expect(screen.getByText("Bạn chưa có thông báo.")).toBeTruthy();
  expect(screen.queryByRole("region", { name: /Cần bạn xử lý/ })).toBeNull();
  expect(screen.queryByRole("link", { name: "Yêu cầu gia hạn kỳ thuê" })).toBeNull();
});

it("asks the tenant to sign in again when the API returns 401", async () => {
  vi.mocked(getTenantSummary).mockRejectedValue(new ApiError(401, "Unauthenticated"));
  render(<TenantPortalPage />);

  const message = await screen.findByRole("alert");
  expect(within(message).getByRole("link", { name: "Đăng nhập lại" }).getAttribute("href")).toBe("/login");
  expect(within(message).queryByRole("button", { name: "Thử lại" })).toBeNull();
});

it("clears loaded private data as soon as a different account is selected", async () => {
  vi.mocked(getTenantSummary).mockResolvedValueOnce({
    ...emptySummary,
    recent_notifications: [{ id: "old", title: "Thông báo riêng", read_at: null, created_at: "2026-11-18T12:00:00Z" }],
  }).mockResolvedValueOnce(emptySummary);
  const { rerender } = render(<TenantPortalPage />);
  expect(await screen.findByText("Thông báo riêng")).toBeTruthy();

  signedInAs("tenant-2", "Nam");
  rerender(<TenantPortalPage />);
  expect(screen.queryByText("Thông báo riêng")).toBeNull();
  expect(await screen.findByText("Bạn chưa có thông báo.")).toBeTruthy();
});
