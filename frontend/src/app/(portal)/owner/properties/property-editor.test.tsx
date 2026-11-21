import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  getAmenityCatalog,
  getOwnerProperty,
  getOwnerPropertyMedia,
  updateOwnerProperty,
} from "@/lib/owner/api";
import type { OwnerPropertyDetail } from "@/lib/owner/types";
import { PropertyEditor } from "./property-editor";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/vietnam-location-picker", () => ({
  VietnamLocationPicker: () => <div />,
}));
vi.mock("@/components/owner/owner-photo", () => ({
  OwnerPhoto: () => <div />,
}));
vi.mock("next/image", () => ({ default: () => <div /> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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
  archiveOwnerProperty: vi.fn(),
  archiveOwnerUnit: vi.fn(),
  getAmenityCatalog: vi.fn(),
  getOwnerProperty: vi.fn(),
  getOwnerPropertyMedia: vi.fn(),
  removeOwnerMedia: vi.fn(),
  saveOwnerUnitSharedMedia: vi.fn(),
  updateOwnerGallery: vi.fn(),
  updateOwnerProperty: vi.fn(),
  updateOwnerUnitGallery: vi.fn(),
  uploadOwnerMedia: vi.fn(),
}));

function property(revision: number): OwnerPropertyDetail {
  return {
    id: "property-1",
    owner_id: "owner-1",
    client_operation_id: "operation-1",
    name: "Nhà mẫu",
    property_type: "APARTMENT",
    rental_arrangement: "WHOLE_SPACE",
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
  };
}

describe("PropertyEditor stale revision recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOwnerProperty)
      .mockResolvedValueOnce(property(1))
      .mockResolvedValueOnce(property(2));
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);
    vi.mocked(getAmenityCatalog).mockResolvedValue([
      { key: "wifi", label: "Wi-Fi", scopes: ["shared", "unit"] },
    ]);
  });

  afterEach(cleanup);

  it("reloads the current revision without discarding property and amenity drafts", async () => {
    const user = userEvent.setup();
    vi.mocked(updateOwnerProperty)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce(property(3));

    render(<PropertyEditor propertyId="property-1" tab="overview" />);

    const name = await screen.findByLabelText("Tên bất động sản");
    await user.clear(name);
    await user.type(name, "Nhà đã chỉnh");
    await user.click(screen.getByRole("checkbox", { name: /Wi-Fi/ }));
    await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Bản nháp của bạn vẫn được giữ nguyên",
    );
    expect((name as HTMLInputElement).value).toBe("Nhà đã chỉnh");
    expect(
      (screen.getByRole("checkbox", { name: /Wi-Fi/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(getOwnerProperty).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
    await waitFor(() => expect(updateOwnerProperty).toHaveBeenCalledTimes(2));
    expect(vi.mocked(updateOwnerProperty).mock.calls[1][1]).toMatchObject({
      expected_content_revision: 2,
      name: "Nhà đã chỉnh",
    });
  });
});
