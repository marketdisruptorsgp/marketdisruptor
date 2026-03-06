/**
 * SHARED ANALYSIS PAGE LAYOUT SYSTEM
 * 
 * Unified design system components used across Product, Service, and Business modes.
 * All styling lives here — mode pages only supply logic, data, and content.
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
import { HeroSection } from "@/components/HeroSection";
import { ModeBadge } from "@/components/ModeBadge";
import { StepNavigator, type StepConfig } from "@/components/StepNavigator";
import { StepNavBar } from "@/components/SectionNav";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { FileDown, Save, RefreshCw, GitBranch, MoreHorizontal, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import type { TierKey } from "@/hooks/useSubscription";
import { scrollToTop } from "@/utils/scrollToTop";
import type { StrategicProfile } from "@/lib/strategicOS";
import { useIsMobile } from "@/hooks/use-mobile";

/* ═══════════════════════════════════════════════════════════
   1. PAGE SHELL — outermost wrapper for every analysis page
   ═══════════════════════════════════════════════════════════ */

interface AnalysisPageShellProps {
  tier: TierKey;
  children: React.ReactNode;
}

export function AnalysisPageShell({ tier, children }: AnalysisPageShellProps) {
  const { theme, toggle } = useWorkspaceTheme();
  const isDark = theme === "dark";
  return (
    <div className="min-h-screen bg-background" {...(isDark ? { "data-command-deck": "" } : {})}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. STEP HEADER — ModeBadge + StepNavigator + StepNavBar
   ═══════════════════════════════════════════════════════════ */

interface AnalysisStepHeaderProps {
  steps: StepConfig[];
  activeStep: number;
  visitedSteps: Set<number>;
  onStepChange: (step: number) => void;
  outdatedSteps?: Set<string>;
  accentColor: string;
  backLabel: string;
  backPath: string;
  /** Optional outdated banner */
  outdatedStepName?: string;
  /** Analysis ID for Command Deck / Graph navigation */
  analysisId?: string | null;
}

export function AnalysisStepHeader({
  steps, activeStep, visitedSteps, onStepChange,
  outdatedSteps, accentColor, backLabel, backPath, outdatedStepName,
  analysisId,
}: AnalysisStepHeaderProps) {
  const navigate = useNavigate();
  const { theme: workspaceTheme, toggle: toggleTheme } = useWorkspaceTheme();
  const baseUrl = analysisId ? `/analysis/${analysisId}` : "";

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ModeBadge />
        <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
      </div>
      <StepNavigator
        steps={steps}
        activeStep={activeStep}
        visitedSteps={visitedSteps}
        onStepChange={(s) => { scrollToTop(); onStepChange(s); }}
        outdatedSteps={outdatedSteps}
        accentColor={accentColor}
      />

      {/* Workspace Navigation: Home + Command Deck + Graph */}
      <div className="flex items-center gap-2 flex-wrap">
        <StepNavBar backLabel={backLabel} backPath={backPath} accentColor={accentColor} />
        {analysisId && (
          <>
            <button
              onClick={() => navigate(`${baseUrl}/command-deck`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:opacity-80 min-h-[44px]"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <LayoutDashboard size={14} /> Command Deck
            </button>
            <button
              onClick={() => navigate(`${baseUrl}/insight-graph`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:opacity-80 min-h-[44px]"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <GitBranch size={14} /> Insight Graph
            </button>
          </>
        )}
      </div>

      {outdatedStepName && <OutdatedBanner stepName={outdatedStepName} accentColor={accentColor} />}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. ACTION TOOLBAR — title (h2) + Run/PDF/Save/Share row
   ═══════════════════════════════════════════════════════════ */

interface AnalysisActionToolbarProps {
  /** The analysis title shown as h1 above the toolbar */
  analysisTitle: string;
  /** The step title shown as h2 */
  stepTitle: string;
  /** Analysis context for PDF/save/share */
  analysis: any;
  selectedProduct: any;
  analysisId: string | null;
  accentColor: string;
  /** Run button state */
  isLoading?: boolean;
  hasData?: boolean;
  onRun?: () => void;
  /** Strategic profile */
  strategicProfile?: StrategicProfile;
  onChangeProfile?: (p: StrategicProfile) => void;
  /** Additional actions rendered between title and buttons */
  extraActions?: React.ReactNode;
  /** Custom PDF handler override */
  onPdf?: () => void;
  /** Hide run button entirely */
  hideRun?: boolean;
  /** Hide share button */
  hideShare?: boolean;
}

export function AnalysisActionToolbar({
  analysisTitle, stepTitle, analysis, selectedProduct, analysisId, accentColor,
  isLoading, hasData, onRun, strategicProfile, onChangeProfile,
  extraActions, onPdf, hideRun, hideShare,
}: AnalysisActionToolbarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handlePdf = () => {
    if (onPdf) { onPdf(); return; }
    if (!selectedProduct) return;
    const data = gatherAllAnalysisData(analysis);
    downloadReportAsPDF(selectedProduct, data, {
      title: selectedProduct.name || analysisTitle,
      mode: (analysis.analysisParams as any)?.analysisType,
      onProgress: (msg: string) => toast.loading(msg, { id: "pdf-progress" }),
    }).then(() => { toast.dismiss("pdf-progress"); toast.success("PDF downloaded!"); })
      .catch(() => { toast.dismiss("pdf-progress"); toast.error("Failed to download PDF"); });
  };

  /* Secondary actions (Graph, PDF, Save, Share) — collapsed on mobile */
  const secondaryActions = (
    <>
      {analysisId && (
        <button
          onClick={() => { setMenuOpen(false); navigate(`/analysis/${analysisId}/insight-graph`); }}
          className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold bg-background border border-border text-foreground hover:bg-muted transition-colors w-full sm:w-auto"
          title="Insight Graph"
        >
          <GitBranch size={14} /> Graph
        </button>
      )}
      {extraActions}
      <button
        onClick={() => { setMenuOpen(false); handlePdf(); }}
        className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold bg-background border border-border text-foreground hover:bg-muted transition-colors w-full sm:w-auto"
      >
        <FileDown size={14} /> PDF
      </button>
      <button
        onClick={() => { setMenuOpen(false); analysis.handleManualSave(); }}
        className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors w-full sm:w-auto"
      >
        <Save size={14} /> Save
      </button>
      {!hideShare && (
        <ShareAnalysis
          analysisId={analysisId || ""}
          analysisTitle={analysisTitle}
          accentColor={accentColor}
        />
      )}
    </>
  );

  return (
    <>
      {/* Persistent analysis title */}
      <h1 className="typo-h1 px-1">
        {analysisTitle}
      </h1>

      {/* Compact header: step title + action buttons */}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="typo-h2 flex-1 min-w-0 truncate">{stepTitle}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {strategicProfile && onChangeProfile && (
            <StrategicProfileSelector
              profile={strategicProfile}
              onChangeProfile={onChangeProfile}
            />
          )}
          {!hideRun && onRun && (
            <button
              onClick={onRun}
              disabled={isLoading}
              className="flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: isLoading ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span className="hidden sm:inline">{hasData ? "Re-run" : "Run"}</span>
            </button>
          )}

          {/* Desktop: show all buttons inline */}
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-2">
              {secondaryActions}
            </div>
          )}

          {/* Mobile: overflow menu */}
          {isMobile && (
            <div className="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-muted border border-border text-foreground hover:bg-accent transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl bg-card border border-border shadow-lg p-1.5 flex flex-col gap-1 animate-in fade-in-0 zoom-in-95"
                >
                  {secondaryActions}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. TAB BAR — pill-style tab buttons (consistent across modes)
   ═══════════════════════════════════════════════════════════ */

export interface TabDef<T extends string = string> {
  id: T;
  label: string;
  icon: React.ElementType;
  /** Override accent color per tab (e.g. red for Red Team) */
  color?: string;
}

interface AnalysisTabBarProps<T extends string> {
  tabs: TabDef<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  accentColor: string;
  /** Hide tabs that shouldn't show yet */
  hiddenTabs?: T[];
  /** Disable tabs that aren't ready */
  disabledTabs?: T[];
}

export function AnalysisTabBar<T extends string>({
  tabs, activeTab, onTabChange, accentColor, hiddenTabs, disabledTabs,
}: AnalysisTabBarProps<T>) {
  return (
    <div className="relative">
      {/* Left/right fade indicators for mobile scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 sm:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1 scrollbar-hide border-b border-border">
        {tabs.map((tab) => {
          if (hiddenTabs?.includes(tab.id)) return null;
          const isActive = activeTab === tab.id;
          const isDisabled = disabledTabs?.includes(tab.id);
          const TabIcon = tab.icon;
          const tabColor = tab.color || accentColor;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 relative"
              style={{
                background: "transparent",
                color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                borderBottom: isActive ? `2px solid ${tabColor}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              <TabIcon size={14} style={{ color: isActive ? tabColor : undefined }} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. DIVIDER — consistent horizontal rule
   ═══════════════════════════════════════════════════════════ */

export function AnalysisDivider() {
  return <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />;
}

/* ═══════════════════════════════════════════════════════════
   6. CONTEXT BANNER — dark info banner with icon + title + desc
   ═══════════════════════════════════════════════════════════ */

interface AnalysisContextBannerProps {
  icon: React.ElementType;
  title: string;
  description: string;
  /** Accent color for the icon container */
  iconColor?: string;
}

export function AnalysisContextBanner({ icon: Icon, title, description, iconColor }: AnalysisContextBannerProps) {
  return (
    <div className="rounded-xl p-5 flex items-start gap-4 bg-card border border-border">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor || "hsl(var(--primary))"}25` }}
      >
        <Icon size={18} style={{ color: iconColor || "hsl(var(--primary))" }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="typo-h3">{title}</h3>
        <p className="typo-body text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. CONTENT CARD — rounded card container for step content
   ═══════════════════════════════════════════════════════════ */

interface AnalysisContentCardProps {
  children: React.ReactNode;
  hidden?: boolean;
  className?: string;
}

export function AnalysisContentCard({ children, hidden, className }: AnalysisContentCardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden p-4 sm:p-6 ${className || ""}`}
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
        display: hidden ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. LOADING CARD — loading tracker wrapper (consistent sizing)
   ═══════════════════════════════════════════════════════════ */

interface AnalysisLoadingCardProps {
  children: React.ReactNode;
}

export function AnalysisLoadingCard({ children }: AnalysisLoadingCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden p-4 sm:p-6"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. SECTION CARD — content block with icon + title header
   ═══════════════════════════════════════════════════════════ */

interface AnalysisSectionCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function AnalysisSectionCard({ icon: Icon, title, children, action }: AnalysisSectionCardProps) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h3 className="typo-card-title">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   10. LOADING SPINNER — shared loading state
   ═══════════════════════════════════════════════════════════ */

export function AnalysisLoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-command-deck>
      <div className="flex flex-col items-center gap-4">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
