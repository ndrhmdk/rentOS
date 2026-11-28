import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingSearchForm } from "./listing-search-form";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
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
});

afterEach(() => {
  cleanup();
  mockPush.mockReset();
  vi.unstubAllGlobals();
});

describe("listing search form", () => {
  it("searches with street first, then ward and monthly rent", async () => {
    const user = userEvent.setup();
    render(<ListingSearchForm />);

    await user.type(screen.getByLabelText("Đường"), "Trần Phú");
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Hải Châu" }),
      ).toBeTruthy(),
    );
    await user.selectOptions(screen.getByLabelText("Phường/Xã"), "Hải Châu");
    await user.selectOptions(
      screen.getByLabelText("Mức giá hằng tháng"),
      "5-10",
    );
    await user.click(screen.getByRole("button", { name: /Tìm nhà ngay/ }));

    const url = new URL(mockPush.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("ward")).toBe("Hải Châu");
    expect(url.searchParams.get("street")).toBe("Trần Phú");
    expect(url.searchParams.get("min_rent")).toBe("5000000");
    expect(url.searchParams.get("max_rent")).toBe("10000000");
    expect(url.searchParams.get("bedrooms")).toBeNull();
  });
});
