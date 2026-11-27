import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Slide } from "./listing-format";
import { ListingPhotoGrid } from "./listing-photo-grid";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <span
      role="img"
      aria-label={(props.alt as string) || (props.src as string)}
      data-loading={props.loading as string}
      data-quality={props.quality as number}
      data-sizes={props.sizes as string}
      data-src={props.src as string}
    />
  ),
}));

const slides: Slide[] = [
  { key: "photo-1", url: "/photos/cover.webp", label: "Ảnh bìa" },
  { key: "photo-2", url: "/photos/room.webp", label: "Phòng khách" },
  { key: "photo-3", url: "/photos/kitchen.webp", label: "Nhà bếp" },
];

describe("ListingPhotoGrid", () => {
  afterEach(cleanup);

  it("requests responsive, lazy-loaded optimized images for its photo grid", () => {
    render(<ListingPhotoGrid slides={slides} />);

    const hero = screen.getByRole("img", { name: "/photos/cover.webp" });
    expect(hero.getAttribute("data-loading")).toBe("lazy");
    expect(hero.getAttribute("data-quality")).toBe("75");
    expect(hero.getAttribute("data-sizes")).toBe(
      "(min-width: 1024px) 700px, 100vw",
    );

    const side = screen.getByRole("img", { name: "/photos/room.webp" });
    expect(side.getAttribute("data-loading")).toBe("lazy");
    expect(side.getAttribute("data-quality")).toBe("75");
    expect(side.getAttribute("data-sizes")).toBe(
      "(min-width: 1024px) 280px, 45vw",
    );
  });

  it("loads the labeled responsive photo set when the gallery is opened", async () => {
    const user = userEvent.setup();
    render(<ListingPhotoGrid slides={slides} />);

    await user.click(screen.getByRole("button", { name: "Xem tất cả 3 ảnh" }));

    const dialog = screen.getByRole("dialog", { name: "Tất cả ảnh" });
    expect(within(dialog).getByText("Ảnh bìa")).toBeTruthy();
    expect(within(dialog).getByText("Phòng khách")).toBeTruthy();
    expect(within(dialog).getByText("Nhà bếp")).toBeTruthy();
    for (const slide of slides) {
      const image = within(dialog).getByRole("img", { name: slide.label });
      expect(image.getAttribute("data-loading")).toBe("lazy");
      expect(image.getAttribute("data-quality")).toBe("75");
      expect(image.getAttribute("data-sizes")).toBe(
        "(min-width: 768px) 768px, 100vw",
      );
    }
  });
});
