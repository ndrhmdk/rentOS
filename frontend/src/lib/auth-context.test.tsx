import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./http/client";
import { getCurrentUser, logout } from "./auth/api";
import { AuthProvider, useAuth } from "./auth-context";
import { getQueryClient } from "./query-provider";
import { getNewlyCreatedToken, saveNewlyCreatedToken } from "./tokens/new-token-secret";

vi.mock("./auth/api", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

function Consumer() {
  const { user, status, signOut } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-email">{user?.email ?? "none"}</span>
      <button type="button" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}

describe("auth context and sign out", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.resetAllMocks();
    getQueryClient().clear();
  });

  it("clears private query data and switches to guest on sign out", async () => {
    const user = userEvent.setup();
    const queryClient = getQueryClient();

    // Populate a private query in query cache and a newly created token
    queryClient.setQueryData(["private-tenant-requests"], [{ id: "req-1" }]);
    expect(queryClient.getQueryData(["private-tenant-requests"])).toBeTruthy();
    saveNewlyCreatedToken({ name: "CLI", plainTextToken: "1|secret" });
    expect(getNewlyCreatedToken()).toEqual({ name: "CLI", plainTextToken: "1|secret" });

    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce({
        id: "u1",
        email: "test@example.com",
        name: "Test User",
        email_verified_at: null,
        phone: "0901234567",
        is_admin: false,
      })
      .mockRejectedValue(new ApiError(401, "Unauthenticated"));
    vi.mocked(logout).mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("test@example.com")).toBeTruthy();
    expect(screen.getByTestId("status").textContent).toBe("authenticated");

    // Click sign out
    await user.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(logout).toHaveBeenCalled();
    expect(queryClient.getQueryData(["private-tenant-requests"])).toBeUndefined();
    expect(queryClient.getQueryData(["current-user"])).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("guest");
    });
    expect(screen.getByTestId("user-email").textContent).toBe("none");

    // Verify logout API was called
    expect(logout).toHaveBeenCalled();

    // Verify private queries and tokens were cleared
    expect(queryClient.getQueryData(["private-tenant-requests"])).toBeUndefined();
    expect(getNewlyCreatedToken()).toBeNull();
  });
});
