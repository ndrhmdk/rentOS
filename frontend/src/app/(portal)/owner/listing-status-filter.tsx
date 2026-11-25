"use client";

import { useState } from "react";
import type { OwnerListingStatusFilter } from "@/lib/owner/types";

export const listingStatusChoices: Array<
  [Exclude<OwnerListingStatusFilter, "all">, string]
> = [
  ["published", "Đang hiển thị"],
  ["pending", "Chờ duyệt"],
  ["hidden", "Đã ẩn"],
  ["none", "Chưa có tin"],
  ["draft", "Bản nháp"],
  ["rejected", "Cần chỉnh sửa"],
  ["approved", "Đã duyệt"],
  ["suspended", "Bị tạm ngưng"],
];

export function ListingStatusFilter({
  value,
  onChange,
}: {
  value: OwnerListingStatusFilter[];
  onChange: (next: OwnerListingStatusFilter[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = listingStatusChoices.filter(([key]) =>
    value.includes(key),
  );
  const summary =
    selected.length === 0
      ? "Tất cả"
      : selected.map(([, label]) => label).join(", ");

  function toggle(status: OwnerListingStatusFilter) {
    onChange(
      value.includes(status)
        ? value.filter((item) => item !== status)
        : [...value, status],
    );
  }

  return (
    <div className="relative z-20 grid gap-1 text-sm text-slate-700">
      <span className="font-medium">Tin đăng</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={[
          "h-10 w-56 truncate rounded-xl border",
          "border-slate-200 bg-white px-3 text-left",
          "font-medium text-slate-900",
        ].join(" ")}
      >
        {summary}
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Đóng bộ lọc tin đăng"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-multiselectable="true"
            className={[
              "absolute top-full z-20 mt-1 w-56 rounded-xl",
              "border border-slate-200 bg-white p-2 shadow-lg",
            ].join(" ")}
          >
            {listingStatusChoices.map(([status, label]) => (
              <label
                key={status}
                className={[
                  "flex cursor-pointer items-center gap-2",
                  "rounded-lg px-2 py-1.5 hover:bg-slate-50",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={value.includes(status)}
                  onChange={() => toggle(status)}
                  className="size-4 accent-[#3368a0]"
                />
                {label}
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
