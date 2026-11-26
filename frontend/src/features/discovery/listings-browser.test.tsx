import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingsBrowser, paginationItems } from "./listings-browser";
import { fetchAmenities, fetchListings } from "./listings-api";

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };
const mockSearchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: null, status: "guest", refreshUser: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("./listings-api", async () => {
  const actual = await vi.importActual<typeof import("./listings-api")>("./listings-api");
  return {
    ...actual,
    fetchListings: vi.fn(),
    fetchAmenities: vi.fn(),
  };
});

describe("ListingsBrowser & paginationItems", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAmenities).mockResolvedValue({ data: [] });
  });

  it("computes pagination ranges with gaps cleanly", () => {
    expect(paginationItems(1, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(1, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
    expect(paginationItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(paginationItems(9, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10]);
  });

  it("renders empty state when no listings match", async () => {
    vi.mocked(fetchListings).mockResolvedValue({
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
    });

    render(<ListingsBrowser />);

    expect(await screen.findByText(/Không có tin phù hợp/)).toBeTruthy();
  });
});
