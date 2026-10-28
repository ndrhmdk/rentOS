import Link from "next/link";
import type { ListingCard } from "./listings-api";

const kindLabels: Record<string, string> = {
  ROOM: "Phòng",
  STUDIO: "Studio",
  APARTMENT: "Căn hộ",
  APARTMENT_BUILDING: "Tòa nhà",
  HOUSE: "Nhà",
};

function millions(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
}

export function formatRent(min: string, max: string): string {
  if (min === max) return `từ ${millions(min)}/tháng`;
  return `từ ${millions(min)} – ${millions(max)}/tháng`;
}

export function ListingCardView({ listing, href }: { listing: ListingCard; href: string }) {
  const place = [listing.property.ward, listing.property.city].filter(Boolean).join(", ");

  return (
    <article className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
      <Link href={href} className="block h-full">
        <div className="relative aspect-[4/3] bg-surface-brand-soft">
          {listing.cover_url ? (
            // Listing photos come from the public API, not a fixed design asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.cover_url} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-heading">
            {listing.availability_label}
          </span>
        </div>
        <div className="grid gap-1 p-4">
          <p className="font-semibold text-heading">{formatRent(listing.rent_min, listing.rent_max)}</p>
          <p className="text-sm text-secondary">
            {kindLabels[listing.property.property_type] ?? listing.property.property_type}
            {" · "}Tối thiểu {listing.minimum_rental_months} tháng
          </p>
          <h3 className="text-base font-medium text-primary">{listing.title}</h3>
          <p className="text-sm text-secondary">{place}</p>
        </div>
      </Link>
    </article>
  );
}
