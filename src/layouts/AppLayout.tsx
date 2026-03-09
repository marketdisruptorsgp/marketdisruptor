/**
 * AppLayout — Unified layout with persistent sidebar for all authenticated routes.
 * Public pages (/, /about, /pricing, /methodology, /faqs, /releases, /api) render
 * WITHOUT sidebar. Analysis & workspace routes render WITH sidebar.
 */

import { useLocation } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandNavigation } from "@/components/layout/CommandNavigation";

/** Routes that should NOT show the sidebar (public/marketing pages) */
const NO_SIDEBAR_ROUTES = [
  "/",
  "/pricing",
  "/about",
  "/methodology",
  "/faqs",
  "/releases",
  "/api",
  "/resources",
  "/pipeline",
  "/demo",
  "/instant-analysis",
  "/share",
  "/analysis/share",
  "/admin/",
];

function shouldShowSidebar(pathname: string): boolean {
  // Exact matches
  if (NO_SIDEBAR_ROUTES.includes(pathname)) return false;
  // Prefix matches
  if (NO_SIDEBAR_ROUTES.some(r => r.endsWith("/") && pathname.startsWith(r))) return false;
  // /analysis/share/:id should not show sidebar
  if (pathname.startsWith("/analysis/share")) return false;
  return true;
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const showSidebar = useMemo(() => shouldShowSidebar(pathname), [pathname]);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CommandNavigation />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 flex items-center border-b border-border bg-background">
            <SidebarTrigger className="ml-2" />
          </header>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
