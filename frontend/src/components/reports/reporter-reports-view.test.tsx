import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReporterReportsView } from "./reporter-reports-view";
import { getTenantReports, type PaginatedResponse, type ReporterListingReport } from "@/lib/reports-api";

vi.mock("@/lib/reports-api", () => ({
  getTenantReports: vi.fn(),
}));

const sampleReport: ReporterListingReport = {
  id: "rep-100",
  listing_id: "lst-1",
  listing_title: "Căn hộ biển Mỹ Khê",
  reason_code: "FRAUD",
  description: "Yêu cầu chuyển khoản giữ chỗ.",
  status: "RESOLVED",
  resolution_summary: "Ban quản trị đã kiểm tra và đình chỉ tin đăng vi phạm.",
  reviewed_at: "2026-11-25T10:00:00Z",
  created_at: "2026-11-24T09:00:00Z",
};

describe("ReporterReportsView", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error state with retry button and recovers when retried", async () => {
    vi.mocked(getTenantReports)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
      } as unknown as PaginatedResponse<ReporterListingReport>);

    render(<ReporterReportsView />);

    expect(await screen.findByText(/Không thể tải danh sách báo cáo/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Chưa có báo cáo nào")).toBeTruthy();
  });

  it("renders report card as keyboard-accessible button and opens accessible modal closed by Escape", async () => {
    vi.mocked(getTenantReports).mockResolvedValueOnce({
      data: [sampleReport],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    } as unknown as PaginatedResponse<ReporterListingReport>);

    render(<ReporterReportsView />);

    const cardButton = await screen.findByRole("button", { name: /Căn hộ biển Mỹ Khê/ });
    fireEvent.click(cardButton);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText(/Ban quản trị đã kiểm tra và đình chỉ/)).toBeTruthy();

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
