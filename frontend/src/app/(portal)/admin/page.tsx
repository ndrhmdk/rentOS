import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center my-auto min-h-[50vh]">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col items-center">
        <span className="block text-4xl sm:text-5xl font-extrabold text-slate-300 mb-4 select-none">
          404
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Không tìm thấy trang
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di dời.
        </p>
        <Link
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg bg-[#3368a0] hover:bg-[#285584] text-white text-sm font-semibold shadow-sm transition-colors"
          href="/"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
