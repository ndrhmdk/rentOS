import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListingDetail } from "./listings-api";
import { ListingDetailView } from "./listing-detail";
import { UnavailableListing } from "./unavailable-listing";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const listing: ListingDetail = {
  id: "listing-1",
  title: "Studio full nội thất",
  description: "Mô tả công khai",
  availability_label: "Trống từ 02/05/2027",
  available_unit_count: 0,
  gallery: [],
  property: {
    name: "Nhà Hải Châu",
    property_type: "APARTMENT",
    address_line: "12 Trần Phú",
    ward: "Hải Châu",
    city: "Đà Nẵng",
    description: "Nhà cho thuê",
    shared_rules: ["Không hút thuốc trong nhà"],
    shared_amenities: [{ key: "laundry", label_vi: "Giặt là chung", details: "Tầng trệt" }],
    custom_amenities: [],
  },
  units: [
    {
      id: "unit-1",
      label: "Phòng 1",
      unit_kind: "STUDIO",
      description: "Phòng",
      area_m2: "28.00",
      bedrooms: 1,
      bathrooms: "1.00",
      advertised_monthly_rent: "3800000",
      deposit: "3800000",
      minimum_rental_months: 3,
      max_occupants: 2,
      availability_label: "Đã được giữ/đặt. Trống từ 02/05/2027",
      available_from: "2027-05-02",
      available_until: null,
      held_start: "2026-11-01",
      held_end: "2027-05-01",
      pets: "NOT_ALLOWED",
      amenities: [],
      custom_amenities: ["Máy giặt riêng"],
      photos: [],
    },
  ],
};

describe("listing detail", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    push.mockReset();
  });

  it("separates shared laundry from an in-unit washing machine and keeps a held unit", () => {
    render(<ListingDetailView listing={listing} isSignedIn />);

    const shared = screen.getByRole("region", { name: "Tiện ích chung" });
    const unitAmenities = screen.getByRole("region", { name: "Tiện ích trong căn Phòng 1" });
    expect(shared.textContent).toContain("Giặt là chung");
    expect(unitAmenities.textContent).not.toContain("Máy giặt");
    expect(screen.getByText("Đã được giữ/đặt. Trống từ 02/05/2027")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Nội quy đang quảng cáo" }).textContent).toContain("Không hút thuốc trong nhà");
  });

  it("blocks submit when the phone is empty and does not call the network", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ListingDetailView listing={listing} isSignedIn />);

    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    expect(screen.getByRole("alert").textContent).toContain("Nhập số điện thoại.");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("sends a guest to login", async () => {
    const user = userEvent.setup();
    render(<ListingDetailView listing={listing} isSignedIn={false} />);

    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    expect(push).toHaveBeenCalledWith("/login");
  });

  it("renders the unavailable copy without a hidden title", () => {
    render(<UnavailableListing />);

    expect(screen.getByRole("heading", { name: "Bài đăng này hiện không khả dụng" })).toBeTruthy();
    expect(screen.queryByText("Tiêu đề bí mật bị ẩn")).toBeNull();
  });
});
