import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListingSearchForm } from "./listing-search-form";

describe("listing search form", () => {
  it("searches with the location and chosen monthly rent without a bedroom filter", async () => {
    const user = userEvent.setup();
    render(<ListingSearchForm />);

    await user.type(screen.getByLabelText("Địa điểm"), "Hải Châu");

    await user.selectOptions(screen.getByLabelText("Mức giá hằng tháng"), "5-10");
    await user.click(screen.getByRole("button", { name: "Tìm nhà ngay!" }));
    const url = new URL(push.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/listings");
    expect(url.searchParams.get("location")).toBe("Hải Châu");
    expect(url.searchParams.get("min_rent")).toBe("5000000");
    expect(url.searchParams.get("max_rent")).toBe("10000000");
    expect(url.searchParams.has("bedrooms")).toBe(false);
    expect(screen.queryByText(/số phòng ngủ/i)).toBeNull();
  });

  it("opens all listings when no filters are chosen", async () => {
    const user = userEvent.setup();
    render(<ListingSearchForm />);
    await user.click(screen.getByRole("button", { name: "Tìm nhà ngay!" }));
    expect(push).toHaveBeenCalledWith("/listings");
  });
});
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  cleanup();
  push.mockClear();
});
