import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchListings,
  fetchListing,
  fetchAmenities,
  ListingUnavailableError,
  ListingsRequestError,
} from "./listings-api";
import { ListingSearchValidationError } from "./listing-search-params";

const originalFetch = global.fetch;

describe("listings-api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchListings appends search params and parses json", async () => {
    const mockData = { data: [], meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 } };
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200 }));

    const params = new URLSearchParams({ location: "Cau Giay", page: "1" });
    const res = await fetchListings(params);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/listings?location=Cau+Giay&page=1"),
      expect.objectContaining({ cache: "no-store", headers: { Accept: "application/json" } }),
    );
    expect(res).toEqual(mockData);
  });

  it("fetchListing retrieves listing detail by id", async () => {
    const mockDetail = { data: { id: "list-1", title: "Căn hộ" } };
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockDetail), { status: 200 }));

    const res = await fetchListing("list-1");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/listings/list-1"),
      expect.any(Object),
    );
    expect(res).toEqual(mockDetail);
  });

  it("fetchAmenities retrieves catalog items", async () => {
    const mockAmenities = { data: [{ key: "wifi", scope: "PROPERTY", label_vi: "Wifi" }] };
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockAmenities), { status: 200 }));

    const res = await fetchAmenities();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/amenities"),
      expect.any(Object),
    );
    expect(res).toEqual(mockAmenities);
  });

  it("throws ListingSearchValidationError on 422", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response("{}", { status: 422 }));

    await expect(fetchListings(new URLSearchParams())).rejects.toThrow(ListingSearchValidationError);
  });

  it("throws ListingUnavailableError on 404", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response("{}", { status: 404 }));

    await expect(fetchListing("not-found")).rejects.toThrow(ListingUnavailableError);
  });

  it("throws ListingsRequestError on server errors", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response("{}", { status: 500 }));

    await expect(fetchListing("err")).rejects.toThrow(ListingsRequestError);
  });
});
