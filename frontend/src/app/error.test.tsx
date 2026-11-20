import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("error boundary page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders retry without exposing the stack or fake API reference", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = Object.assign(new Error("secret stack details"), {
      digest: "abc123digest",
      stack: "Error: secret stack details\n    at boom",
    });

    render(<ErrorPage error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: /Đã có lỗi\. Vui lòng thử lại!/ }),
    ).toBeTruthy();
    expect(screen.queryByText(/Mã tham chiếu/)).toBeNull();
    expect(screen.queryByText(/abc123digest/)).toBeNull();
    expect(screen.queryByText(/secret stack details/)).toBeNull();
    expect(screen.queryByText(/at boom/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Về trang chủ" }).getAttribute("href"),
    ).toBe("/");
  });
});
