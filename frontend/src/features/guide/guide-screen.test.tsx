import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GlobalErrorPage from "@/app/global-error";
import { GuideScreen } from "./guide-screen";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("GuideScreen", () => {
  it("plays a chapter, advances the clock and stops at the end", () => {
    render(<GuideScreen />);

    expect(screen.getByText("Chương 1 / 3")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bắt đầu tìm nhà" }).getAttribute("href")).toBe("/listings");
    fireEvent.click(screen.getByRole("button", { name: "Phát video Tìm nhà phù hợp" }));
    expect(screen.getByRole("button", { name: "Tạm dừng video Tìm nhà phù hợp" })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByText(/^01:05 \//)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(200_000);
    });
    expect(screen.getByText(/^02:40 \//)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Phát video Tìm nhà phù hợp" })).toBeTruthy();
  });

  it("moves to the next chapter and resets playback", () => {
    render(<GuideScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Phát video Tìm nhà phù hợp" }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Chương tiếp theo/ }));

    expect(screen.getByText("Chương 2 / 3")).toBeTruthy();
    expect(screen.getByText(/^00:00 \//)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Phát video Gửi yêu cầu thuê" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xem tin đang trống" })).toBeTruthy();
  });

  it("opens any chapter from the playlist and hides next on the last one", () => {
    render(<GuideScreen />);

    const playlist = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-pressed"));
    expect(playlist).toHaveLength(3);
    expect(playlist[0].getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(playlist[2]);
    expect(screen.getByText("Chương 3 / 3")).toBeTruthy();
    expect(playlist[2].getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: "Mở cổng cư dân" }).getAttribute("href")).toBe("/tenant");
    expect(screen.queryByRole("button", { name: /Chương tiếp theo/ })).toBeNull();
  });
});

describe("GlobalErrorPage", () => {
  it("lets the user retry without showing error details", () => {
    vi.useRealTimers();
    const reset = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<GlobalErrorPage error={Object.assign(new Error("secret stack"), { digest: "d1" })} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Đã có lỗi. Vui lòng thử lại!" })).toBeTruthy();
    expect(screen.queryByText(/secret stack/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /trang chủ/i }).getAttribute("href")).toBe("/");
    consoleError.mockRestore();
  });
});
