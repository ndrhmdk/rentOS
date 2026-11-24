import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  getTenantRentalRequest,
  getTenantRentalRequests,
  withdrawTenantRentalRequest,
  type TenantRentalRequest,
  type TenantRentalRequestDetail,
} from "@/lib/rental-requests-api";
import { TenantRequestsScreen } from "./tenant-requests-screen";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "tenant-1" }, status: "authenticated" }),
}));
vi.mock("@/lib/rental-requests-api", () => ({
  getTenantRentalRequest: vi.fn(),
  getTenantRentalRequests: vi.fn(),
  withdrawTenantRentalRequest: vi.fn(),
}));

const pending: TenantRentalRequestDetail = {
  id: "request-1",
  title: "Studio gần biển Mỹ Khê",
  ward: "Phước Mỹ",
  city: "Đà Nẵng",
  desired_move_in_date: "2027-01-01",
  desired_end_date: "2027-03-31",
  preferred_unit: "S201",
  status: "PENDING",
  outcome_reason: null,
  updated_at: "2026-11-06T08:00:00.000000+07:00",
  created_at: "2026-11-06T08:00:00+07:00",
  closed_at: null,
  tenancy: null,
  contact_name: "Nguyễn Thị Mai",
  contact_phone: "0901234567",
  message: "Tôi muốn hẹn xem nhà.",
};

describe("tenant rental requests", () => {
  const dialogPrototype = HTMLDialogElement.prototype;
  const needsDialogMethods = typeof dialogPrototype.showModal !== "function";

  beforeAll(() => {
    if (needsDialogMethods) {
      Object.defineProperties(dialogPrototype, {
        showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
        close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
      });
    }
  });
  afterAll(() => {
    if (needsDialogMethods) {
      Reflect.deleteProperty(dialogPrototype, "showModal");
      Reflect.deleteProperty(dialogPrototype, "close");
    }
  });
  afterEach(cleanup);
  beforeEach(() => vi.resetAllMocks());

  it("withdraws from the list and refreshes the closed tab and counts", async () => {
    const user = userEvent.setup();
    const list = vi.mocked(getTenantRentalRequests);
    list.mockResolvedValueOnce({
      items: [pending], counts: { all: 1, pending: 1, accepted: 0, closed: 0 }, page: 1, last_page: 1,
    }).mockResolvedValueOnce({
      items: [{ ...pending, status: "WITHDRAWN" }],
      counts: { all: 1, pending: 0, accepted: 0, closed: 1 }, page: 1, last_page: 1,
    });
    vi.mocked(withdrawTenantRentalRequest).mockResolvedValue(undefined);
    render(<TenantRequestsScreen />);

    await user.click(await screen.findByRole("button", { name: "Rút yêu cầu" }));
    const dialog = within(screen.getByRole("dialog", { name: "Rút yêu cầu thuê?" }));
    await user.type(dialog.getByRole("textbox", { name: /Lý do/ }), "Đổi kế hoạch");
    await user.click(dialog.getByRole("button", { name: "Xác nhận rút yêu cầu" }));

    expect(await screen.findByText("Đã rút lại")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Đã đóng/ }).getAttribute("aria-pressed")).toBe("true");
    expect(withdrawTenantRentalRequest).toHaveBeenCalledWith(pending.id, expect.objectContaining({
      reason: "Đổi kế hoạch", expected_updated_at: pending.updated_at,
    }));
    expect(list).toHaveBeenLastCalledWith("closed", 1, expect.any(AbortSignal));
    expect(screen.queryByRole("button", { name: "Rút yêu cầu" })).toBeNull();
  });

  it("refreshes a conflicting detail and shows the separate contract confirmation state", async () => {
    const user = userEvent.setup();
    vi.mocked(getTenantRentalRequest).mockResolvedValueOnce(pending).mockResolvedValueOnce({
      ...pending, status: "ACCEPTED",
      tenancy: { id: "tenancy-1", status: "PENDING_CONFIRMATION", confirmation_expires_at: null },
    });
    vi.mocked(withdrawTenantRentalRequest).mockRejectedValue(new ApiError(409, "Đã có đề xuất"));
    render(<TenantRequestsScreen requestId={pending.id} />);

    expect(await screen.findByText(pending.contact_name)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Rút yêu cầu" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận rút yêu cầu" }));

    expect(await screen.findByText("Đang chờ bạn xác nhận")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Yêu cầu đã thay đổi");
    expect(screen.getByRole("link", { name: "Căn hộ và hợp đồng" }).getAttribute("href")).toBe("/tenant/contracts");
    expect(screen.queryByRole("button", { name: "Rút yêu cầu" })).toBeNull();
  });

  it("renders Vietnamese auto-rejection explanation when outcome_reason is NO_AVAILABLE_UNIT", async () => {
    const rejected: TenantRentalRequestDetail = {
      ...pending,
      status: "REJECTED",
      outcome_reason: "NO_AVAILABLE_UNIT",
      closed_at: "2026-11-21T08:00:00+07:00",
    };
    vi.mocked(getTenantRentalRequest).mockResolvedValueOnce(rejected);
    render(<TenantRequestsScreen requestId={pending.id} />);

    expect(
      await screen.findByText("Tự động từ chối do không còn căn trống phù hợp sau 15 ngày"),
    ).toBeTruthy();
    expect(
      screen.getByText(/Yêu cầu đã quá 15 ngày kể từ ngày gửi/),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Tìm phòng khác" }).getAttribute("href"),
    ).toBe("/");
  });

  it("renders auto-rejection explanation for NO_AVAILABLE_UNIT in the request table for tenant", async () => {
    const rejectedItem: TenantRentalRequest = {
      id: "req-rejected-tenant-1",
      title: "Phòng trọ sinh viên tiện nghi",
      ward: "Hòa Khánh Bắc",
      city: "Đà Nẵng",
      desired_move_in_date: "2027-02-01",
      desired_end_date: "2027-08-01",
      preferred_unit: "P.101",
      status: "REJECTED",
      outcome_reason: "NO_AVAILABLE_UNIT",
      updated_at: "2026-11-17T08:00:00.000000+07:00",
      created_at: "2026-11-01T08:00:00+07:00",
      closed_at: "2026-11-17T08:00:00+07:00",
      tenancy: null,
    };

    vi.mocked(getTenantRentalRequests).mockResolvedValueOnce({
      items: [rejectedItem],
      counts: { all: 1, pending: 0, accepted: 0, closed: 1 },
      page: 1,
      last_page: 1,
    });

    render(<TenantRequestsScreen />);

    expect(
      await screen.findByText("Tự động từ chối do không còn căn trống phù hợp sau 15 ngày"),
    ).toBeTruthy();
    expect(screen.getAllByText("Phòng trọ sinh viên tiện nghi").length).toBeGreaterThan(0);
  });
});
