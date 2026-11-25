import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { getOwnerListing, getOwnerProperties, getOwnerProperty } from "@/lib/owner/api";
import type { OwnerListing, OwnerProperty, OwnerPropertyDetail } from "@/lib/owner/types";
import OwnerPropertiesPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { push: mockPush, replace: mockReplace };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
vi.mock("@/lib/owner/api", () => ({
  getOwnerProperties: vi.fn(),
  getOwnerProperty: vi.fn(),
  getOwnerListing: vi.fn(),
}));

function property(id: string, overrides: Partial<OwnerPropertyDetail> = {}): OwnerPropertyDetail {
  return {
    id,
    name: `Nhà ${id}`,
    property_type: "HOUSE",
    rental_arrangement: "SEPARATE_UNITS",
    address_line: "12 Lê Duẩn",
    ward: "Hải Châu",
    city: "Đà Nẵng",
    archived_at: null,
    updated_at: "2026-11-20T00:00:00Z",
    units: [{ id: `${id}-u1`, archived_at: null }, { id: `${id}-u2`, archived_at: "2026-11-01T00:00:00Z" }],
    ...overrides,
  } as unknown as OwnerPropertyDetail;
}

function listing(overrides: Partial<OwnerListing>): OwnerListing {
  return { admin_suspended_at: null, publication_status: "DRAFT", moderation_status: "DRAFT", ...overrides } as OwnerListing;
}

const details: Record<string, OwnerPropertyDetail> = {
  a: property("a"),
  b: property("b", { rental_arrangement: "WHOLE_SPACE", address_line: null, ward: null, city: null } as Partial<OwnerPropertyDetail>),
  c: property("c"),
  d: property("d"),
  e: property("e"),
  f: property("f"),
  g: property("g", { archived_at: "2026-11-10T00:00:00Z" } as Partial<OwnerPropertyDetail>),
};
const listings: Record<string, OwnerListing | null> = {
  a: listing({ publication_status: "PUBLISHED", moderation_status: "APPROVED" }),
  b: null,
  c: listing({ moderation_status: "PENDING" }),
  d: listing({ moderation_status: "REJECTED" }),
  e: listing({ moderation_status: "APPROVED" }),
  f: listing({ admin_suspended_at: "2026-11-15T00:00:00Z", publication_status: "PUBLISHED" }),
  g: listing({}),
};

function rowFor(name: string) {
  return within(screen.getByText(name).closest("tr") as HTMLElement);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOwnerProperties).mockResolvedValue(Object.keys(details).map((id) => ({ id }) as OwnerProperty));
  vi.mocked(getOwnerProperty).mockImplementation(async (id) => details[id]);
  vi.mocked(getOwnerListing).mockImplementation(async (id) => listings[id]);
});
afterEach(cleanup);

describe("owner properties", () => {
  it("summarises each active property with its listing status", async () => {
    render(<OwnerPropertiesPage />);

    expect(screen.getByText("Đang tải bất động sản…")).toBeTruthy();
    await screen.findByText("Nhà a");
    expect(getOwnerProperties).toHaveBeenCalledWith(true);

    expect(rowFor("Nhà a").getByText("Đang hiển thị")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("12 Lê Duẩn, Hải Châu, Đà Nẵng")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("Từng căn riêng lẻ")).toBeTruthy();
    expect(rowFor("Nhà a").getByText("1")).toBeTruthy();
    expect(rowFor("Nhà a").getByRole("link", { name: "Chỉnh sửa" }).getAttribute("href")).toBe("/owner/properties/a");
    expect(rowFor("Nhà b").getByText("Chưa có tin")).toBeTruthy();
    expect(rowFor("Nhà b").getByText("Chưa nhập địa chỉ")).toBeTruthy();
    expect(rowFor("Nhà b").getByText("Toàn bộ không gian")).toBeTruthy();
    expect(rowFor("Nhà c").getByText("Chờ duyệt")).toBeTruthy();
    expect(rowFor("Nhà d").getByText("Cần chỉnh sửa")).toBeTruthy();
    expect(rowFor("Nhà e").getByText("Đã duyệt")).toBeTruthy();
    expect(rowFor("Nhà f").getByText("Bị tạm ngưng")).toBeTruthy();
    expect(screen.queryByText("Nhà g")).toBeNull();
  });

  it("shows archived properties on request", async () => {
    const user = userEvent.setup();
    render(<OwnerPropertiesPage />);

    await screen.findByText("Nhà a");
    await user.click(screen.getByRole("checkbox", { name: "Hiện mục đã lưu trữ" }));
    expect(rowFor("Nhà g").getByText("Bản nháp")).toBeTruthy();
  });

  it("starts a fresh property form when creating one", async () => {
    const user = userEvent.setup();
    render(<OwnerPropertiesPage />);

    await screen.findByText("Nhà a");
    await user.click(screen.getByRole("link", { name: "Tạo bất động sản" }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/owner\/properties\/new\?fresh=/));
  });

  it("invites a new owner to add a first property", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperties).mockResolvedValue([]);
    render(<OwnerPropertiesPage />);

    expect(await screen.findByRole("heading", { name: "Thêm bất động sản đầu tiên của bạn" })).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "Thêm bất động sản" }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/owner\/properties\/new\?fresh=/));
  });

  it("retries after a load error and sends a signed-out owner to login", async () => {
    const user = userEvent.setup();
    vi.mocked(getOwnerProperties).mockReset();
    vi.mocked(getOwnerProperties)
      .mockRejectedValueOnce(new ApiError(503, "Dịch vụ đang bận."))
      .mockResolvedValueOnce([{ id: "a" } as OwnerProperty]);
    render(<OwnerPropertiesPage />);

    expect((await screen.findByRole("alert")).textContent).toContain("Dịch vụ đang bận.");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Nhà a")).toBeTruthy();

    cleanup();
    vi.mocked(getOwnerProperties).mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));
    render(<OwnerPropertiesPage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
