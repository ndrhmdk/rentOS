import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FavouriteButton, FavouritesProvider } from "./favourites-provider";
import { useAuth } from "@/lib/auth-context";
import { getFavouriteIds, setFavourite } from "@/lib/favourites-api";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/favourites-api", () => ({
  getFavouriteIds: vi.fn(),
  setFavourite: vi.fn(),
}));

describe("FavouritesProvider & FavouriteButton", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it("prompts guest to sign in when clicking favourite button", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: "guest",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <FavouritesProvider>
        <FavouriteButton propertyId="prop-1" />
      </FavouritesProvider>,
    );

    const button = screen.getByRole("button", { name: "Lưu vào Yêu thích" });
    await user.click(button);

    expect(await screen.findByRole("dialog", { hidden: true })).toBeTruthy();
    expect(screen.getByText("Đăng nhập để lưu tin")).toBeTruthy();
  });

  it("loads and toggles favourite for authenticated user", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1", email: "user@example.com", name: "User", phone: "0901234567", is_admin: false, email_verified_at: "2026-11-25T10:00:00Z" },
      status: "authenticated",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(getFavouriteIds).mockResolvedValue({ ids: ["prop-1"], count: 1 });
    vi.mocked(setFavourite).mockResolvedValue(undefined);

    render(
      <FavouritesProvider>
        <FavouriteButton propertyId="prop-1" />
        <FavouriteButton propertyId="prop-2" />
      </FavouritesProvider>,
    );

    // Initial state: prop-1 is saved ("Bỏ khỏi Yêu thích"), prop-2 is not ("Lưu vào Yêu thích")
    expect(await screen.findByRole("button", { name: "Bỏ khỏi Yêu thích" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lưu vào Yêu thích" })).toBeTruthy();

    // Toggle prop-2
    await user.click(screen.getByRole("button", { name: "Lưu vào Yêu thích" }));

    expect(setFavourite).toHaveBeenCalledWith("user-1", "prop-2", true, expect.any(AbortSignal));
    await waitFor(() => {
      expect(screen.getByText("Đã lưu vào Yêu thích")).toBeTruthy();
    });
  });
});
