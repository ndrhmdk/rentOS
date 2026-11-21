import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  getAmenityCatalog,
  getOwnerListing,
  getOwnerListingById,
  getOwnerProperty,
  getOwnerPropertyMedia,
  updateOwnerListing,
} from "@/lib/owner/api";
import type { OwnerListing, OwnerPropertyDetail } from "@/lib/owner/types";
import { ListingEditor } from "./listing-editor";

const replace = vi.fn();
const router = { replace, push: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/components/listings/listing-detail", () => ({
  ListingDetailView: () => <div />,
}));
vi.mock("@/lib/http/client", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public errors: Record<string, string[]> = {},
    ) {
      super(message);
    }
  },
}));
vi.mock("@/lib/owner/api", () => ({
  archiveOwnerListing: vi.fn(),
  createOwnerListing: vi.fn(),
  getAmenityCatalog: vi.fn(),
  getOwnerListing: vi.fn(),
  getOwnerListingById: vi.fn(),
  getOwnerProperty: vi.fn(),
  getOwnerPropertyMedia: vi.fn(),
  hideOwnerListing: vi.fn(),
  publishOwnerListing: vi.fn(),
  submitOwnerListing: vi.fn(),
  updateOwnerListing: vi.fn(),
  updateOwnerUnit: vi.fn(),
}));

const property = (revision: number): OwnerPropertyDetail => ({
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
  address_line: null,
  ward: null,
  description: null,
  content_revision: revision,
  shared_amenities: { schema_version: 1, standard: {}, custom: [] },
  policies: {
    schema_version: 1,
    pets: "NOT_ALLOWED",
    smoking: "NOT_ALLOWED",
    shared_rules: [],
  },
  units: [],
});

const listing: OwnerListing = {
  id: "listing-1",
  property_id: "property-1",
  client_operation_id: "listing-operation-1",
  title: "Tiêu đề cũ",
  description: "Đây là phần mô tả tin đăng cũ đã đủ độ dài.",
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
};

describe("ListingEditor stale revision recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOwnerListingById).mockResolvedValue(listing);
    vi.mocked(getOwnerListing).mockResolvedValue(listing);
    vi.mocked(getOwnerProperty)
      .mockResolvedValueOnce(property(1))
      .mockResolvedValueOnce(property(2));
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);
    vi.mocked(getAmenityCatalog).mockResolvedValue([]);
  });

  afterEach(cleanup);

  it("retains edited title and description and retries with the refreshed revision", async () => {
    const user = userEvent.setup();
    vi.mocked(updateOwnerListing)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce(listing);

    render(<ListingEditor listingId="listing-1" />);
    const saveButton = await screen.findByRole("button", {
      name: "Lưu nội dung",
    });
    const title = await screen.findByLabelText("Tiêu đề");
    const description = screen.getByLabelText("Mô tả tin đăng");
    fireEvent.change(title, { target: { value: "Tiêu đề bản nháp mới" } });
    fireEvent.change(description, {
      target: {
        value: "Nội dung bản nháp cần được giữ lại sau khi tải phiên bản mới.",
      },
    });
    await user.click(saveButton);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Tiêu đề và nội dung bạn nhập vẫn được giữ nguyên",
    );
    expect((title as HTMLInputElement).value).toBe("Tiêu đề bản nháp mới");
    expect((description as HTMLTextAreaElement).value).toBe(
      "Nội dung bản nháp cần được giữ lại sau khi tải phiên bản mới.",
    );

    await user.click(saveButton);
    await waitFor(() => expect(updateOwnerListing).toHaveBeenCalledTimes(2));
    expect(vi.mocked(updateOwnerListing).mock.calls[1][1]).toMatchObject({
      expected_content_revision: 2,
      title: "Tiêu đề bản nháp mới",
      description:
        "Nội dung bản nháp cần được giữ lại sau khi tải phiên bản mới.",
    });
  });
});
