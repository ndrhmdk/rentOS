import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingReportDialog } from "./listing-report-dialog";
import { submitListingReport, type ReporterListingReport } from "@/lib/reports-api";
import { ApiError } from "@/lib/http/client";

vi.mock("@/lib/reports-api", () => ({
  submitListingReport: vi.fn(),
}));

describe("ListingReportDialog", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts guest users to sign in instead of showing report form", () => {
    render(
      <ListingReportDialog
        listingId="lst-1"
        listingTitle="Studio Hải Châu"
        isSignedIn={false}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Yêu cầu đăng nhập/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Đăng nhập/ }).getAttribute("href")).toBe("/login?redirect=/listings/lst-1");
  });

  it("validates reason and description before submitting", () => {
    render(
      <ListingReportDialog
        listingId="lst-1"
        listingTitle="Studio Hải Châu"
        isSignedIn={true}
        onClose={vi.fn()}
      />,
    );

    const form = screen.getByRole("button", { name: "Gửi báo cáo" }).closest("form")!;
    fireEvent.submit(form);
    expect(screen.getByText("Chọn lý do báo cáo.")).toBeTruthy();

    fireEvent.click(screen.getByLabelText(/Gian lận hoặc lừa đảo/));
    fireEvent.submit(form);
    expect(screen.getByText("Vui lòng nhập mô tả chi tiết nội dung vi phạm.")).toBeTruthy();
  });

  it("submits report successfully and handles 409/429 API errors and Escape key", async () => {
    const onClose = vi.fn();
    vi.mocked(submitListingReport).mockResolvedValueOnce({
      message: "Đã gửi",
      data: { id: "rep-1" } as unknown as ReporterListingReport,
    });

    render(
      <ListingReportDialog
        listingId="lst-1"
        listingTitle="Studio Hải Châu"
        isSignedIn={true}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Gian lận hoặc lừa đảo/));
    fireEvent.change(screen.getByPlaceholderText(/Cung cấp thêm chi tiết vi phạm/), {
      target: { value: "Chủ nhà đòi chuyển cọc trước khi xem phòng." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    await waitFor(() => {
      expect(submitListingReport).toHaveBeenCalledWith("lst-1", {
        reason_code: "FRAUD",
        description: "Chủ nhà đòi chuyển cọc trước khi xem phòng.",
      });
    });
    expect(await screen.findByText(/Đã tiếp nhận báo cáo/)).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("displays rate limit message on 429 error", async () => {
    vi.mocked(submitListingReport).mockRejectedValueOnce(new ApiError(429, "Too many requests"));

    render(
      <ListingReportDialog
        listingId="lst-1"
        listingTitle="Studio Hải Châu"
        isSignedIn={true}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Sai lệch thông tin/));
    fireEvent.change(screen.getByPlaceholderText(/Cung cấp thêm chi tiết vi phạm/), {
      target: { value: "Ảnh không đúng thực tế." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    expect(await screen.findByText(/Bạn đang thao tác quá nhanh/)).toBeTruthy();
  });
});
