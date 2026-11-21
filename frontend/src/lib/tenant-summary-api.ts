import { request } from "@/lib/http/client";
import type { RentalRequestStatus } from "@/lib/rental-requests-api";

type SummaryLink = { id: string; title: string; href: string };

export type TenantProposal = SummaryLink & {
  kind: "contract" | "renewal";
  rental_request_id: string;
  unit_label: string;
  version: number;
  expires_at: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  photo_url: string | null;
};

export type TenantUpcomingTenancy = SummaryLink & {
  ward: string | null;
  city: string | null;
  unit_label: string;
  bedrooms: number | null;
  area_m2: string | null;
  version: number;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  photo_url: string | null;
};

export type TenantSummary = {
  counts: {
    tenancies: number;
    pending_rental_requests: number;
    awaiting_confirmation: number;
    unread_notifications: number;
  };
  pending_actions: Array<TenantProposal | (SummaryLink & { kind: "rental_request" })>;
  upcoming_tenancy: TenantUpcomingTenancy | null;
  renewal_href: string | null;
  recent_requests: Array<SummaryLink & {
    status: RentalRequestStatus;
    created_at: string;
    desired_move_in_date: string;
    desired_end_date: string;
    preferred_unit: string | null;
    photo_url: string | null;
  }>;
  recent_notifications: Array<{ id: string; title: string; read_at: string | null; created_at: string }>;
};

export function getTenantSummary(signal?: AbortSignal) {
  return request<TenantSummary>("/api/v1/tenant/summary", { signal });
}
