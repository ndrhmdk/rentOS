import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "@/lib/http/client";
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
      expect.objectContaining({ cache: "default", headers: { Accept: "application/json" } }),
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

describe("HTTP cache mode", () => {
  function stubFetch() {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets the browser cache public discovery reads and sends no credentials", async () => {
    const fetchMock = stubFetch();

    await fetchListings(new URLSearchParams("location=Hai%20Chau"));
    await fetchListing("listing-1");
    await fetchAmenities();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.cache).toBe("default");
      expect(init.credentials).toBeUndefined();
    }
  });

  it("keeps private account requests out of the browser cache", async () => {
    const fetchMock = stubFetch();

    await request("/api/v1/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.cache).toBe("no-store");
    expect(init.credentials).toBe("include");
  });
});
