"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/identity/api";
import { privateKey, useIdentity } from "@/lib/identity/provider";
import type { Ability, ApiToken, TokenPage } from "@/lib/identity/types";
import { Feedback, Field, IdentityGate } from "./ui";

const abilities: Ability[] = [
  "account:read",
  "favourites:read",
  "favourites:write",
];
export function ApiTokens() {
  const { account } = useIdentity();
  return (
    <>
      <h1>API tokens</h1>
      <IdentityGate>
        {account && <TokenSettings key={account.id} userId={account.id} />}
      </IdentityGate>
    </>
  );
}
export function TokenSettings({ userId }: { userId: string }) {
  const client = useQueryClient();
  const { recoveryStatus } = useIdentity();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: privateKey(userId, "api-tokens", page),
    enabled: !recoveryStatus,
    queryFn: ({ signal }) =>
      api<TokenPage>(`/api/v1/account/api-tokens?page=${page}`, { signal }),
  });
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Ability[]>(["account:read"]);
  const [days, setDays] = useState(30);
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState("");
  const [revoking, setRevoking] = useState<ApiToken | null>(null);
  const sending = useRef(false);
  const mounted = useRef(true);
  const secretGeneration = useRef(0);
  const fields = error instanceof ApiError ? error.errors : {};
  const refreshList = () =>
    client.invalidateQueries({ queryKey: privateKey(userId, "api-tokens") });
  useEffect(() => {
    mounted.current = true;
    function clear() {
      secretGeneration.current++;
      setSecret(null);
      setPassword("");
      setCopied(false);
    }
    function hide() {
      if (document.hidden) clear();
    }
    window.addEventListener("identity:clear-secret", clear);
    window.addEventListener("pagehide", clear);
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      window.removeEventListener("identity:clear-secret", clear);
      window.removeEventListener("pagehide", clear);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  async function confirm(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    setSuccess("");
    try {
      await api("/user/confirm-password", {
        method: "POST",
        body: { password },
      });
      setSuccess("Đã xác nhận mật khẩu trong 15 phút.");
    } catch (caught) {
      setError(caught);
    } finally {
      setPassword("");
      setBusy(false);
    }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    setSuccess("");
    setSecret(null);
    setCopied(false);
    try {
      // Deliberately outside TanStack mutation caches: creation secrets live only in this component.
      const generation = secretGeneration.current;
      const result = await api<{ data: ApiToken; plain_text_token: string }>(
        "/api/v1/account/api-tokens",
        {
          method: "POST",
          body: { name, abilities: scopes, expiry_days: days },
        },
      );
      if (mounted.current && generation === secretGeneration.current) {
        setSecret(result.plain_text_token);
        setName("");
      }
      await refreshList();
    } catch (caught) {
      setError(caught);
      if (!(caught instanceof ApiError)) {
        setSuccess(
          "Phản hồi tạo token có thể đã bị mất. Làm mới danh sách, thu hồi token không sử dụng được rồi chủ động tạo mới.",
        );
      }
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function revoke() {
    if (!revoking || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await api(`/api/v1/account/api-tokens/${revoking.id}`, {
        method: "DELETE",
      });
      setSecret(null);
      setRevoking(null);
      await refreshList();
      setSuccess(
        "Đã thu hồi token. Những yêu cầu mới bằng token này sẽ bị từ chối.",
      );
    } catch (caught) {
      setError(caught);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function copy() {
    try {
      if (secret) {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
      }
    } catch {
      setError(new Error("Clipboard unavailable"));
    }
  }
  return (
    <div className="token-settings">
      <p>
        API token dành cho script hoặc Postman. Đăng xuất trình duyệt không thu
        hồi các token này; hãy thu hồi riêng tại đây.
      </p>
      <Feedback error={error} success={success} />
      {Boolean(error) && success && <p role="status">{success}</p>}
      <form className="identity-card identity-form" onSubmit={confirm}>
        <h2>Xác nhận mật khẩu</h2>
        <Field
          label="Mật khẩu hiện tại"
          name="confirm_password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="secondary-button" disabled={busy}>
          Xác nhận mật khẩu
        </button>
      </form>
      <form className="identity-card identity-form" onSubmit={create}>
        <h2>Tạo API token</h2>
        <Field
          label="Tên token"
          name="token_name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
          error={fields.name}
        />
        <fieldset>
          <legend>Quyền truy cập</legend>
          {abilities.map((ability) => (
            <label className="scope-option" key={ability}>
              <input
                type="checkbox"
                checked={scopes.includes(ability)}
                onChange={(event) =>
                  setScopes(
                    event.target.checked
                      ? [...scopes, ability]
                      : scopes.filter((scope) => scope !== ability),
                  )
                }
              />
              {ability}
            </label>
          ))}
          {fields.abilities && (
            <small className="field-error">{fields.abilities.join(" ")}</small>
          )}
        </fieldset>
        <label className="identity-field">
          Thời hạn
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {[1, 7, 30].map((day) => (
              <option key={day} value={day}>
                {day} ngày
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" disabled={busy || !scopes.length}>
          {busy ? "Đang xử lý…" : "Tạo token"}
        </button>
      </form>
      {secret && (
        <section
          className="identity-card one-time-secret"
          aria-label="Token hiển thị một lần"
        >
          <h2>Sao chép token ngay</h2>
          <p>
            Token chỉ xuất hiện một lần và sẽ được xóa khỏi màn hình khi bạn rời
            trang.
          </p>
          <code>{secret}</code>
          <div className="form-actions">
            <button className="primary-button" onClick={copy}>
              {copied ? "Đã sao chép" : "Sao chép token"}
            </button>
            <button
              className="secondary-button"
              onClick={() => setSecret(null)}
            >
              Đã lưu, ẩn token
            </button>
          </div>
        </section>
      )}
      <section className="identity-card">
        <div className="section-heading">
          <h2>Token của bạn</h2>
          <button
            className="text-button"
            onClick={() => {
              void refreshList();
            }}
          >
            Làm mới danh sách
          </button>
        </div>
        {query.isPending ? (
          <p role="status">Đang tải token…</p>
        ) : query.isError ? (
          <Feedback error={query.error} />
        ) : !query.data?.data.length ? (
          <p>Chưa có API token nào.</p>
        ) : (
          <>
            <div className="token-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên / Quyền</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((token) => (
                    <tr key={token.id}>
                      <td>
                        <strong>{token.name}</strong>
                        <small>{token.abilities.join(", ")}</small>
                      </td>
                      <td>
                        <small>
                          Tạo:{" "}
                          {new Date(token.created_at).toLocaleString("vi-VN")}
                        </small>
                        <small>
                          Dùng gần nhất:{" "}
                          {token.last_used_at
                            ? new Date(token.last_used_at).toLocaleString(
                                "vi-VN",
                              )
                            : "Chưa dùng"}
                        </small>
                        <small>
                          Hết hạn:{" "}
                          {new Date(token.expires_at).toLocaleString("vi-VN")}
                        </small>
                      </td>
                      <td>
                        {token.status === "active"
                          ? "Đang hoạt động"
                          : "Đã hết hạn"}
                      </td>
                      <td>
                        <button
                          className="danger-button"
                          disabled={busy}
                          onClick={() => setRevoking(token)}
                        >
                          Thu hồi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {query.data.meta.last_page}
              </span>
              <button
                className="secondary-button"
                disabled={page >= query.data.meta.last_page}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </section>
      {revoking && (
        <div className="dialog-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="identity-card"
          >
            <h2 id="revoke-title">Thu hồi “{revoking.name}”?</h2>
            <p>
              Những yêu cầu mới sử dụng token này sẽ không còn được chấp nhận.
            </p>
            <div className="form-actions">
              <button
                autoFocus
                className="secondary-button"
                disabled={busy}
                onClick={() => setRevoking(null)}
              >
                Hủy
              </button>
              <button
                className="danger-button"
                disabled={busy}
                onClick={revoke}
              >
                Xác nhận thu hồi
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
