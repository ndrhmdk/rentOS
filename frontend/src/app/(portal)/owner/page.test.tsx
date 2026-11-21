import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { useAuth } from "@/lib/auth-context";
import { getOwnerPropertyPreview, getOwnerSummary, type OwnerSummary } from "@/lib/owner-summary-api";
import OwnerPortalPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/owner-summary-api", () => ({
  getOwnerSummary: vi.fn(),
  getOwnerPropertyPreview: vi.fn(),
}));

const emptySummary: OwnerSummary = {
  counts: {
    pending_rental_requests: 0,
    awaiting_tenant_confirmation: 0,
    active_properties: 0,
    unread_notifications: 0,
  },
  recent_requests: [],
  pending_actions: [],
  recent_notifications: [],
};

function signedInAs(id: string, name: string) {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: { id, name } as NonNullable<ReturnType<typeof useAuth>["user"]>,
    refreshUser: vi.fn(),
    signOut: vi.fn(),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  signedInAs("owner-1", "Linh");
  vi.mocked(getOwnerPropertyPreview).mockResolvedValue([]);
});
afterEach(cleanup);

it("shows real property details and badges, with a fallback for broken photos", async () => {
  vi.mocked(getOwnerSummary).mockRejectedValue(new Error("summary offline"));
  vi.mocked(getOwnerPropertyPreview).mockResolvedValue([{
    id: "property-1",
    name: "Studio Mỹ Khê",
    ward: "Phước Mỹ",
    city: "Đà Nẵng",
    rental_arrangement: "SEPARATE_UNITS",
    unit_count: 5,
    moderation_status: "APPROVED",
    publication_status: "PUBLISHED",
    suspended: true,
    photo_url: "/test-cover.jpg",
  }]);
  render(<OwnerPortalPage />);

  const section = screen.getByRole("region", { name: "Bất động sản của bạn" });
  const property = await within(section).findByRole("link", { name: /Studio Mỹ Khê/ });
  expect(property.getAttribute("href")).toBe("/owner/properties/property-1");
  expect(within(property).getByText("Phước Mỹ, Đà Nẵng · Từng căn · 5 căn")).toBeTruthy();
  expect(within(property).getByText("Đã đăng")).toBeTruthy();
  expect(within(property).getByText("Bị đình chỉ bởi admin")).toBeTruthy();
  const photo = property.querySelector("img");
  if (photo === null) throw new Error("Expected property cover");
  expect(new URL(photo.src).pathname).toBe("/test-cover.jpg");
  fireEvent.error(photo);
  expect(property.querySelector("img")).toBeNull();
});

it("shows loading and then links each preview to the existing portal", async () => {
  vi.mocked(getOwnerSummary).mockResolvedValue({
    counts: { ...emptySummary.counts, pending_rental_requests: 7, unread_notifications: 3 },
    recent_requests: [{
      id: "request-1",
      contact_name: "Mai",
      property_name: "Studio Mỹ Khê",
      preferred_unit: "S201",
      desired_move_in_date: "2030-06-01",
      desired_end_date: "2030-08-01",
      status: "PENDING",
    }],
    pending_actions: [{
      id: "renewal-1",
      title: "Xem yêu cầu gia hạn của Mai",
      description: "Đang chờ chủ nhà.",
      kind: "renewal",
      href: "/owner/tenancies/tenancy-1",
    }],
    recent_notifications: [{
      id: "notification-1",
      title: "Có yêu cầu thuê mới",
      read_at: null,
      created_at: "2026-11-18T12:00:00Z",
    }],
  });
  render(<OwnerPortalPage />);

  expect(screen.getByText("Đang tải tổng quan chủ nhà…")).toBeTruthy();
  const requests = await screen.findByRole("region", { name: "Yêu cầu thuê gần đây" });
  const table = within(requests).getByRole("table");
  expect(within(table).getByRole("link", { name: "Chi tiết yêu cầu của Mai" }).getAttribute("href")).toBe("/owner/requests/request-1");
  expect(screen.getByRole("link", { name: /Yêu cầu chờ xử lý, 7/ }).getAttribute("href")).toBe("/owner/requests");
  expect(screen.getByRole("link", { name: /Xem yêu cầu gia hạn của Mai/ }).getAttribute("href")).toBe("/owner/tenancies/tenancy-1");
  expect(screen.getByRole("link", { name: /Chưa đọc: Có yêu cầu thuê mới/ }).getAttribute("href")).toBe("/owner/notifications");
});

it("keeps property navigation available and can retry a failed summary", async () => {
  const user = userEvent.setup();
  vi.mocked(getOwnerSummary).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(emptySummary);
  render(<OwnerPortalPage />);

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Không thể tải tổng quan chủ nhà.");
  expect(screen.getByRole("link", { name: /Quản lý bất động sản/ }).getAttribute("href")).toBe("/owner/properties");

  await user.click(within(alert).getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("Bạn chưa có việc nào cần xử lý.")).toBeTruthy();
  expect(screen.getByText("Bạn chưa có thông báo.")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Thông báo chưa đọc, 0/ }).getAttribute("href")).toBe("/owner/notifications");
});

it("offers sign in again when the summary request returns 401", async () => {
  vi.mocked(getOwnerSummary).mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));
  render(<OwnerPortalPage />);

  const alert = await screen.findByRole("alert");
  expect(within(alert).getByRole("link", { name: "Đăng nhập lại" }).getAttribute("href")).toBe("/login");
  expect(within(alert).queryByRole("button", { name: "Thử lại" })).toBeNull();
});

it("clears the previous owner's summary immediately on account switch", async () => {
  vi.mocked(getOwnerSummary).mockResolvedValueOnce({
    ...emptySummary,
    recent_notifications: [{ id: "old", title: "Thông báo riêng", read_at: null, created_at: "2026-11-18T12:00:00Z" }],
  }).mockResolvedValueOnce(emptySummary);
  const { rerender } = render(<OwnerPortalPage />);
  expect(await screen.findByText("Thông báo riêng")).toBeTruthy();

  signedInAs("owner-2", "Hòa");
  rerender(<OwnerPortalPage />);
  expect(screen.queryByText("Thông báo riêng")).toBeNull();
  expect(await screen.findByText("Bạn chưa có thông báo.")).toBeTruthy();
});
