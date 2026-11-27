import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminReviewLoader } from "./admin-review-loader";
import { AdminReviewDialog } from "./admin-review-dialog";
import {
  decideAdminPackage,
  getAdminPackage,
  type AdminPackageDto,
} from "@/lib/admin-review-api";
import { ApiError } from "@/lib/http/client";
import type { ReviewPackage } from "@/lib/admin-review-package";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "adm-1", name: "Mai Anh", email: "admin@test", is_admin: true },
    status: "authenticated",
  }),
}));

vi.mock("./admin-api-provider", () => ({
  useAdminApi: () => ({ revision: 0, refresh: vi.fn() }),
}));

vi.mock("@/lib/admin-review-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-review-api")>(
    "@/lib/admin-review-api",
  );
  return {
    ...actual,
    getAdminPackage: vi.fn(),
    decideAdminPackage: vi.fn(),
  };
});

const sampleDto = {
  id: "lst-1",
  title: "Studio Han River",
  description: "Mô tả chi tiết căn hộ",
  moderation_status: "PENDING",
  publication_status: "DRAFT",
  submitted_at: "2026-11-25T10:00:00Z",
  submitted_revision: 1,
  submitted_content_revision: 1,
  approved_content_revision: null,
  reviewed_at: null,
  review_reason: null,
  reviewer: null,
  snapshot_token: "snap-1",
  cover_media_id: "m-1",
  owner: { id: "o-1", name: "Minh Tuan", email: "owner@test", other_listings_count: 0 },
  property: {
    id: "p-1",
    name: "Han River House",
    address_line: "120 Bạch Đằng",
    ward: "Hải Châu",
    district: null,
    city: "Đà Nẵng",
    content_revision: 1,
    shared_amenities: { standard: { wifi: { enabled: true } } },
    policies: { defaults: { pets: "NOT_ALLOWED" } },
  },
  units: [
    {
      id: "u-1",
      label: "Studio 01",
      area_m2: "35",
      max_occupants: 2,
      advertised_monthly_rent: "8500000",
      deposit: "8500000",
      minimum_rental_months: 6,
      floor: 2,
      bathroom_arrangement: "PRIVATE",
      policy_overrides: {},
    },
  ],
  media: [],
  audit: [],
  completeness: {
    address: true,
    shared_photos: true,
    eligible_units: true,
    cover_photo: true,
  },
} as unknown as AdminPackageDto;

describe("AdminReviewLoader, AdminReviewDetail & AdminReviewDialog", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
  });

  it("handles 404/retry in AdminReviewLoader and renders AdminReviewDetail", async () => {
    vi.mocked(getAdminPackage)
      .mockRejectedValueOnce(new ApiError(404, "Not found"))
      .mockResolvedValue(sampleDto);

    render(<AdminReviewLoader id="lst-1" />);

    expect(await screen.findByText("Không tìm thấy gói tin đăng")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByRole("button", { name: "Phê duyệt" })).toBeTruthy();
    expect(screen.getByText("Địa chỉ đầy đủ")).toBeTruthy();
  });

  it("validates rejection reason and submits approve decision via AdminReviewDialog", async () => {
    const onClose = vi.fn();
    const onDecided = vi.fn();
    const pkg: ReviewPackage = {
      id: "lst-1",
      title: "Studio Han River",
      description: "Mô tả",
      status: "PENDING",
      initialApprovedAt: null,
      property: "Han River House",
      owner: "Minh Tuan",
      photos: 1,
      submittedAt: "2026-11-25T10:00:00Z",
      waiting: "Dưới 1 giờ",
      submittedVersion: 1,
      listingVersion: 1,
      propertyVersion: 1,
      address: "120 Bạch Đằng, Hải Châu, Đà Nẵng",
      amenities: ["Wi-Fi"],
      policies: ["Thú cưng: Không cho phép"],
      cover: "Ảnh bìa",
      email: "owner@test",
      otherListings: 0,
      units: [],
      gallery: [],
      apiData: sampleDto,
    };

    const { rerender } = render(
      <AdminReviewDialog
        reviewPackage={pkg}
        action="REJECTED"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    const rejectForm = screen.getByLabelText(/Lý do từ chối/).closest("form")!;
    fireEvent.submit(rejectForm);
    expect(screen.getByText("Vui lòng nhập lý do từ chối.")).toBeTruthy();

    vi.mocked(decideAdminPackage).mockResolvedValueOnce({
      ...sampleDto,
      moderation_status: "APPROVED",
    });

    rerender(
      <AdminReviewDialog
        reviewPackage={pkg}
        action="APPROVED"
        onClose={onClose}
        onDecided={onDecided}
      />,
    );

    const approveForm = screen.getByRole("button", { name: "Hủy" }).closest("form")!;
    fireEvent.submit(approveForm);

    await waitFor(() => {
      expect(decideAdminPackage).toHaveBeenCalledWith(
        "lst-1",
        "APPROVED",
        "snap-1",
        expect.any(String),
        "",
      );
      expect(onDecided).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
