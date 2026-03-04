import { PipelineDiagram } from "@/components/PipelineDiagram";

export default function PipelinePage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PipelineDiagram />
      </div>
    </div>
  );
}
