"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface NavigationItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  adminOnly?: boolean;
  badge?: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: "Cổng Cư Dân",
    href: "/tenant",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: "Cổng Chủ Nhà",
    href: "/owner",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    ),
  },
  {
    name: "Hồ sơ cá nhân",
    href: "/profile",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    name: "Cổng Quản Trị",
    href: "/admin",
    adminOnly: true,
    badge: "Admin",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAVIGATION_ITEMS.filter((item) => {
    if (item.adminOnly && !user?.is_admin) {
      return false;
    }
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none text-on-dark-muted">
      <div>
        <div className="px-3 pt-2 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            TRANG CỦA BẠN
          </span>
        </div>
        <nav className="space-y-1.5" aria-label="Điều hướng các Cổng">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm transition-all min-h-[44px] ${
                  isActive
                    ? "bg-navy-800 text-on-dark font-semibold shadow-sm"
                    : "text-on-dark-muted hover:text-action-secondary hover:bg-white/5 font-medium"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-on-dark" : "text-on-dark-muted"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      isActive
                        ? "text-on-dark font-semibold"
                        : "text-on-dark-muted font-medium"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-xs bg-navy-900 text-on-dark shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="pt-4 border-t border-white/10 mt-6">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-navy-800 text-on-dark flex items-center justify-center text-xs font-bold border border-white/20 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-on-dark truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-muted truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden w-full bg-surface-sidebar border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-on-dark">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors"
          aria-expanded={mobileOpen}
          aria-label="Mở menu chuyển Cổng"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Danh mục Cổng</span>
        </button>
        <span className="text-xs text-on-dark-muted font-medium">
          {visibleItems.find((i) => i.href === pathname)?.name || "rentOS Portal"}
        </span>
      </div>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-surface-sidebar text-on-dark-muted shadow-2xl z-50 flex flex-col pt-16">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 text-on-dark-muted hover:text-white rounded-md hover:bg-white/10"
                aria-label="Đóng menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 bg-surface-sidebar text-on-dark-muted border-r border-white/10 min-h-[calc(100vh-94px)] sticky top-[94px] self-start">
        {sidebarContent}
      </aside>
    </>
  );
}
