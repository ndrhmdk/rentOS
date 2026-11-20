"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  void error;

  // Full-viewport overlay so the layout header/footer (especially the home
  // transparent nav over a light page) cannot show through or block clicks.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f1f6f8] px-4">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-[#3368A0]">
          rentOS
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#102337] sm:text-3xl">
          Đã có lỗi. Vui lòng thử lại!
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#52636c]">
          Trang này gặp sự cố tạm thời. Bạn có thể thử tải lại hoặc quay về
          trang chủ. 
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#3368A0] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2b5788] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3368A0]"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[#dce5ef] bg-white px-6 text-sm font-semibold text-[#102337] transition-colors hover:bg-[#f1f6f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3368A0]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
