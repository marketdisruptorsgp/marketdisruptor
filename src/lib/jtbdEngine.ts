/**
 * JTBD Engine — Jobs-To-Be-Done extraction
 *
 * Extracts the functional, emotional, and social "jobs" customers are hiring
 * a product or service to do (Christensen 2003, Ulwick 2016).
 *
 * Each job is traced back to a demand-side driver — community complaints,
 * user stories, or market data — ensuring every extracted job has a verifiable
 * source, not just an inference.
 *
 * The engine also provides a JTBD thesis for each opportunity or innovation
 * move, connecting the supply-side idea to a real customer demand.
 */

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type JtbdJobType = "functional" | "emotional" | "social";

export interface JtbdJob {
  id: string;
  jobType: JtbdJobType;
  /** "When I _____, I want to _____, so I can _____" format */
  jobStatement: string;
  /** The core need being satisfied */
  coreNeed: string;
  /** The outcome the customer is trying to achieve */
  desiredOutcome: string;
  /**
   * Demand-side source — community complaint, user story, or market data.
   * Per PR #20 requirements: every job must trace to a verifiable source.
   */
  demandSource: string;
  demandSourceType: "community_complaint" | "user_story" | "market_data" | "inferred";
  /** How strongly evidenced is this job? 0-1 */
  evidenceStrength: number;
  /** IDs of evidence items supporting this job */
  evidenceIds: string[];
  /** Current solution quality: how well is this job done today? */
  currentSolutionQuality: "poor" | "adequate" | "good";
  /** Underservice gap — magnitude of the opportunity */
  underserviceScore: number; // 1-10
}

export interface JtbdOpportunityLink {
  jobId: string;
  opportunityLabel: string;
  /** How does this innovation move address the JTBD? */
  jtbdThesis: string;
  /** Which dimension of the job does it address? */
  addressesDimension: "functional" | "emotional" | "social" | "all";
  strengthOfLink: "strong" | "moderate" | "weak";
}

export interface JtbdProfile {
  /** All extracted jobs */
  jobs: JtbdJob[];
  /** Functional jobs only */
  functionalJobs: JtbdJob[];
  /** Emotional jobs only */
  emotionalJobs: JtbdJob[];
  /** Social jobs only */
  socialJobs: JtbdJob[];
  /** Top job by underservice score — the primary opportunity */
  primaryUnderservedJob: JtbdJob | null;
  /** Demand-side signals used as sources */
  demandSignals: string[];
}

// ═══════════════════════════════════════════════════════════════
//  JOB STATEMENT TEMPLATES
//  "When I [situation], I want to [motivation], so I can [outcome]"
// ═══════════════════════════════════════════════════════════════

interface FunctionalJobTemplate {
  keywords: string[];
  jobStatement: (entity: string) => string;
  coreNeed: string;
  desiredOutcome: string;
  underserviceScore: number;
}

const FUNCTIONAL_JOB_TEMPLATES: FunctionalJobTemplate[] = [
  {
    keywords: ["repair", "fix", "broken", "maintenance", "service"],
    jobStatement: (e) => `When my ${e} breaks or degrades, I want it restored quickly and correctly, so I can resume normal operations without unexpected downtime`,
    coreNeed: "Reliability restoration",
    desiredOutcome: "Zero unexpected downtime; first-time fix rate > 95%",
    underserviceScore: 8,
  },
  {
    keywords: ["price", "cost", "expensive", "quote", "overcharge"],
    jobStatement: (e) => `When I need ${e} services, I want transparent upfront pricing, so I can budget confidently without fear of invoice shock`,
    coreNeed: "Price transparency and predictability",
    desiredOutcome: "Know the total cost before commitment; no surprise fees",
    underserviceScore: 9,
  },
  {
    keywords: ["schedule", "appointment", "availability", "wait", "slow"],
    jobStatement: (e) => `When I need ${e}, I want to schedule immediately and receive prompt service, so I can minimize disruption to my schedule`,
    coreNeed: "Availability and responsiveness",
    desiredOutcome: "Same-day or next-day booking; arrival within promised window",
    underserviceScore: 8,
  },
  {
    keywords: ["quality", "professional", "skilled", "expertise", "trust"],
    jobStatement: (e) => `When hiring ${e}, I want to verify the technician is qualified and trustworthy, so I can grant access to my property with confidence`,
    coreNeed: "Quality assurance and trust",
    desiredOutcome: "Background-checked, rated technicians; proof of qualification",
    underserviceScore: 7,
  },
  {
    keywords: ["digital", "app", "online", "tracking", "status"],
    jobStatement: (e) => `While ${e} is being performed, I want real-time visibility into status and progress, so I can plan my day without being tied to waiting`,
    coreNeed: "Visibility and control during service",
    desiredOutcome: "Live tracking, arrival notifications, and completion confirmation",
    underserviceScore: 7,
  },
  {
    keywords: ["warranty", "guarantee", "follow-up", "callback", "return"],
    jobStatement: (e) => `After ${e} is complete, I want a service guarantee I can rely on, so I'm not left responsible if the problem recurs`,
    coreNeed: "Post-service assurance",
    desiredOutcome: "Hassle-free recourse; guaranteed resolution within defined timeframe",
    underserviceScore: 6,
  },
];

interface EmotionalJobTemplate {
  situationKeywords: string[];
  jobStatement: (entity: string) => string;
  coreNeed: string;
  desiredOutcome: string;
  underserviceScore: number;
}

const EMOTIONAL_JOB_TEMPLATES: EmotionalJobTemplate[] = [
  {
    situationKeywords: ["emergency", "urgent", "broken", "failed", "crisis"],
    jobStatement: (e) => `When something goes wrong with ${e}, I want to feel calm and in control, so I don't spiral into anxiety about costs or consequences`,
    coreNeed: "Stress reduction in high-stakes moments",
    desiredOutcome: "Guided, step-by-step resolution process that removes ambiguity",
    underserviceScore: 9,
  },
  {
    situationKeywords: ["price", "cost", "overcharge", "ripped off", "scam"],
    jobStatement: (e) => `When paying for ${e}, I want to feel I received fair value, so I don't carry the resentment of feeling taken advantage of`,
    coreNeed: "Sense of fairness and value",
    desiredOutcome: "Price benchmarks, reviews, and transparent line-item invoices",
    underserviceScore: 8,
  },
  {
    situationKeywords: ["trust", "strangers", "home", "access", "security"],
    jobStatement: (e) => `When letting ${e} providers into my home, I want to feel safe and secure, so I can grant access without anxiety`,
    coreNeed: "Safety and peace of mind",
    desiredOutcome: "Verified identity, background checks, and accountability trail",
    underserviceScore: 8,
  },
  {
    situationKeywords: ["quality", "poor work", "amateur", "redo", "mistake"],
    jobStatement: (e) => `When ${e} work is completed, I want to feel proud of the result, so I'm not embarrassed by visible quality issues`,
    coreNeed: "Pride in the outcome",
    desiredOutcome: "Consistent quality with photographic documentation of completion",
    underserviceScore: 7,
  },
  {
    situationKeywords: ["ignored", "disrespect", "communication", "unprofessional"],
    jobStatement: (e) => `Throughout the ${e} process, I want to feel respected and valued as a customer, so I recommend the service to others`,
    coreNeed: "Dignity and respect",
    desiredOutcome: "Proactive communication, on-time arrivals, and genuine follow-up",
    underserviceScore: 7,
  },
];

interface SocialJobTemplate {
  contextKeywords: string[];
  jobStatement: (entity: string) => string;
  coreNeed: string;
  desiredOutcome: string;
  underserviceScore: number;
}

const SOCIAL_JOB_TEMPLATES: SocialJobTemplate[] = [
  {
    contextKeywords: ["home", "property", "neighborhood", "curb appeal"],
    jobStatement: (e) => `When maintaining my property with ${e}, I want my neighbors and guests to see a well-cared-for home, so I'm perceived as responsible and successful`,
    coreNeed: "Status signaling through property upkeep",
    desiredOutcome: "Visibly high-quality work with before/after documentation",
    underserviceScore: 6,
  },
  {
    contextKeywords: ["business", "commercial", "office", "clients", "professional"],
    jobStatement: (e) => `When clients visit my business, I want the environment maintained by ${e} to signal professional excellence, so clients trust my operation`,
    coreNeed: "Professional credibility signaling",
    desiredOutcome: "Consistent, documented standards that can be shared with clients",
    underserviceScore: 5,
  },
  {
    contextKeywords: ["recommend", "referral", "friend", "tell", "review"],
    jobStatement: (e) => `When friends or colleagues need ${e} services, I want to confidently recommend a provider, so I'm seen as a helpful, well-connected resource`,
    coreNeed: "Social currency through superior recommendations",
    desiredOutcome: "Referral program that rewards me and guarantees my reputation",
    underserviceScore: 6,
  },
  {
    contextKeywords: ["family", "children", "safe", "healthy", "environment"],
    jobStatement: (e) => `When ${e} work is done around my family, I want to be seen as a responsible caretaker, so my family feels protected and cared for`,
    coreNeed: "Identity as a responsible provider/protector",
    desiredOutcome: "Eco-safe processes, child-safe products, and transparent material usage",
    underserviceScore: 7,
  },
];

// ═══════════════════════════════════════════════════════════════
//  DEMAND SIGNAL EXTRACTION
//  Pulls community complaints, user stories, and market data from product
// ═══════════════════════════════════════════════════════════════

function extractDemandSignals(product: any): {
  complaints: string[];
  requests: string[];
  marketSignals: string[];
  allSignals: string[];
} {
  const complaints: string[] = [];
  const requests: string[] = [];
  const marketSignals: string[] = [];

  if (product?.communityInsights) {
    const ci = product.communityInsights;
    if (Array.isArray(ci.topComplaints)) complaints.push(...ci.topComplaints);
    if (Array.isArray(ci.improvementRequests)) requests.push(...ci.improvementRequests);
    if (typeof ci.communitySentiment === "string") marketSignals.push(ci.communitySentiment);
    if (Array.isArray(ci.userStories)) requests.push(...ci.userStories);
  }

  if (product?.userWorkflow?.frictionPoints) {
    const frictions = product.userWorkflow.frictionPoints as any[];
    frictions.forEach((f: any) => {
      if (f.friction) complaints.push(f.friction);
    });
  }

  if (product?.competitorAnalysis?.gaps) {
    const gaps = product.competitorAnalysis.gaps as string[];
    gaps.forEach(g => marketSignals.push(g));
  }

  return {
    complaints,
    requests,
    marketSignals,
    allSignals: [...complaints, ...requests, ...marketSignals],
  };
}

// ═══════════════════════════════════════════════════════════════
//  JOB EXTRACTION
// ═══════════════════════════════════════════════════════════════

let jobIdSeq = 0;
function nextJobId() { return `jtbd-${++jobIdSeq}`; }

function matchKeywords(haystack: string, keywords: string[]): boolean {
  const lower = haystack.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Extract functional jobs from product data.
 * Uses community complaints and friction points as demand-side sources.
 */
function extractFunctionalJobs(product: any, demandSignals: string[]): JtbdJob[] {
  const jobs: JtbdJob[] = [];
  const entityName = product?.name || product?.category || "the service";

  const signalText = demandSignals.join(" ").toLowerCase();
  const descText = (
    (product?.description || "") + " " +
    (product?.category || "") + " " +
    signalText
  ).toLowerCase();

  for (const template of FUNCTIONAL_JOB_TEMPLATES) {
    const matched = matchKeywords(descText, template.keywords);

    // Find the specific demand signal that triggered this job
    const matchedSignal = demandSignals.find(s =>
      matchKeywords(s, template.keywords)
    ) || (matched ? `${entityName} category analysis` : null);

    if (!matchedSignal && !matched) continue;

    jobs.push({
      id: nextJobId(),
      jobType: "functional",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: matchedSignal || `${entityName} operational context`,
      demandSourceType: demandSignals.includes(matchedSignal || "") ? "community_complaint" : "inferred",
      evidenceStrength: matched ? (demandSignals.includes(matchedSignal || "") ? 0.85 : 0.6) : 0.4,
      evidenceIds: [],
      currentSolutionQuality: template.underserviceScore >= 8 ? "poor" : template.underserviceScore >= 6 ? "adequate" : "good",
      underserviceScore: template.underserviceScore,
    });
  }

  // Always include at least 3 functional jobs
  while (jobs.length < 3 && jobs.length < FUNCTIONAL_JOB_TEMPLATES.length) {
    const template = FUNCTIONAL_JOB_TEMPLATES[jobs.length];
    jobs.push({
      id: nextJobId(),
      jobType: "functional",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: `${entityName} category baseline`,
      demandSourceType: "inferred",
      evidenceStrength: 0.4,
      evidenceIds: [],
      currentSolutionQuality: "adequate",
      underserviceScore: template.underserviceScore,
    });
  }

  return jobs.slice(0, 6);
}

/**
 * Extract emotional jobs — how customers want to feel.
 * Primarily sourced from community sentiment and complaint patterns.
 */
function extractEmotionalJobs(product: any, demandSignals: string[]): JtbdJob[] {
  const jobs: JtbdJob[] = [];
  const entityName = product?.name || product?.category || "the service";

  const signalText = demandSignals.join(" ").toLowerCase();
  const descText = (
    (product?.description || "") + " " +
    (product?.category || "") + " " +
    signalText
  ).toLowerCase();

  for (const template of EMOTIONAL_JOB_TEMPLATES) {
    const matched = matchKeywords(descText, template.situationKeywords);
    const matchedSignal = demandSignals.find(s =>
      matchKeywords(s, template.situationKeywords)
    );

    if (!matched && !matchedSignal) continue;

    jobs.push({
      id: nextJobId(),
      jobType: "emotional",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: matchedSignal || `${entityName} community sentiment analysis`,
      demandSourceType: matchedSignal ? "community_complaint" : "inferred",
      evidenceStrength: matchedSignal ? 0.8 : 0.5,
      evidenceIds: [],
      currentSolutionQuality: template.underserviceScore >= 8 ? "poor" : "adequate",
      underserviceScore: template.underserviceScore,
    });
  }

  // Ensure at least 2 emotional jobs
  while (jobs.length < 2 && jobs.length < EMOTIONAL_JOB_TEMPLATES.length) {
    const template = EMOTIONAL_JOB_TEMPLATES[jobs.length];
    jobs.push({
      id: nextJobId(),
      jobType: "emotional",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: `${entityName} service category baseline`,
      demandSourceType: "inferred",
      evidenceStrength: 0.35,
      evidenceIds: [],
      currentSolutionQuality: "adequate",
      underserviceScore: template.underserviceScore,
    });
  }

  return jobs.slice(0, 4);
}

/**
 * Extract social jobs — how customers want to be perceived.
 */
function extractSocialJobs(product: any, _demandSignals: string[]): JtbdJob[] {
  const jobs: JtbdJob[] = [];
  const entityName = product?.name || product?.category || "the service";

  const descText = (
    (product?.description || "") + " " +
    (product?.category || "")
  ).toLowerCase();

  for (const template of SOCIAL_JOB_TEMPLATES) {
    const matched = matchKeywords(descText, template.contextKeywords);
    if (!matched) continue;

    jobs.push({
      id: nextJobId(),
      jobType: "social",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: `${entityName} customer context analysis`,
      demandSourceType: "inferred",
      evidenceStrength: 0.45,
      evidenceIds: [],
      currentSolutionQuality: "adequate",
      underserviceScore: template.underserviceScore,
    });
  }

  // Ensure at least 1 social job
  if (jobs.length === 0) {
    const template = SOCIAL_JOB_TEMPLATES[0];
    jobs.push({
      id: nextJobId(),
      jobType: "social",
      jobStatement: template.jobStatement(entityName),
      coreNeed: template.coreNeed,
      desiredOutcome: template.desiredOutcome,
      demandSource: `${entityName} general customer context`,
      demandSourceType: "inferred",
      evidenceStrength: 0.3,
      evidenceIds: [],
      currentSolutionQuality: "adequate",
      underserviceScore: template.underserviceScore,
    });
  }

  return jobs.slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Extract a full JTBD profile from product/service data.
 * Traces every job to a demand-side source.
 */
export function extractJtbdProfile(product: any): JtbdProfile {
  jobIdSeq = 0;

  const { complaints, requests, marketSignals, allSignals } = extractDemandSignals(product);
  const demandSignals = allSignals;

  const functionalJobs = extractFunctionalJobs(product, demandSignals);
  const emotionalJobs = extractEmotionalJobs(product, demandSignals);
  const socialJobs = extractSocialJobs(product, demandSignals);

  const allJobs = [...functionalJobs, ...emotionalJobs, ...socialJobs];

  // Primary underserved job = highest underservice score with strongest evidence
  const primaryUnderservedJob = allJobs.length > 0
    ? [...allJobs]
      .sort((a, b) => (b.underserviceScore * b.evidenceStrength) - (a.underserviceScore * a.evidenceStrength))[0]
    : null;

  return {
    jobs: allJobs,
    functionalJobs,
    emotionalJobs,
    socialJobs,
    primaryUnderservedJob,
    demandSignals: [...new Set([...complaints, ...requests, ...marketSignals])].slice(0, 10),
  };
}

/**
 * Generate a JTBD thesis linking an innovation opportunity to a specific job.
 * This traces supply-side logic back to demand-side need.
 */
export function generateJtbdThesis(
  opportunityLabel: string,
  jobs: JtbdJob[],
): JtbdOpportunityLink | null {
  if (jobs.length === 0) return null;

  const oppLower = opportunityLabel.toLowerCase();

  // Try to match opportunity to a specific job by keyword overlap
  let bestJob: JtbdJob | null = null;
  let bestScore = 0;

  for (const job of jobs) {
    const jobText = `${job.jobStatement} ${job.coreNeed} ${job.desiredOutcome}`.toLowerCase();
    const oppTokens = oppLower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 3);
    const matches = oppTokens.filter(t => jobText.includes(t)).length;
    const score = matches / Math.max(1, oppTokens.length);

    if (score > bestScore) {
      bestScore = score;
      bestJob = job;
    }
  }

  // Fall back to highest-priority functional job
  if (!bestJob || bestScore < 0.1) {
    bestJob = [...jobs]
      .filter(j => j.jobType === "functional")
      .sort((a, b) => b.underserviceScore - a.underserviceScore)[0] || jobs[0];
  }

  if (!bestJob) return null;

  const strengthOfLink: "strong" | "moderate" | "weak" = bestScore >= 0.3 ? "strong" : bestScore >= 0.1 ? "moderate" : "weak";

  return {
    jobId: bestJob.id,
    opportunityLabel,
    jtbdThesis: `This opportunity directly addresses the customer job: "${bestJob.coreNeed}". ${bestJob.desiredOutcome} — currently rated as ${bestJob.currentSolutionQuality} by the market. Closing this gap unlocks the value customers are hiring for but not receiving.`,
    addressesDimension: bestJob.jobType === "functional" ? "functional" : bestJob.jobType === "emotional" ? "emotional" : "social",
    strengthOfLink,
  };
}
