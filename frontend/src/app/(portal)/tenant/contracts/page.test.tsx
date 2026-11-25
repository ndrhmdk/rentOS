import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TenantContractsPage from "./page";
import { getTenantTenancies } from "@/lib/tenancies/api";
import { ApiError } from "@/lib/http/client";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/lib/tenancies/api", () => ({
  getTenantTenancies: vi.fn(),
}));

describe("TenantContractsPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when tenant has no tenancies", async () => {
    vi.mocked(getTenantTenancies).mockResolvedValue([]);

    render(<TenantContractsPage />);

    expect(await screen.findByText("Chưa có đề xuất hoặc hợp đồng thuê")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tìm nơi ở" }).getAttribute("href")).toBe("/");
  });

  it("renders tenancy cards with correct status badges and terms", async () => {
    vi.mocked(getTenantTenancies).mockResolvedValue([
      {
        id: "tenancy-1",
        unit_id: "unit-1",
        tenant_id: "tenant-1",
        owner_id: "owner-1",
        rental_request_id: "req-1",
        status: "PENDING_CONFIRMATION",
        property_name: "Chung cư mini Cầu Giấy",
        property_city: "Hà Nội",
        unit_label: "Phòng 201",
        rental_request_status: "ACCEPTED",
        counterparty_name: "Chủ nhà Trần B",
        pending_contract_id: "contract-1",
        pending_contract_version: 1,
        pending_contract_start_date: "2026-12-01",
        pending_contract_end_date: "2027-06-01",
        pending_contract_monthly_rent: 4500000,
        pending_contract_deposit_amount: 4500000,
        latest_confirmed_contract_id: null,
        latest_confirmed_contract_version: null,
        latest_confirmed_contract_start_date: null,
        latest_confirmed_contract_end_date: null,
        latest_confirmed_contract_monthly_rent: null,
        latest_confirmed_contract_deposit_amount: null,
        confirmed_start_date: null,
        confirmed_end_date: null,
        blocked_start_date: "2026-12-01",
        blocked_end_date: "2027-06-01",
        confirmation_expires_at: "2026-12-01T00:00:00Z",
        moved_in_at: null,
        actual_ended_at: null,
        end_reason: null,
        created_at: "2026-11-20T00:00:00Z",
        updated_at: "2026-11-20T00:00:00Z",
      },
      {
        id: "tenancy-2",
        unit_id: "unit-2",
        tenant_id: "tenant-1",
        owner_id: "owner-2",
        rental_request_id: "req-2",
        status: "ACTIVE",
        property_name: "Nhà trọ Đống Đa",
        property_city: "Hà Nội",
        unit_label: "Phòng 102",
        rental_request_status: "ACCEPTED",
        counterparty_name: "Chủ nhà Lê C",
        pending_contract_id: null,
        pending_contract_version: null,
        pending_contract_start_date: null,
        pending_contract_end_date: null,
        pending_contract_monthly_rent: null,
        pending_contract_deposit_amount: null,
        latest_confirmed_contract_id: "contract-2",
        latest_confirmed_contract_version: 1,
        latest_confirmed_contract_start_date: "2026-01-01",
        latest_confirmed_contract_end_date: "2026-12-31",
        latest_confirmed_contract_monthly_rent: 3800000,
        latest_confirmed_contract_deposit_amount: 3800000,
        confirmed_start_date: "2026-01-01",
        confirmed_end_date: "2026-12-31",
        blocked_start_date: "2026-01-01",
        blocked_end_date: "2026-12-31",
        confirmation_expires_at: null,
        moved_in_at: "2026-01-01T00:00:00Z",
        actual_ended_at: null,
        end_reason: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ]);

    render(<TenantContractsPage />);

    expect(await screen.findByText("Chung cư mini Cầu Giấy")).toBeTruthy();
    expect(screen.getByText("Chờ bạn xác nhận")).toBeTruthy();
    expect(screen.getByText("Nhà trọ Đống Đa")).toBeTruthy();
    expect(screen.getByText("Đang thuê")).toBeTruthy();
    expect(screen.getByText("4.500.000 ₫/tháng")).toBeTruthy();
    expect(screen.getByText("3.800.000 ₫/tháng")).toBeTruthy();

    expect(screen.getByRole("link", { name: "Xem đề xuất" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-1");
    expect(screen.getByRole("link", { name: "Xem hợp đồng" }).getAttribute("href")).toBe("/tenant/tenancies/tenancy-2");
  });

  it("redirects to /login when receiving 401 error", async () => {
    vi.mocked(getTenantTenancies).mockRejectedValue(new ApiError(401, "Unauthenticated"));

    render(<TenantContractsPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("displays retryable error message on generic API failure", async () => {
    const user = userEvent.setup();
    vi.mocked(getTenantTenancies)
      .mockRejectedValueOnce(new ApiError(500, "Lỗi máy chủ"))
      .mockResolvedValueOnce([]);

    render(<TenantContractsPage />);

    expect(await screen.findByText("Lỗi máy chủ")).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Chưa có đề xuất hoặc hợp đồng thuê")).toBeTruthy();
    });
  });
});
