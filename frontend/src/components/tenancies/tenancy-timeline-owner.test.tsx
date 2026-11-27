import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { cancelOwnerTenancy, endOwnerTenancy, getOwnerTenancyTimeline, markOwnerTenancyMoveIn } from "@/lib/tenancies/api";
import type { TenancyContractRecord, TenancyTimeline } from "@/lib/tenancies/types";
import { TenancyTimelinePage } from "./tenancy-timeline-page";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace, push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tenancy-1" }),
  useRouter: () => mockRouter,
}));
vi.mock("@/lib/tenancies/api", () => ({
  getTenantTenancyTimeline: vi.fn(),
  getOwnerTenancyTimeline: vi.fn(),
  confirmTenantTenancyContract: vi.fn(),
  declineTenantTenancyContract: vi.fn(),
  cancelOwnerTenancy: vi.fn(),
  endOwnerTenancy: vi.fn(),
  markOwnerTenancyMoveIn: vi.fn(),
  correctOwnerTenancyRenewal: vi.fn(),
  proposeOwnerTenancyRenewal: vi.fn(),
  rejectOwnerTenancyRenewal: vi.fn(),
  requestTenantTenancyRenewal: vi.fn(),
  withdrawTenantTenancyRenewal: vi.fn(),
}));

function contract(overrides: Partial<TenancyContractRecord> = {}): TenancyContractRecord {
  return {
    id: "contract-1",
    version_number: 1,
    type: "ORIGINAL",
    renewal_request_id: null,
    supersedes_contract_id: null,
    basis_contract_id: null,
    start_date: "2099-01-01",
    end_date: "2099-06-30",
    monthly_rent: 5000000,
    deposit_amount: 5000000,
    policies_snapshot: { property: { pets: "NOT_ALLOWED", smoking: "NOT_ALLOWED", shared_rules: [] }, unit: {} },
    signed_on: null,
    created_at: "2026-11-20T00:00:00Z",
    owner_confirmed_at: "2026-11-20T00:00:00Z",
    tenant_confirmed_at: "2026-11-21T00:00:00Z",
    tenant_rejected_at: null,
    tenant_rejection_reason: null,
    ...overrides,
  };
}

function timeline(tenancy: Partial<TenancyTimeline["tenancy"]>, overrides: Partial<TenancyTimeline> = {}): TenancyTimeline {
  const agreement = contract();
  return {
    tenancy: {
      id: "tenancy-1",
      owner_id: "owner-1",
      tenant_id: "tenant-1",
      rental_request_id: "req-1",
      unit_id: "unit-1",
      status: "CONFIRMED",
      confirmed_start_date: "2099-01-01",
      confirmed_end_date: "2099-06-30",
      blocked_start_date: "2099-01-01",
      blocked_end_date: "2099-06-30",
      pending_contract_id: null,
      latest_confirmed_contract_id: "contract-1",
      confirmation_expires_at: null,
      moved_in_at: null,
      actual_ended_at: null,
      end_reason: null,
      created_at: "2026-11-20T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
      ...tenancy,
    },
    rental_request: { id: "req-1", status: "ACCEPTED", created_at: "2026-11-19T00:00:00Z", closed_at: "2026-11-20T00:00:00Z", contact_name: "Mai Nguyễn", contact_phone: "0901234567" },
    property: { id: "property-1", name: "Nhà Phước Mỹ", address_line: "12 Lê Duẩn", ward: "Hải Châu", city: "Đà Nẵng" },
    unit: { id: "unit-1", label: "Phòng 101" },
    participants: { owner_name: "Linh", tenant_name: "Mai Nguyễn" },
    contracts: [agreement],
    renewal_requests: [],
    pending_contract: null,
    current_agreement: agreement,
    upcoming_agreements: [],
    events: [
      { entity_type: "tenancy", action: "tenancy.proposed", reason: null, correlation_id: null, created_at: "2026-11-20T00:00:00Z" },
      { entity_type: "tenancy", action: "tenancy.contract.confirmed", reason: null, correlation_id: null, created_at: "2026-11-21T00:00:00Z" },
      { entity_type: "tenancy", action: "tenancy.custom_event", reason: "Ghi chú", correlation_id: null, created_at: "2026-11-21T01:00:00Z" },
    ],
    ...overrides,
  } as unknown as TenancyTimeline;
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("owner tenancy timeline", () => {
  it("shows the agreement history and records the move-in", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline)
      .mockResolvedValueOnce(timeline({}))
      .mockResolvedValueOnce(timeline({ status: "ACTIVE", moved_in_at: "2099-01-01T00:00:00Z" }));
    vi.mocked(markOwnerTenancyMoveIn).mockResolvedValue(undefined as never);
    render(<TenancyTimelinePage party="owner" />);

    expect(await screen.findByText("Chủ nhà đã gửi đề xuất thuê")).toBeTruthy();
    expect(screen.getByText("Người thuê đã xác nhận hợp đồng")).toBeTruthy();
    expect(screen.getByText("tenancy.custom_event")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Kỳ thuê và hợp đồng/ }).getAttribute("href")).toBe("/owner/tenancies");

    await user.click(screen.getByRole("button", { name: "Xác nhận nhận nhà" }));
    expect(await screen.findByText("Đã ghi nhận ngày nhận nhà.")).toBeTruthy();
    expect(markOwnerTenancyMoveIn).toHaveBeenCalledWith("tenancy-1", { client_operation_id: expect.any(String) });
    await waitFor(() => expect(getOwnerTenancyTimeline).toHaveBeenCalledTimes(2));
  });

  it("explains a failed move-in", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline({}));
    vi.mocked(markOwnerTenancyMoveIn).mockRejectedValue(new TypeError("Failed to fetch"));
    render(<TenancyTimelinePage party="owner" />);

    await user.click(await screen.findByRole("button", { name: "Xác nhận nhận nhà" }));
    expect(await screen.findByText("Không thể ghi nhận ngày nhận nhà. Vui lòng thử lại.")).toBeTruthy();
  });

  it("cancels a confirmed tenancy before it starts, only after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline({}));
    vi.mocked(cancelOwnerTenancy).mockResolvedValue(undefined as never);
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<TenancyTimelinePage party="owner" />);

    const reason = await screen.findByLabelText("Lý do hủy kỳ thuê");
    const cancel = screen.getByRole("button", { name: "Hủy kỳ thuê" }) as HTMLButtonElement;
    expect(cancel.disabled).toBe(true);
    await user.type(reason, "Hai bên thống nhất hủy.");

    await user.click(cancel);
    expect(cancelOwnerTenancy).not.toHaveBeenCalled();

    await user.click(cancel);
    expect(await screen.findByText("Đã hủy kỳ thuê.")).toBeTruthy();
    expect(confirm).toHaveBeenCalledWith("Bạn có chắc muốn hủy kỳ thuê này?");
    expect(cancelOwnerTenancy).toHaveBeenCalledWith("tenancy-1", { client_operation_id: expect.any(String), reason: "Hai bên thống nhất hủy." });
  });

  it("records the end of an active tenancy and shows API errors", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline({ status: "ACTIVE", moved_in_at: "2026-11-01T00:00:00Z" }));
    vi.mocked(endOwnerTenancy)
      .mockRejectedValueOnce(new ApiError(409, "Kỳ thuê đã thay đổi. Vui lòng tải lại."))
      .mockResolvedValueOnce(undefined as never);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TenancyTimelinePage party="owner" />);

    await user.type(await screen.findByLabelText("Lý do kết thúc kỳ thuê"), "Người thuê đã trả phòng.");
    await user.click(screen.getByRole("button", { name: "Ghi nhận kết thúc" }));
    expect(await screen.findByText("Kỳ thuê đã thay đổi. Vui lòng tải lại.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ghi nhận kết thúc" }));
    expect(await screen.findByText("Đã ghi nhận kỳ thuê kết thúc.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xác nhận nhận nhà" })).toBeNull();
  });

  it("links to a correction when the tenant declined the original proposal", async () => {
    const declined = contract({ tenant_confirmed_at: null, tenant_rejected_at: "2026-11-21T00:00:00Z", tenant_rejection_reason: "Giá chưa đúng." });
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline(
      { status: "AWAITING_REVISION", confirmed_start_date: null, confirmed_end_date: null, latest_confirmed_contract_id: null },
      { contracts: [declined], current_agreement: null, events: [] },
    ));
    render(<TenancyTimelinePage party="owner" />);

    expect(await screen.findByText(/Người thuê đã từ chối phiên bản 1/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tạo phiên bản mới" }).getAttribute("href")).toBe("/owner/tenancies/tenancy-1/correction");
    expect(screen.queryByRole("button", { name: "Hủy kỳ thuê" })).toBeNull();
  });
});
