import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  getAmenityCatalog,
  getOwnerProperty,
  getOwnerPropertyMedia,
  uploadOwnerMedia,
  updateOwnerProperty,
} from "@/lib/owner/api";
import type { OwnerPropertyDetail } from "@/lib/owner/types";
import { PropertyEditor } from "./property-editor";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(window.location.search),
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
    window.history.replaceState(null, "", "/");
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:photo"),
      revokeObjectURL: vi.fn(),
    });
    vi.mocked(getOwnerProperty)
      .mockResolvedValueOnce(property(1))
      .mockResolvedValueOnce(property(2));
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);
    vi.mocked(getAmenityCatalog).mockResolvedValue([
      { key: "wifi", label: "Wi-Fi", scopes: ["shared", "unit"] },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("reloads the current revision without discarding property and amenity drafts", async () => {
    const user = userEvent.setup();
    vi.mocked(updateOwnerProperty)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce(property(3));

    render(<PropertyEditor propertyId="property-1" />);

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

  it("refreshes amenities changed elsewhere while keeping the other draft fields", async () => {
    const original = property(1);
    original.shared_amenities = {
      schema_version: 1,
      standard: { wifi: { enabled: true } },
      custom: [],
    };
    const latest = property(2);
    latest.shared_amenities = {
      schema_version: 1,
      standard: { air_conditioning: { enabled: true } },
      custom: [],
    };
    vi.mocked(getOwnerProperty)
      .mockReset()
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(latest);
    vi.mocked(getAmenityCatalog).mockResolvedValue([
      { key: "wifi", label: "Wi-Fi", scopes: ["shared", "unit"] },
      {
        key: "air_conditioning",
        label: "Điều hòa",
        scopes: ["shared", "unit"],
      },
    ]);
    vi.mocked(updateOwnerProperty).mockRejectedValueOnce(
      new ApiError(409, "Stale revision"),
    );

    const user = userEvent.setup();
    render(<PropertyEditor propertyId="property-1" />);

    const name = await screen.findByLabelText("Tên bất động sản");
    await user.clear(name);
    await user.type(name, "Bản nháp vẫn giữ");
    await user.click(screen.getByRole("checkbox", { name: /Wi-Fi/ }));
    await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Tiện nghi đã được cập nhật ở nơi khác",
    );
    expect((name as HTMLInputElement).value).toBe("Bản nháp vẫn giữ");
    expect(
      (screen.getByRole("checkbox", { name: /Wi-Fi/ }) as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(
      (
        screen.getByRole("checkbox", { name: /Điều hòa/ }) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });

  it("uploads each queued photo to the scope selected when it was added", async () => {
    const separateProperty = property(1);
    separateProperty.rental_arrangement = "SEPARATE_UNITS";
    separateProperty.units = [
      {
        id: "unit-1",
        property_id: separateProperty.id,
        label: "Phòng A",
        unit_kind: "STUDIO",
        description: null,
        floor: null,
        area_m2: 25,
        bedrooms: 1,
        bathrooms: 1,
        bathroom_arrangement: "PRIVATE",
        amenities: { schema_version: 1, standard: {}, custom: [] },
        advertised_monthly_rent: 3000000,
        deposit: 3000000,
        minimum_rental_months: 1,
        max_occupants: 2,
        operational_status: "READY",
        is_marketed: true,
        policy_overrides: {},
        archived_at: null,
      },
    ];
    vi.mocked(getOwnerProperty).mockReset().mockResolvedValue(separateProperty);
    vi.mocked(getOwnerPropertyMedia).mockResolvedValue([]);
    vi.mocked(uploadOwnerMedia)
      .mockResolvedValueOnce({ content_revision: 2 } as never)
      .mockResolvedValueOnce({ content_revision: 3 } as never);

    const user = userEvent.setup();
    window.history.replaceState(
      null,
      "",
      "/owner/properties/property-1/edit?tab=photos",
    );
    render(<PropertyEditor propertyId="property-1" />);

    const sharedPhoto = new File(["shared"], "shared.jpg", {
      type: "image/jpeg",
    });
    await user.upload(
      await screen.findByLabelText("Tải ảnh dùng chung lên"),
      sharedPhoto,
    );
    expect(screen.getByText("Ảnh dùng chung")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ảnh căn/phòng" }));
    await user.selectOptions(screen.getByLabelText("Chọn căn/phòng"), "unit-1");
    const unitPhoto = new File(["unit"], "unit.jpg", { type: "image/jpeg" });
    await user.upload(await screen.findByLabelText("Chọn ảnh"), unitPhoto);

    await user.click(screen.getByRole("button", { name: "Tải 2 ảnh" }));

    await waitFor(() => expect(uploadOwnerMedia).toHaveBeenCalledTimes(2));
    expect(vi.mocked(uploadOwnerMedia).mock.calls[0][1].unit_id).toBeUndefined();
    expect(vi.mocked(uploadOwnerMedia).mock.calls[1][1].unit_id).toBe("unit-1");
  });
});
