import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ListingCardView } from "./listing-card";
import type { ListingCard } from "./listings-api";

afterEach(cleanup);

function listing(imageUrls: string[]): ListingCard {
  return {
    id: "listing-1",
    title: "Studio full nội thất gần biển Mỹ Khê",
    availability_label: "3 căn còn trống",
    available_unit_count: 3,
    rent_min: "3800000",
    rent_max: "3800000",
    minimum_rental_months: 3,
    cover_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    property: {
      name: "Nhà Phước Mỹ",
      property_type: "HOUSE",
      ward: "Phước Mỹ",
      city: "Sơn Trà",
    },
  };
}

function photo(): HTMLImageElement {
  const image = screen.getByRole("img", { name: "Studio full nội thất gần biển Mỹ Khê" });
  if (!(image instanceof HTMLImageElement)) {
    throw new Error("Expected the listing photo.");
  }
  return image;
}

describe("listing card gallery", () => {
  it("steps through every photo and shows the current position", async () => {
    const user = userEvent.setup();
    render(
      <ListingCardView
        listing={listing(["/photos/house.webp", "/photos/living.webp", "/photos/kitchen.webp", "/photos/bath.webp"])}
        href="/listings/listing-1"
      />,
    );

    expect(photo().src).toContain("/photos/house.webp");
    expect(screen.getByText("1/4")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ảnh sau" }));

    expect(photo().src).toContain("/photos/living.webp");
    expect(screen.getByText("2/4")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ảnh trước" }));

    expect(photo().src).toContain("/photos/house.webp");
    expect(screen.getByText("1/4")).toBeTruthy();
  });

  it("hides the controls when a listing has one photo", () => {
    render(<ListingCardView listing={listing(["/photos/only.webp"])} href="/listings/listing-1" />);

    expect(photo().src).toContain("/photos/only.webp");
    expect(screen.queryByRole("button", { name: "Ảnh sau" })).toBeNull();
    expect(screen.queryByText("1/1")).toBeNull();
  });
});
