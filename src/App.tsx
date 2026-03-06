import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ScrollToTopProvider } from "@/components/ScrollToTopProvider";
import { lazy, Suspense, useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { AppLayout } from "@/layouts/AppLayout";
import AuthPage from "./pages/AuthPage";
import { HelpAssistantPanel } from "@/components/HelpAssistantPanel";
import { PipelineDiagnosticsPanel } from "@/components/PipelineDiagnosticsPanel";

// ── Lazy-loaded route pages ──
const StartPage = lazy(() => import("./pages/StartPage"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const NewAnalysisPage = lazy(() => import("./pages/NewAnalysisPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const DisruptPage = lazy(() => import("./pages/DisruptPage"));
const RedesignPage = lazy(() => import("./pages/RedesignPage"));
const StressTestPage = lazy(() => import("./pages/StressTestPage"));
const PitchPage = lazy(() => import("./pages/PitchPage"));
const InsightGraphPage = lazy(() => import("./pages/InsightGraphPage"));
const BusinessResultsPage = lazy(() => import("./pages/BusinessResultsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const FaqsPage = lazy(() => import("./pages/FaqsPage"));
const ApiPage = lazy(() => import("./pages/ApiPage"));
const ShareableAnalysisPage = lazy(() => import("./pages/ShareableAnalysisPage"));
const InstantAnalysisPage = lazy(() => import("./pages/InstantAnalysisPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"));
const AdminHealthPage = lazy(() => import("./pages/AdminHealthPage"));
const GovernanceAuditPage = lazy(() => import("./pages/GovernanceAuditPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const PipelinePage = lazy(() => import("./pages/PipelinePage"));
const PipelineObservabilityPage = lazy(() => import("./pages/PipelineObservabilityPage"));
const AdminArchitecturePage = lazy(() => import("./pages/AdminArchitecturePage"));
const CommandDeckPage = lazy(() => import("./pages/CommandDeckPage"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background" />
);

// ── ErrorBoundary to prevent white screens from render crashes ──
class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary] Caught render error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md px-6 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-destructive/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.error?.message || "An unexpected error occurred."}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-muted text-foreground border border-border"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

/** Redirect /analysis/:id → /analysis/:id/command-deck */
function CommandDeckRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/workspace" replace />;
  return <Navigate to={`/analysis/${id}/command-deck`} replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  useEffect(() => {
    import("@/lib/analyticsTracker").then(({ initAnalyticsTracker }) => initAnalyticsTracker());
  }, []);

  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("[App] Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/admin/analytics" element={<LazyRoute><AdminAnalyticsPage /></LazyRoute>} />
        <Route path="/admin/health" element={<LazyRoute><AdminHealthPage /></LazyRoute>} />
        <Route path="/demo" element={<LazyRoute><DemoPage /></LazyRoute>} />
        <Route path="/instant-analysis" element={<LazyRoute><InstantAnalysisPage /></LazyRoute>} />
        <Route path="/share" element={<LazyRoute><SharePage /></LazyRoute>} />
        <Route path="/analysis/share/:id" element={<LazyRoute><ShareableAnalysisPage /></LazyRoute>} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        {/* Workspace / Analysis routes (sidebar visible) */}
        <Route path="/workspace" element={<LazyRoute><WorkspacePage /></LazyRoute>} />
        <Route path="/analysis/new" element={<LazyRoute><NewAnalysisPage /></LazyRoute>} />
        <Route path="/intelligence" element={<LazyRoute><IntelligencePage /></LazyRoute>} />
        <Route path="/portfolio" element={<Navigate to="/workspace" replace />} />
        <Route path="/intel" element={<Navigate to="/intelligence" replace />} />
        {/* Default analysis landing → Command Deck */}
        <Route path="/analysis/:id" element={<LazyRoute><CommandDeckRedirect /></LazyRoute>} />
        <Route path="/analysis/:id/command-deck" element={<LazyRoute><CommandDeckPage /></LazyRoute>} />
        <Route path="/analysis/:id/report" element={<LazyRoute><ReportPage /></LazyRoute>} />
        <Route path="/analysis/:id/disrupt" element={<LazyRoute><DisruptPage /></LazyRoute>} />
        <Route path="/analysis/:id/redesign" element={<LazyRoute><RedesignPage /></LazyRoute>} />
        <Route path="/analysis/:id/stress-test" element={<LazyRoute><StressTestPage /></LazyRoute>} />
        <Route path="/analysis/:id/pitch" element={<LazyRoute><PitchPage /></LazyRoute>} />
        <Route path="/analysis/:id/insight-graph" element={<LazyRoute><InsightGraphPage /></LazyRoute>} />
        <Route path="/business/:id" element={<LazyRoute><BusinessResultsPage /></LazyRoute>} />

        {/* Full-width routes (no sidebar) */}
        <Route path="/admin/analytics" element={<LazyRoute><AdminAnalyticsPage /></LazyRoute>} />
        <Route path="/admin/health" element={<LazyRoute><AdminHealthPage /></LazyRoute>} />
        <Route path="/admin/governance" element={<LazyRoute><GovernanceAuditPage /></LazyRoute>} />
        <Route path="/admin/architecture" element={<LazyRoute><AdminArchitecturePage /></LazyRoute>} />
        <Route path="/admin/pipeline" element={<LazyRoute><PipelineObservabilityPage /></LazyRoute>} />
        <Route path="/demo" element={<LazyRoute><DemoPage /></LazyRoute>} />
        <Route path="/instant-analysis" element={<LazyRoute><InstantAnalysisPage /></LazyRoute>} />
        <Route path="/share" element={<LazyRoute><SharePage /></LazyRoute>} />
        <Route path="/analysis/share/:id" element={<LazyRoute><ShareableAnalysisPage /></LazyRoute>} />
        <Route path="/" element={<LazyRoute><StartPage /></LazyRoute>} />
        <Route path="/pricing" element={<LazyRoute><PricingPage /></LazyRoute>} />
        <Route path="/about" element={<LazyRoute><AboutPage /></LazyRoute>} />
        <Route path="/resources" element={<LazyRoute><ResourcesPage /></LazyRoute>} />
        <Route path="/methodology" element={<LazyRoute><MethodologyPage /></LazyRoute>} />
        <Route path="/faqs" element={<LazyRoute><FaqsPage /></LazyRoute>} />
        <Route path="/api" element={<LazyRoute><ApiPage /></LazyRoute>} />
        <Route path="/pipeline" element={<LazyRoute><PipelinePage /></LazyRoute>} />
        <Route path="/start/product" element={<Navigate to="/analysis/new" replace />} />
        <Route path="/start/service" element={<Navigate to="/analysis/new" replace />} />
        <Route path="/start/business" element={<Navigate to="/analysis/new" replace />} />
        <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTopProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AnalysisProvider>
                <AppRoutes />
                <HelpAssistantPanel />
              </AnalysisProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ScrollToTopProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
