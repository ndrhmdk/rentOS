import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OwnerPhoto } from "./owner-photo";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <span
      role="img"
      aria-label={props.alt as string}
      className={props.className as string}
      data-loading={props.loading as string}
      data-quality={props.quality as number}
      data-sizes={props.sizes as string}
      data-unoptimized={String(props.unoptimized ?? false)}
      data-src={props.src as string}
    />
  ),
}));

describe("OwnerPhoto", () => {
  afterEach(cleanup);

  it("loads signed private photos directly and defers loading saved photos", () => {
    render(
      <div className="relative">
        <OwnerPhoto
          src="https://demo.supabase.co/storage/v1/object/sign/property-media/photo.jpg?token=secret"
          alt="Ảnh căn hộ"
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>,
    );

    const image = screen.getByRole("img", { name: "Ảnh căn hộ" });
    expect(image.getAttribute("data-loading")).toBe("lazy");
    expect(image.getAttribute("data-quality")).toBe("75");
    expect(image.getAttribute("data-sizes")).toContain("25vw");
    expect(image.getAttribute("data-unoptimized")).toBe("true");
    expect(image.getAttribute("data-src")).toContain("token=secret");
  });
});
