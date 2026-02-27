import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ScrollToTopProvider } from "@/components/ScrollToTopProvider";
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
import IntelPage from "./pages/IntelPage";
import MethodologyPage from "./pages/MethodologyPage";
import FaqsPage from "./pages/FaqsPage";
import PortfolioPage from "./pages/PortfolioPage";
import ApiPage from "./pages/ApiPage";
import ShareableAnalysisPage from "./pages/ShareableAnalysisPage";
import StartPage from "./pages/StartPage";
import StartProductPage from "./pages/StartProductPage";
import StartServicePage from "./pages/StartServicePage";
import StartBusinessPage from "./pages/StartBusinessPage";
import NotFound from "./pages/NotFound";
import InstantAnalysisPage from "./pages/InstantAnalysisPage";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
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
      <Route path="/instant-analysis" element={<InstantAnalysisPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/analysis/share/:id" element={<ShareableAnalysisPage />} />
      {user ? (
        <>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/start" element={<StartPage />} />
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
          <Route path="/intel" element={<IntelPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
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
              </AnalysisProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ScrollToTopProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
