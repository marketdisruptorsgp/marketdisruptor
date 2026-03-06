/**
 * AppLayout — Centralized layout that conditionally renders the workspace sidebar.
 * Sidebar only appears on workspace/analysis routes, never on public pages.
 */

import { useLocation } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandNavigation } from "@/components/layout/CommandNavigation";

const WORKSPACE_PREFIXES = [
  "/analysis/",    // /analysis/:id/* but NOT /analysis/new
  "/command-deck",
  "/insight-graph",
  "/evidence-explorer",
  "/intelligence",
  "/business/",
];

const EXCLUDED_WORKSPACE = [
  "/analysis/new",
  "/analysis/share",
];

function isWorkspaceRoute(pathname: string): boolean {
  return WORKSPACE_PREFIXES.some((p) => pathname.startsWith(p));
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const showSidebar = useMemo(() => isWorkspaceRoute(pathname), [pathname]);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CommandNavigation />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 flex items-center border-b border-border bg-background lg:hidden">
            <SidebarTrigger className="ml-2" />
          </header>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
