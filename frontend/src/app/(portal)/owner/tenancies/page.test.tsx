import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { getOwnerTenancies } from "@/lib/tenancies/api";
import type { ParticipantTenancySummary } from "@/lib/tenancies/types";
import OwnerTenanciesPage from "./page";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/tenancies/api", () => ({ getOwnerTenancies: vi.fn() }));

function tenancy(id: string, status: string, overrides: Partial<ParticipantTenancySummary> = {}): ParticipantTenancySummary {
  return {
    id,
    status,
    unit_label: `Phòng ${id}`,
    property_name: "Nhà Phước Mỹ",
    counterparty_name: "Mai Nguyễn",
    confirmed_start_date: null,
    confirmed_end_date: null,
    blocked_start_date: null,
    blocked_end_date: null,
    pending_contract_version: null,
    pending_contract_start_date: null,
    pending_contract_end_date: null,
    pending_contract_monthly_rent: null,
    pending_contract_deposit_amount: null,
    latest_confirmed_contract_version: null,
    latest_confirmed_contract_start_date: null,
    latest_confirmed_contract_end_date: null,
    latest_confirmed_contract_monthly_rent: null,
    latest_confirmed_contract_deposit_amount: null,
    ...overrides,
  } as ParticipantTenancySummary;
}

const items = [
  tenancy("101", "PENDING_CONFIRMATION", {
    blocked_start_date: "2027-01-01",
    blocked_end_date: "2027-06-30",
    pending_contract_version: 1,
    pending_contract_monthly_rent: "4500000",
    pending_contract_deposit_amount: "4500000",
  }),
  tenancy("102", "ACTIVE", {
    confirmed_start_date: "2026-09-01",
    confirmed_end_date: "2027-02-28",
    latest_confirmed_contract_version: 2,
    latest_confirmed_contract_monthly_rent: 5000000,
    latest_confirmed_contract_deposit_amount: 5000000,
  }),
  tenancy("103", "AWAITING_REVISION"),
  tenancy("104", "CONFIRMED", { latest_confirmed_contract_version: 1, latest_confirmed_contract_start_date: "2027-03-01", latest_confirmed_contract_end_date: "2027-08-31", latest_confirmed_contract_monthly_rent: 3000000, latest_confirmed_contract_deposit_amount: 0 }),
  tenancy("105", "ENDED"),
  tenancy("106", "CANCELLED"),
];

function rowFor(label: string): HTMLElement {
  return screen.getByText(label).closest("tr") as HTMLElement;
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

describe("owner tenancies", () => {
  it("lists every tenancy with its contract terms and status", async () => {
    vi.mocked(getOwnerTenancies).mockResolvedValue(items);
    render(<OwnerTenanciesPage />);

    expect(screen.getByText("Đang tải kỳ thuê…")).toBeTruthy();
    const pending = within(await screen.findByText("Phòng 101").then(() => rowFor("Phòng 101")));
    expect(pending.getByText("Chờ người thuê xác nhận")).toBeTruthy();
    expect(pending.getByText("Phiên bản 1 · chờ xác nhận")).toBeTruthy();
    expect(pending.getAllByText("Theo đề xuất")).toHaveLength(2);
    expect(pending.getByRole("link", { name: "Xem hợp đồng" }).getAttribute("href")).toBe("/owner/tenancies/101");

    const active = within(rowFor("Phòng 102"));
    expect(active.getByText("Đang hoạt động")).toBeTruthy();
    expect(active.getByText("Phiên bản 2")).toBeTruthy();
    expect(active.queryByText("Theo đề xuất")).toBeNull();

    expect(within(rowFor("Phòng 103")).getByText("Chưa có hợp đồng")).toBeTruthy();
    expect(within(rowFor("Phòng 103")).getByText("Cần gửi phiên bản mới")).toBeTruthy();
    expect(within(rowFor("Phòng 105")).getByText("Đã kết thúc")).toBeTruthy();
    expect(within(rowFor("Phòng 106")).getByText("Đã hủy")).toBeTruthy();
  });

  it("filters by tab and shows the count on each tab", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancies).mockResolvedValue(items);
    render(<OwnerTenanciesPage />);

    await screen.findByText("Phòng 101");
    const tabs = screen.getByRole("navigation", { name: "Lọc kỳ thuê" });
    expect(within(tabs).getByRole("button", { name: /Lịch sử/ }).textContent).toContain("2");

    await user.click(within(tabs).getByRole("button", { name: /Lịch sử/ }));
    expect(screen.getByText("Phòng 105")).toBeTruthy();
    expect(screen.queryByText("Phòng 101")).toBeNull();

    await user.click(within(tabs).getByRole("button", { name: /Đã xác nhận/ }));
    expect(screen.getByText("Phòng 104")).toBeTruthy();
    expect(within(tabs).getByRole("button", { name: /Đã xác nhận/ }).getAttribute("aria-current")).toBe("page");

    for (const label of ["Chờ người thuê", "Cần sửa đổi", "Đang hoạt động"]) {
      await user.click(within(tabs).getByRole("button", { name: new RegExp(label) }));
      expect(screen.getAllByRole("row")).toHaveLength(2);
    }
  });

  it("shows an empty state for a tab with nothing in it", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancies).mockResolvedValue([tenancy("201", "ACTIVE")]);
    render(<OwnerTenanciesPage />);

    await screen.findByText("Phòng 201");
    await user.click(screen.getByRole("button", { name: /Lịch sử/ }));
    expect(screen.getByText("Không có kỳ thuê trong mục này.")).toBeTruthy();
  });

  it("retries after a load error and sends a signed-out owner to login", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerTenancies).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(items);
    render(<OwnerTenanciesPage />);

    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải danh sách kỳ thuê. Vui lòng thử lại.");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Phòng 101")).toBeTruthy();

    cleanup();
    vi.mocked(getOwnerTenancies).mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));
    render(<OwnerTenanciesPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
