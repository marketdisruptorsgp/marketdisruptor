

## Plan: Add System Dynamics to Structural Decomposition

Your reasoning is sound. The engine currently extracts static structure (what the parts are) but not dynamic behavior (how they interact and fail). Adding system dynamics closes the gap between decomposition and the downstream analysis layers.

### What changes

**1. Extend types (`src/lib/structuralDecomposition.ts`)**

Add a shared `SystemDynamics` interface applied to all three modes:

```typescript
interface FailureMode {
  id: string;
  component: string;        // which primitive fails
  mode: string;              // how it fails
  cascadeEffect: string;     // what breaks downstream
  frequency: "rare" | "occasional" | "frequent";
  detectability: "obvious" | "hidden" | "delayed";
}

interface FeedbackLoop {
  id: string;
  name: string;
  type: "reinforcing" | "balancing";
  components: string[];      // primitive ids involved
  mechanism: string;
  strength: "weak" | "moderate" | "strong";
}

interface Bottleneck {
  id: string;
  location: string;          // which primitive
  throughputLimit: string;
  cause: string;
  workaround: string;
}

interface ControlPoint {
  id: string;
  point: string;
  leverageType: "gatekeeping" | "pricing" | "quality" | "access" | "information";
  controller: string;
  switchability: "locked" | "negotiable" | "open";
}

interface SubstitutionPath {
  id: string;
  target: string;            // primitive being replaced
  substitute: string;
  feasibility: "ready" | "emerging" | "theoretical";
  tradeoff: string;
}

interface SystemDynamics {
  failureModes: FailureMode[];
  feedbackLoops: FeedbackLoop[];
  bottlenecks: Bottleneck[];
  controlPoints: ControlPoint[];
  substitutionPaths: SubstitutionPath[];
}
```

Add `systemDynamics: SystemDynamics` to all three decomposition interfaces (`ProductDecomposition`, `ServiceDecomposition`, `BusinessModelDecomposition`).

**2. Update edge function (`supabase/functions/structural-decomposition/index.ts`)**

- Add `systemDynamics` block to all three JSON schemas (PRODUCT_SCHEMA, SERVICE_SCHEMA, BUSINESS_SCHEMA)
- Add system dynamics extraction mandate to the system prompt for each mode
- Increase `max_tokens` from 4000 to 6000 to accommodate the additional output

**3. Thread dynamics into downstream edge functions**

The orchestrator already passes `structuralDecomposition` into disrupt, redesign, and stress test. The decomposition object will now include `systemDynamics`, so downstream functions automatically receive it. Minor prompt additions in:

- `first-principles-analysis/index.ts` — reference failure modes and feedback loops when identifying hidden assumptions
- `critical-validation/index.ts` — reference bottlenecks and control points when stress-testing concepts

**4. Update DecompositionViewer (`src/components/DecompositionViewer.tsx`)**

Add a "System Dynamics" section to the viewer for all three modes, rendering:
- Failure modes with cascade chains and frequency/detectability badges
- Feedback loops with reinforcing/balancing indicators and component links
- Bottlenecks with throughput limits
- Control points with leverage type and switchability
- Substitution paths with feasibility ratings

**5. Update PipelineDataHealth**

Add `systemDynamics` as a tracked sub-field within the decomposition health check.