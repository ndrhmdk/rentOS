"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { describeDuration, dong } from "@/components/listings/listing-format";
import { ListingIcon } from "@/components/listings/listing-icon";
import { ApiError } from "@/lib/http/client";
import { useAuth } from "@/lib/auth-context";
import { dateFormat, dateRange, statuses, timestamp } from "@/lib/rental-request-format";
import { getTenantSummary, type TenantProposal, type TenantSummary, type TenantUpcomingTenancy } from "@/lib/tenant-summary-api";

const panel = "rounded-2xl border border-border-default bg-surface-card";
const outline = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-strong px-4 text-sm font-semibold text-link hover:bg-surface-brand-soft";
const link = "text-sm font-semibold text-link hover:underline";
const badge = "inline-flex w-fit flex-wrap items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

const requestPath = "/tenant/requests";
const contractPath = "/tenant/contracts";
const notificationPath = "/tenant/notifications";
const discoveryPath = "/listings";

const iconDimensions = {
  search: 18, deadline: 14, confirmation: 18, request: 18, tenancy: 18,
  notifications: 18, confirmed: 14, contract: 18, arrow: 14, activity: 14,
} as const;

function Icon({ name }: { name: keyof typeof iconDimensions }) {
  const size = iconDimensions[name];
  return <Image src={`/images/tenant-summary/${name}.svg`} alt="" width={size} height={size} unoptimized />;
}

function PropertyPhoto({ url, hero = false }: { url: string | null; hero?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const dimensions = hero ? "aspect-[4/3] w-full max-h-[44rem] sm:aspect-square" : "h-[46px] w-16 shrink-0 rounded-lg sm:w-[72px]";
  return (
    <span className={`relative grid place-items-center overflow-hidden bg-surface-brand-soft text-link ${dimensions}`}>
      {url && url !== failedUrl ? (
        <Image src={url} alt="" fill unoptimized sizes={hero ? "(max-width: 1024px) 100vw, 68vw" : "72px"} className="object-cover" onError={() => setFailedUrl(url)} />
      ) : (
        <ListingIcon name="building" size={hero ? 42 : 22} />
      )}
    </span>
  );
}

function windowLabel(start: string, end: string) {
  return dateRange({ desired_move_in_date: start, desired_end_date: end });
}

function timeRemaining(deadline: string) {
  const minutes = Math.ceil((Date.parse(deadline) - Date.now()) / 60_000);
  if (minutes <= 0) return "Đã hết hạn";
  if (minutes < 60) return `Còn ${minutes} phút`;
  return `Còn ${Math.ceil(minutes / 60)} giờ`;
}

type LoadResult = { data: TenantSummary; error?: never } | { data?: never; error: unknown };

export default function TenantPortalPage() {
  const { user, status } = useAuth();

  return (
    <section className="-m-4 flex-1 bg-surface-app p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 xl:px-10">
      <div className="mx-auto max-w-[1360px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-secondary">Trang của bạn / Người thuê / Trang chính</p>
            <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-heading">
              {user?.name ? `Chào, ${user.name}!` : "Trang chính người thuê"}
            </h1>
            <p className="mt-1 text-sm text-secondary">Tổng quan yêu cầu, hợp đồng và kỳ thuê của bạn.</p>
          </div>
          <Link className={outline + " bg-surface-card"} href={discoveryPath}><Icon name="search" /> Tìm kiếm căn hộ</Link>
        </header>

        {status === "loading" ? (
          <DashboardLoading />
        ) : user ? (
          <TenantOverview key={user.id} />
        ) : (
          <div className={panel + " flex flex-wrap items-center gap-3 p-5"}>
            <p>Đăng nhập để xem tổng quan kỳ thuê của bạn.</p>
            <Link href="/login" className={outline}>Đăng nhập</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardLoading() {
  return (
    <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <span className="sr-only">Đang tải tổng quan người thuê…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className={panel + " h-32 p-5 motion-safe:animate-pulse"}>
          <div className="mb-4 h-3 w-2/3 rounded bg-surface-brand-soft" />
          <div className="h-7 w-10 rounded bg-surface-brand-soft" />
        </div>
      ))}
    </div>
  );
}

function TenantOverview() {
  const [result, setResult] = useState<LoadResult>();
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getTenantSummary(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ data }); },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ error }); },
    );
    return () => controller.abort();
  }, [retry]);

  if (!result) return <DashboardLoading />;
  if (!result.data) {
    const status = result.error instanceof ApiError ? result.error.status : null;
    return (
      <div className="space-y-5">
        <div role="alert" className={panel + " flex flex-wrap items-center gap-3 p-5"}>
          {status === 401 ? (
            <><p>Phiên đăng nhập đã hết hạn.</p><Link href="/login" className={outline}>Đăng nhập lại</Link></>
          ) : status === 403 ? (
            <p>Tài khoản của bạn chưa có quyền xem tổng quan này.</p>
          ) : (
            <>
              <p>Không thể tải tổng quan người thuê.</p>
              <button type="button" className={outline} onClick={() => {
                setResult(undefined);
                setRetry((value) => value + 1);
              }}>Thử lại</button>
            </>
          )}
        </div>
        <QuickActions renewalHref={null} />
      </div>
    );
  }

  const data = result.data;
  const proposals = data.pending_actions.filter((item): item is TenantProposal => item.kind !== "rental_request");

  return (
    <>
      {proposals.length > 0 && <DueActions proposals={proposals} />}
      <SummaryCards data={data} nextProposal={proposals.find((proposal) => proposal.kind === "contract")} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.8fr)_minmax(14rem,1fr)]">
        <UpcomingTenancy tenancy={data.upcoming_tenancy} />
        <QuickActions renewalHref={data.renewal_href} />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.15fr)_minmax(14rem,1fr)]">
        <RecentRequests data={data} proposals={proposals} />
        <RecentActivity notifications={data.recent_notifications} />
      </div>
    </>
  );
}

function DueActions({ proposals }: { proposals: TenantProposal[] }) {
  return (
    <section className="rounded-2xl bg-navy-900 p-4 text-on-dark sm:p-5" aria-labelledby="tenant-due">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="tenant-due" className="text-lg font-semibold">Cần bạn xử lý · {proposals.length}</h2>
        <p className="text-sm text-on-dark-muted">Những đề xuất đang chờ bạn phản hồi trước hạn chót.</p>
      </div>
      <ul className="max-h-96 space-y-3 overflow-y-auto">
        {proposals.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-card p-4 text-primary">
            <div className="flex min-w-0 flex-[1_1_20rem] items-center gap-3">
              <PropertyPhoto url={item.photo_url} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap gap-1.5">
                  <span className={badge + " bg-amber-100 text-amber-900"}>Đề xuất chờ bạn xác nhận</span>
                  <span className={badge + " bg-blue-100 text-blue-900"}>Phiên bản {item.version} · {item.kind === "renewal" ? "Gia hạn" : "Bản gốc"}</span>
                </div>
                <p className="font-bold text-heading">{item.unit_label} · {item.title}</p>
                <p className="text-xs text-secondary">{dong(Number(item.monthly_rent))}/tháng · {windowLabel(item.start_date, item.end_date)} · phản hồi trước {timestamp(item.expires_at)}</p>
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span className={badge + " bg-blue-100 text-blue-900"}><Icon name="deadline" /> {timeRemaining(item.expires_at)}</span>
              <Link href={item.href} className="inline-flex min-h-11 items-center rounded-xl bg-action-primary px-4 text-sm font-semibold text-white hover:bg-action-secondary">Xem xét và xác nhận</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SummaryCards({ data, nextProposal }: { data: TenantSummary; nextProposal?: TenantProposal }) {
  const { counts, upcoming_tenancy: upcoming } = data;
  const cards: { title: string; value: string | number; href: string; action: string; icon: keyof typeof iconDimensions }[] = [
    {
      title: "Đang chờ bạn xác nhận", value: `${counts.awaiting_confirmation} hợp đồng`, href: nextProposal?.href ?? contractPath,
      action: nextProposal ? `${timeRemaining(nextProposal.expires_at)} · Xem xét` : "Xem danh sách hợp đồng", icon: "confirmation",
    },
    { title: "Yêu cầu đang chờ", value: counts.pending_rental_requests, href: requestPath, action: "Xem tất cả yêu cầu", icon: "request" },
    { title: "Kỳ thuê", value: counts.tenancies, href: contractPath, action: upcoming ? `Sắp tới · ${upcoming.title}` : "Xem các kỳ thuê", icon: "tenancy" },
    { title: "Thông báo chưa đọc", value: counts.unread_notifications, href: notificationPath, action: "Xem thông báo", icon: "notifications" },
  ];

  return (
    <div aria-label="Số liệu tổng quan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, href, action, icon }) => (
        <Link key={title} href={href} aria-label={`${title}, ${value}. ${action}`} className={panel + " flex min-h-32 flex-col gap-1.5 p-5 hover:border-border-strong"}>
          <span className="flex items-start justify-between gap-2 text-sm text-secondary">{title}<Icon name={icon} /></span>
          <strong className="text-[28px] leading-tight font-bold text-heading tabular-nums">{value}</strong>
          <span className={link + " mt-auto"}>{action} <span aria-hidden="true">→</span></span>
        </Link>
      ))}
    </div>
  );
}

function UpcomingTenancy({ tenancy }: { tenancy: TenantUpcomingTenancy | null }) {
  if (!tenancy) {
    return (
      <section className={panel + " p-6"} aria-labelledby="tenant-upcoming">
        <h2 id="tenant-upcoming" className="text-lg font-semibold text-heading">Kỳ thuê sắp tới</h2>
        <p className="mt-2 text-sm text-secondary">Bạn chưa có kỳ thuê sắp tới đã xác nhận.</p>
        <Link className={outline + " mt-4"} href={contractPath}>Căn hộ và hợp đồng</Link>
      </section>
    );
  }

  const details = [
    tenancy.unit_label,
    tenancy.bedrooms !== null ? `${tenancy.bedrooms} phòng ngủ` : null,
    tenancy.area_m2 !== null ? `${Number(tenancy.area_m2).toLocaleString("vi-VN")} m²` : null,
    windowLabel(tenancy.start_date, tenancy.end_date),
    describeDuration(tenancy.start_date, tenancy.end_date),
  ].filter(Boolean);

  return (
    <section className={panel + " overflow-hidden"} aria-labelledby="tenant-upcoming">
      <PropertyPhoto url={tenancy.photo_url} hero />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-5">
          <h2 id="tenant-upcoming" className="text-sm font-medium text-secondary">Kỳ thuê sắp tới</h2>
          <span className={badge + " bg-emerald-100 text-emerald-800"}><Icon name="confirmed" /> Đã xác nhận · chờ dọn vào</span>
        </div>
        <h3 className="mt-2 text-xl font-bold text-heading">{[tenancy.title, tenancy.ward ?? tenancy.city].filter(Boolean).join(" · ")}</h3>
        <p className="mt-2 text-sm text-secondary">{details.join(" · ")}</p>
        <div className="mt-4 border-t border-border-default pt-4">
          <p className="text-xs text-secondary">Giá thuê theo điều khoản đã xác nhận</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div><strong className="text-2xl text-link">{dong(Number(tenancy.monthly_rent))}</strong><span className="text-sm"> /tháng · v{tenancy.version}</span></div>
            <Link className={outline} href={tenancy.href}><Icon name="contract" /> Xem hợp đồng</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ renewalHref }: { renewalHref: string | null }) {
  const actions = [
    { label: "Khám phá căn hộ", href: discoveryPath },
    { label: "Xem yêu cầu của tôi", href: requestPath },
    renewalHref
      ? { label: "Yêu cầu gia hạn kỳ thuê", href: renewalHref }
      : { label: "Căn hộ và hợp đồng", href: contractPath },
  ];

  return (
    <section className={panel + " p-5"} aria-labelledby="tenant-quick">
      <h2 id="tenant-quick" className="mb-3 text-lg font-semibold text-heading">Tác vụ nhanh</h2>
      <ul className="space-y-2">
        {actions.map(({ label, href }) => (
          <li key={label}><Link className={outline + " w-full justify-between text-left"} href={href}>{label}<Icon name="arrow" /></Link></li>
        ))}
      </ul>
    </section>
  );
}

function RecentRequests({ data, proposals }: { data: TenantSummary; proposals: TenantProposal[] }) {
  const recentIds = new Set(data.recent_requests.map((row) => row.id));
  const additionalPending = data.pending_actions.filter((item) => item.kind === "rental_request" && !recentIds.has(item.id));
  const originalProposals = new Map(proposals.filter((item) => item.kind === "contract").map((item) => [item.rental_request_id, item]));

  return (
    <section className={panel + " overflow-hidden"} aria-labelledby="tenant-recent-requests">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6">
        <h2 id="tenant-recent-requests" className="text-lg font-semibold text-heading">Yêu cầu gần đây</h2>
        <Link href={requestPath} className={link}>Xem tất cả <span aria-hidden="true">→</span></Link>
      </div>
      {data.recent_requests.length === 0 ? (
        <p className="border-t border-border-default px-5 py-4 text-sm text-secondary">Bạn chưa gửi yêu cầu thuê nào.</p>
      ) : (
        <ul className="max-h-[32rem] divide-y divide-border-default overflow-y-auto border-t border-border-default">
          {data.recent_requests.map((row) => {
            const status = statuses[row.status];
            const proposal = originalProposals.get(row.id);
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 flex-[1_1_14rem] items-center gap-3">
                  <PropertyPhoto url={row.photo_url} />
                  <div className="min-w-0 space-y-0.5">
                    <Link href={row.href} className="block text-sm font-bold text-heading hover:underline">{row.title}</Link>
                    <p className="text-xs text-secondary">
                      Gửi {dateFormat.format(new Date(row.created_at))} · {dateRange(row)}{row.preferred_unit && ` · Ưu tiên ${row.preferred_unit}`}
                    </p>
                    {proposal && <Link href={proposal.href} className={link + " block text-xs"}>Đang chờ bạn xác nhận · {timeRemaining(proposal.expires_at)}</Link>}
                  </div>
                </div>
                <span className={badge + " ml-auto shrink-0 " + status.color}>{status.label}</span>
              </li>
            );
          })}
        </ul>
      )}
      {additionalPending.length > 0 && (
        <div className="border-t border-border-default p-5">
          <h3 className="mb-2 text-sm font-semibold text-heading">Yêu cầu khác đang chờ</h3>
          <ul className="space-y-2">
            {additionalPending.map((row) => <li key={row.id}><Link className={link} href={row.href}>{row.title}</Link></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

function RecentActivity({ notifications }: { notifications: TenantSummary["recent_notifications"] }) {
  return (
    <section className={panel + " overflow-hidden"} aria-labelledby="tenant-activity">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <h2 id="tenant-activity" className="text-lg font-semibold text-heading">Hoạt động gần đây</h2>
        <Link href={notificationPath} className={link}>Mở hộp thư</Link>
      </div>
      {notifications.length === 0 ? (
        <p className="border-t border-border-default px-5 py-4 text-sm text-secondary">Bạn chưa có thông báo.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-border-default overflow-y-auto border-t border-border-default">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link href={notificationPath} aria-label={item.read_at === null ? `Chưa đọc: ${item.title}` : item.title} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-app">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-surface-brand-soft"><Icon name="activity" /></span>
                <span className="min-w-0">
                  <span className={item.read_at === null ? "block text-sm font-semibold text-heading" : "block text-sm text-secondary"}>{item.title}</span>
                  <time dateTime={item.created_at} className="block text-xs text-secondary">{timestamp(item.created_at)}</time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
