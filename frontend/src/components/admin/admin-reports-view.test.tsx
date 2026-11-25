import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminReportsView } from "./admin-reports-view";
import { ApiError } from "@/lib/http/client";
import {
  getAdminListingReports,
  startAdminReportReview,
  type AdminListingReport,
  type PaginatedResponse,
} from "@/lib/reports-api";

vi.mock("@/lib/reports-api", () => ({
  getAdminListingReports: vi.fn(),
  startAdminReportReview: vi.fn(),
  resolveAdminReport: vi.fn(),
  dismissAdminReport: vi.fn(),
  suspendAdminListing: vi.fn(),
  restoreAdminListing: vi.fn(),
}));

const sampleAdminReport: AdminListingReport = {
  id: "rep-1",
  listing_id: "lst-1",
  reason_code: "FRAUD",
  description: "Chủ nhà đòi cọc trước.",
  status: "OPEN",
  resolution_summary: null,
  internal_notes: "Ghi chú nội bộ",
  reviewed_at: null,
  created_at: "2026-11-24T09:00:00Z",
  updated_at: "2026-11-24T09:00:00Z",
  listing: {
    id: "lst-1",
    title: "Studio Hải Châu",
    publication_status: "PUBLISHED",
    moderation_status: "APPROVED",
    is_suspended: false,
    suspension_reason: null,
    owner: { id: "own-1", name: "Quốc Huy", email: "owner1@rentos.test" },
  },
  reporter: { id: "ten-1", name: "Lan Chi", email: "tenant1@example.com" },
};

describe("AdminReportsView", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders non-disclosure 404 screen when receiving 403/404", async () => {
    vi.mocked(getAdminListingReports).mockRejectedValueOnce(new ApiError(404, "Not found"));

    render(<AdminReportsView />);

    expect(await screen.findByText("Không tìm thấy trang")).toBeTruthy();
  });

  it("shows table retry UI on server error and recovers on click", async () => {
    vi.mocked(getAdminListingReports)
      .mockRejectedValueOnce(new ApiError(500, "Server error"))
      .mockResolvedValueOnce({
        data: [sampleAdminReport],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      } as unknown as PaginatedResponse<AdminListingReport>);

    render(<AdminReportsView />);

    expect(await screen.findByText(/Không thể tải danh sách điều tra/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Studio Hải Châu")).toBeTruthy();
  });

  it("opens detail dialog, closes on Escape, and triggers start-review", async () => {
    vi.mocked(getAdminListingReports).mockResolvedValue({
      data: [sampleAdminReport],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    } as unknown as PaginatedResponse<AdminListingReport>);
    vi.mocked(startAdminReportReview).mockResolvedValue({
      message: "OK",
      data: { ...sampleAdminReport, status: "REVIEWING" },
    });

    render(<AdminReportsView />);

    const titleCell = await screen.findByText("Studio Hải Châu");
    fireEvent.click(titleCell);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết" }));
    const reopenedDialog = await screen.findByRole("dialog");
    expect(reopenedDialog).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu điều tra" }));
    await waitFor(() => {
      expect(startAdminReportReview).toHaveBeenCalledWith("rep-1");
    });
  });
});
