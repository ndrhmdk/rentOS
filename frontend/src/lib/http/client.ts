import { localizeApiMessage, localizeFieldErrors } from "./localize";
import type { FieldErrors } from "./localize";

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

type ApiDocument = {
  message?: string;
  error_code?: string;
  reference?: string;
  errors?: FieldErrors;
  data?: unknown;
  meta?: unknown;
};

const errorCodeMessages: Record<string, string> = {
  storage_failed: "Không thể tải ảnh lên. Vui lòng thử lại.",
  service_unavailable: "Dịch vụ tạm thời không phản hồi. Vui lòng thử lại.",
  server_error: "Đã có lỗi. Vui lòng thử lại.",
};

export function messageForErrorCode(
  errorCode: string | null | undefined,
  reference: string | null | undefined,
): string {
  const base =
    errorCodeMessages[errorCode ?? ""] ?? errorCodeMessages.server_error;
  if (!reference) {
    return base;
  }
  if (base.includes(reference)) {
    return base;
  }
  return `${base} Mã tham chiếu: ${reference}`;
}

export class ApiError extends Error {
  status: number;
  errors: FieldErrors;
  errorCode: string | null;
  reference: string | null;

  constructor(
    status: number,
    message: string,
    errors: FieldErrors = {},
    errorCode: string | null = null,
    reference: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.errorCode = errorCode;
    this.reference = reference;
  }
}

async function executeFetch(
  path: string,
  method: string,
  headers: Headers,
  init: RequestInit,
): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

async function requestDocument(
  path: string,
  init: RequestInit = {},
): Promise<ApiDocument | undefined> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (isWriteMethod) {
    headers.set("X-XSRF-TOKEN", await ensureCsrfToken());
  }
  let response = await executeFetch(path, method, headers, init);
  if (response.status === 419 && isWriteMethod) {
    await initializeCsrf();
    const refreshedToken = csrfToken();
    if (refreshedToken) {
      headers.set("X-XSRF-TOKEN", refreshedToken);
      response = await executeFetch(path, method, headers, init);
    }
  }
  if (response.status === 204) {
    return undefined;
  }
  const payload = (await response.json().catch(() => ({}))) as ApiDocument;
  if (!response.ok) {
    const referenceHeader = response.headers.get("X-Request-Id");
    const reference =
      (typeof payload.reference === "string" && payload.reference) ||
      (typeof referenceHeader === "string" && referenceHeader) ||
      null;
    const errorCode =
      typeof payload.error_code === "string" && payload.error_code !== ""
        ? payload.error_code
        : null;
    const fallback =
      response.status === 401
        ? "Thông tin đăng nhập không đúng hoặc phiên đã hết hạn."
        : response.status === 419
          ? "Phiên bảo mật đã hết hạn. Vui lòng thử lại."
          : response.status === 429
            ? "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại."
            : "Có lỗi xảy ra. Vui lòng kiểm tra thông tin và thử lại.";
    const message =
      response.status >= 500
        ? messageForErrorCode(errorCode, reference)
        : localizeApiMessage(payload.message ?? fallback, response.status);
    throw new ApiError(
      response.status,
      message,
      localizeFieldErrors(payload.errors ?? {}),
      response.status >= 500 ? errorCode : null,
      response.status >= 500 ? reference : null,
    );
  }
  return payload;
}

export function csrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
  } catch {
    return cookie.slice("XSRF-TOKEN=".length);
  }
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      "Không thể khởi tạo phiên bảo mật. Vui lòng thử lại.",
    );
  }
}

async function ensureCsrfToken(): Promise<string> {
  let token = csrfToken();
  if (!token) {
    await initializeCsrf();
    token = csrfToken();
  }
  if (!token) {
    throw new ApiError(
      419,
      "Phiên bảo mật đã hết hạn. Vui lòng tải lại trang.",
    );
  }
  return token;
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const payload = await requestDocument(path, init);
  if (payload === undefined) {
    return undefined as T;
  }

  // Preserve pagination envelope { data, meta } and mutation envelopes { message, data }
  if (payload && typeof payload === "object") {
    if ("meta" in payload && "data" in payload) {
      return payload as T;
    }
    if ("message" in payload && "data" in payload) {
      return payload as T;
    }
  }

  return ((payload as { data?: T }).data ?? payload) as T;
}
