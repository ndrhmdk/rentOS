import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingDetailScreen } from "./listing-detail-screen";
import { fetchListing, ListingUnavailableError, type ListingDetail } from "./listings-api";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./listings-api", () => ({
  fetchListing: vi.fn(),
  ListingUnavailableError: class ListingUnavailableError extends Error {},
}));

vi.mock("@/components/listings/listing-detail", () => ({
  ListingDetailView: ({ listing, isSignedIn }: { listing: { title: string }; isSignedIn: boolean }) => (
    <div data-testid="listing-detail-view">
      <h1>{listing.title}</h1>
      <span data-testid="signed-in">{String(isSignedIn)}</span>
    </div>
  ),
}));

describe("ListingDetailScreen", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: "guest",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it("renders loading state initially", () => {
    vi.mocked(fetchListing).mockReturnValue(new Promise(() => {}));

    render(<ListingDetailScreen id="listing-1" />);

    expect(screen.getByText("Đang tải thế giới cho bạn...")).toBeTruthy();
  });

  it("renders detail view when listing fetch succeeds", async () => {
    vi.mocked(fetchListing).mockResolvedValue({
      data: {
        id: "listing-1",
        title: "Căn hộ cao cấp Golden Land",
        property_id: "prop-1",
        published_at: "2026-11-20T00:00:00Z",
        advertised_rules: [],
        owner: { id: "owner-1", name: "Chủ nhà", phone: "0901234567" },
        units: [],
        photos: [],
      } as unknown as ListingDetail,
    });

    render(<ListingDetailScreen id="listing-1" />);

    expect(await screen.findByText("Căn hộ cao cấp Golden Land")).toBeTruthy();
    expect(screen.getByTestId("signed-in").textContent).toBe("false");
  });

  it("renders unavailable view when listing is suspended or not found", async () => {
    vi.mocked(fetchListing).mockRejectedValue(new ListingUnavailableError());

    render(<ListingDetailScreen id="listing-1" />);

    expect(await screen.findByText("Bài đăng này hiện không khả dụng")).toBeTruthy();
  });
});
