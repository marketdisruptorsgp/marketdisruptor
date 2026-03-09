/**
 * COMMAND NAVIGATION — Unified Sidebar
 *
 * Renders inside all authenticated routes (controlled by AppLayout).
 * Top: Logo + project list. Middle: Analysis journey (contextual).
 * Bottom: Resources/settings.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard, GitBranch, Search,
  Lightbulb,
  Shield, Brain,
  FolderOpen, PlusCircle, Zap,
  Info, HelpCircle, Sparkles, BarChart3, Map,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

/* ── Analysis ID extraction ── */
function useAnalysisId(): string | null {
  const location = useLocation();
  const match = location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
  return match?.[1] || null;
}

/* ── Nav config ── */
interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string | ((id: string | null) => string);
  requiresAnalysis?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const JOURNEY_SECTION: NavSection = {
  label: "Analysis Journey",
  items: [
    { label: "Command Deck", icon: LayoutDashboard, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace", requiresAnalysis: true },
    { label: "Insight Graph", icon: GitBranch, path: (id) => id ? `/analysis/${id}/insight-graph` : "/workspace", requiresAnalysis: true },
    { label: "1 · Understand", icon: Search, path: (id) => id ? `/analysis/${id}/report` : "/analysis/new", requiresAnalysis: true },
    { label: "2 · Disrupt", icon: Brain, path: (id) => id ? `/analysis/${id}/disrupt` : "/analysis/new", requiresAnalysis: true },
    { label: "3 · Reimagine", icon: Lightbulb, path: (id) => id ? `/analysis/${id}/redesign` : "/analysis/new", requiresAnalysis: true },
    { label: "4 · Stress Test", icon: Shield, path: (id) => id ? `/analysis/${id}/stress-test` : "/analysis/new", requiresAnalysis: true },
    { label: "5 · Pitch", icon: Sparkles, path: (id) => id ? `/analysis/${id}/pitch` : "/analysis/new", requiresAnalysis: true },
  ],
};

const SYSTEM_ITEMS: NavItem[] = [
  { label: "My Workspace", icon: FolderOpen, path: "/workspace" },
  { label: "New Analysis", icon: PlusCircle, path: "/analysis/new" },
];

const RESOURCE_ITEMS: NavItem[] = [
  { label: "About", icon: Info, path: "/about" },
  { label: "Methodology", icon: BarChart3, path: "/methodology" },
  { label: "FAQs", icon: HelpCircle, path: "/faqs" },
];

export function CommandNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const analysisId = useAnalysisId();
  const currentPath = location.pathname;

  const resolvePath = (item: NavItem): string => {
    if (typeof item.path === "string") return item.path;
    return item.path(analysisId);
  };

  const isActive = (item: NavItem): boolean => {
    const resolved = resolvePath(item);
    return currentPath === resolved || currentPath.startsWith(resolved + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="pt-2 bg-sidebar">
        {/* Logo */}
        <div className="px-3 py-2 mb-1">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 w-full"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
              <Zap size={18} />
            </div>
            {!collapsed && (
              <span className="text-sm font-extrabold tracking-tight text-sidebar-foreground">
                Market Disruptor
              </span>
            )}
          </button>
        </div>

        {/* ── Projects ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SYSTEM_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const path = resolvePath(item);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={path}
                        end
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <Icon size={16} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60"} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Analysis Journey (only when inside an analysis) ── */}
        {analysisId && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
              {JOURNEY_SECTION.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {JOURNEY_SECTION.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  const path = resolvePath(item);
                  const disabled = item.requiresAnalysis && !analysisId;

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={disabled ? "#" : path}
                          end
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                            disabled
                              ? "opacity-40 cursor-not-allowed"
                              : active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`}
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          onClick={(e) => {
                            if (disabled) e.preventDefault();
                          }}
                        >
                          <Icon size={16} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60"} />
                          {!collapsed && <span>{item.label}</span>}
                          {active && !collapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary flex-shrink-0" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Resources ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {RESOURCE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const path = resolvePath(item);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={path}
                        end
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <Icon size={16} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60"} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border bg-sidebar">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest">
            <Zap size={10} />
            Strategic Discovery OS
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
