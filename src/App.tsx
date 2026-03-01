import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ScrollToTopProvider } from "@/components/ScrollToTopProvider";
import { lazy, Suspense, useEffect } from "react";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import DisruptPage from "./pages/DisruptPage";
import RedesignPage from "./pages/RedesignPage";
import StressTestPage from "./pages/StressTestPage";
import PitchPage from "./pages/PitchPage";
import BusinessResultsPage from "./pages/BusinessResultsPage";
import AuthPage from "./pages/AuthPage";
import PricingPage from "./pages/PricingPage";
import SharePage from "./pages/SharePage";
import AboutPage from "./pages/AboutPage";
import ResourcesPage from "./pages/ResourcesPage";
import MethodologyPage from "./pages/MethodologyPage";
import FaqsPage from "./pages/FaqsPage";
import ApiPage from "./pages/ApiPage";
import ShareableAnalysisPage from "./pages/ShareableAnalysisPage";
import StartProductPage from "./pages/StartProductPage";
import StartServicePage from "./pages/StartServicePage";
import StartBusinessPage from "./pages/StartBusinessPage";
import NotFound from "./pages/NotFound";
import InstantAnalysisPage from "./pages/InstantAnalysisPage";
import WorkspacePage from "./pages/WorkspacePage";
import NewAnalysisPage from "./pages/NewAnalysisPage";
import IntelligencePage from "./pages/IntelligencePage";
import StartPage from "./pages/StartPage";
import { HelpAssistantPanel } from "@/components/HelpAssistantPanel";

const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"));
const AdminHealthPage = lazy(() => import("./pages/AdminHealthPage"));

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  useEffect(() => {
    import("@/lib/analyticsTracker").then(({ initAnalyticsTracker }) => initAnalyticsTracker());
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

  return (
    <Routes>
      <Route path="/admin/analytics" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><AdminAnalyticsPage /></Suspense>} />
      <Route path="/admin/health" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><AdminHealthPage /></Suspense>} />
      <Route path="/instant-analysis" element={<InstantAnalysisPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/analysis/share/:id" element={<ShareableAnalysisPage />} />
      {user ? (
        <>
          {/* Default landing → Workspace */}
          <Route path="/" element={<StartPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/analysis/new" element={<NewAnalysisPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          {/* Legacy redirects */}
          <Route path="/portfolio" element={<Navigate to="/workspace" replace />} />
          <Route path="/intel" element={<Navigate to="/intelligence" replace />} />
          {/* Analysis pipeline routes */}
          <Route path="/start/product" element={<StartProductPage />} />
          <Route path="/start/service" element={<StartServicePage />} />
          <Route path="/start/business" element={<StartBusinessPage />} />
          <Route path="/analysis/:id/report" element={<ReportPage />} />
          <Route path="/analysis/:id/disrupt" element={<DisruptPage />} />
          <Route path="/analysis/:id/redesign" element={<RedesignPage />} />
          <Route path="/analysis/:id/stress-test" element={<StressTestPage />} />
          <Route path="/analysis/:id/pitch" element={<PitchPage />} />
          <Route path="/business/:id" element={<BusinessResultsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/api" element={<ApiPage />} />
          <Route path="*" element={<NotFound />} />
        </>
      ) : (
        <>
          <Route path="*" element={<AuthPage />} />
        </>
      )}
    </Routes>
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
