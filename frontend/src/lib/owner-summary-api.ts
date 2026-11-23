import { request } from "@/lib/http/client";

export type OwnerPropertyPreview = {
  id: string;
  name: string;
  ward: string | null;
  city: string | null;
  rental_arrangement: "WHOLE_SPACE" | "SEPARATE_UNITS";
  unit_count: number;
  photo_url: string | null;
  moderation_status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | null;
  publication_status: "DRAFT" | "PUBLISHED" | "HIDDEN" | null;
  suspended: boolean;
};

export type OwnerSummary = {
  counts: {
    pending_rental_requests: number;
    awaiting_tenant_confirmation: number;
    active_properties: number;
    unread_notifications: number;
  };
  recent_requests: Array<{
    id: string;
    contact_name: string;
    property_name: string;
    preferred_unit: string | null;
    desired_move_in_date: string;
    desired_end_date: string;
    status: "PENDING" | "ACCEPTED";
  }>;
  pending_actions: Array<{
    id: string;
    kind: "rental_request" | "contract_correction" | "renewal";
    title: string;
    description: string;
    href: string;
  }>;
  recent_notifications: Array<{
    id: string;
    title: string;
    read_at: string | null;
    created_at: string;
  }>;
};

export function getOwnerSummary(signal?: AbortSignal) {
  return request<OwnerSummary>("/api/v1/owner/summary", { signal });
}

export function getOwnerPropertyPreview(signal?: AbortSignal) {
  return request<OwnerPropertyPreview[]>("/api/v1/owner/summary/properties", { signal });
}
