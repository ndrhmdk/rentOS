import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchListings, type ListingCard } from "@/features/discovery/listings-api";
import Home from "./page";

const mockRouter = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/discovery/listings-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/discovery/listings-api")>();
  return { ...actual, fetchListings: vi.fn(), fetchAmenities: vi.fn().mockResolvedValue({ data: [] }) };
});

function card(id: string, title: string): ListingCard {
  return {
    id,
    title,
    availability_label: "Còn trống từ hôm nay",
    available_unit_count: 1,
    rent_min: "3800000",
    rent_max: "4200000",
    minimum_rental_months: 3,
    cover_url: null,
    image_urls: [],
    property: { name: "Nhà Phước Mỹ", property_type: "HOUSE", ward: "Phước Mỹ", city: "Đà Nẵng" },
  };
}

beforeEach(() => {
  vi.mocked(fetchListings).mockReset();
});
afterEach(cleanup);

describe("home page", () => {
  it("shows the three newest listings from the public search", async () => {
    vi.mocked(fetchListings).mockResolvedValue({
      data: [card("l1", "Studio gần biển"), card("l2", "Phòng gần chợ Hàn"), card("l3", "Căn hộ sông Hàn")],
      meta: { current_page: 1, per_page: 3, total: 3, last_page: 1 },
    } as Awaited<ReturnType<typeof fetchListings>>);
    render(<Home />);

    expect(await screen.findByText("Studio gần biển")).toBeTruthy();
    expect(screen.getByText("Căn hộ sông Hàn")).toBeTruthy();
    const [params] = vi.mocked(fetchListings).mock.calls[0];
    expect(params.get("per_page")).toBe("3");
    expect(screen.getAllByRole("link", { name: /Studio gần biển/ })[0].getAttribute("href")).toBe("/listings/l1");
  });

  it("still renders the page when the listing request fails", async () => {
    vi.mocked(fetchListings).mockRejectedValue(new Error("offline"));
    render(<Home />);

    await waitFor(() => expect(fetchListings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByText("Studio gần biển")).toBeNull();
  });

  it("links each neighbourhood to a filtered search and answers the FAQ", async () => {
    vi.mocked(fetchListings).mockResolvedValue({ data: [], meta: { current_page: 1, per_page: 3, total: 0, last_page: 1 } } as Awaited<ReturnType<typeof fetchListings>>);
    render(<Home />);

    const area = screen.getAllByRole("link").find((link) => link.getAttribute("href") === "/listings?location=H%E1%BA%A3i%20Ch%C3%A2u");
    expect(area?.textContent).toContain("Hải Châu");
    const faq = screen.getByText("Thời hạn thuê tối thiểu là bao lâu?").closest("details");
    expect(faq?.open).toBe(true);
    expect(screen.getByText("Gửi yêu cầu có giữ chỗ cho tôi không?").closest("details")?.open).toBe(false);
    expect(screen.getAllByRole("link").some((link) => link.getAttribute("href") === "/owner")).toBe(true);
    await waitFor(() => expect(fetchListings).toHaveBeenCalled());
  });

  it("scrolls to the FAQ when opened from a #cau-hoi link", async () => {
    vi.mocked(fetchListings).mockResolvedValue({ data: [], meta: { current_page: 1, per_page: 3, total: 0, last_page: 1 } } as Awaited<ReturnType<typeof fetchListings>>);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.history.replaceState(null, "", "/#cau-hoi");
    render(<Home />);

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number) }));
    window.history.replaceState(null, "", "/");
    scrollTo.mockRestore();
  });
});
