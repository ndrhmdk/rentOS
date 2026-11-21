import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import {
  removeOwnerMedia,
  updateOwnerGallery,
} from "@/lib/owner/api";
import type { OwnerPropertyDetail, OwnerPropertyMedia } from "@/lib/owner/types";
import { PropertyPhotos } from "./property-editor";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <span role="img" aria-label={props.alt as string} />
  ),
}));

vi.mock("@/components/owner/owner-photo", () => ({
  OwnerPhoto: (props: Record<string, unknown>) => (
    <span role="img" aria-label={props.alt as string} />
  ),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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

function property(contentRevision: number): OwnerPropertyDetail {
  return {
    id: "property-1",
    owner_id: "owner-1",
    client_operation_id: "create-operation-1",
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

function photo(
  id: string,
  sortOrder: number,
  revision = 1,
  selected = true,
): OwnerPropertyMedia {
  return {
    id,
    property_id: "property-1",
    unit_id: null,
    caption: `Ảnh ${id}`,
    sort_order: sortOrder,
    is_selected_for_listing: selected,
    revision,
    mime_type: "image/jpeg",
    size_bytes: 100,
    preview_url: null,
  };
}

function renderGallery(
  contentRevision: number,
  media: OwnerPropertyMedia[],
  onReload = vi.fn(async () => property(contentRevision)),
) {
  const props = {
    property: property(contentRevision),
    media,
    busy: false,
    setBusy: vi.fn(),
    onReload,
    onError: vi.fn(),
    onNotice: vi.fn(),
  };
  const rendered = render(<PropertyPhotos {...props} />);

  return { ...rendered, props };
}

describe("PropertyPhotos gallery recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(updateOwnerGallery).mockResolvedValue([]);
    vi.mocked(removeOwnerMedia).mockResolvedValue(photo("a", 0));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps a reordered gallery after a stale revision and retries with fresh revisions", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => property(2));
    const { rerender } = renderGallery(1, [photo("a", 0), photo("b", 1)], reload);
    vi.mocked(updateOwnerGallery)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce([]);

    const firstCard = screen.getByText("Ảnh a").closest("li");
    expect(firstCard).not.toBeNull();
    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Đưa Ảnh a xuống" }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

    const refreshedPhotos = [
      photo("a", 0, 2),
      photo("b", 1, 2),
      photo("c", 2, 1),
    ];
    rerender(
      <PropertyPhotos
        property={property(2)}
        media={refreshedPhotos}
        busy={false}
        setBusy={vi.fn()}
        onReload={reload}
        onError={vi.fn()}
        onNotice={vi.fn()}
      />,
    );

    const visiblePhotos = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(visiblePhotos[0]).toContain("Ảnh b");
    expect(visiblePhotos[1]).toContain("Ảnh a");
    expect(visiblePhotos[2]).toContain("Ảnh c");

    await user.click(screen.getByRole("button", { name: "Lưu lựa chọn hiển thị" }));

    await waitFor(() => expect(updateOwnerGallery).toHaveBeenCalledTimes(2));
    expect(vi.mocked(updateOwnerGallery).mock.calls[1]).toEqual([
      "property-1",
      {
        expected_content_revision: 2,
        items: [
          { media_id: "b", revision: 2, sort_order: 0, is_selected_for_listing: true },
          { media_id: "a", revision: 2, sort_order: 1, is_selected_for_listing: true },
          { media_id: "c", revision: 1, sort_order: 2, is_selected_for_listing: true },
        ],
      },
    ]);
  });

  it("retains a pending display selection after refreshing a stale gallery", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => property(2));
    const { rerender } = renderGallery(1, [photo("a", 0), photo("b", 1)], reload);
    vi.mocked(updateOwnerGallery)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce([]);

    const checkboxes = screen.getAllByRole("checkbox", { name: "Hiển thị trên tin" });
    await user.click(checkboxes[0]);
    await user.click(screen.getByRole("button", { name: "Lưu lựa chọn hiển thị" }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

    rerender(
      <PropertyPhotos
        property={property(2)}
        media={[photo("a", 0, 2), photo("b", 1, 2)]}
        busy={false}
        setBusy={vi.fn()}
        onReload={reload}
        onError={vi.fn()}
        onNotice={vi.fn()}
      />,
    );

    expect(
      (screen.getAllByRole("checkbox", {
        name: "Hiển thị trên tin",
      })[0] as HTMLInputElement).checked,
    ).toBe(false);
    await user.click(screen.getByRole("button", { name: "Lưu lựa chọn hiển thị" }));
    await waitFor(() => expect(updateOwnerGallery).toHaveBeenCalledTimes(2));
    const retryPayload = vi.mocked(updateOwnerGallery).mock.calls[1][1];
    expect(retryPayload.expected_content_revision).toBe(2);
    expect(retryPayload.items.find((item) => item.media_id === "a")).toMatchObject({
      revision: 2,
      is_selected_for_listing: false,
    });
  });

  it("offers a retry for a photo removal after refreshing a stale revision", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const reload = vi.fn(async () => property(2));
    const { rerender } = renderGallery(1, [photo("a", 0)], reload);
    vi.mocked(removeOwnerMedia)
      .mockRejectedValueOnce(new ApiError(409, "Stale revision"))
      .mockResolvedValueOnce(photo("a", 2));

    await user.click(screen.getByRole("button", { name: "Gỡ Ảnh a" }));
    await waitFor(() => expect(removeOwnerMedia).toHaveBeenCalledTimes(1));
    expect(confirm).toHaveBeenCalledOnce();

    rerender(
      <PropertyPhotos
        property={property(2)}
        media={[photo("a", 0, 2)]}
        busy={false}
        setBusy={vi.fn()}
        onReload={reload}
        onError={vi.fn()}
        onNotice={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Thử gỡ lại Ảnh a" }));
    await waitFor(() => expect(removeOwnerMedia).toHaveBeenCalledTimes(2));
    expect(removeOwnerMedia).toHaveBeenLastCalledWith("property-1", "a", 2, 2);
  });
});
