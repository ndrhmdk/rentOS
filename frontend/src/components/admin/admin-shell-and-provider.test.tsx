import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiProvider, useAdminApi } from "./admin-api-provider";
import { AdminShell } from "./admin-shell";
import { AdminPrivateImage } from "./admin-private-image";
import { getAdminDashboard, type AdminDashboard } from "@/lib/admin-review-api";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http/client";

const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  usePathname: () => "/admin/review-queue",
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/admin-review-api", () => ({
  adminPreviewMode: false,
  getAdminDashboard: vi.fn(),
  adminMediaUrl: (path: string) => `http://localhost:8000${path}`,
}));

vi.mock("@/lib/notification-inbox", () => ({
  useNotificationInbox: () => ({ unreadCount: 2 }),
}));

function DashboardConsumer() {
  const { dashboard } = useAdminApi();
  return <div>Pending: {dashboard?.pending_count ?? 0}</div>;
}

describe("AdminShell, AdminApiProvider & AdminPrivateImage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("calls notFound when user is not an admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u-1", name: "User", email: "u@test", phone: null, is_admin: false, email_verified_at: "2026-01-01" },
      status: "authenticated",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });

    expect(() =>
      render(
        <AdminApiProvider>
          <DashboardConsumer />
        </AdminApiProvider>,
      ),
    ).toThrow("NEXT_NOT_FOUND");
  });

  it("renders loading state, handles 500 error with Retry, and renders shell", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "adm-1", name: "Mai Anh", email: "admin@test", phone: null, is_admin: true, email_verified_at: "2026-01-01" },
      status: "authenticated",
      refreshUser: vi.fn(),
      signOut: vi.fn(),
    });

    const dashboardData = {
      pending_count: 3,
      open_reports_count: 1,
      suspended_count: 0,
      oldest_submitted_at: null,
      waiting: [],
      activities: [],
    } as unknown as AdminDashboard;

    vi.mocked(getAdminDashboard)
      .mockRejectedValueOnce(new ApiError(500, "Server error"))
      .mockResolvedValueOnce(dashboardData);

    render(
      <AdminApiProvider>
        <AdminShell>
          <DashboardConsumer />
        </AdminShell>
      </AdminApiProvider>,
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(await screen.findByRole("alert")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => {
      expect(screen.getByText("Pending: 3")).toBeTruthy();
    });
    expect(screen.getByText("Hàng đợi kiểm duyệt")).toBeTruthy();
  });

  it("loads and renders AdminPrivateImage and handles fetch failure", async () => {
    const createObjectURL = vi.fn(() => "blob:http://localhost/img-1");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(["img"], { type: "image/png" }),
        })
        .mockResolvedValueOnce({ ok: false, status: 503 }),
    );

    const media = {
      id: "m-1",
      unit_id: null,
      caption: "Ảnh bìa",
      sort_order: 1,
      mime_type: "image/png",
      size_bytes: 100,
      url: "/api/v1/admin/media/1",
    };

    const { rerender } = render(<AdminPrivateImage media={media} />);
    const img = await screen.findByAltText("Ảnh bìa");
    expect(img.getAttribute("src")).toBe("blob:http://localhost/img-1");

    rerender(<AdminPrivateImage media={{ ...media, id: "m-2" }} />);
    expect(await screen.findByText("Không tải được ảnh")).toBeTruthy();
  });
});
