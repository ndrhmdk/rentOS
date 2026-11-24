import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "@/lib/http/client";
import { getFavouriteIds, getFavouritePage, setFavourite } from "./favourites-api";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("favourites-api", () => {
  const signal = new AbortController().signal;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches favourite IDs with X-Favourites-Account header", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ ids: ["prop-1", "prop-2"], count: 2 });

    const res = await getFavouriteIds("acc-123", signal);

    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/favourite-properties/ids",
      {
        headers: { "X-Favourites-Account": "acc-123" },
        signal,
      },
    );
    expect(res).toEqual({ ids: ["prop-1", "prop-2"], count: 2 });
  });

  it("fetches favourite page with query parameters and header", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({
      items: [{ property_id: "prop-1", listing: null }],
      page: 1,
      last_page: 1,
      total: 1,
    });

    const params = new URLSearchParams({ page: "1", per_page: "12" });
    const res = await getFavouritePage("acc-123", params, signal);

    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/favourite-properties?page=1&per_page=12",
      {
        headers: { "X-Favourites-Account": "acc-123" },
        signal,
      },
    );
    expect(res.total).toBe(1);
  });

  it("sets favourite status to PUT when saved=true", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);

    await setFavourite("acc-123", "prop-abc", true, signal);

    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/favourite-properties/prop-abc",
      {
        method: "PUT",
        headers: { "X-Favourites-Account": "acc-123" },
        signal,
      },
    );
  });

  it("sets favourite status to DELETE when saved=false", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(undefined);

    await setFavourite("acc-123", "prop-xyz", false, signal);

    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/favourite-properties/prop-xyz",
      {
        method: "DELETE",
        headers: { "X-Favourites-Account": "acc-123" },
        signal,
      },
    );
  });
});
