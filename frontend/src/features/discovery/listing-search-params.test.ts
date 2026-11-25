import { describe, expect, it } from "vitest";
import {
  clearPlace,
  parseListingSearchParams,
  toListingSearchParams,
} from "./listing-search-params";

describe("listing search params", () => {
  it("round-trips ward, street, move-in date, price, chips, and page", () => {
    const state = {
      ward: "Hải Châu",
      street: "Trần Phú",
      moveInDate: "2026-12-01",
      minRent: "3000000",
      maxRent: "8000000",
      unitKind: "STUDIO",
      bedrooms: "1",
      bathrooms: "1",
      occupants: "2",
      amenities: ["wifi", "balcony"],
      pets: "ALLOWED",
      page: 2,
    };
    const encoded = toListingSearchParams(state);
    expect(encoded.get("ward")).toBe("Hải Châu");
    expect(encoded.get("street")).toBe("Trần Phú");
    expect(encoded.get("location")).toBeNull();
    expect(parseListingSearchParams(encoded)).toEqual(state);
  });

  it("accepts legacy location as ward and clears place filters", () => {
    const state = parseListingSearchParams(
      new URLSearchParams("location=Hải Châu&max_rent=4000000"),
    );
    expect(state.ward).toBe("Hải Châu");
    expect(state.street).toBe("");

    const cleared = clearPlace(
      toListingSearchParams({
        ...state,
        street: "Trần Phú",
        page: 3,
      }),
    );
    expect(cleared.get("ward")).toBeNull();
    expect(cleared.get("street")).toBeNull();
    expect(cleared.get("location")).toBeNull();
    expect(cleared.get("max_rent")).toBe("4000000");
    expect(cleared.get("page")).toBe("1");
  });
});
