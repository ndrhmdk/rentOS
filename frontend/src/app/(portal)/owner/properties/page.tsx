"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/pagination";
import { propertyLabels } from "@/components/listings/listing-format";
import { ApiError } from "@/lib/http/client";
import type {
  OccupancyBadge,
  OwnerListingStatusFilter,
  OwnerOccupancyFilter,
  OwnerPropertyPage,
  OwnerPropertySummary,
} from "@/lib/owner/types";
import { getOwnerPropertyPage } from "@/lib/owner/api";
import { ListingStatusFilter } from "../listing-status-filter";
import { StatusPill, textLinkClass } from "./components/status-pill";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-[#3368a0] px-4 text-sm font-semibold text-white hover:bg-[#285584]";

const occupancyOptions: Array<[OwnerOccupancyFilter, string]> = [
  ["all", "Tất cả"],
  ["OCCUPIED", "Đang thuê"],
  ["VACANT", "Còn trống"],
  ["MAINTENANCE", "Bảo trì"],
  ["PENDING_CONFIRMATION", "Đang chờ xác nhận"],
  ["AWAITING_MOVE_IN", "Chờ dọn vào"],
];

function listingStatusLabel(listing: OwnerPropertySummary["listing"]) {
  if (!listing) return "Chưa có tin";
  if (listing.admin_suspended_at) return "Bị tạm ngưng";
  if (listing.publication_status === "PUBLISHED") return "Đang hiển thị";
  if (listing.publication_status === "HIDDEN") return "Đã ẩn";
  if (listing.moderation_status === "PENDING") return "Chờ duyệt";
  if (listing.moderation_status === "REJECTED") return "Cần chỉnh sửa";
  if (listing.moderation_status === "APPROVED") return "Đã duyệt";
  return "Bản nháp";
}

function listingStatusClass(listing: OwnerPropertySummary["listing"]) {
  if (listing?.publication_status === "PUBLISHED" && !listing.admin_suspended_at) {
    return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800";
  }
  return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700";
}

function FilterField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-48 rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-900"
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function OccupancyBadges({ occupancy }: { occupancy: OccupancyBadge }) {
  if (occupancy.kind === "single") {
    return <StatusPill tone={occupancy.status}>{occupancy.label}</StatusPill>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {occupancy.items.map((item) => (
        <StatusPill key={item.status} tone={item.status}>
          {item.label}
        </StatusPill>
      ))}
    </div>
  );
}

export default function OwnerPropertiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [occupancy, setOccupancy] =
    useState<OwnerOccupancyFilter>("all");
  const [listingStatuses, setListingStatuses] = useState<
    OwnerListingStatusFilter[]
  >([]);
  const [result, setResult] = useState<OwnerPropertyPage | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await getOwnerPropertyPage({
          page,
          includeArchived: false,
          occupancy,
          listingStatuses,
        });
        if (!active) return;
        setResult(next);
      } catch (caught) {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Không thể tải thông tin bất động sản.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [listingStatuses, occupancy, page, retry, router]);

  const rows = result?.data ?? [];
  const filtersActive =
    occupancy !== "all" || listingStatuses.length > 0;

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col px-1 py-4 sm:px-2 sm:py-6">
      <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bất động sản
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Quản lý bất động sản, phòng và ảnh. Tin đăng được tạo riêng sau khi
            hoàn tất dữ liệu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/owner/properties/new"
            className={buttonClass}
            onClick={(event) => {
              event.preventDefault();
              router.push(
                `/owner/properties/new?fresh=${crypto.randomUUID()}`,
              );
            }}
          >
            Tạo bất động sản
          </Link>
        </div>
      </header>
      <div className="mb-4 flex shrink-0 flex-wrap items-end gap-3">
        <FilterField
          label="Trạng thái thuê"
          value={occupancy}
          options={occupancyOptions}
          onChange={(value) => {
            setOccupancy(value as OwnerOccupancyFilter);
            setPage(1);
          }}
        />
        <ListingStatusFilter
          value={listingStatuses}
          onChange={(next) => {
            setListingStatuses(next);
            setPage(1);
          }}
        />
        {filtersActive ? (
          <button
            type="button"
            className="h-10 rounded-xl px-3 text-sm font-semibold text-[#3368a0] hover:bg-slate-100"
            onClick={() => {
              setOccupancy("all");
              setListingStatuses([]);
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </button>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {loading && (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
            aria-busy="true"
          >
            Đang tải bất động sản…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
            <button
              type="button"
              className="ml-3 font-semibold underline"
              onClick={() => setRetry((value) => value + 1)}
            >
              Thử lại
            </button>
          </div>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-4">Tên và địa chỉ</th>
                  <th className="px-4 py-4">Loại</th>
                  <th className="px-4 py-4">Hình thức cho thuê</th>
                  <th className="px-4 py-4">Số căn</th>
                  <th className="px-4 py-4">Trạng thái thuê</th>
                  <th className="px-4 py-4">Tin đăng</th>
                  <th className="px-4 py-4">Cập nhật</th>
                  <th className="px-4 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[item.address_line, item.ward, item.city]
                          .filter(Boolean)
                          .join(", ") || "Chưa nhập địa chỉ"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {propertyLabels[item.property_type] ??
                        item.property_type}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-slate-700">
                        {item.rental_arrangement === "WHOLE_SPACE"
                          ? "Toàn bộ không gian"
                          : "Từng căn riêng lẻ"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {item.unit_count}
                    </td>
                    <td className="px-4 py-4">
                      <OccupancyBadges occupancy={item.occupancy} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={listingStatusClass(item.listing)}>
                        {listingStatusLabel(item.listing)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(item.updated_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/owner/properties/${item.id}`}
                          className={textLinkClass}
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href={`/owner/properties/${item.id}/edit`}
                          className={textLinkClass}
                        >
                          Chỉnh sửa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && result && result.meta.last_page > 1 && (
          <div className="mt-4 flex shrink-0 justify-end">
            <Pagination
              current={result.meta.current_page}
              lastPage={result.meta.last_page}
              onSelect={setPage}
            />
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            {!filtersActive ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái rỗng
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Thêm bất động sản đầu tiên của bạn
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Bắt đầu với thông tin cơ bản và địa chỉ, bạn có thể hoàn
                  thiện sau.
                </p>
                <Link
                  href="/owner/properties/new"
                  className={`${buttonClass} mt-5`}
                  onClick={(event) => {
                    event.preventDefault();
                    router.push(
                      `/owner/properties/new?fresh=${crypto.randomUUID()}`,
                    );
                  }}
                >
                  Thêm bất động sản
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-900">
                  Không có bất động sản phù hợp
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Thử trạng thái thuê hoặc tin đăng khác.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
