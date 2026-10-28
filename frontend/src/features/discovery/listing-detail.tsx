import type { ListingDetail } from "./listings-api";
import { RentalRequestForm } from "./rental-request-form";

export function ListingDetailView({
  listing,
  isSignedIn,
}: {
  listing: ListingDetail;
  isSignedIn: boolean;
}) {
  const place = [listing.property.ward, listing.property.city].filter(Boolean).join(", ");

  return (
    <article className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold text-heading">{listing.title}</h1>
        <p className="text-secondary">{place}</p>
        <p className="text-sm font-medium">{listing.availability_label}</p>
      </header>
      {listing.gallery.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listing.gallery.map((photo) => (
            // Photos are returned by the listing API.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={photo.url} alt={photo.caption ?? ""} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          ))}
        </div>
      ) : null}
      <section aria-label="Tiện ích chung" className="grid gap-2">
        <h2 className="text-xl font-semibold">Tiện ích chung</h2>
        <ul className="flex flex-wrap gap-2">
          {listing.property.shared_amenities.map((amenity) => (
            <li key={amenity.key} className="rounded-full bg-surface-brand-soft px-3 py-1 text-sm">
              {amenity.label_vi}{amenity.details ? ` · ${amenity.details}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Nội quy đang quảng cáo" className="grid gap-2">
        <h2 className="text-xl font-semibold">Nội quy đang quảng cáo</h2>
        <ul className="grid gap-1 text-sm">
          {listing.property.shared_rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
      <section className="grid gap-4" aria-label="Các căn">
        <h2 className="text-xl font-semibold">Các căn</h2>
        {listing.units.map((unit) => (
          <article key={unit.id} className="grid gap-2 rounded-2xl border border-border-default p-4">
            <h3 className="text-lg font-semibold">{unit.label}</h3>
            <p>{unit.availability_label}</p>
            {unit.held_start && unit.held_end ? (
              <p className="text-sm text-secondary">Giữ chỗ {unit.held_start} – {unit.held_end}</p>
            ) : null}
            <p className="text-sm">{Number(unit.advertised_monthly_rent).toLocaleString("vi-VN")} đ/tháng · tối thiểu {unit.minimum_rental_months} tháng</p>
            <section aria-label={`Tiện ích trong căn ${unit.label}`}>
              <h4 className="text-sm font-semibold">Tiện ích trong căn</h4>
              <ul className="flex flex-wrap gap-2">
                {unit.amenities.map((amenity) => (
                  <li key={amenity.key}>{amenity.label_vi}</li>
                ))}
              </ul>
            </section>
            {unit.custom_amenities.length > 0 ? (
              <p className="text-sm text-secondary">Mô tả thêm: {unit.custom_amenities.join(", ")}</p>
            ) : null}
          </article>
        ))}
      </section>
      <RentalRequestForm listing={listing} isSignedIn={isSignedIn} />
    </article>
  );
}
