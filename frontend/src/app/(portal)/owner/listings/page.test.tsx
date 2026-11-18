import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOwnerProperties } from "@/lib/auth-api";
import OwnerListingsPage from "./page";

const replace = vi.fn();
const router = { replace };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/lib/auth-api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  getOwnerProperties: vi.fn(),
}));

describe("owner listings page", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOwnerProperties).mockResolvedValue([
      {
        id: "property-1",
        owner_id: "owner-1",
        client_operation_id: "operation-1",
        name: "Nhà mẫu",
        property_type: "APARTMENT",
        rental_arrangement: "SEPARATE_UNITS",
        city: "Đà Nẵng",
        archived_at: null,
        created_at: "2026-11-18T00:00:00Z",
        updated_at: "2026-11-18T00:00:00Z",
        units: [
          {
            id: "unit-1",
            property_id: "property-1",
            label: "Phòng A",
            unit_kind: "ROOM",
            description: "Phòng mẫu",
            floor: "2",
            area_m2: "24.00",
            bedrooms: 1,
            bathrooms: 1,
            bathroom_arrangement: "PRIVATE",
            amenities: { schema_version: 1, standard: {}, custom: [] },
            advertised_monthly_rent: 4_000_000,
            deposit: 4_000_000,
            minimum_rental_months: 3,
            max_occupants: 2,
            operational_status: "READY",
            is_marketed: true,
            policy_overrides: {},
            archived_at: null,
          },
        ],
        listing: {
          id: "listing-1",
          property_id: "property-1",
          client_operation_id: "listing-operation-1",
          title: "Tin đăng mẫu",
          description: "Mô tả mẫu",
          cover_media_id: null,
          moderation_status: "DRAFT",
          publication_status: "DRAFT",
          submitted_revision: null,
          submitted_content_revision: null,
          approved_content_revision: null,
          review_reason: null,
          admin_suspended_at: null,
          archived_at: null,
          property_content_revision: 1,
        },
      },
    ]);
  });

  it("renders listing and unit summary from the paginated property response", async () => {
    render(<OwnerListingsPage />);

    expect(await screen.findByText("Tin đăng mẫu")).toBeTruthy();
    expect(screen.getByText("1 / 1")).toBeTruthy();
    expect(getOwnerProperties).toHaveBeenCalledTimes(1);
  });
});
