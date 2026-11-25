import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { getOwnerPropertyPage } from "@/lib/owner/api";
import type { OwnerPropertySummary } from "@/lib/owner/types";
import OwnerPropertiesPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/owner/api", () => ({
  getOwnerPropertyPage: vi.fn(),
}));

function summary(
  id: string,
  overrides: Partial<OwnerPropertySummary> = {},
): OwnerPropertySummary {
  return {
    id,
    owner_id: "owner",
    name: `Nhà ${id}`,
    property_type: "HOUSE",
    rental_arrangement: "SEPARATE_UNITS",
    address_line: "12 Lê Duẩn",
    ward: "Hải Châu",
    city: "Đà Nẵng",
    archived_at: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    unit_count: 1,
    occupancy: {
      kind: "single",
      status: "VACANT",
      label: "Còn trống",
    },
    listing: {
      id: `listing-${id}`,
      title: `Tin ${id}`,
      moderation_status: "DRAFT",
      publication_status: "DRAFT",
      admin_suspended_at: null,
    },
    ...overrides,
  };
}

const rows: OwnerPropertySummary[] = [
  summary("a", {
    listing: {
      id: "la",
      title: "A",
      moderation_status: "APPROVED",
      publication_status: "PUBLISHED",
      admin_suspended_at: null,
    },
  }),
  summary("b", {
    rental_arrangement: "WHOLE_SPACE",
    address_line: null,
    ward: null,
    city: null,
    listing: null,
  }),
  summary("c", {
    listing: {
      id: "lc",
      title: "C",
      moderation_status: "PENDING",
      publication_status: "DRAFT",
      admin_suspended_at: null,
    },
  }),
  summary("d", {
    listing: {
      id: "ld",
      title: "D",
      moderation_status: "REJECTED",
      publication_status: "DRAFT",
      admin_suspended_at: null,
    },
  }),
  summary("e", {
    listing: {
      id: "le",
      title: "E",
      moderation_status: "APPROVED",
      publication_status: "DRAFT",
      admin_suspended_at: null,
    },
  }),
  summary("f", {
    listing: {
      id: "lf",
      title: "F",
      moderation_status: "APPROVED",
      publication_status: "PUBLISHED",
      admin_suspended_at: "2026-11-15T00:00:00Z",
    },
  }),
];

function rowFor(name: string) {
  return within(screen.getByText(name).closest("tr") as HTMLElement);
}

function pageOf(data: OwnerPropertySummary[]) {
  return {
    data,
    meta: {
      current_page: 1,
      per_page: 20,
      total: data.length,
      last_page: 1,
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOwnerPropertyPage).mockResolvedValue(pageOf(rows));
});
afterEach(cleanup);

describe("owner properties", () => {
  it("summarises each property with rental and listing status", async () => {
    render(<OwnerPropertiesPage />);

    expect(screen.getByText("Đang tải bất động sản…")).toBeTruthy();
    await screen.findByText("Nhà a");
    expect(getOwnerPropertyPage).toHaveBeenCalledWith({
      page: 1,
      includeArchived: false,
      occupancy: "all",
      listingStatuses: [],
    });

    expect(rowFor("Nhà a").getByText("Đang hiển thị")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("12 Lê Duẩn, Hải Châu, Đà Nẵng")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("Từng căn riêng lẻ")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("Còn trống")).toBeTruthy();
    expect(
      rowFor("Nhà a").getByRole("link", { name: "Chi tiết" }).getAttribute("href"),
    ).toBe("/owner/properties/a");
    expect(
      rowFor("Nhà a").getByRole("link", { name: "Chỉnh sửa" }).getAttribute("href"),
    ).toBe("/owner/properties/a/edit");
    expect(rowFor("Nhà b").getByText("Chưa có tin")).toBeTruthy();
    expect(rowFor("Nhà b").getByText("Chưa nhập địa chỉ")).toBeTruthy();
    expect(rowFor("Nhà b").getByText("Toàn bộ không gian")).toBeTruthy();
    expect(rowFor("Nhà c").getByText("Chờ duyệt")).toBeTruthy();
    expect(rowFor("Nhà d").getByText("Cần chỉnh sửa")).toBeTruthy();
    expect(rowFor("Nhà e").getByText("Đã duyệt")).toBeTruthy();
    expect(rowFor("Nhà f").getByText("Bị tạm ngưng")).toBeTruthy();
  });

  it("does not show the archived properties toggle", async () => {
    render(<OwnerPropertiesPage />);

    await screen.findByText("Nhà a");
    expect(screen.queryByRole("checkbox", { name: "Hiện mục đã lưu trữ" })).toBeNull();
    expect(getOwnerPropertyPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeArchived: false, page: 1 }),
    );
  });

  it("starts a fresh property form when creating one", async () => {
    const user = userEvent.setup();
    render(<OwnerPropertiesPage />);

    await screen.findByText("Nhà a");
    await user.click(screen.getByRole("link", { name: "Tạo bất động sản" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/owner\/properties\/new\?fresh=/),
    );
  });

  it("invites a new owner to add a first property", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerPropertyPage).mockResolvedValue(pageOf([]));
    render(<OwnerPropertiesPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Thêm bất động sản đầu tiên của bạn",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "Thêm bất động sản" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/owner\/properties\/new\?fresh=/),
    );
  });

  it("retries after a load error and sends a signed-out owner to login", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerPropertyPage).mockReset();
    vi.mocked(getOwnerPropertyPage)
      .mockRejectedValueOnce(new ApiError(503, "Dịch vụ đang bận."))
      .mockResolvedValueOnce(pageOf([rows[0]]));
    render(<OwnerPropertiesPage />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Dịch vụ đang bận.",
    );
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Nhà a")).toBeTruthy();

    cleanup();
    vi.mocked(getOwnerPropertyPage).mockRejectedValueOnce(
      new ApiError(401, "Unauthenticated"),
    );
    render(<OwnerPropertiesPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
