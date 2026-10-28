"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DiscoverySidebar } from "./discovery-sidebar";
import { ListingCardView } from "./listing-card";
import { ListingFilters } from "./listing-filters";
import { ListingSearchValidationError, parseListingSearchParams, toListingSearchParams } from "./listing-search-params";
import { fetchAmenities, fetchListings, type AmenityCatalogItem, type ListingSearchResponse } from "./listings-api";
import type { ListingSearchState } from "./listing-search-params";

const emptySearch: ListingSearchState = {
  location: "",
  moveInDate: "",
  minRent: "",
  maxRent: "",
  unitKind: "",
  bedrooms: "",
  bathrooms: "",
  occupants: "",
  amenities: [],
  pets: "",
  page: 1,
};

function parseSearchState(query: string): { state: ListingSearchState; error: string | null } {
  try {
    return { state: parseListingSearchParams(new URLSearchParams(query)), error: null };
  } catch (error) {
    const message = error instanceof ListingSearchValidationError ? error.message : "Bộ lọc tìm kiếm không hợp lệ.";
    return { state: emptySearch, error: message };
  }
}

export function ListingsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ query: string; status: "ready" | "error"; body: ListingSearchResponse | null } | null>(null);
  const [amenities, setAmenities] = useState<AmenityCatalogItem[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const parsed = parseSearchState(query);
  const state = parsed.state;
  const status = parsed.error ? "error" : result?.query === query ? result.status : "loading";

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAmenities(controller.signal)
      .then((body) => {
        if (!controller.signal.aborted) setAmenities(body.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (parsed.error) return;
    const controller = new AbortController();
    fetchListings(toListingSearchParams(parseListingSearchParams(new URLSearchParams(query))), controller.signal)
      .then((body) => {
        if (controller.signal.aborted) return;
        setResult({ query, status: "ready", body });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof Error && error.name === "AbortError") return;
        setResult({ query, status: "error", body: null });
      });
    return () => controller.abort();
  }, [query, attempt, parsed.error]);

  const body = result?.body;
  const heading = body?.meta.result_label
    ?? (state.location ? `${body?.meta.total ?? 0} tin đăng tại ${state.location}` : `${body?.meta.total ?? 0} tin đăng`);

  return (
    <div className="fixed inset-x-0 top-[75px] bottom-0 flex overflow-hidden bg-[#f0f4f7]">
      <DiscoverySidebar active="search" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative z-20 shrink-0 grid gap-4 px-4 pt-5 pb-4 lg:px-8">
          <ListingFilters
            query={query}
            amenities={amenities}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((open) => !open)}
          />
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.4px] text-[#091216]">{state.location ? `Nhà cho thuê tại ${state.location}` : "Nhà cho thuê"}</h1>
            <p className="text-sm text-[#5b6676]">{status === "ready" ? heading : "Đang tìm phòng..."}</p>
          </div>
          <p className="text-sm text-muted">Tình trạng trống chỉ mang tính chỉ báo, căn có thể được người khác giữ chỗ ngay sau khi bạn tìm kiếm.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 lg:px-8">
      <div className="grid content-start gap-4">
      {status === "loading" ? <p role="status">Đang tìm phòng...</p> : null}
      {status === "error" ? (
        <div role="alert" className="grid gap-3">
          <p>{parsed.error ?? "Không tải được danh sách. Thử lại."}</p>
          {parsed.error ? null : (
            <button type="button" className="min-h-11 w-fit rounded-xl border px-4" onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>
              Thử lại
            </button>
          )}
        </div>
      ) : null}
      {status === "ready" && body?.data.length === 0 ? <p>Không có tin phù hợp.</p> : null}
      {status === "ready" && body ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {body.data.map((listing) => (
            <ListingCardView key={listing.id} listing={listing} href={`/listings/${listing.id}?${query}`} />
          ))}
        </div>
      ) : null}
      {status === "ready" && body && body.meta.last_page > 1 ? (
        <nav aria-label="Phân trang" className="flex gap-2">
          {Array.from({ length: body.meta.last_page }, (_, index) => {
            const page = index + 1;
            const params = toListingSearchParams({ ...state, page });
            const text = params.toString();
            return (
              <Link
                key={page}
                href={text ? `/listings?${text}` : "/listings"}
                aria-current={page === body.meta.current_page ? "page" : undefined}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border"
                onClick={(event) => {
                  event.preventDefault();
                  router.replace(text ? `/listings?${text}` : "/listings");
                }}
              >
                {page}
              </Link>
            );
          })}
        </nav>
      ) : null}
      </div>
        </div>
      </div>
    </div>
  );
}
