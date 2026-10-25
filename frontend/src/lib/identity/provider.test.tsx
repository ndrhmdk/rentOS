import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { IdentityProvider, privateKey, useIdentity } from "./provider";
import { api } from "./api";
import { Profile } from "@/components/identity/profile";
import { RecoveryNotice } from "@/components/identity/ui";

const accountA = {
  id: "a",
  name: "Account A",
  email: "a@example.com",
  phone: null,
  is_admin: false,
  email_verified: true,
};
const accountB = {
  ...accountA,
  id: "b",
  name: "Account B",
  email: "b@example.com",
};
afterEach(() => vi.unstubAllGlobals());
function AccountProbe() {
  const { account, refresh } = useIdentity();
  const privateData = useQuery({
    queryKey: privateKey(account?.id ?? "guest", "notes"),
    enabled: !!account,
    queryFn: async ({ signal }) =>
      api<{ note: string }>(`/api/v1/testing/notes/${account?.id}`, { signal }),
  });
  return (
    <>
      <p>{account?.name ?? "Guest"}</p>
      <p>{privateData.data?.note}</p>
      <button
        onClick={() => {
          void refresh();
        }}
      >
        Switch account
      </button>
    </>
  );
}
it("cancels account A private queries so a late response cannot render under account B", async () => {
  let current = accountA;
  let releaseA: ((response: Response) => void) | undefined;
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/me")) return Response.json({ data: current });
    if (url.endsWith("/notes/a"))
      return new Promise<Response>((resolve) => {
        releaseA = resolve;
      });
    return Response.json({ note: "B private note" });
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <IdentityProvider>
      <AccountProbe />
    </IdentityProvider>,
  );
  expect(await screen.findByText("Account A")).toBeVisible();
  await waitFor(() => expect(releaseA).toBeDefined());
  current = accountB;
  await userEvent.click(screen.getByRole("button", { name: "Switch account" }));
  expect(await screen.findByText("Account B")).toBeVisible();
  expect(await screen.findByText("B private note")).toBeVisible();
  await act(async () => {
    releaseA?.(Response.json({ note: "A private note" }));
  });
  expect(screen.queryByText("A private note")).not.toBeInTheDocument();
});
it("retains only a safe profile draft through 401 recovery and never replays its write", async () => {
  const fetch = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith("csrf-cookie")) return new Response(null, { status: 204 });
    if (options?.method === "PATCH")
      return Response.json({ message: "Expired" }, { status: 401 });
    return Response.json({ data: accountA });
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <IdentityProvider>
      <RecoveryNotice />
      <Profile />
    </IdentityProvider>,
  );
  const input = await screen.findByLabelText("Họ và tên");
  await userEvent.clear(input);
  await userEvent.type(input, "Safe unsent draft");
  await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
  expect(await screen.findByText("Vui lòng đăng nhập")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Khôi phục phiên" }),
  );
  expect(await screen.findByLabelText("Họ và tên")).toHaveValue(
    "Safe unsent draft",
  );
  expect(
    fetch.mock.calls.filter(([, options]) => options?.method === "PATCH"),
  ).toHaveLength(1);
});
