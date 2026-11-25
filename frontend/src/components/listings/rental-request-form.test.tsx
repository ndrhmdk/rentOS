import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RentalRequestForm } from "./rental-request-form";
import { submitRentalRequest, type SubmittedRentalRequest } from "@/lib/rental-requests-api";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http/client";
import type { ListingDetail } from "@/features/discovery/listings-api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/rental-requests-api", () => ({
  submitRentalRequest: vi.fn(),
}));

vi.mock("@/components/ui/date-field", () => ({
  DateField: ({
    label,
    value,
    onValueChange,
    name,
  }: {
    label?: ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
    name?: string;
  }) => (
    <label>
      {label}
      <input
        aria-label={typeof label === "string" ? label : undefined}
        name={name}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </label>
  ),
}));

const mockListing = {
  id: "listing-1",
  title: "Phòng trọ cao cấp",
  property_id: "prop-1",
  description: "Mô tả phòng trọ",
  availability_label: "Còn trống",
  available_unit_count: 1,
  gallery: [{ id: "m-1", url: "https://example.com/cover.jpg", caption: null, sort_order: 0 }],
  property: {
    name: "Tòa nhà Green",
    property_type: "APARTMENT",
    address_line: "123 Cầu Giấy",
    ward: "Dịch Vọng",
    city: "Hà Nội",
    description: "Tòa nhà tiện nghi",
    shared_rules: [],
    shared_amenities: [],
    custom_amenities: [],
  },
  owner: { id: "owner-1", name: "Chủ nhà", phone: "0901234567" },
  units: [
    {
      id: "unit-1",
      label: "Phòng 101",
      unit_kind: "STUDIO",
      description: null,
      area_m2: "30",
      bedrooms: 1,
      bathrooms: "1",
      advertised_monthly_rent: "4000000",
      deposit: "4000000",
      minimum_rental_months: 6,
      max_occupants: 2,
      availability_label: "Còn trống",
      available_from: null,
      available_until: null,
      held_start: null,
      held_end: null,
      pets: null,
      smoking: null,
      rules: [],
      amenities: [],
      custom_amenities: [],
      photos: [],
    },
  ],
} as unknown as ListingDetail;

describe("RentalRequestForm", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "tenant-1", email: "tenant@example.com", name: "Khách Thuê", phone: "0901111111", is_admin: false, email_verified_at: null },
      status: "authenticated",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it("autofills contact name and formatted phone from authenticated user", () => {
    render(<RentalRequestForm listing={mockListing} isSignedIn={true} onCancel={vi.fn()} />);

    expect(screen.getByDisplayValue("Khách Thuê")).toBeTruthy();
    expect(screen.getByDisplayValue("090 111 1111")).toBeTruthy();
  });

  it("submits rental request successfully with contact details", async () => {
    const user = userEvent.setup();
    vi.mocked(submitRentalRequest).mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    } as unknown as SubmittedRentalRequest);

    render(<RentalRequestForm listing={mockListing} isSignedIn={true} onCancel={vi.fn()} />);

    expect(screen.getByDisplayValue("Khách Thuê")).toBeTruthy();
    expect(screen.getByDisplayValue("090 111 1111")).toBeTruthy();

    const startInput = screen.getByLabelText("Ngày dọn vào mong muốn");
    fireEvent.change(startInput, { target: { value: "2026-12-01" } });

    const endInput = screen.getByLabelText("Ngày kết thúc mong muốn");
    fireEvent.change(endInput, { target: { value: "2027-06-01" } });

    const submitBtn = screen.getByRole("button", { name: "Gửi yêu cầu thuê" });
    await user.click(submitBtn);

    expect(submitRentalRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: "listing-1",
        contact_name: "Khách Thuê",
        contact_phone: "0901111111",
        desired_move_in_date: "2026-12-01",
        desired_end_date: "2027-06-01",
        client_operation_id: expect.any(String),
      }),
    );

    expect(await screen.findByText("Đã gửi yêu cầu thuê")).toBeTruthy();
  });

  it("redirects to /login when receiving 401 error", async () => {
    const user = userEvent.setup();
    vi.mocked(submitRentalRequest).mockRejectedValue(new ApiError(401, "Unauthenticated"));

    render(<RentalRequestForm listing={mockListing} isSignedIn={true} onCancel={vi.fn()} />);

    const startInput = screen.getByLabelText("Ngày dọn vào mong muốn");
    fireEvent.change(startInput, { target: { value: "2026-12-01" } });

    const endInput = screen.getByLabelText("Ngày kết thúc mong muốn");
    fireEvent.change(endInput, { target: { value: "2027-06-01" } });

    const submitBtn = screen.getByRole("button", { name: "Gửi yêu cầu thuê" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("displays validation errors when receiving 422 error", async () => {
    const user = userEvent.setup();
    vi.mocked(submitRentalRequest).mockRejectedValue(
      new ApiError(422, "Dữ liệu không hợp lệ", {
        contact_phone: ["Số điện thoại không hợp lệ."],
      }),
    );

    render(<RentalRequestForm listing={mockListing} isSignedIn={true} onCancel={vi.fn()} />);

    const startInput = screen.getByLabelText("Ngày dọn vào mong muốn");
    fireEvent.change(startInput, { target: { value: "2026-12-01" } });

    const endInput = screen.getByLabelText("Ngày kết thúc mong muốn");
    fireEvent.change(endInput, { target: { value: "2027-06-01" } });

    const submitBtn = screen.getByRole("button", { name: "Gửi yêu cầu thuê" });
    await user.click(submitBtn);

    expect(await screen.findByText("Số điện thoại không hợp lệ.")).toBeTruthy();
  });
});
