/**
 * Benchmark Runner Page
 * 
 * UI for running constraint detection benchmarks and viewing results.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { executeBenchmark, type BenchmarkSummary, type FailureMode } from "@/lib/benchmarks";
import { Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const failureModeColors: Record<FailureMode, string> = {
  success: "bg-green-500/10 text-green-600 border-green-500/20",
  facet_extraction_failure: "bg-red-500/10 text-red-600 border-red-500/20",
  keyword_coverage_failure: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  constraint_ranking_error: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  ambiguous_evidence: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  incorrect_taxonomy_mapping: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  no_detection: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export default function BenchmarkRunner() {
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [report, setReport] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = () => {
    setIsRunning(true);
    // Small timeout to allow UI to update
    setTimeout(() => {
      const { summary, report } = executeBenchmark();
      setSummary(summary);
      setReport(report);
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Constraint Detection Benchmark</h1>
            <p className="text-muted-foreground">Measure detection accuracy against known-constraint businesses</p>
          </div>
          <Button onClick={runBenchmark} disabled={isRunning} size="lg">
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Run Benchmark"}
          </Button>
        </div>

        {summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalTestCases}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top-1 Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {(summary.top1Accuracy * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Target: 60%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top-2 Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {(summary.top2Accuracy * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Target: 85%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">False Positives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.falsePositives}</div>
                </CardContent>
              </Card>
            </div>

            {/* Failure Mode Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Failure Mode Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.failureModeDistribution)
                    .filter(([, count]) => count > 0)
                    .map(([mode, count]) => (
                      <Badge key={mode} variant="outline" className={failureModeColors[mode as FailureMode]}>
                        {mode.replace(/_/g, " ")}: {count}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Individual Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Case Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary.results.map((result) => (
                    <div key={result.testCaseId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.top1Correct ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : result.top2Correct ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <h3 className="font-medium">{result.businessName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Expected: {result.expectedConstraints.join(", ")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={failureModeColors[result.failureMode]}>
                          {result.failureMode.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Predicted:</span>{" "}
                          {result.predictedTop3.join(", ") || "(none)"}
                        </p>
                        <p className="text-muted-foreground">{result.failureExplanation}</p>
                      </div>

                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View reasoning trace
                        </summary>
                        <div className="mt-2 pl-4 border-l-2 space-y-2">
                          <p>Evidence items: {result.reasoningTrace.inputEvidence.length}</p>
                          <p>
                            Facets extracted: {result.reasoningTrace.extractedFacets.filter(f => f.facets).length}/
                            {result.reasoningTrace.inputEvidence.length}
                          </p>
                          <p>Candidates detected: {result.reasoningTrace.candidatesDetected.length}</p>
                          <div>
                            <p className="font-medium">Ranked constraints:</p>
                            <ul className="pl-4 space-y-1">
                              {result.reasoningTrace.rankedConstraints.slice(0, 5).map((rc) => (
                                <li key={rc.rank}>
                                  #{rc.rank}: {rc.constraintName} ({rc.confidence}, {rc.evidenceCount} evidence)
                                  {rc.facetBasis.length > 0 ? (
                                    <span className="text-green-600"> [facets: {rc.facetBasis.join(", ")}]</span>
                                  ) : (
                                    <span className="text-orange-600"> [keywords only]</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Raw Report */}
            <Card>
              <CardHeader>
                <CardTitle>Full Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs font-mono whitespace-pre-wrap">{report}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
