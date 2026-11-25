import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TenancyTimelinePage } from "./tenancy-timeline-page";
import {
  confirmTenantTenancyContract,
  declineTenantTenancyContract,
  getOwnerTenancyTimeline,
  getTenantTenancyTimeline,
} from "@/lib/tenancies/api";
import type { TenancyTimeline } from "@/lib/tenancies/types";
import { ApiError } from "@/lib/http/client";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tenancy-123" }),
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/tenancies/api", () => ({
  getTenantTenancyTimeline: vi.fn(),
  getOwnerTenancyTimeline: vi.fn(),
  confirmTenantTenancyContract: vi.fn(),
  declineTenantTenancyContract: vi.fn(),
  cancelOwnerTenancy: vi.fn(),
  endOwnerTenancy: vi.fn(),
  markOwnerTenancyMoveIn: vi.fn(),
}));

const mockTimelineData = {
  tenancy: {
    id: "tenancy-123",
    owner_id: "owner-1",
    tenant_id: "tenant-1",
    rental_request_id: "req-1",
    unit_id: "unit-1",
    status: "PENDING_CONFIRMATION",
    confirmed_start_date: null,
    confirmed_end_date: null,
    blocked_start_date: null,
    blocked_end_date: null,
    pending_contract_id: "contract-1",
    latest_confirmed_contract_id: null,
    confirmation_expires_at: "2026-12-15T00:00:00Z",
    moved_in_at: null,
    actual_ended_at: null,
    end_reason: null,
    created_at: "2026-11-20T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
  },
  rental_request: {
    id: "req-1",
    status: "ACCEPTED",
    created_at: "2026-11-20T00:00:00Z",
    closed_at: null,
    contact_name: "Nguyễn Văn A",
    contact_phone: "0901234567",
  },
  property: {
    id: "prop-1",
    name: "Chung cư mini Cầu Giấy",
    address_line: "123 Cầu Giấy",
    ward: "Dịch Vọng",
    city: "Hà Nội",
  },
  unit: {
    id: "unit-1",
    label: "Phòng 301",
  },
  participants: {
    owner_name: "Trần Thị B",
    tenant_name: "Nguyễn Văn A",
  },
  contracts: [],
  renewal_requests: [],
  pending_contract: {
    id: "contract-1",
    version_number: 1,
    type: "ORIGINAL",
    renewal_request_id: null,
    supersedes_contract_id: null,
    basis_contract_id: null,
    start_date: "2026-12-01",
    end_date: "2027-06-01",
    monthly_rent: 5000000,
    deposit_amount: 5000000,
    policies_snapshot: {
      pets: "NOT_ALLOWED",
      smoking: "NOT_ALLOWED",
      shared_rules: ["Giữ trật tự sau 23h"],
    },
    signed_on: null,
    created_at: "2026-11-20T00:00:00Z",
    owner_confirmed_at: "2026-11-20T00:00:00Z",
    tenant_confirmed_at: null,
    tenant_rejected_at: null,
    tenant_rejection_reason: null,
  },
  current_agreement: null,
  upcoming_agreements: [],
  events: [],
};

describe("TenancyTimelinePage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state and then tenancy details for tenant", async () => {
    vi.mocked(getTenantTenancyTimeline).mockResolvedValue(mockTimelineData as unknown as TenancyTimeline);

    render(<TenancyTimelinePage party="tenant" />);

    expect(screen.getByText("Đang tải lịch sử kỳ thuê…")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: /Chung cư mini Cầu Giấy/ })).toBeTruthy();
    expect(screen.getByText("Chờ người thuê xác nhận")).toBeTruthy();
  });

  it("allows tenant to confirm pending contract", async () => {
    const user = userEvent.setup();
    vi.mocked(getTenantTenancyTimeline).mockResolvedValue(mockTimelineData as unknown as TenancyTimeline);
    vi.mocked(confirmTenantTenancyContract).mockResolvedValue({
      tenancy_id: "tenancy-123",
      status: "CONFIRMED",
      confirmed_start_date: "2026-12-01",
      confirmed_end_date: "2027-06-01",
      contract_id: "contract-1",
      version_number: 1,
      replayed: false,
    });

    render(<TenancyTimelinePage party="tenant" />);

    expect(await screen.findByRole("heading", { name: /Chung cư mini Cầu Giấy/ })).toBeTruthy();
    const confirmButton = screen.getByRole("button", { name: "Xác nhận phiên bản 1" });
    await user.click(confirmButton);

    expect(confirmTenantTenancyContract).toHaveBeenCalledWith(
      "tenancy-123",
      "contract-1",
      expect.objectContaining({ client_operation_id: expect.any(String) }),
    );
    expect(await screen.findByText("Bạn đã xác nhận phiên bản hợp đồng này.")).toBeTruthy();
  });

  it("allows tenant to decline pending contract with reason", async () => {
    const user = userEvent.setup();
    vi.mocked(getTenantTenancyTimeline).mockResolvedValue(mockTimelineData as unknown as TenancyTimeline);
    vi.mocked(declineTenantTenancyContract).mockResolvedValue({
      tenancy_id: "tenancy-123",
      status: "AWAITING_REVISION",
      contract_id: "contract-1",
      version_number: 1,
      replayed: false,
    });

    render(<TenancyTimelinePage party="tenant" />);

    expect(await screen.findByRole("heading", { name: /Chung cư mini Cầu Giấy/ })).toBeTruthy();
    const openDeclineBtn = await screen.findByRole("button", { name: "Từ chối" });
    await user.click(openDeclineBtn);

    const textarea = await screen.findByPlaceholderText(/ít nhất 5 ký tự/);
    fireEvent.change(textarea, { target: { value: "Gia thue chua dung hop dong." } });

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: "Gửi từ chối" });
      expect(btn.hasAttribute("disabled")).toBe(false);
    });

    const submitDeclineBtn = screen.getByRole("button", { name: "Gửi từ chối" });
    fireEvent.click(submitDeclineBtn);

    await waitFor(() => {
      expect(declineTenantTenancyContract).toHaveBeenCalledWith(
        "tenancy-123",
        "contract-1",
        expect.objectContaining({
          reason: "Gia thue chua dung hop dong.",
          client_operation_id: expect.any(String),
        }),
      );
    });
  });

  it("redirects to /login when receiving 401 error", async () => {
    vi.mocked(getTenantTenancyTimeline).mockRejectedValue(new ApiError(401, "Unauthenticated"));

    render(<TenancyTimelinePage party="tenant" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders owner view correctly", async () => {
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(mockTimelineData as unknown as TenancyTimeline);

    render(<TenancyTimelinePage party="owner" />);

    expect(await screen.findByText("Nguyễn Văn A")).toBeTruthy();
    // Tenant confirmation buttons should NOT appear for owner
    expect(screen.queryByRole("button", { name: "Xác nhận hợp đồng này" })).toBeNull();
  });
});
