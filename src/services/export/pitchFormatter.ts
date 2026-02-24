export interface SlideSection {
  heading: string;
  bullets: string[];
  evidenceTag?: "VERIFIED" | "MODELED" | "ASSUMPTION";
  dataRef?: string;
}

export interface SlideModel {
  id: string;
  title: string;
  headline?: string;
  sections: SlideSection[];
  dataCallout?: { label: string; value: string };
  metadata: { timestamp: string; platform: string; dataSource?: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatPitchToSlides(deck: any, productName: string): SlideModel[] {
  const timestamp = new Date().toISOString();
  const meta = { timestamp, platform: "Market Disruptor" };

  const slides: SlideModel[] = [];

  // 1. Problem
  slides.push({
    id: "problem",
    title: "The Problem",
    headline: deck.problemStatement?.split(".")?.[0] || "Market gap identified",
    sections: [
      {
        heading: "Problem Statement",
        bullets: splitToBullets(deck.problemStatement, 5),
        evidenceTag: "MODELED",
      },
      ...(deck.customerPersona?.painPoints?.length ? [{
        heading: "Customer Pain Points",
        bullets: deck.customerPersona.painPoints.slice(0, 4),
        evidenceTag: "VERIFIED" as const,
      }] : []),
    ],
    metadata: { ...meta, dataSource: "Market analysis" },
  });

  // 2. Solution
  slides.push({
    id: "solution",
    title: "The Solution",
    headline: deck.elevatorPitch?.split(".")?.[0] || productName,
    sections: [
      { heading: "Solution", bullets: splitToBullets(deck.solutionStatement, 4), evidenceTag: "MODELED" },
      { heading: "Elevator Pitch", bullets: [deck.elevatorPitch || ""], evidenceTag: "MODELED" },
    ],
    metadata: { ...meta, dataSource: "Strategic analysis" },
  });

  // 3. Why Now
  slides.push({
    id: "whynow",
    title: "Why Now",
    headline: "Market timing advantage",
    sections: [
      { heading: "Market Timing", bullets: splitToBullets(deck.whyNow, 4), evidenceTag: "MODELED" },
    ],
    metadata: { ...meta, dataSource: "Trend analysis" },
  });

  // 4. Market
  if (deck.marketOpportunity) {
    slides.push({
      id: "market",
      title: "Market Opportunity",
      headline: `TAM: ${deck.marketOpportunity.tam}`,
      sections: [
        {
          heading: "Market Size",
          bullets: [`TAM: ${deck.marketOpportunity.tam}`, `SAM: ${deck.marketOpportunity.sam}`, `SOM: ${deck.marketOpportunity.som}`],
          evidenceTag: "MODELED",
        },
        ...(deck.marketOpportunity.keyDrivers?.length ? [{
          heading: "Key Drivers",
          bullets: deck.marketOpportunity.keyDrivers.slice(0, 5),
          evidenceTag: "VERIFIED" as const,
        }] : []),
      ],
      dataCallout: { label: "Growth Rate", value: deck.marketOpportunity.growthRate || "N/A" },
      metadata: { ...meta, dataSource: "Market data" },
    });
  }

  // 5. Product
  slides.push({
    id: "product",
    title: "Product / Innovation",
    headline: "Structural differentiation",
    sections: [
      ...(deck.productInnovation ? [{ heading: "Innovation", bullets: splitToBullets(deck.productInnovation, 3), evidenceTag: "MODELED" as const }] : []),
      ...(deck.competitiveAdvantages?.length ? [{ heading: "Competitive Advantages", bullets: deck.competitiveAdvantages.slice(0, 5), evidenceTag: "VERIFIED" as const }] : []),
    ],
    metadata: { ...meta, dataSource: "Product analysis" },
  });

  // 6. Business Model
  slides.push({
    id: "businessmodel",
    title: "Business Model",
    sections: [
      ...(deck.businessModel?.revenueStreams?.length ? [{ heading: "Revenue Streams", bullets: deck.businessModel.revenueStreams.slice(0, 4), evidenceTag: "MODELED" as const }] : []),
      ...(deck.financialModel?.unitEconomics ? [{
        heading: "Unit Economics",
        bullets: [
          `COGS: ${deck.financialModel.unitEconomics.cogs}`,
          `Gross Margin: ${deck.financialModel.unitEconomics.grossMargin}`,
          `Payback: ${deck.financialModel.unitEconomics.paybackPeriod}`,
        ],
        evidenceTag: "MODELED" as const,
      }] : []),
    ],
    metadata: { ...meta, dataSource: "Financial model" },
  });

  // 7. Traction
  if (deck.tractionSignals?.length) {
    slides.push({
      id: "traction",
      title: "Traction Signals",
      sections: [{ heading: "Early Signals", bullets: deck.tractionSignals.slice(0, 5), evidenceTag: "VERIFIED" }],
      metadata: { ...meta, dataSource: "Market signals" },
    });
  }

  // 8. Risks
  if (deck.risks?.length) {
    slides.push({
      id: "risks",
      title: "Risks & Mitigation",
      sections: deck.risks.slice(0, 5).map((r: any) => ({
        heading: r.risk,
        bullets: [r.mitigation],
        evidenceTag: r.severity === "high" ? "ASSUMPTION" as const : "MODELED" as const,
        dataRef: r.severity,
      })),
      metadata: { ...meta, dataSource: "Risk analysis" },
    });
  }

  // 9. Metrics
  if (deck.keyMetrics?.length) {
    slides.push({
      id: "metrics",
      title: "Metrics That Matter",
      sections: deck.keyMetrics.slice(0, 5).map((m: any) => ({
        heading: m.metric,
        bullets: [m.why],
        evidenceTag: "MODELED" as const,
        dataRef: m.target,
      })),
      metadata: { ...meta, dataSource: "KPI framework" },
    });
  }

  // 10. GTM
  if (deck.gtmStrategy) {
    slides.push({
      id: "gtm",
      title: "Go-To-Market",
      sections: [
        { heading: "Phase 1: Launch", bullets: splitToBullets(deck.gtmStrategy.phase1, 3), evidenceTag: "MODELED" },
        { heading: "Phase 2: Scale", bullets: splitToBullets(deck.gtmStrategy.phase2, 3), evidenceTag: "ASSUMPTION" },
        ...(deck.gtmStrategy.keyChannels?.length ? [{ heading: "Channels", bullets: deck.gtmStrategy.keyChannels.slice(0, 4), evidenceTag: "VERIFIED" as const }] : []),
      ],
      dataCallout: { label: "Launch Budget", value: deck.gtmStrategy.launchBudget || "TBD" },
      metadata: { ...meta, dataSource: "Strategy model" },
    });
  }

  // 11. Competitive
  if (deck.competitiveLandscape) {
    slides.push({
      id: "competitive",
      title: "Competitive Landscape",
      sections: [
        ...(deck.competitiveLandscape.directCompetitors?.length ? [{
          heading: "Direct Competitors",
          bullets: deck.competitiveLandscape.directCompetitors.slice(0, 4).map((c: any) => `${c.name}: ${c.weakness}`),
          evidenceTag: "VERIFIED" as const,
        }] : []),
        ...(deck.competitiveLandscape.moat ? [{ heading: "Moat", bullets: [deck.competitiveLandscape.moat], evidenceTag: "MODELED" as const }] : []),
      ],
      metadata: { ...meta, dataSource: "Competitive intel" },
    });
  }

  // 12. Investment
  if (deck.investmentAsk || deck.financialModel) {
    slides.push({
      id: "invest",
      title: "Investment Ask",
      sections: [
        ...(deck.investmentAsk?.amount ? [{ heading: "Ask", bullets: [deck.investmentAsk.amount], evidenceTag: "MODELED" as const }] : []),
        ...(deck.investmentAsk?.useOfFunds?.length ? [{ heading: "Use of Funds", bullets: deck.investmentAsk.useOfFunds.slice(0, 5), evidenceTag: "MODELED" as const }] : []),
        ...(deck.financialModel?.exitStrategy ? [{ heading: "Exit Strategy", bullets: [deck.financialModel.exitStrategy], evidenceTag: "ASSUMPTION" as const }] : []),
      ],
      dataCallout: deck.investmentAsk?.amount ? { label: "Funding Ask", value: deck.investmentAsk.amount } : undefined,
      metadata: { ...meta, dataSource: "Financial model" },
    });
  }

  return slides;
}

function splitToBullets(text: string | undefined, max: number): string[] {
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, max);
}
