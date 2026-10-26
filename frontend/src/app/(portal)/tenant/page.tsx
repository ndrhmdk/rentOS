"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getTenantTenancies, type TenantTenancy } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { PortalEmptyState } from "@/components/portal-empty-state";

export default function TenantPortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenancies, setTenancies] = useState<TenantTenancy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getTenantTenancies();
        if (!ignore) {
          setTenancies(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError("Không thể tải thông tin hợp đồng thuê. Vui lòng thử lại sau.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [router, retryKey]);

  const handleRetry = () => {
    setLoading(true);
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="mb-8">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">CỔNG CƯ DÂN</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Quản lý cuộc sống thuê nhà</h1>
        <p className="text-sm text-slate-600">Theo dõi hợp đồng, thanh toán tiền phòng và gửi yêu cầu hỗ trợ dịch vụ tiện ích.</p>
      </div>

      {loading ? (
        <p className="text-center py-12 text-slate-500">Đang tải thông tin cư dân…</p>
      ) : error ? (
        <div className="text-center py-10 px-4 bg-white border border-rose-200 rounded-2xl p-8 max-w-xl mx-auto shadow-sm">
          <p className="text-sm text-rose-600 font-medium mb-4">{error}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
            onClick={handleRetry}
          >
            Thử lại
          </button>
        </div>
      ) : tenancies && tenancies.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#3368a0] mb-3">
            Cư dân chính thức
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Không gian sống của bạn</h2>
          <p className="text-sm text-slate-600">
            Chào mừng bạn, <strong>{user?.name}</strong>. Dưới đây là thông tin về hợp đồng thuê nhà của bạn trên hệ thống rentOS.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-3xl font-bold text-[#3368a0] mb-1">{tenancies.length}</div>
              <div className="text-xs font-medium text-slate-500">Hợp đồng thuê đang kích hoạt</div>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-3xl font-bold text-emerald-600 mb-1">Đang hoạt động</div>
              <div className="text-xs font-medium text-slate-500">Trạng thái cư trú</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
              href="/"
            >
              Khám phá thêm căn hộ
            </Link>
          </div>
        </div>
      ) : (
        <PortalEmptyState
          kicker="CHƯA CÓ HỢP ĐỒNG"
          title="Bạn chưa có hợp đồng thuê nhà nào"
          description="Tìm kiếm không gian sống lý tưởng trong danh mục phòng cho thuê đã được xác thực của chúng tôi và gửi yêu cầu thuê ngay hôm nay."
          ctaHref="/"
          ctaText="Tìm nơi ở phù hợp"
        />
      )}
    </div>
  );
}
