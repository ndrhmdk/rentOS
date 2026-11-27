import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("keeps long Vietnamese labels on a single line", () => {
    render(<StatusBadge tone="success">Đã giải quyết</StatusBadge>);
    const badge = screen.getByText("Đã giải quyết");
    expect(badge.className).toContain("whitespace-nowrap");
    expect(badge.className).toContain("text-emerald-700");
  });

  it("falls back to the neutral tone", () => {
    render(<StatusBadge>Bình thường</StatusBadge>);
    expect(screen.getByText("Bình thường").className).toContain("bg-slate-100");
  });
});
