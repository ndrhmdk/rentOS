import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { correctOwnerTenancyProposal, getOwnerTenancyTimeline } from "@/lib/tenancies/api";
import type { TenancyContractRecord, TenancyTimeline } from "@/lib/tenancies/types";
import OwnerTenancyCorrectionPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { push: mockPush, replace: mockReplace, refresh: mockRefresh };

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tenancy-1" }),
  useRouter: () => mockRouter,
}));
vi.mock("@/lib/tenancies/api", () => ({
  getOwnerTenancyTimeline: vi.fn(),
  correctOwnerTenancyProposal: vi.fn(),
}));

function contract(overrides: Partial<TenancyContractRecord> = {}): TenancyContractRecord {
  return {
    id: "contract-1",
    version_number: 1,
    type: "ORIGINAL",
    renewal_request_id: null,
    supersedes_contract_id: null,
    basis_contract_id: null,
    start_date: "2027-01-01",
    end_date: "2027-06-30",
    monthly_rent: "4500000",
    deposit_amount: "4500000",
    policies_snapshot: JSON.stringify({
      property: { pets: "NOT_ALLOWED", smoking: "NOT_ALLOWED", shared_rules: [] },
      unit: { pets: "ALLOWED", additional_rules: ["Không nấu ăn trong phòng", 3] },
    }),
    signed_on: null,
    created_at: "2026-11-20T00:00:00Z",
    owner_confirmed_at: "2026-11-20T00:00:00Z",
    tenant_confirmed_at: null,
    tenant_rejected_at: "2026-11-21T00:00:00Z",
    tenant_rejection_reason: "Giá thuê chưa đúng.",
    ...overrides,
  };
}

function timeline(status = "AWAITING_REVISION", latest = contract()): TenancyTimeline {
  return { tenancy: { id: "tenancy-1", status }, contracts: [latest] } as unknown as TenancyTimeline;
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

describe("owner tenancy correction", () => {
  it("prefills the declined version and sends a corrected one that supersedes it", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline());
    vi.mocked(correctOwnerTenancyProposal).mockResolvedValue({ tenancy_id: "tenancy-1" } as Awaited<ReturnType<typeof correctOwnerTenancyProposal>>);
    render(<OwnerTenancyCorrectionPage />);

    expect(screen.getByText(/Đang tải/)).toBeTruthy();
    await screen.findByRole("heading", { name: "Gửi phiên bản hợp đồng mới" });
    expect(screen.getByText(/thay thế phiên bản 1/)).toBeTruthy();

    const rent = screen.getByLabelText("Giá thuê tháng (₫)") as HTMLInputElement;
    expect(rent.value).toBe("4500000");
    expect((screen.getByLabelText("Chính sách thú cưng") as HTMLSelectElement).value).toBe("ALLOWED");
    expect((screen.getByLabelText("Chính sách hút thuốc") as HTMLSelectElement).value).toBe("NOT_ALLOWED");
    const rules = screen.getByLabelText("Nội quy bổ sung, mỗi dòng một mục") as HTMLTextAreaElement;
    expect(rules.value).toBe("Không nấu ăn trong phòng");

    await user.clear(rent);
    await user.type(rent, "4200000");
    await user.selectOptions(screen.getByLabelText("Chính sách hút thuốc"), "OUTDOOR_ONLY");
    await user.type(rules, "\n  Giữ yên tĩnh  ");

    const submit = screen.getByRole("button", { name: "Gửi phiên bản mới" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await user.click(screen.getByRole("checkbox"));
    await user.click(submit);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/owner/tenancies/tenancy-1"));
    expect(correctOwnerTenancyProposal).toHaveBeenCalledWith("tenancy-1", expect.objectContaining({
      supersedes_contract_id: "contract-1",
      start_date: "2027-01-01",
      end_date: "2027-06-30",
      monthly_rent: 4200000,
      deposit_amount: 4500000,
      policies_snapshot: {
        property: { pets: "NOT_ALLOWED", smoking: "NOT_ALLOWED", shared_rules: [] },
        unit: { pets: "ALLOWED", smoking: "OUTDOOR_ONLY", additional_rules: ["Không nấu ăn trong phòng", "Giữ yên tĩnh"] },
      },
    }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows field errors from the API instead of a generic message", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline());
    vi.mocked(correctOwnerTenancyProposal).mockRejectedValue(
      new ApiError(422, "The given data was invalid.", { end_date: ["Ngày kết thúc phải sau ngày bắt đầu."], start_date: ["Ngày kết thúc phải sau ngày bắt đầu."] }),
    );
    render(<OwnerTenancyCorrectionPage />);

    await screen.findByRole("heading", { name: "Gửi phiên bản hợp đồng mới" });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Gửi phiên bản mới" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Ngày kết thúc phải sau ngày bắt đầu.");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the request fails for another reason", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(timeline("AWAITING_REVISION", contract({ policies_snapshot: "not json" })));
    vi.mocked(correctOwnerTenancyProposal).mockRejectedValue(new TypeError("Failed to fetch"));
    render(<OwnerTenancyCorrectionPage />);

    await screen.findByRole("heading", { name: "Gửi phiên bản hợp đồng mới" });
    expect((screen.getByLabelText("Chính sách thú cưng") as HTMLSelectElement).value).toBe("ASK_OWNER");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Gửi phiên bản mới" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Không thể gửi phiên bản mới. Vui lòng thử lại.");
  });

  it("refuses to correct a proposal the tenant has not declined", async () => {
    vi.mocked(getOwnerTenancyTimeline).mockResolvedValue(
      timeline("PENDING_CONFIRMATION", contract({ tenant_rejected_at: null, tenant_rejection_reason: null })),
    );
    render(<OwnerTenancyCorrectionPage />);

    expect(await screen.findByText(/Chỉ có thể gửi phiên bản mới khi đề xuất gần nhất đã bị người thuê từ chối/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gửi phiên bản mới" })).toBeNull();
    expect(screen.getByRole("link", { name: "← Quay lại kỳ thuê" }).getAttribute("href")).toBe("/owner/tenancies/tenancy-1");
  });

  it("offers a retry after a load failure and redirects a signed-out owner", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancyTimeline)
      .mockRejectedValueOnce(new ApiError(503, "Dịch vụ tạm thời không phản hồi."))
      .mockResolvedValueOnce(timeline());
    render(<OwnerTenancyCorrectionPage />);

    expect((await screen.findByRole("alert")).textContent).toBe("Dịch vụ tạm thời không phản hồi.");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("heading", { name: "Gửi phiên bản hợp đồng mới" })).toBeTruthy();

    cleanup();
    vi.mocked(getOwnerTenancyTimeline).mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));
    render(<OwnerTenancyCorrectionPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
