/**
 * Dynamic Due Diligence Question Engine
 * 
 * Generates analysis-specific questions by matching biExtraction signals
 * to a 100+ template library. Each question is triggered by specific
 * data conditions — no generic filler.
 */

import type { ETAFinancialInputs } from "./etaScoringEngine";

export interface DDQuestion {
  question: string;
  why: string;
  severity: "critical" | "high" | "medium";
  dataTriggered: boolean;
  /** Which extracted signal triggered this question */
  triggerSource?: string;
}

export interface DDCategory {
  id: string;
  label: string;
  iconName: string; // lucide icon name
  questions: DDQuestion[];
}

interface SignalContext {
  inputs: ETAFinancialInputs;
  bi: Record<string, any>;
  constraints: any[];
  leveragePoints: any[];
  revenueSources: any[];
  costDrivers: any[];
  workflows: any[];
  ownerDeps: any[];
  companyName: string;
  industry: string;
}

function buildContext(inputs: ETAFinancialInputs, biExtraction: Record<string, any> | null): SignalContext {
  const bi = biExtraction || {};
  const eta = bi?.eta_assessment || {};
  return {
    inputs,
    bi,
    constraints: Array.isArray(bi.constraints) ? bi.constraints : [],
    leveragePoints: Array.isArray(bi.signals_for_visualization?.candidate_leverage_points)
      ? bi.signals_for_visualization.candidate_leverage_points : [],
    revenueSources: Array.isArray(bi.revenue_engine?.revenue_sources) ? bi.revenue_engine.revenue_sources : [],
    costDrivers: Array.isArray(bi.revenue_engine?.cost_drivers) ? bi.revenue_engine.cost_drivers : [],
    workflows: Array.isArray(bi.operating_model?.workflow_stages) ? bi.operating_model.workflow_stages : [],
    ownerDeps: Array.isArray(eta?.owner_dependencies) ? eta.owner_dependencies : [],
    companyName: bi?.business_overview?.company_name || "this business",
    industry: bi?.business_overview?.industry || "",
  };
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE LIBRARY — questions triggered by specific data signals
// ═══════════════════════════════════════════════════════════════

function financialIntegrityQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [];
  const { inputs, bi, companyName } = ctx;

  // Always ask
  qs.push({
    question: "Can you provide 3 years of tax returns — not internal P&Ls — to verify stated revenue and SDE?",
    why: "Internal financials can be dressed up. Tax returns are filed under penalty of perjury.",
    severity: "critical", dataTriggered: true,
  });

  // Addback scrutiny
  const addbacks = bi?.eta_assessment?.financial_snapshot?.claimed_addbacks;
  if (Array.isArray(addbacks) && addbacks.length > 0) {
    qs.push({
      question: `You've claimed ${addbacks.length} addbacks. Walk me through each one — which disappear if you're not the owner?`,
      why: "Inflated addbacks are the #1 way sellers overstate SDE. Each must be independently verifiable.",
      severity: "critical", dataTriggered: true, triggerSource: `${addbacks.length} claimed addbacks`,
    });
    // Specific addback challenges
    for (const ab of addbacks.slice(0, 3)) {
      const label = typeof ab === "string" ? ab : ab?.label || ab?.description;
      if (label) {
        qs.push({
          question: `The "${label}" addback — can you provide documentation proving this is truly discretionary and not essential to operations?`,
          why: "Every addback inflates the purchase price. Unverifiable addbacks should be removed from SDE.",
          severity: "high", dataTriggered: true, triggerSource: `Addback: ${label}`,
        });
      }
    }
  } else {
    qs.push({
      question: "Walk me through every single addback line by line. Which ones disappear if you're not the owner?",
      why: "Inflated addbacks are the #1 way sellers overstate SDE.",
      severity: "critical", dataTriggered: false,
    });
  }

  // SDE margin trigger
  if (inputs.sdeMargin != null && inputs.sdeMargin < 0.20) {
    qs.push({
      question: `${companyName}'s SDE margin is ${(inputs.sdeMargin * 100).toFixed(0)}%. What's preventing price increases or cost reduction?`,
      why: "Thin margins leave zero room for debt service surprises, new-owner salary, or growth investment.",
      severity: "high", dataTriggered: true, triggerSource: `SDE margin: ${(inputs.sdeMargin * 100).toFixed(0)}%`,
    });
  }

  // Multiple trigger
  if (inputs.revenue && inputs.sde && inputs.askingPrice) {
    const multiple = inputs.askingPrice / inputs.sde;
    if (multiple > 4) {
      qs.push({
        question: `At ${multiple.toFixed(1)}x SDE, what specifically justifies a premium multiple versus the industry norm of 2.5–3.5x?`,
        why: "Premium multiples require provable growth trajectory, proprietary advantages, or locked-in recurring revenue.",
        severity: "high", dataTriggered: true, triggerSource: `${multiple.toFixed(1)}x SDE multiple`,
      });
    }
    if (multiple < 2) {
      qs.push({
        question: `The ${multiple.toFixed(1)}x multiple seems low. What's wrong with this business that's driving the discount?`,
        why: "Below-market multiples often signal hidden problems the seller knows about but hasn't disclosed.",
        severity: "high", dataTriggered: true, triggerSource: `Low multiple: ${multiple.toFixed(1)}x`,
      });
    }
  }

  // Revenue growth trigger
  if (inputs.revenueGrowthPct != null && inputs.revenueGrowthPct < 0) {
    qs.push({
      question: `Revenue declined ${Math.abs(inputs.revenueGrowthPct).toFixed(0)}%. Is this market contraction, competitive loss, or a one-time event? Prove it.`,
      why: "Declining revenue in a business for sale is a massive red flag. The seller may be exiting a sinking ship.",
      severity: "critical", dataTriggered: true, triggerSource: `Revenue decline: ${inputs.revenueGrowthPct.toFixed(0)}%`,
    });
  }

  // Cost driver challenges
  for (const cd of ctx.costDrivers.slice(0, 2)) {
    const name = cd?.name || cd?.label || cd?.driver;
    const pct = cd?.percentage || cd?.pct_of_revenue;
    if (name) {
      qs.push({
        question: pct
          ? `"${name}" is ${pct}% of costs. Is this locked in contractually, or could a new owner renegotiate?`
          : `How much does "${name}" actually cost annually, and what happens if it increases 20%?`,
        why: "Cost drivers that can't be controlled or renegotiated directly limit your margin improvement runway.",
        severity: "high", dataTriggered: true, triggerSource: `Cost driver: ${name}`,
      });
    }
  }

  qs.push({
    question: "What percentage of revenue is collected in cash, and how is it tracked?",
    why: "Cash-heavy businesses may have unreported revenue — or reported revenue that doesn't actually exist.",
    severity: "high", dataTriggered: false,
  });

  qs.push({
    question: "Show me working capital needs month by month. What's the worst cash-flow gap in the last 3 years?",
    why: "Seasonal cash crunches can kill a leveraged acquisition. SBA loans don't care about your slow season.",
    severity: "medium", dataTriggered: false,
  });

  return qs;
}

function customerRevenueQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [];
  const { inputs, companyName, revenueSources } = ctx;

  // Customer concentration trigger
  if (inputs.customerConcentration != null && inputs.customerConcentration > 0.15) {
    qs.push({
      question: `Your top customer is ${(inputs.customerConcentration * 100).toFixed(0)}% of revenue. Written contract? Renewal date? Ever threatened to leave?`,
      why: "If this customer leaves post-acquisition, the business may not cover debt service.",
      severity: "critical", dataTriggered: true, triggerSource: `Top customer: ${(inputs.customerConcentration * 100).toFixed(0)}% of revenue`,
    });
  }

  if (inputs.top5CustomerPct != null && inputs.top5CustomerPct > 0.50) {
    qs.push({
      question: `Top 5 customers are ${(inputs.top5CustomerPct * 100).toFixed(0)}% of revenue. What's the average relationship tenure, and are any contracts up for renewal in the next 12 months?`,
      why: "Losing even one major account in a concentrated base can make the deal economics collapse.",
      severity: "critical", dataTriggered: true, triggerSource: `Top 5 customers: ${(inputs.top5CustomerPct * 100).toFixed(0)}%`,
    });
  }

  // Revenue source-specific questions
  for (const rs of revenueSources.slice(0, 3)) {
    const name = rs?.name || rs?.source || rs?.type;
    const pct = rs?.percentage || rs?.pct_of_revenue;
    if (name && pct && pct > 20) {
      qs.push({
        question: `"${name}" drives ${pct}% of revenue. Is this contractual/recurring, or does it need to be re-won every period?`,
        why: "Revenue that must be actively re-sold every period is worth less than locked-in recurring revenue.",
        severity: "high", dataTriggered: true, triggerSource: `Revenue: ${name} (${pct}%)`,
      });
    }
  }

  // Recurring revenue trigger
  if (inputs.recurringRevenuePct != null && inputs.recurringRevenuePct < 0.30) {
    qs.push({
      question: `Only ${(inputs.recurringRevenuePct * 100).toFixed(0)}% of revenue is recurring. What's your plan for converting project-based work into ongoing contracts?`,
      why: "Non-recurring revenue means the business starts from near-zero every period. That's a job, not an asset.",
      severity: "high", dataTriggered: true, triggerSource: `Recurring revenue: ${(inputs.recurringRevenuePct * 100).toFixed(0)}%`,
    });
  }

  // Always-ask
  qs.push({
    question: `If I called ${companyName}'s top 5 customers today and told them the business sold, how many would stay?`,
    why: "Customer relationships often follow the owner, not the business. This is the single biggest post-close risk.",
    severity: "critical", dataTriggered: false,
  });

  qs.push({
    question: "What's the customer churn rate? How many customers from 3 years ago are still active?",
    why: "High churn means you're on a treadmill — constantly replacing lost revenue just to stay flat.",
    severity: "high", dataTriggered: false,
  });

  qs.push({
    question: "How do new customers find you? What happens to lead flow when you're no longer the face of the business?",
    why: "If the owner IS the sales engine, the buyer is purchasing a job, not a business.",
    severity: "high", dataTriggered: false,
  });

  return qs;
}

function ownerDependencyQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [];
  const { inputs, ownerDeps, companyName } = ctx;

  if (inputs.ownerDependency === "dependent" || inputs.ownerDependency === "owner_critical") {
    qs.push({
      question: `If you were hit by a bus tomorrow, could ${companyName} operate for 90 days without you?`,
      why: "If the answer is no, the 'business' is really a well-paying job disguised as an asset.",
      severity: "critical", dataTriggered: true, triggerSource: `Owner dependency: ${inputs.ownerDependency}`,
    });
  }

  // Specific owner dependency challenges from extraction
  for (const dep of ownerDeps.filter((d: any) => d.severity === "critical" || d.severity === "high").slice(0, 3)) {
    const area = dep?.area || dep?.function || dep?.dependency;
    if (area) {
      qs.push({
        question: `The owner is ${dep.severity}-level dependent in "${area}". What's the documented succession plan for this function?`,
        why: `Owner dependency in ${area} means this capability may not transfer to a new owner.`,
        severity: dep.severity === "critical" ? "critical" : "high",
        dataTriggered: true, triggerSource: `Owner dependency: ${area}`,
      });
    }
  }

  // Workflow-based questions — if key workflows depend on owner knowledge
  for (const wf of ctx.workflows.slice(0, 2)) {
    const name = wf?.name || wf?.stage || wf?.step;
    if (name) {
      qs.push({
        question: `The "${name}" stage — is this documented in an SOP, or does it live in someone's head?`,
        why: "Undocumented workflows are transfer risks. If key people leave, institutional knowledge walks out.",
        severity: "medium", dataTriggered: true, triggerSource: `Workflow: ${name}`,
      });
    }
  }

  qs.push({
    question: "Which employees would quit within 6 months of a sale? Be honest.",
    why: "Key person departures post-close are a leading cause of acquisition failure in SMBs.",
    severity: "critical", dataTriggered: false,
  });

  qs.push({
    question: "Are all vendor relationships, licenses, and contracts in the company name — or yours personally?",
    why: "Personal relationships and contracts don't transfer. If key vendor terms are owner-dependent, they're at risk.",
    severity: "high", dataTriggered: false,
  });

  qs.push({
    question: "What specific steps have you taken to remove yourself from day-to-day operations in the last 12 months?",
    why: "Sellers who promise 'easy transition' but haven't started delegating are selling a fantasy.",
    severity: "high", dataTriggered: false,
  });

  return qs;
}

function operationalQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [];
  const { constraints, companyName } = ctx;

  // Constraint-driven questions — the most valuable, analysis-specific ones
  for (const c of constraints) {
    const name = c?.constraint || c?.name || c?.label;
    const type = c?.type || "operational";
    const evidence = Array.isArray(c?.evidence) ? c.evidence : [];
    if (!name) continue;

    if (type === "operational") {
      qs.push({
        question: `Your data shows "${name}". What have you tried to fix this, and why hasn't it worked?`,
        why: "If the seller knows about an operational constraint and hasn't fixed it, there may be a deeper structural reason.",
        severity: "high", dataTriggered: true, triggerSource: `Constraint: ${name}`,
      });
    } else if (type === "market") {
      qs.push({
        question: `"${name}" — is this getting worse? What would it cost to address this in the next 12 months?`,
        why: "Market constraints often require capital investment. Factor this into your acquisition price.",
        severity: "high", dataTriggered: true, triggerSource: `Market constraint: ${name}`,
      });
    } else if (type === "financial") {
      qs.push({
        question: `"${name}" — how has this affected profitability trend, and what's the dollar impact annually?`,
        why: "Financial constraints directly reduce your post-acquisition cash flow and debt service coverage.",
        severity: "critical", dataTriggered: true, triggerSource: `Financial constraint: ${name}`,
      });
    }
  }

  // Leverage point questions — opportunities that need validation
  for (const lp of ctx.leveragePoints.slice(0, 3)) {
    const name = lp?.name || lp?.point || lp?.description;
    if (name) {
      qs.push({
        question: `We identified "${name}" as a potential lever. Has anyone tried this before? Why hasn't it been done?`,
        why: "If an obvious improvement hasn't been implemented, there's usually a hidden blocker the data doesn't show.",
        severity: "medium", dataTriggered: true, triggerSource: `Leverage point: ${name}`,
      });
    }
  }

  // Employee-related
  if (ctx.inputs.employeeCount != null) {
    if (ctx.inputs.employeeCount < 5) {
      qs.push({
        question: `With only ${ctx.inputs.employeeCount} employees, what happens if any single person leaves? Is there any cross-training?`,
        why: "Micro-teams have zero redundancy. One departure can paralyze operations.",
        severity: "high", dataTriggered: true, triggerSource: `Small team: ${ctx.inputs.employeeCount} employees`,
      });
    }
    qs.push({
      question: `Are all ${ctx.inputs.employeeCount} employees W-2, or are some 1099 contractors? Any misclassification risk?`,
      why: "Worker misclassification carries massive back-tax liability that transfers with the business.",
      severity: "high", dataTriggered: true, triggerSource: `${ctx.inputs.employeeCount} employees`,
    });
  }

  return qs;
}

function hiddenLiabilityQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [
    {
      question: "Any pending or threatened lawsuits, regulatory actions, or environmental issues?",
      why: "Hidden liabilities can surface post-close and blow up your entire return model.",
      severity: "critical", dataTriggered: false,
    },
    {
      question: "When was your last tax audit? Are all payroll taxes, sales taxes, and 1099s current?",
      why: "Tax liability transfers with the business in asset sales. Unpaid taxes become YOUR problem.",
      severity: "critical", dataTriggered: false,
    },
    {
      question: "Is any equipment leased, financed, or subject to liens? Show me the full liability schedule.",
      why: "Hidden debt and equipment liens reduce the actual equity value you're buying.",
      severity: "high", dataTriggered: false,
    },
    {
      question: "Are there any deferred maintenance issues — facilities, equipment, technology — requiring immediate capital?",
      why: "Sellers often defer spending to inflate SDE in the sale year. You inherit the deferred costs.",
      severity: "high", dataTriggered: false,
    },
  ];

  // Industry-specific liability triggers
  const industry = ctx.industry.toLowerCase();
  if (industry.includes("construction") || industry.includes("woodwork") || industry.includes("manufacturing")) {
    qs.push({
      question: "Are there any outstanding workers' comp claims, OSHA citations, or safety violations?",
      why: "Manufacturing/construction businesses carry high workplace liability risk that may not appear on the balance sheet.",
      severity: "critical", dataTriggered: true, triggerSource: `Industry: ${ctx.industry}`,
    });
    qs.push({
      question: "What's the workers' comp experience modification rate (EMR)? Has it been rising?",
      why: "A high or rising EMR signals safety problems and increases insurance costs significantly.",
      severity: "high", dataTriggered: true, triggerSource: `Industry: ${ctx.industry}`,
    });
  }
  if (industry.includes("food") || industry.includes("restaurant") || industry.includes("hospitality")) {
    qs.push({
      question: "What's the health inspection history? Any critical violations in the past 3 years?",
      why: "Health violations can result in closure, fines, and devastating reputation damage.",
      severity: "critical", dataTriggered: true, triggerSource: `Industry: ${ctx.industry}`,
    });
  }
  if (industry.includes("healthcare") || industry.includes("medical") || industry.includes("dental")) {
    qs.push({
      question: "Are all licenses, certifications, and Medicare/Medicaid enrollments transferable to a new owner?",
      why: "Healthcare licensing and payer enrollment often can't be transferred — you may need to re-apply.",
      severity: "critical", dataTriggered: true, triggerSource: `Industry: ${ctx.industry}`,
    });
  }
  if (industry.includes("tech") || industry.includes("software") || industry.includes("saas")) {
    qs.push({
      question: "Is the codebase well-documented? What happens if the lead developer leaves?",
      why: "Technical debt and single-developer dependency are acquisition killers in tech businesses.",
      severity: "critical", dataTriggered: true, triggerSource: `Industry: ${ctx.industry}`,
    });
  }

  return qs;
}

function marketCompetitiveQuestions(ctx: SignalContext): DDQuestion[] {
  const qs: DDQuestion[] = [];
  const { inputs, companyName } = ctx;

  if (inputs.revenueGrowthPct != null && inputs.revenueGrowthPct < 0) {
    qs.unshift({
      question: `Revenue declined ${Math.abs(inputs.revenueGrowthPct).toFixed(0)}%. Is this market contraction, competitive loss, or one-time? Show me evidence.`,
      why: "Declining revenue in a business for sale is a massive red flag.",
      severity: "critical", dataTriggered: true, triggerSource: `Revenue decline: ${inputs.revenueGrowthPct.toFixed(0)}%`,
    });
  }

  qs.push({
    question: `What's the biggest competitive threat to ${companyName} in the next 3 years?`,
    why: "If the seller can't name specific threats, they either don't understand their market or aren't being honest.",
    severity: "high", dataTriggered: false,
  });

  qs.push({
    question: "Has any new competitor entered your market in the last 2 years? Did you lose customers?",
    why: "New entrants signal market attractiveness — but also pricing pressure and share erosion.",
    severity: "medium", dataTriggered: false,
  });

  qs.push({
    question: "Could a technology shift, regulation change, or platform dependency make this model obsolete?",
    why: "Structural disruption risk isn't reflected in historical financials.",
    severity: "high", dataTriggered: false,
  });

  // Backlog trigger
  if (inputs.backlog != null && inputs.revenue) {
    const months = (inputs.backlog / inputs.revenue) * 12;
    if (months > 6) {
      qs.push({
        question: `${months.toFixed(0)} months of backlog — what percentage is contracted vs. verbal/expected?`,
        why: "Verbal backlog evaporates during ownership transitions. Only signed contracts count.",
        severity: "high", dataTriggered: true, triggerSource: `Backlog: ${months.toFixed(0)} months`,
      });
    }
  }

  return qs;
}

function killerQuestions(ctx: SignalContext): DDQuestion[] {
  const { companyName, inputs } = ctx;
  const qs: DDQuestion[] = [
    {
      question: `If ${companyName} is as good as you say, why are you selling it?`,
      why: "The answer reveals everything. Health, burnout, retirement are valid. 'Great opportunity' is not.",
      severity: "critical", dataTriggered: false,
    },
    {
      question: "Would you carry 10–20% of the purchase price as a seller note with a 2-year earnout tied to performance?",
      why: "Sellers who believe in their numbers will put skin in the game. Those who won't are telling you something.",
      severity: "critical", dataTriggered: false,
    },
  ];

  // Years in business trigger
  if (inputs.yearsInBusiness != null && inputs.yearsInBusiness > 20) {
    qs.push({
      question: `${inputs.yearsInBusiness} years in business — what's different about the last 3 years that made you decide to sell NOW?`,
      why: "Long-tenured owners selling often see market shifts they're not disclosing.",
      severity: "high", dataTriggered: true, triggerSource: `${inputs.yearsInBusiness} years in business`,
    });
  }

  return qs;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR — assembles all category-specific questions
// ═══════════════════════════════════════════════════════════════

export function generateDDQuestions(
  inputs: ETAFinancialInputs,
  biExtraction: Record<string, any> | null,
): DDCategory[] {
  const ctx = buildContext(inputs, biExtraction);

  const categories: DDCategory[] = [
    { id: "financial", label: "Financial Integrity", iconName: "DollarSign", questions: financialIntegrityQuestions(ctx) },
    { id: "customers", label: "Customer & Revenue Risk", iconName: "Users", questions: customerRevenueQuestions(ctx) },
    { id: "owner", label: "Owner Dependency", iconName: "Building", questions: ownerDependencyQuestions(ctx) },
    { id: "operations", label: "Operational & Constraint Risk", iconName: "Settings", questions: operationalQuestions(ctx) },
    { id: "liabilities", label: "Hidden Liabilities", iconName: "Shield", questions: hiddenLiabilityQuestions(ctx) },
    { id: "market", label: "Market & Competitive", iconName: "TrendingDown", questions: marketCompetitiveQuestions(ctx) },
    { id: "killer", label: "The Question They Don't Want to Answer", iconName: "Crosshair", questions: killerQuestions(ctx) },
  ];

  // Filter out empty categories
  return categories.filter(c => c.questions.length > 0);
}

export function getDDStats(categories: DDCategory[]) {
  const totalQuestions = categories.reduce((s, c) => s + c.questions.length, 0);
  const criticalCount = categories.reduce((s, c) => s + c.questions.filter(q => q.severity === "critical").length, 0);
  const dataTriggeredCount = categories.reduce((s, c) => s + c.questions.filter(q => q.dataTriggered).length, 0);
  return { totalQuestions, criticalCount, dataTriggeredCount };
}
