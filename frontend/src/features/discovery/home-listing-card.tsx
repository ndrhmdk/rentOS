"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingIcon } from "@/components/listings/listing-icon";
import { propertyLabels } from "@/components/listings/listing-format";
import { FavouriteButton } from "./favourites-provider";
import { fetchListing, type ListingCard, type ListingDetail, type PublicUnit } from "./listings-api";

function unitRange(units: PublicUnit[], field: "bedrooms" | "bathrooms" | "area_m2") {
  const values = units.map((unit) => Number(unit[field])).filter(Number.isFinite);
  if (values.length === 0) return "—";
  const min = Math.min(...values).toLocaleString("vi-VN");
  const max = Math.max(...values).toLocaleString("vi-VN");
  return min === max ? min : `${min}–${max}`;
}

export function HomeListingCard({ listing }: { listing: ListingCard }) {
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchListing(listing.id, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setDetail(response.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [listing.id]);

  const href = `/listings/${listing.id}`;
  const cover = listing.cover_url ?? listing.image_urls[0];
  const units = detail?.id === listing.id ? detail.units : [];
  const location = [listing.property.ward, listing.property.city].filter(Boolean).join(", ");
  const rent = Number(listing.rent_min).toLocaleString("vi-VN");

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl bg-[#f0f9fc]">
      <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-[#dce9ef]">
        <Link href={href} aria-label={listing.title} className="relative block h-full">
          {cover ? <Image src={cover} alt={listing.title} fill sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 hover:scale-105" /> : <span className="absolute inset-0 flex items-center justify-center text-sm text-[#5b6676]">Chưa có ảnh</span>}
        </Link>
        <span className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-5rem)] rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#091216] shadow-sm">
          {listing.available_unit_count > 0
            ? `${listing.available_unit_count} căn còn trống`
            : listing.availability_label}
        </span>
        <FavouriteButton propertyId={listing.property_id} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f0f8] px-2 py-1 text-[#526c80]"><ListingIcon name="building" size={12} />{propertyLabels[listing.property.property_type] ?? listing.property.property_type}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dbf4e2] px-2 py-1 text-[#27773c]"><ListingIcon name="check" size={12} />Đã duyệt</span>
        </div>
        <Link href={href} className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-[#091216] hover:text-[#3368a0]">{listing.title}</Link>
        <p className="flex items-center gap-1.5 text-sm text-[#627583]"><ListingIcon name="pin" size={15} />{location}</p>
        <div className="grid grid-cols-3 gap-2 py-1 text-[#6b94a9]">
          <HomeSpec kind="bed" value={`${unitRange(units, "bedrooms")} PN`} label="Phòng ngủ" />
          <HomeSpec kind="bath" value={`${unitRange(units, "bathrooms")} WC`} label="Phòng tắm" />
          <HomeSpec kind="area" value={`${unitRange(units, "area_m2")} m²`} label="Diện tích" />
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-[#526575]">{listing.rent_min !== listing.rent_max && <span className="mr-1 text-xs">Từ</span>}<strong className="text-xl font-bold text-[#3368a0]">{rent}đ</strong><span className="ml-1 text-xs">/ tháng</span></p>
          <Link href={href} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3368a0] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#254e7a]">Xem ngay</Link>
        </div>
      </div>
    </article>
  );
}

function HomeSpec({ kind, value, label }: { kind: "bed" | "bath" | "area"; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6 shrink-0" aria-hidden="true">
        {kind === "bed" && <path d="M3 18V7m18 11v-7H3m0 5h18M6 11V7h5v4m1 0V7h6v4M3 18v3m18-3v3" />}
        {kind === "bath" && <path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Zm2 0V5a2 2 0 0 1 4 0m-2 0h4M7 20v2m10-2v2" />}
        {kind === "area" && <path d="M9 3h12v12M15 21H3V9m18-6-7 7M3 21l7-7M8 14h2v2m4-8v2h2" />}
      </svg>
      <span><span className="block text-xs font-medium">{value}</span><span className="block text-[10px] text-[#6f7d87]">{label}</span></span>
    </div>
  );
}
