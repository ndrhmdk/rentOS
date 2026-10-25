import type { ReactNode } from "react";
import { AccountShell } from "@/components/identity/shell";
import "@/components/identity/identity.css";
export const metadata = {
  title: "Tài khoản · rentOS",
  description: "Tài khoản, quyền truy cập và bảo mật rentOS",
};
export default function Layout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
