"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ListingDetail } from "./listings-api";

export function RentalRequestForm({
  listing,
  isSignedIn,
}: {
  listing: Pick<ListingDetail, "title" | "property" | "units">;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [phoneError, setPhoneError] = useState("");
  const [notice, setNotice] = useState("");
  const place = [listing.property.ward, listing.property.city].filter(Boolean).join(", ");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    const values = new FormData(event.currentTarget);
    const phone = String(values.get("phone") ?? "").trim();
    const name = String(values.get("name") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const moveIn = String(values.get("move_in_date") ?? "");
    if (!name || !phone || !message || !moveIn) {
      setPhoneError(phone ? "Điền tên, lời nhắn và ngày dọn vào." : "Nhập số điện thoại.");
      return;
    }

    setPhoneError("");
    setNotice("Chưa gửi yêu cầu. Việc gửi tới chủ nhà sẽ được nối sau.");
  }

  return (
    <form className="grid gap-4 rounded-2xl border border-border-default bg-white p-6" aria-label="Gửi yêu cầu thuê" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-heading">Gửi yêu cầu thuê</h2>
      <p className="text-sm text-secondary">{listing.title} · {place}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Tên liên hệ
          <input name="name" className="min-h-11 rounded-xl border border-border-default px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Số điện thoại
          <input name="phone" inputMode="tel" className="min-h-11 rounded-xl border border-border-default px-3" aria-describedby="phone-hint" />
          <span id="phone-hint" className="font-normal text-muted">Chủ nhà sẽ liên lạc với bạn qua số này.</span>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Ngày dọn vào mong muốn
          <input name="move_in_date" type="date" className="min-h-11 rounded-xl border border-border-default px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Căn ưu tiên
          <select name="unit_id" className="min-h-11 rounded-xl border border-border-default px-3" defaultValue={listing.units[0]?.id ?? ""}>
            {listing.units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Lời nhắn cho chủ nhà
        <textarea name="message" className="min-h-24 rounded-xl border border-border-default px-3 py-2" />
      </label>
      {phoneError ? <p role="alert">{phoneError}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      <p className="text-sm text-muted">Gửi yêu cầu không đồng nghĩa với việc giữ chỗ.</p>
      <button type="submit" className="min-h-11 w-fit rounded-xl bg-action-primary px-5 font-semibold text-white">
        Gửi yêu cầu
      </button>
    </form>
  );
}
