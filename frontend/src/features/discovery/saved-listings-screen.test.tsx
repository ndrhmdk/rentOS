import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFavouritePage, type FavouritePage } from "@/lib/favourites-api";
import { SavedListingsScreen } from "./saved-listings-screen";
import type { ListingCard } from "./listings-api";

const mockUseFavourites = vi.fn();
vi.mock("./favourites-provider", () => ({
  useFavourites: () => mockUseFavourites(),
  FavouriteButton: ({ propertyId }: { propertyId: string }) => (
    <button type="button" aria-label={`Bỏ lưu ${propertyId}`}>Bỏ lưu</button>
  ),
}));

vi.mock("@/lib/favourites-api", () => ({
  getFavouritePage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockCard: ListingCard = {
  id: "listing-1",
  property_id: "prop-1",
  title: "Căn hộ cao cấp ven sông Hàn",
  availability_label: "Còn trống",
  available_unit_count: 2,
  rent_min: "5000000",
  rent_max: "8000000",
  minimum_rental_months: 6,
  cover_url: "https://example.com/cover.jpg",
  image_urls: ["https://example.com/cover.jpg"],
  property: {
    name: "Tòa nhà Hàn Giang",
    property_type: "APARTMENT",
    ward: "Hải Châu 1",
    city: "Đà Nẵng",
  },
};

describe("saved listings screen", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("prompts guest to sign in when not authenticated", async () => {
    const prompt = vi.fn();
    mockUseFavourites.mockReturnValue({
      authStatus: "guest",
      prompt,
      accountId: null,
      state: { status: "ready", ids: new Set(), revision: 0 },
    });

    render(<SavedListingsScreen />);

    expect(screen.getByText("Đăng nhập để xem tin đã lưu")).toBeTruthy();
    expect(
      screen.getByText("Danh sách yêu thích được lưu riêng cho tài khoản của bạn."),
    ).toBeTruthy();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it("renders saved listings and handles unavailable property placeholders safely without data leakage", async () => {
    mockUseFavourites.mockReturnValue({
      authStatus: "authenticated",
      accountId: "tenant-100",
      state: { status: "ready", ids: new Set(["prop-1", "prop-2"]), revision: 1 },
    });

    const mockPage: FavouritePage = {
      items: [
        { property_id: "prop-1", listing: mockCard },
        { property_id: "prop-2", listing: null }, // Suspended or archived property
      ],
      page: 1,
      last_page: 1,
      total: 2,
    };

    vi.mocked(getFavouritePage).mockResolvedValue(mockPage);

    render(<SavedListingsScreen />);

    // Available listing card
    expect(
      await screen.findByRole("heading", {
        name: "Căn hộ cao cấp ven sông Hàn",
        level: 3,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Hải Châu 1, Đà Nẵng")).toBeTruthy();

    // Unavailable placeholder card (FR88-AC07)
    expect(screen.getByText("Bất động sản không khả dụng")).toBeTruthy();
    expect(screen.getByText("Ảnh không khả dụng")).toBeTruthy();
    expect(screen.getByText("Bạn vẫn có thể bỏ lưu mục này.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bỏ lưu prop-2" })).toBeTruthy();

    // Verify no secret data leakage
    expect(screen.queryByText("Tiêu đề bí mật")).toBeNull();
    expect(screen.queryByText("admin_suspended_at")).toBeNull();
  });

  it("displays empty state when user has no saved listings", async () => {
    mockUseFavourites.mockReturnValue({
      authStatus: "authenticated",
      accountId: "tenant-100",
      state: { status: "ready", ids: new Set(), revision: 1 },
    });

    const emptyPage: FavouritePage = {
      items: [],
      page: 1,
      last_page: 1,
      total: 0,
    };

    vi.mocked(getFavouritePage).mockResolvedValue(emptyPage);

    render(<SavedListingsScreen />);

    expect(await screen.findByText("Chưa có tin yêu thích.")).toBeTruthy();
  });

  it("allows searching within saved listings", async () => {
    mockUseFavourites.mockReturnValue({
      authStatus: "authenticated",
      accountId: "tenant-100",
      state: { status: "ready", ids: new Set(["prop-1"]), revision: 1 },
    });

    vi.mocked(getFavouritePage).mockResolvedValue({
      items: [{ property_id: "prop-1", listing: mockCard }],
      page: 1,
      last_page: 1,
      total: 1,
    });

    render(<SavedListingsScreen />);

    expect(
      await screen.findByRole("heading", {
        name: "Căn hộ cao cấp ven sông Hàn",
        level: 3,
      }),
    ).toBeTruthy();

    const user = userEvent.setup();
    const searchInput = screen.getByLabelText("Tìm trong danh sách đã lưu");
    await user.type(searchInput, "sông Hàn");
    await user.click(screen.getByRole("button", { name: "Tìm" }));

    expect(getFavouritePage).toHaveBeenCalledWith(
      "tenant-100",
      expect.any(URLSearchParams),
      expect.any(AbortSignal),
    );
  });
});
