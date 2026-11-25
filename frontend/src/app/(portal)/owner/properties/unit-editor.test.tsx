import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { getAmenityCatalog, getOwnerProperty, updateOwnerUnit } from "@/lib/owner/api";
import type { OwnerPropertyDetail, OwnerUnit } from "@/lib/owner/types";
import { UnitEditor } from "./unit-editor";

const mockPush = vi.fn();
const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { push: mockPush, replace: mockReplace };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/owner/api", () => ({
  getOwnerProperty: vi.fn(),
  getAmenityCatalog: vi.fn(),
  updateOwnerUnit: vi.fn(),
}));
vi.mock("./unit-photos", () => ({
  UnitPhotoManager: ({ unitId }: { unitId: string }) => <p>Ảnh của {unitId}</p>,
}));

function unit(overrides: Partial<OwnerUnit> = {}): OwnerUnit {
  return {
    id: "unit-1",
    property_id: "property-1",
    label: "Phòng 101",
    unit_kind: "ROOM",
    description: "Phòng có cửa sổ",
    floor: "1",
    area_m2: "24",
    bedrooms: 1,
    bathrooms: 1,
    bathroom_arrangement: "PRIVATE",
    amenities: { schema_version: 1, standard: { air_conditioner: { enabled: true, details: "Inverter" } }, custom: ["Ban công"] },
    advertised_monthly_rent: "3500000",
    deposit: "3500000",
    minimum_rental_months: 6,
    max_occupants: 2,
    operational_status: "READY",
    is_marketed: true,
    policy_overrides: { pets: "ALLOWED", additional_rules: ["Không hút thuốc trong phòng"] },
    archived_at: null,
    ...overrides,
  } as OwnerUnit;
}

function property(units: OwnerUnit[] = [unit()]): OwnerPropertyDetail {
  return { id: "property-1", content_revision: 7, units } as unknown as OwnerPropertyDetail;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAmenityCatalog).mockResolvedValue([
    { key: "air_conditioner", label: "Điều hòa", scopes: ["unit"] },
    { key: "wifi", label: "Wi-Fi", scopes: ["unit", "property"] },
    { key: "parking", label: "Bãi xe", scopes: ["property"] },
  ]);
});
afterEach(cleanup);

describe("UnitEditor", () => {
  it("loads the unit, shows only unit-scoped amenities and saves the edited values", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperty).mockResolvedValue(property());
    vi.mocked(updateOwnerUnit).mockResolvedValue(undefined as never);
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);

    expect(screen.getByText("Đang tải phòng…")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Sửa Phòng 101" })).toBeTruthy();
    expect(screen.getByLabelText("Ghi chú Điều hòa")).toBeTruthy();
    expect(screen.getByLabelText("Ghi chú Wi-Fi")).toBeTruthy();
    expect(screen.queryByLabelText("Ghi chú Bãi xe")).toBeNull();

    const label = screen.getByLabelText("Tên phòng");
    await user.clear(label);
    await user.type(label, "  Phòng 102  ");
    await user.selectOptions(screen.getByLabelText("Trạng thái"), "MAINTENANCE");
    await user.selectOptions(screen.getByLabelText("Hút thuốc"), "OUTDOOR_ONLY");
    await user.click(screen.getByRole("checkbox", { name: /Wi-Fi/ }));
    await user.clear(screen.getByLabelText("Diện tích (m²)"));
    await user.click(screen.getByRole("button", { name: "Lưu phòng" }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/owner/properties/property-1/edit?tab=units",
      ),
    );
    expect(updateOwnerUnit).toHaveBeenCalledWith("property-1", "unit-1", expect.objectContaining({
      expected_content_revision: 7,
      label: "Phòng 102",
      unit_kind: "ROOM",
      area_m2: null,
      bedrooms: 1,
      minimum_rental_months: 6,
      max_occupants: 2,
      operational_status: "MAINTENANCE",
      amenities: {
        schema_version: 1,
        standard: { air_conditioner: { enabled: true, details: "Inverter" }, wifi: { enabled: true } },
        custom: ["Ban công"],
      },
      policy_overrides: { pets: "ALLOWED", smoking: "OUTDOOR_ONLY", additional_rules: ["Không hút thuốc trong phòng"] },
    }));
  });

  it("lists every field error the API returns", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperty).mockResolvedValue(property());
    vi.mocked(updateOwnerUnit).mockRejectedValue(new ApiError(422, "Dữ liệu chưa hợp lệ.", {
      advertised_monthly_rent: ["Giá thuê phải lớn hơn 0."],
      max_occupants: ["Số người tối đa phải từ 1."],
    }));
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);

    await screen.findByRole("heading", { name: "Sửa Phòng 101" });
    await user.click(screen.getByRole("button", { name: "Lưu phòng" }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      "Dữ liệu chưa hợp lệ.",
      "Giá thuê phải lớn hơn 0.Số người tối đa phải từ 1.",
    ]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows a generic error when saving fails without an API response", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperty).mockResolvedValue(property());
    vi.mocked(updateOwnerUnit).mockRejectedValue(new TypeError("Failed to fetch"));
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);

    await screen.findByRole("heading", { name: "Sửa Phòng 101" });
    await user.click(screen.getByRole("button", { name: "Lưu phòng" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Không thể lưu thay đổi. Vui lòng thử lại.");
    expect((screen.getByRole("button", { name: "Lưu phòng" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("switches to the photo tab", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperty).mockResolvedValue(property());
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);

    await screen.findByRole("heading", { name: "Sửa Phòng 101" });
    await user.click(screen.getByRole("tab", { name: "Ảnh" }));

    expect(screen.getByText("Ảnh của unit-1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lưu phòng" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Ảnh" }).getAttribute("aria-selected")).toBe("true");
  });

  it("treats an archived unit as missing", async () => {
    vi.mocked(getOwnerProperty).mockResolvedValue(property([unit({ archived_at: "2026-11-01T00:00:00Z" } as Partial<OwnerUnit>)]));
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);

    expect((await screen.findByRole("alert")).textContent).toBe("Không tìm thấy phòng.");
    expect(screen.getByRole("heading", { name: "Phòng" })).toBeTruthy();
  });

  it("shows load errors and redirects a signed-out owner", async () => {
    vi.mocked(getOwnerProperty).mockRejectedValueOnce(new Error("offline"));
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);
    expect((await screen.findByRole("alert")).textContent).toBe("Không thể tải phòng.");

    cleanup();
    vi.mocked(getOwnerProperty).mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));
    render(<UnitEditor propertyId="property-1" unitId="unit-1" />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
