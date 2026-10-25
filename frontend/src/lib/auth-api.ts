const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string | null;
};

function csrfToken(): string | null {
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
    throw new ApiError(response.status, "Không thể khởi tạo phiên bảo mật. Vui lòng thử lại.");
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await initializeCsrf();
    const token = csrfToken();
    if (!token) {
      throw new ApiError(419, "Phiên CSRF đã hết hạn. Vui lòng tải lại trang.");
    }
    headers.set("X-XSRF-TOKEN", token);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 204 || response.status === 201) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    errors?: FieldErrors;
    data?: T;
    two_factor?: boolean;
  };

  if (!response.ok) {
    const defaultMessage = response.status === 401
      ? "Thông tin đăng nhập không đúng hoặc phiên đã hết hạn."
      : response.status === 419
        ? "Phiên bảo mật đã hết hạn. Vui lòng thử lại."
        : response.status === 429
          ? "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại."
          : "Có lỗi xảy ra. Vui lòng kiểm tra thông tin và thử lại.";

    throw new ApiError(response.status, payload.message ?? defaultMessage, payload.errors ?? {});
  }

  return (payload.data ?? payload) as T;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await request<void>("/register", { method: "POST", body: JSON.stringify(input) });
}

export async function login(input: { email: string; password: string }): Promise<void> {
  await request<void>("/login", { method: "POST", body: JSON.stringify(input) });
}

export async function logout(): Promise<void> {
  await request<void>("/logout", { method: "POST", body: "{}" });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/me");
}

export async function updateProfile(input: { name: string; phone: string | null }): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/me", { method: "PATCH", body: JSON.stringify(input) });
}

export async function updatePassword(input: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await request<void>("/user/password", { method: "PUT", body: JSON.stringify(input) });
}

export async function resendVerification(): Promise<void> {
  await request<void>("/email/verification-notification", { method: "POST", body: "{}" });
}
