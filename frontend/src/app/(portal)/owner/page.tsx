"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ListingIcon } from "@/components/listings/listing-icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ApiError } from "@/lib/http/client";
import { useAuth } from "@/lib/auth-context";
import { getOwnerPropertyPreview, getOwnerSummary, type OwnerPropertyPreview, type OwnerSummary } from "@/lib/owner-summary-api";
import { dateRange, statuses, timestamp } from "@/lib/rental-request-format";

const panel = "rounded-2xl border border-border-default bg-surface-card";
const outline = "inline-flex min-h-11 items-center justify-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-link hover:bg-surface-brand-soft";
const link = "font-semibold text-link hover:underline";
const propertyPath = "/owner/properties";
const requestPath = "/owner/requests";
const notificationPath = "/owner/notifications";
const tenancyPath = "/owner/tenancies";

function OverviewIcon({ name }: { name: "add" | "request" | "confirmation" }) {
  return <Image src={`/images/owner-summary/${name}.svg`} alt="" width={18} height={18} unoptimized />;
}

type Result<T> = { data: T; error?: never } | { data?: never; error: unknown };

function LoadError({ error, onRetry, message }: { error: unknown; onRetry: () => void; message: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 p-5">
      {error instanceof ApiError && error.status === 401 ? (
        <>
          <p>Phiên đăng nhập đã hết hạn.</p>
          <Link href="/login" className={outline}>Đăng nhập lại</Link>
        </>
      ) : error instanceof ApiError && error.status === 403 ? (
        <p>Tài khoản của bạn chưa có quyền xem nội dung này.</p>
      ) : (
        <>
          <p>{message}</p>
          <button type="button" className={outline} onClick={onRetry}>Thử lại</button>
        </>
      )}
    </div>
  );
}

export default function OwnerPortalPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  return (
    <section className="-m-4 flex-1 bg-surface-app p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 xl:px-10">
      <div className="mx-auto max-w-[1360px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-secondary">Không gian quản lý / Chủ nhà / Tổng quan</p>
            <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-heading">
              {user?.name ? `Chào, ${user.name}!` : "Tổng quan chủ nhà"}
            </h1>
            <p className="mt-1 text-sm text-secondary">Tổng quan hoạt động cho thuê bất động sản của bạn.</p>
          </div>
          {user && (
            <Link
              href="/owner/properties/new"
              onNavigate={(event) => {
                event.preventDefault();
                router.push(`/owner/properties/new?fresh=${crypto.randomUUID()}`);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-action-primary px-5 text-sm font-semibold text-white hover:bg-action-secondary"
            >
              <OverviewIcon name="add" /> Thêm bất động sản
            </Link>
          )}
        </header>

        {status === "loading" ? (
          <p role="status" className={panel + " p-5 text-secondary"}>Đang tải phiên đăng nhập…</p>
        ) : user ? (
          <OwnerOverview key={user.id} />
        ) : (
          <div className={panel + " flex flex-wrap items-center gap-3 p-5"}>
            <p>Đăng nhập để xem tổng quan cho thuê của bạn.</p>
            <Link href="/login" className={outline}>Đăng nhập</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function OwnerOverview() {
  const [summary, setSummary] = useState<Result<OwnerSummary>>();
  const [properties, setProperties] = useState<Result<OwnerPropertyPreview[]>>();
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  const [propertiesAttempt, setPropertiesAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getOwnerSummary(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setSummary({ data }); },
      (error: unknown) => { if (!controller.signal.aborted) setSummary({ error }); },
    );
    return () => controller.abort();
  }, [summaryAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    void getOwnerPropertyPreview(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setProperties({ data }); },
      (error: unknown) => { if (!controller.signal.aborted) setProperties({ error }); },
    );
    return () => controller.abort();
  }, [propertiesAttempt]);

  const data = summary?.data;

  return (
    <>
      {!summary && (
        <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <span className="sr-only">Đang tải tổng quan chủ nhà…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} aria-hidden="true" className={panel + " h-32 motion-safe:animate-pulse p-5"}>
              <div className="mb-4 h-3 w-2/3 rounded bg-surface-brand-soft" />
              <div className="h-7 w-10 rounded bg-surface-brand-soft" />
            </div>
          ))}
        </div>
      )}
      {summary && "error" in summary && (
        <div className={panel}>
          <LoadError
            error={summary.error}
            message="Không thể tải tổng quan chủ nhà."
            onRetry={() => {
              setSummary(undefined);
              setSummaryAttempt((current) => current + 1);
            }}
          />
        </div>
      )}
      {data && (
        <>
          <SummaryCards counts={data.counts} />
          <RecentRequests rows={data.recent_requests} />
        </>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={panel + " min-w-0 p-5 sm:p-6"} aria-labelledby="owner-properties-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="owner-properties-heading" className="text-lg font-semibold text-heading">Bất động sản của bạn</h2>
            <Link className={link + " text-sm"} href={propertyPath}>Quản lý bất động sản <span aria-hidden="true">→</span></Link>
          </div>
          {!properties && (
            <LoadingScreen
              message="Đang tải bất động sản…"
              className="min-h-40"
            />
          )}
          {properties && "error" in properties && (
            <LoadError
              error={properties.error}
              message="Không thể tải danh sách bất động sản."
              onRetry={() => {
                setProperties(undefined);
                setPropertiesAttempt((current) => current + 1);
              }}
            />
          )}
          {properties?.data && <PropertyList properties={properties.data} />}
        </section>

        {data && (
          <div className="space-y-5">
            <PendingActions actions={data.pending_actions} />
            <RecentNotifications notifications={data.recent_notifications} />
          </div>
        )}
      </div>

      <section className={panel + " flex flex-wrap items-center justify-between gap-3 px-5 py-4"}>
        <div>
          <h2 className="font-semibold text-heading">Quản lý cho thuê</h2>
          <p className="text-sm text-secondary">Mở danh sách tin đăng và hợp đồng của bạn.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/owner/listings/new" className={outline}>Tạo bài đăng</Link>
          <Link href={tenancyPath} className={outline}>Kỳ thuê</Link>
        </div>
      </section>
    </>
  );
}

function SummaryCards({ counts }: { counts: OwnerSummary["counts"] }) {
  const cards: Array<{ label: string; value: number; href: string; action: string; icon: ReactNode }> = [
    { label: "Yêu cầu chờ xử lý", value: counts.pending_rental_requests, href: requestPath, action: "Xem yêu cầu", icon: <OverviewIcon name="request" /> },
    { label: "Đề xuất chờ người thuê", value: counts.awaiting_tenant_confirmation, href: tenancyPath, action: "Xem kỳ thuê", icon: <OverviewIcon name="confirmation" /> },
    { label: "Bất động sản chưa lưu trữ", value: counts.active_properties, href: propertyPath, action: "Quản lý bất động sản", icon: <ListingIcon name="building" size={18} /> },
    { label: "Thông báo chưa đọc", value: counts.unread_notifications, href: notificationPath, action: "Xem thông báo", icon: <AdminIcon name="bell" width={18} height={18} /> },
  ];

  return (
    <div aria-label="Số liệu tổng quan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, href, action, icon }) => (
        <Link key={label} href={href} aria-label={`${label}, ${value}. ${action}`} className={panel + " flex min-h-32 flex-col gap-1.5 p-5 hover:border-border-strong sm:px-6"}>
          <span className="flex items-start justify-between gap-2 text-sm text-secondary">
            {label}<span className="shrink-0 text-link">{icon}</span>
          </span>
          <strong className="text-[30px] leading-tight text-heading tabular-nums">{value}</strong>
          <span className={link + " mt-auto text-sm"}>{action} <span aria-hidden="true">→</span></span>
        </Link>
      ))}
    </div>
  );
}

function RecentRequests({ rows }: { rows: OwnerSummary["recent_requests"] }) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  return (
    <section className={panel + " overflow-hidden"} aria-labelledby="owner-requests-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6">
        <div>
          <h2 id="owner-requests-heading" className="text-lg font-semibold text-heading">Yêu cầu thuê gần đây</h2>
          <p className="mt-0.5 text-sm text-secondary">Mở chi tiết để trao đổi với người thuê hoặc tạo đề xuất.</p>
        </div>
        <Link className={outline} href={requestPath}>Xem tất cả yêu cầu</Link>
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-border-default px-6 py-5 text-sm text-secondary">Chưa có yêu cầu thuê trong danh sách xem trước.</p>
      ) : (
        <>
          <ul className="max-h-96 divide-y divide-border-default overflow-y-auto border-t border-border-default md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`${requestPath}/${row.id}`}
                  aria-label={`Chi tiết yêu cầu của ${row.contact_name}`}
                  className="block space-y-2 px-5 py-4 text-sm hover:bg-surface-brand-soft"
                >
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-semibold text-heading">{row.contact_name}</span>
                    <RequestStatus row={row} today={today} />
                  </span>
                  <span className="block text-secondary">{row.property_name} · {row.preferred_unit ?? "Không ưu tiên"}</span>
                  <span className="block text-secondary">{dateRange(row)}</span>
                  <span className={link}>Chi tiết <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="relative hidden max-h-96 overflow-auto md:block">
            <table className="w-full min-w-[690px] text-left text-sm">
              <thead className="bg-surface-app text-xs text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3">Người yêu cầu</th>
                  <th scope="col" className="px-4 py-3">Bất động sản · căn ưu tiên</th>
                  <th scope="col" className="px-4 py-3">Ngày mong muốn</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Chi tiết</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const words = row.contact_name.trim().split(/\s+/);
                  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)?.[0] : ""].join("").toUpperCase();
                  return (
                    <tr key={row.id} className="border-t border-border-default">
                      <th scope="row" className="px-4 py-4 font-semibold text-heading">
                        <span className="flex items-center gap-2.5">
                          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-brand-soft text-xs text-link">{initials}</span>
                          {row.contact_name}
                        </span>
                      </th>
                      <td className="px-4 py-4">{row.property_name} · {row.preferred_unit ?? "Không ưu tiên"}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{dateRange(row)}</td>
                      <td className="px-4 py-4"><RequestStatus row={row} today={today} /></td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`${requestPath}/${row.id}`} aria-label={`Chi tiết yêu cầu của ${row.contact_name}`} className={link + " whitespace-nowrap"}>
                          Chi tiết <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border-default px-6 py-3 text-xs text-secondary">{rows.length} yêu cầu trong danh sách xem trước</p>
        </>
      )}
    </section>
  );
}

function RequestStatus({ row, today }: { row: OwnerSummary["recent_requests"][number]; today: string }) {
  const overdue = row.status === "PENDING" && row.desired_move_in_date < today;
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${overdue ? "bg-orange-100 text-orange-900" : statuses[row.status].color}`}>
      {overdue ? "Đang chờ · ngày đã qua" : statuses[row.status].label}
    </span>
  );
}

const moderationLabels = {
  APPROVED: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-100 text-red-800" },
  PENDING: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-900" },
} as const;

const publicationLabels = {
  PUBLISHED: { label: "Đã đăng", color: "bg-emerald-100 text-emerald-800" },
  DRAFT: { label: "Bản nháp", color: "bg-slate-200 text-slate-700" },
  HIDDEN: { label: "Đã ẩn", color: "bg-slate-200 text-slate-700" },
} as const;

function PropertyPhoto({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return (
    <span className="relative grid h-[68px] w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-brand-soft text-link">
      {url && url !== failedUrl ? (
        <Image src={url} alt="" fill sizes="96px" unoptimized className="object-cover" onError={() => setFailedUrl(url)} />
      ) : (
        <ListingIcon name="building" size={24} />
      )}
    </span>
  );
}

function PropertyStatus({ property }: { property: OwnerPropertyPreview }) {
  const moderation = property.moderation_status;
  const badges = [
    !property.suspended && moderation && moderation !== "DRAFT" ? moderationLabels[moderation] : null,
    property.publication_status ? publicationLabels[property.publication_status] : { label: "Chưa có tin đăng", color: "bg-slate-200 text-slate-700" },
    property.suspended ? { label: "Bị đình chỉ bởi admin", color: "bg-red-700 text-white" } : null,
  ];

  return (
    <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
      {badges.map((badge) => badge && (
        <span key={badge.label} className={`rounded-full px-2.5 py-1 text-[13px] leading-[18px] font-semibold ${badge.color}`}>{badge.label}</span>
      ))}
    </span>
  );
}

function PropertyList({ properties }: { properties: OwnerPropertyPreview[] }) {
  if (properties.length === 0) {
    return <p className="text-sm text-secondary">Bạn chưa có bất động sản nào. Chọn “Thêm bất động sản” để bắt đầu.</p>;
  }

  return (
    <ul className="space-y-3">
      {properties.map((property) => (
        <li key={property.id}>
          <Link href={`${propertyPath}/${property.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-border-default p-3 hover:border-border-strong hover:bg-surface-app">
            <span className="flex min-w-0 flex-[1_0_15rem] items-center gap-3.5">
              <PropertyPhoto url={property.photo_url} />
              <span className="min-w-0">
                <span className="block leading-5 font-bold text-heading">{property.name}</span>
                <span className="mt-1 block text-[13px] leading-5 text-secondary">
                  {[
                    [property.ward, property.city].filter(Boolean).join(", "),
                    property.rental_arrangement === "WHOLE_SPACE" ? "Nguyên căn" : "Từng căn",
                    `${property.unit_count} căn`,
                  ].filter(Boolean).join(" · ")}
                </span>
              </span>
            </span>
            <PropertyStatus property={property} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const actionLabels = {
  rental_request: { name: "Yêu cầu thuê", color: "bg-amber-100 text-amber-900" },
  contract_correction: { name: "Cần chỉnh sửa", color: "bg-red-100 text-red-800" },
  renewal: { name: "Gia hạn", color: "bg-blue-100 text-blue-900" },
} as const;

function PendingActions({ actions }: { actions: OwnerSummary["pending_actions"] }) {
  return (
    <section className={panel + " p-5 sm:p-6"} aria-labelledby="owner-actions-heading">
      <h2 id="owner-actions-heading" className="mb-4 text-lg font-semibold text-heading">Cần chú ý</h2>
      {actions.length === 0 ? (
        <p className="text-sm text-secondary">Bạn chưa có việc nào cần xử lý.</p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {actions.map((action) => {
            const badge = actionLabels[action.kind];
            return (
              <li key={`${action.kind}:${action.id}`}>
                <Link href={action.href} className="block rounded-xl border border-border-default p-3 hover:border-border-strong">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badge.color}`}>{badge.name}</span>
                  <span className="mt-1 block text-sm font-semibold text-heading">{action.title}</span>
                  <span className="mt-1 block text-sm text-secondary">{action.description}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RecentNotifications({ notifications }: { notifications: OwnerSummary["recent_notifications"] }) {
  return (
    <section className={panel + " p-5 sm:p-6"} aria-labelledby="owner-notifications-preview">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="owner-notifications-preview" className="text-lg font-semibold text-heading">Thông báo gần đây</h2>
        <Link className={link + " text-sm"} href={notificationPath}>Mở hộp thư <span aria-hidden="true">→</span></Link>
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-secondary">Bạn chưa có thông báo.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-border-default overflow-y-auto">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link
                href={notificationPath}
                aria-label={item.read_at === null ? `Chưa đọc: ${item.title}` : item.title}
                className="block rounded-md py-3 hover:bg-surface-app"
              >
                <span className={item.read_at === null ? "block text-sm font-semibold text-heading" : "block text-sm text-secondary"}>
                  {item.title}
                </span>
                <time dateTime={item.created_at} className="block text-xs text-secondary">{timestamp(item.created_at)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
