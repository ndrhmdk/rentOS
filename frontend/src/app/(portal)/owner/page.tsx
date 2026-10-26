"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getOwnerProperties, type OwnerProperty } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { PortalEmptyState } from "@/components/portal-empty-state";

export default function OwnerPortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<OwnerProperty[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getOwnerProperties();
        if (!ignore) {
          setProperties(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError("Không thể tải thông tin bất động sản. Vui lòng thử lại sau.");
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
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">CỔNG CHỦ NHÀ</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Quản lý tài sản và người thuê</h1>
        <p className="text-sm text-slate-600">Kiểm soát danh mục căn hộ cho thuê, xét duyệt hợp đồng và tối ưu hóa doanh thu bất động sản.</p>
      </div>

      {loading ? (
        <p className="text-center py-12 text-slate-500">Đang tải thông tin chủ nhà…</p>
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
      ) : properties && properties.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#3368a0] mb-3">
            Chủ nhà đối tác
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Danh mục bất động sản của bạn</h2>
          <p className="text-sm text-slate-600">
            Xin chào, <strong>{user?.name}</strong>. Dưới đây là tình hình hoạt động của các bất động sản bạn đang quản lý.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-3xl font-bold text-[#3368a0] mb-1">{properties.length}</div>
              <div className="text-xs font-medium text-slate-500">Bất động sản đang quản lý</div>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-3xl font-bold text-emerald-600 mb-1">Đang hoạt động</div>
              <div className="text-xs font-medium text-slate-500">Trạng thái danh mục</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
              href="/"
            >
              Xem danh sách căn hộ
            </Link>
          </div>
        </div>
      ) : (
        <PortalEmptyState
          kicker="CHƯA CÓ BẤT ĐỘNG SẢN"
          title="Bạn chưa có bất động sản nào"
          description="Đăng tin cho thuê nhà hoặc căn hộ của bạn để tiếp cận hàng nghìn người thuê tiềm năng và quản lý hợp đồng chuyên nghiệp."
          ctaHref="/"
          ctaText="Bắt đầu đăng tin"
        />
      )}
    </div>
  );
}
