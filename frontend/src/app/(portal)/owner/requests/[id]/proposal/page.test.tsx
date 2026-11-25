import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { getOwnerRentalRequest } from "@/lib/owner/api";
import type { OwnerRentalRequestDetail } from "@/lib/owner/types";
import { proposeOwnerTenancy } from "@/lib/tenancies/api";
import OwnerTenancyProposalPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { push: mockPush, replace: mockReplace, refresh: mockRefresh };

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "request-1" }),
  useRouter: () => mockRouter,
}));
vi.mock("@/lib/owner/api", () => ({ getOwnerRentalRequest: vi.fn() }));
vi.mock("@/lib/tenancies/api", () => ({ proposeOwnerTenancy: vi.fn() }));

function detail(overrides: Partial<OwnerRentalRequestDetail> = {}): OwnerRentalRequestDetail {
  return {
    request: {
      id: "request-1",
      contact_name: "Mai Nguyễn",
      desired_move_in_date: "2027-01-01",
      desired_end_date: "2027-06-30",
      preferred_unit_id: "unit-preferred",
      listing_id: "listing-1",
      property_id: "property-1",
      policies: "",
    } as OwnerRentalRequestDetail["request"],
    property_policies: { schema_version: 1, pets: "NOT_ALLOWED", smoking: "NOT_ALLOWED", shared_rules: ["Giữ yên tĩnh sau 22:00"] },
    units: [
      { id: "unit-busy", label: "Phòng A", operational_status: "READY", monthly_rent: 3000000, deposit_amount: 3000000, minimum_rental_months: 3, policy_overrides: {}, has_date_conflict: true },
      { id: "unit-repair", label: "Phòng B", operational_status: "MAINTENANCE", monthly_rent: 3200000, deposit_amount: 3200000, minimum_rental_months: 3, policy_overrides: {}, has_date_conflict: false },
      { id: "unit-preferred", label: "Phòng C", operational_status: "READY", monthly_rent: 4500000, deposit_amount: 4500000, minimum_rental_months: 3, policy_overrides: { pets: "ALLOWED", additional_rules: ["Không nấu ăn trong phòng"] }, has_date_conflict: false },
      { id: "unit-free", label: "Phòng D", operational_status: "READY", monthly_rent: 5000000, deposit_amount: 2500000, minimum_rental_months: 6, policy_overrides: {}, has_date_conflict: false },
    ],
    ...overrides,
  };
}

async function goToTerms(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("heading", { name: "Lập thỏa thuận thuê cho Mai Nguyễn" });
  await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
  await screen.findByRole("heading", { name: "Điều khoản" });
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

describe("owner tenancy proposal", () => {
  it("preselects the tenant's preferred unit and blocks units that are busy or under repair", async () => {
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail());
    render(<OwnerTenancyProposalPage />);

    await screen.findByRole("heading", { name: "Lập thỏa thuận thuê cho Mai Nguyễn" });
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => (radio as HTMLInputElement).value)).toEqual(["unit-busy", "unit-repair", "unit-preferred", "unit-free"]);
    expect((radios[0] as HTMLInputElement).disabled).toBe(true);
    expect((radios[1] as HTMLInputElement).disabled).toBe(true);
    expect((radios[2] as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("Đã có lịch thuê")).toBeTruthy();
    expect(screen.getByText("Đang bảo trì")).toBeTruthy();
    expect(screen.getByText("Căn ưu tiên")).toBeTruthy();
  });

  it("walks through the steps, validates terms and sends the agreed proposal", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail());
    vi.mocked(proposeOwnerTenancy).mockResolvedValue({ tenancy_id: "tenancy-9" } as Awaited<ReturnType<typeof proposeOwnerTenancy>>);
    render(<OwnerTenancyProposalPage />);

    await goToTerms(user);
    const rent = screen.getByLabelText("Giá thuê hằng tháng (₫)") as HTMLInputElement;
    expect(rent.value).toContain("4");
    expect(screen.getByText("Giữ yên tĩnh sau 22:00")).toBeTruthy();
    expect((screen.getByPlaceholderText("Mỗi dòng một nội quy") as HTMLTextAreaElement).value).toBe("Không nấu ăn trong phòng");

    await user.clear(rent);
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Giá thuê phải lớn hơn 0.");

    await user.type(rent, "4800000");
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await screen.findByRole("heading", { name: "Xem lại và gửi" });

    const summary = screen.getByRole("heading", { name: "Xem lại và gửi" }).closest("div")?.parentElement as HTMLElement;
    expect(within(summary).getByText("Phòng C")).toBeTruthy();
    expect(within(summary).getByText("Được phép")).toBeTruthy();

    const submit = screen.getByRole("button", { name: "Xác nhận thỏa thuận & Khóa căn" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await user.click(screen.getByRole("checkbox"));
    await user.click(submit);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/owner/tenancies/tenancy-9"));
    expect(proposeOwnerTenancy).toHaveBeenCalledWith("request-1", expect.objectContaining({
      unit_id: "unit-preferred",
      start_date: "2027-01-01",
      end_date: "2027-06-30",
      monthly_rent: 4800000,
      deposit_amount: 4500000,
      client_operation_id: expect.any(String),
      policies_snapshot: {
        property: detail().property_policies,
        unit: { pets: "ALLOWED", smoking: "NOT_ALLOWED", additional_rules: ["Không nấu ăn trong phòng"] },
      },
    }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("switching units resets the terms to that unit's defaults", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail());
    render(<OwnerTenancyProposalPage />);

    await screen.findByRole("heading", { name: "Lập thỏa thuận thuê cho Mai Nguyễn" });
    await user.click(screen.getAllByRole("radio")[3]);
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect((await screen.findByPlaceholderText("Mỗi dòng một nội quy") as HTMLTextAreaElement).value).toBe("");
    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.getByRole("heading", { name: "Lập thỏa thuận thuê cho Mai Nguyễn" })).toBeTruthy();
  });

  it("returns to unit selection when another proposal took the unit first", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail());
    vi.mocked(proposeOwnerTenancy).mockRejectedValue(new ApiError(409, "Căn này vừa được giữ cho kỳ thuê khác.", { unit_id: ["Trùng lịch."] }));
    render(<OwnerTenancyProposalPage />);

    await goToTerms(user);
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Xác nhận thỏa thuận & Khóa căn" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Căn này vừa được giữ cho kỳ thuê khác. Trùng lịch.");
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows a server error without leaking details", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail());
    vi.mocked(proposeOwnerTenancy).mockRejectedValue(new ApiError(500, "SQLSTATE[...]"));
    render(<OwnerTenancyProposalPage />);

    await goToTerms(user);
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Xác nhận thỏa thuận & Khóa căn" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Máy chủ gặp lỗi khi lưu đề xuất. Vui lòng thử lại sau.");
  });

  it("cannot continue when no unit is free for the requested dates", async () => {
    vi.mocked(getOwnerRentalRequest).mockResolvedValue(detail({
      units: [{ id: "unit-busy", label: "Phòng A", operational_status: "READY", monthly_rent: 3000000, deposit_amount: 3000000, minimum_rental_months: 3, policy_overrides: {}, has_date_conflict: true }],
    }));
    render(<OwnerTenancyProposalPage />);

    expect(await screen.findByText(/Hiện không còn căn nào khả dụng/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Tiếp tục" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers a retry when the request cannot be loaded", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerRentalRequest)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(detail());
    render(<OwnerTenancyProposalPage />);

    expect((await screen.findByRole("alert")).textContent).toBe("Không thể tải dữ liệu đề xuất. Vui lòng thử lại.");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("heading", { name: "Lập thỏa thuận thuê cho Mai Nguyễn" })).toBeTruthy();
  });

  it("sends a signed-out owner to login", async () => {
    vi.mocked(getOwnerRentalRequest).mockRejectedValue(new ApiError(401, "Unauthenticated"));
    render(<OwnerTenancyProposalPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
