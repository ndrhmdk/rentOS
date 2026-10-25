import type { FieldErrors } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors: FieldErrors = {},
    message?: string,
  ) {
    super(message ?? "Không thể hoàn thành yêu cầu.");
  }
}
const origin = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const recoveryListeners = new Set<(status: number) => void>();
export function onSessionFailure(listener: (status: number) => void) {
  recoveryListeners.add(listener);
  return () => {
    recoveryListeners.delete(listener);
  };
}
export function readXsrfCookie(): string | undefined {
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);
  return value ? decodeURIComponent(value) : undefined;
}
export async function api<T = void>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    recover?: boolean;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = readXsrfCookie();
    if (csrf) headers["X-XSRF-TOKEN"] = csrf;
  }
  const response = await fetch(`${origin}${path}`, {
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (options.recover !== false && [401, 419].includes(response.status))
      recoveryListeners.forEach((listener) => listener(response.status));
    throw new ApiError(response.status, body?.errors, body?.message);
  }
  return body as T;
}
export function initializeCsrf() {
  return api("/sanctum/csrf-cookie", { recover: false });
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Không nhận được phản hồi. Kiểm tra kết quả trước khi chủ động gửi lại; yêu cầu chưa được tự động gửi lại.";
  const messages: Record<number, string> = {
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi tự gửi lại biểu mẫu.",
    403: "Bạn không có quyền thực hiện thao tác này. Hãy kiểm tra trạng thái xác minh tài khoản.",
    409: "Thông tin đã thay đổi ở nơi khác. Tải lại và kiểm tra trước khi lưu.",
    419: "Phiên bảo mật đã hết hạn. Khôi phục phiên rồi chủ động gửi lại biểu mẫu.",
    422: "Vui lòng kiểm tra thông tin trong biểu mẫu.",
    423: "Vui lòng xác nhận lại mật khẩu trước khi tiếp tục.",
    429: "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.",
  };
  return (
    messages[error.status] ??
    "Không thể hoàn thành yêu cầu. Vui lòng thử lại sau."
  );
}
