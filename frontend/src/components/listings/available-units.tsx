"use client";

import type { PublicUnit } from "@/features/discovery/listings-api";
import { dong, kindLabels, meters } from "./listing-format";

export function AvailableUnits({
  units,
  selectedUnitId,
  openUnitId,
  onChoose,
}: {
  units: PublicUnit[];
  selectedUnitId: string;
  openUnitId: string | null;
  onChoose: (unitId: string) => void;
}) {
  return (
    <section className="grid gap-4" aria-label="Các căn">
      <h2 className="text-2xl font-bold text-[#091216]">Các căn</h2>
      <p className="rounded-xl bg-[#e8f3ff] px-4 py-3 text-sm text-[#1f3a5c]">
        Chọn một căn để xem chi tiết. Căn đang chọn sẽ được đưa vào yêu cầu thuê.
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#e1e7ed]">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_120px_160px_140px] gap-3 bg-[#f7f8fa] px-4 py-3 text-sm font-semibold text-[#3368a0] md:grid">
          <span>Căn</span>
          <span>Diện tích</span>
          <span>Tình trạng</span>
          <span>Giá thuê</span>
        </div>
        <ul>
          {units.map((unit) => {
            const open = openUnitId === unit.id;
            const selected = selectedUnitId === unit.id;
            const photo = unit.photos[0];
            const available = unit.availability_label.startsWith("Còn trống");
            return (
              <li key={unit.id} className={selected ? "bg-[#f3f8fd]" : "bg-white"}>
                <button
                  type="button"
                  aria-expanded={open}
                  className="grid w-full gap-3 border-t border-[#e1e7ed] px-4 py-4 text-left md:grid-cols-[minmax(0,1.6fr)_120px_160px_140px] md:items-center"
                  onClick={() => onChoose(unit.id)}
                >
                  <span className="flex items-center gap-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt="" className="h-14 w-16 rounded-lg object-cover" />
                    ) : (
                      <span className="h-14 w-16 rounded-lg bg-[#e8ebf0]" />
                    )}
                    <span>
                      <span className="block font-bold text-[#091216]">{unit.label}</span>
                      <span className="block text-sm text-[#454e5c]">
                        {unit.bedrooms > 0 ? `${unit.bedrooms} phòng ngủ, ` : ""}
                        {Number(unit.bathrooms) >= 1 ? `${meters(Number(unit.bathrooms))} phòng tắm` : "WC chung"}
                      </span>
                      <span className="block text-xs text-[#5b6676]">{kindLabels[unit.unit_kind] ?? unit.unit_kind}</span>
                    </span>
                  </span>
                  <span className="text-sm text-[#091216]">{meters(Number(unit.area_m2))} m²</span>
                  <span className={`text-sm font-medium ${available ? "text-[#14692f]" : "text-[#454e5c]"}`}>{unit.availability_label}</span>
                  <span className="text-sm font-bold text-[#091216]">{dong(Number(unit.advertised_monthly_rent))}</span>
                </button>
                {open ? (
                  <div className="grid gap-2 border-t border-[#d5dee7] px-4 py-4 text-sm text-[#454e5c]">
                    {unit.description ? <p>{unit.description}</p> : null}
                    <p>Cọc {dong(Number(unit.deposit))} · tối thiểu {unit.minimum_rental_months} tháng · tối đa {unit.max_occupants} người</p>
                    {unit.held_start && unit.held_end ? <p>Giữ chỗ {unit.held_start} – {unit.held_end}</p> : null}
                    <section aria-label={`Tiện ích trong căn ${unit.label}`}>
                      <h3 className="font-semibold text-[#091216]">Tiện ích trong căn</h3>
                      <ul className="flex flex-wrap gap-2">
                        {unit.amenities.map((amenity) => (
                          <li key={amenity.key}>{amenity.label_vi}</li>
                        ))}
                      </ul>
                    </section>
                    <p className="font-semibold text-[#3368a0]">{selected ? "Đã chọn căn này" : "Chọn căn này"}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
