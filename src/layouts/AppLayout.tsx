/**
 * AppLayout — Unified layout with persistent sidebar for all authenticated routes.
 * Public pages (/, /about, /pricing, /methodology, /faqs, /releases, /api) render
 * WITHOUT sidebar. Analysis & workspace routes render WITH sidebar.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandNavigation } from "@/components/layout/CommandNavigation";
import { GuidedTour, useGuidedTour } from "@/components/GuidedTour";
import { Zap, Home } from "lucide-react";

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
  const navigate = useNavigate();
  const showSidebar = useMemo(() => shouldShowSidebar(pathname), [pathname]);
  const tour = useGuidedTour();

  // DEBUG: Log sidebar decision
  console.log("[AppLayout] pathname:", pathname, "showSidebar:", showSidebar);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <CommandNavigation onOpenTour={tour.open} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact global header — always shows sidebar trigger + branding */}
          <header className="h-10 flex items-center border-b border-border/60 bg-background px-2 gap-2 flex-shrink-0 z-10">
            <SidebarTrigger className="h-7 w-7 flex-shrink-0" />
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-bold hidden sm:inline">Market Disruptor</span>
            </button>
            <span className="text-border hidden sm:inline">|</span>
            <button
              onClick={() => navigate("/workspace")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
            >
              <Home size={12} />
              <span className="text-[11px]">Workspace</span>
            </button>
          </header>
          {children}
        </div>
      </div>
      <GuidedTour isOpen={tour.isOpen} onClose={tour.close} />
    </SidebarProvider>
  );
}
