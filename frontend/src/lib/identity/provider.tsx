"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, api, initializeCsrf, onSessionFailure } from "./api";
import type { Account } from "./types";

type Identity = {
  account: Account | null;
  loading: boolean;
  recoveryStatus: number | null;
  refresh: () => Promise<void>;
  clearPrivate: () => Promise<void>;
  logout: () => Promise<void>;
};
const IdentityContext = createContext<Identity | null>(null);
export const privateKey = (userId: string, ...parts: unknown[]) => [
  "private",
  userId,
  ...parts,
];

function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [recoveryStatus, setRecoveryStatus] = useState<number | null>(null);
  const previousUser = useRef<string | null>(null);
  const session = useQuery({
    queryKey: ["identity", "me"],
    queryFn: async ({ signal }): Promise<Account | null> => {
      try {
        const user = (
          await api<{ data: Account }>("/api/v1/me", { signal, recover: false })
        ).data;
        if (previousUser.current !== user.id) {
          await client.cancelQueries({ queryKey: ["private"] });
          client.removeQueries({ queryKey: ["private"] });
          window.dispatchEvent(new Event("identity:clear-secret"));
        }
        previousUser.current = user.id;
        return user;
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          await client.cancelQueries({ queryKey: ["private"] });
          client.removeQueries({ queryKey: ["private"] });
          previousUser.current = null;
          window.dispatchEvent(new Event("identity:clear-secret"));
          return null;
        }
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });
  const clearPrivate = useCallback(async () => {
    await client.cancelQueries({ queryKey: ["private"] });
    client.removeQueries({ queryKey: ["private"] });
  }, [client]);
  useEffect(
    () =>
      onSessionFailure((status) => {
        setRecoveryStatus(status);
        void clearPrivate();
        if (status === 401) {
          void client.cancelQueries({ queryKey: ["identity", "me"] });
          client.setQueryData(["identity", "me"], null);
        }
        window.dispatchEvent(new Event("identity:clear-secret"));
      }),
    [client, clearPrivate],
  );
  const refresh = useCallback(async () => {
    await clearPrivate();
    await client.invalidateQueries({ queryKey: ["identity", "me"] });
    setRecoveryStatus(null);
  }, [client, clearPrivate]);
  useEffect(() => {
    function passwordChanged() {
      void clearPrivate();
      client.setQueryData(["identity", "me"], null);
      window.dispatchEvent(new Event("identity:clear-secret"));
    }
    window.addEventListener("identity:password-changed", passwordChanged);
    return () =>
      window.removeEventListener("identity:password-changed", passwordChanged);
  }, [client, clearPrivate]);
  const logout = useCallback(async () => {
    await api("/logout", { method: "POST" });
    await clearPrivate();
    await client.cancelQueries({ queryKey: ["identity", "me"] });
    client.setQueryData(["identity", "me"], null);
    window.dispatchEvent(new Event("identity:clear-secret"));
  }, [client, clearPrivate]);
  return (
    <IdentityContext
      value={{
        account: session.data ?? null,
        loading: session.isPending,
        recoveryStatus:
          recoveryStatus ??
          (session.error instanceof ApiError ? session.error.status : null),
        refresh,
        clearPrivate,
        logout,
      }}
    >
      {children}
    </IdentityContext>
  );
}
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false, gcTime: 0 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
export function useIdentity() {
  const identity = useContext(IdentityContext);
  if (!identity) throw new Error("IdentityProvider is required");
  return identity;
}
export async function recoverCsrf() {
  await initializeCsrf();
}
