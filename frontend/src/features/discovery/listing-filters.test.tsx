import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingFilters } from "./listing-filters";
import type { AmenityCatalogItem } from "./listings-api";

const mockReplace = vi.fn();
// Next's useRouter() returns the same instance on every render.
const mockRouter = { replace: mockReplace, push: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));

const amenities = [
  { key: "wifi", label_vi: "Wi-Fi", scope: "PROPERTY" },
  { key: "air_conditioner", label_vi: "Điều hòa", scope: "UNIT" },
] as AmenityCatalogItem[];

function lastQuery(): URLSearchParams {
  const target = String(mockReplace.mock.calls.at(-1)?.[0] ?? "");
  return new URLSearchParams(target.split("?")[1] ?? "");
}

function renderFilters(query = "", filtersOpen = false, onToggleFilters = vi.fn()) {
  return render(<ListingFilters query={query} amenities={amenities} filtersOpen={filtersOpen} onToggleFilters={onToggleFilters} />);
}

function mockLocationFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/provinces")) {
        return Response.json({
          success: true,
          data: [{ code: "48", name: "Đà Nẵng" }],
        });
      }
      if (url.includes("/wards")) {
        return Response.json({
          success: true,
          data: [
            { code: "1", name: "Hải Châu" },
            { code: "2", name: "Sơn Trà" },
          ],
        });
      }
      return Response.json({ success: false }, { status: 404 });
    }),
  );
}

beforeEach(() => {
  mockReplace.mockReset();
  mockLocationFetch();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ListingFilters", () => {
  it("applies a price range given in millions and labels the button with it", async () => {
    const user = userEvent.setup();
    const { rerender } = renderFilters("ward=S%C6%A1n%20Tr%C3%A0&page=3");

    await user.click(screen.getByRole("button", { name: /^Giá/ }));
    await user.type(screen.getByLabelText(/Tối thiểu/), "3.5");
    await user.type(screen.getByLabelText(/Tối đa/), "6");
    await user.click(screen.getByRole("button", { name: "Xem kết quả" }));

    const query = lastQuery();
    expect(query.get("min_rent")).toBe("3500000");
    expect(query.get("max_rent")).toBe("6000000");
    expect(query.get("ward")).toBe("Sơn Trà");
    expect(query.get("page")).toBeNull();

    rerender(<ListingFilters query="min_rent=3500000&max_rent=6000000" amenities={amenities} filtersOpen={false} onToggleFilters={vi.fn()} />);
    expect(screen.getByRole("button", { name: /3,5 triệu – 6 triệu/ })).toBeTruthy();
  });

  it("warns when the maximum price is below the minimum", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(screen.getByRole("button", { name: /^Giá/ }));
    await user.type(screen.getByLabelText(/Tối thiểu/), "8");
    await user.type(screen.getByLabelText(/Tối đa/), "5");

    expect(screen.getByText("Giá tối đa đang nhỏ hơn giá tối thiểu")).toBeTruthy();
    expect(screen.getByLabelText(/Tối đa/).getAttribute("aria-invalid")).toBe("true");
  });

  it("filters by minimum bedrooms and bathrooms", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(screen.getByRole("button", { name: "Phòng ngủ & phòng tắm" }));
    const bedrooms = screen.getByText("Phòng ngủ").parentElement as HTMLElement;
    const bathrooms = screen.getByText("Phòng tắm").parentElement as HTMLElement;
    await user.click(within(bedrooms).getByRole("button", { name: "2+" }));
    await user.click(within(bathrooms).getByRole("button", { name: "1+" }));
    expect(within(bedrooms).getByRole("button", { name: "2+" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Xem kết quả" }));

    expect(lastQuery().get("bedrooms")).toBe("2");
    expect(lastQuery().get("bathrooms")).toBe("1");
  });

  it("filters by unit kind and shows the chosen kind", async () => {
    const user = userEvent.setup();
    const { rerender } = renderFilters();

    await user.click(screen.getByRole("button", { name: /^Loại căn/ }));
    await user.click(screen.getByRole("button", { name: "Studio" }));
    expect(lastQuery().get("unit_kind")).toBe("STUDIO");

    rerender(<ListingFilters query="unit_kind=STUDIO" amenities={amenities} filtersOpen={false} onToggleFilters={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^Studio/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("closes an open menu with Escape", async () => {
    const user = userEvent.setup();
    renderFilters();

    const price = screen.getByRole("button", { name: /^Giá/ });
    await user.click(price);
    expect(price.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Escape}");
    expect(price.getAttribute("aria-expanded")).toBe("false");
  });

  it("searches street then ward only when the search button is pressed", async () => {
    const user = userEvent.setup();
    renderFilters("bedrooms=2");

    await user.type(screen.getByLabelText("Đường"), "  Trần   Phú ");
    expect(mockReplace).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Hải Châu" })).toBeTruthy(),
    );
    await user.selectOptions(screen.getByLabelText("Phường"), "Hải Châu");
    expect(mockReplace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(lastQuery().get("street")).toBe("Trần Phú");
    expect(lastQuery().get("ward")).toBe("Hải Châu");
    expect(lastQuery().get("bedrooms")).toBe("2");

    await user.click(screen.getByRole("button", { name: "Xóa địa điểm" }));
    expect(lastQuery().get("ward")).toBeNull();
    expect(lastQuery().get("street")).toBeNull();
    expect((screen.getByLabelText("Đường") as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("shows active amenities as removable chips and counts filters on the button", async () => {
    const user = userEvent.setup();
    renderFilters("amenities%5B%5D=wifi&pets=ALLOWED");

    expect(screen.getByRole("button", { name: /^Bộ lọc/ }).textContent).toContain("2");
    await user.click(screen.getByRole("button", { name: /Wi-Fi/ }));
    expect(lastQuery().getAll("amenities[]")).toEqual([]);
    expect(lastQuery().get("pets")).toBe("ALLOWED");
  });

  it("applies pets and amenities from the filter dialog", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderFilters("", true, onToggle);

    const dialog = screen.getByRole("dialog", { name: "Bộ lọc" });
    await user.click(within(dialog).getByRole("button", { name: "Cho nuôi thú cưng" }));
    await user.click(within(dialog).getByRole("button", { name: "Điều hòa" }));
    await user.click(within(dialog).getByRole("button", { name: "Xem kết quả" }));

    expect(lastQuery().get("pets")).toBe("ALLOWED");
    expect(lastQuery().getAll("amenities[]")).toEqual(["air_conditioner"]);
    expect(onToggle).toHaveBeenCalled();
  });

  it("clears the dialog's choices and closes without applying", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderFilters("amenities%5B%5D=wifi&pets=NOT_ALLOWED", true, onToggle);

    const dialog = screen.getByRole("dialog", { name: "Bộ lọc" });
    expect(within(dialog).getByRole("button", { name: "Wi-Fi" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(within(dialog).getByRole("button", { name: "Xóa bộ lọc" }));
    expect(within(dialog).getByRole("button", { name: "Wi-Fi" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(dialog).getByRole("button", { name: "Mọi chính sách" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(within(dialog).getByRole("button", { name: "Đóng bộ lọc" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
