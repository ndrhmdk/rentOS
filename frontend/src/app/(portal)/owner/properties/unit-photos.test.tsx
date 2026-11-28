import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  getOwnerProperty,
  getOwnerPropertyMedia,
  uploadOwnerMedia,
} from "@/lib/owner/api";
import type { OwnerPropertyDetail, OwnerPropertyMedia } from "@/lib/owner/types";
import { UnitPhotoManager } from "./unit-photos";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <span role="img" aria-label={props.alt as string} />
  ),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/http/client", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/owner/api", () => ({
  getOwnerProperty: vi.fn(),
  getOwnerPropertyMedia: vi.fn(),
  removeOwnerMedia: vi.fn(),
  saveOwnerUnitSharedMedia: vi.fn(),
  uploadOwnerMedia: vi.fn(),
}));

function property(contentRevision: number): OwnerPropertyDetail {
  return {
    id: "property-1",
    owner_id: "owner-1",
    client_operation_id: "create-operation-1",
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
    content_revision: contentRevision,
    shared_amenities: { schema_version: 1, standard: {}, custom: [] },
    policies: {
      schema_version: 1,
      pets: "NOT_ALLOWED",
      smoking: "NOT_ALLOWED",
      shared_rules: [],
    },
    units: [],
  };
}

function uploadedMedia(id: string): OwnerPropertyMedia {
  return {
    id,
    property_id: "property-1",
    unit_id: "unit-1",
    caption: null,
    sort_order: 0,
    is_selected_for_listing: true,
    revision: 1,
    mime_type: "image/jpeg",
    size_bytes: 1,
    preview_url: null,
  };
}

describe("UnitPhotoManager upload recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    let nextObjectUrl = 0;
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => `blob:photo-${++nextObjectUrl}`),
      revokeObjectURL: vi.fn(),
    });

    vi.mocked(getOwnerProperty)
      .mockResolvedValueOnce(property(1))
      .mockResolvedValueOnce(property(2))
      .mockResolvedValueOnce(property(3));
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);
    vi.mocked(uploadOwnerMedia)
      .mockResolvedValueOnce({ media: uploadedMedia("media-1"), content_revision: 2 })
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce({ media: uploadedMedia("media-2"), content_revision: 3 });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uses the property already loaded by the unit editor", async () => {
    const initialProperty = property(7);
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);

    render(
      <UnitPhotoManager
        propertyId="property-1"
        unitId="unit-1"
        initialProperty={initialProperty}
      />,
    );

    await waitFor(() => expect(getOwnerPropertyMedia).toHaveBeenCalledTimes(1));
    expect(getOwnerProperty).not.toHaveBeenCalled();
  });

  it("separates new computer photos from photos already uploaded", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([uploadedMedia("saved-1")]);
    render(<UnitPhotoManager propertyId="property-1" unitId="unit-1" />);

    expect(
      await screen.findByRole("heading", {
        name: "Ảnh đã tải lên cho căn này",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Đã tải lên")).toBeTruthy();

    const localPhoto = new File(["local"], "local.jpg", {
      type: "image/jpeg",
    });
    await user.upload(screen.getByLabelText("Chọn ảnh"), localPhoto);

    expect(
      screen.getByRole("heading", { name: "Ảnh mới từ máy tính" }),
    ).toBeTruthy();
    expect(screen.getByText("local.jpg")).toBeTruthy();
    expect(screen.getByText("Chưa tải lên")).toBeTruthy();
  });

  it("keeps failed files retryable and does not upload completed files again", async () => {
    const user = userEvent.setup();
    render(<UnitPhotoManager propertyId="property-1" unitId="unit-1" />);

    await waitFor(() => expect(getOwnerProperty).toHaveBeenCalledTimes(1));

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Chọn ảnh"), [firstFile, secondFile]);
    await user.click(screen.getByRole("button", { name: "Tải 2 ảnh" }));

    await screen.findByRole("alert");
    expect(getOwnerProperty).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("img", { name: "first.jpg" })).toBeNull();
    expect(screen.getByRole("img", { name: "second.jpg" })).toBeTruthy();

    const uploadCalls = vi.mocked(uploadOwnerMedia).mock.calls;
    expect(uploadCalls).toHaveLength(2);
    const failedOperationId = uploadCalls[1][1].client_operation_id;

    await user.click(screen.getByRole("button", { name: "Tải 1 ảnh" }));

    await waitFor(() => expect(uploadOwnerMedia).toHaveBeenCalledTimes(3));
    expect(getOwnerProperty).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole("img", { name: "second.jpg" })).toBeNull();
    expect(uploadCalls[2][1].client_operation_id).toBe(failedOperationId);
    expect(uploadCalls.map(([, input]) => input.expected_content_revision)).toEqual([
      1, 2, 2,
    ]);
  });
});
