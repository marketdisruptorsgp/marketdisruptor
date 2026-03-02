import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DemoSection = lazy(() => import("@/components/DemoSection"));

export default function DemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-6 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Suspense fallback={<div className="h-96 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />}>
          <DemoSection />
        </Suspense>
      </div>
    </div>
  );
}
