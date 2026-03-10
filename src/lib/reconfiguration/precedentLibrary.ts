/**
 * STRATEGIC PRECEDENT LIBRARY
 *
 * Maps strategic direction archetypes to real companies that executed
 * structurally similar moves. Used as a deterministic fallback when
 * the AI doesn't return strategicPrecedents, and as enrichment data
 * for the UI.
 */

export interface PrecedentEntry {
  company: string;
  description: string;
  pattern: string;
}

/**
 * Precedents indexed by strategic direction ID.
 * Each direction has 4-6 entries; the system picks 2-3 most relevant.
 */
export const PRECEDENT_LIBRARY: Record<string, PrecedentEntry[]> = {
  automate: [
    { company: "ServiceTitan", description: "Automated contractor scheduling, dispatch, and invoicing to replace manual coordinator workflows", pattern: "workflow automation" },
    { company: "Gusto", description: "Turned manual payroll and HR administration into an automated platform for small businesses", pattern: "operational automation" },
    { company: "Loom", description: "Replaced synchronous meetings with asynchronous video, automating communication overhead", pattern: "process automation" },
    { company: "Zapier", description: "Automated cross-application workflows that previously required manual data entry", pattern: "integration automation" },
  ],
  platformize: [
    { company: "Shopify", description: "Transformed merchant tooling into an ecosystem platform with apps, payments, and fulfillment", pattern: "platformization" },
    { company: "Toast", description: "Evolved from restaurant POS into a full operational platform with payroll, delivery, and marketing", pattern: "vertical platform" },
    { company: "Procore", description: "Turned construction project management into a platform connecting GCs, subs, and owners", pattern: "industry platform" },
    { company: "Mindbody", description: "Built a platform for fitness and wellness businesses that became the industry operating system", pattern: "vertical SaaS platform" },
  ],
  aggregate: [
    { company: "Zillow", description: "Aggregated fragmented real estate listings into a single discovery platform", pattern: "supply aggregation" },
    { company: "Zocdoc", description: "Aggregated fragmented healthcare provider availability into a unified booking system", pattern: "marketplace aggregation" },
    { company: "Convoy", description: "Aggregated fragmented trucking capacity to improve utilization and reduce empty miles", pattern: "capacity aggregation" },
    { company: "Faire", description: "Aggregated independent retail buyers and wholesale brands into a single marketplace", pattern: "supply-demand aggregation" },
  ],
  marketplace: [
    { company: "Uber", description: "Created a two-sided marketplace matching drivers with riders in real time", pattern: "marketplace creation" },
    { company: "Thumbtack", description: "Built a marketplace connecting homeowners with local service professionals", pattern: "services marketplace" },
    { company: "Upwork", description: "Created a global marketplace for freelance talent across skill categories", pattern: "talent marketplace" },
    { company: "Vettery", description: "Built a curated talent marketplace that flipped recruiting from outbound to inbound", pattern: "curated marketplace" },
  ],
  go_direct: [
    { company: "Warby Parker", description: "Bypassed optical retail distribution to sell eyewear directly to consumers", pattern: "direct-to-consumer" },
    { company: "Tesla", description: "Eliminated dealer networks to sell vehicles directly through company-owned stores and online", pattern: "disintermediation" },
    { company: "Dollar Shave Club", description: "Cut out retail distribution with a direct subscription model for razors", pattern: "DTC subscription" },
    { company: "Casper", description: "Bypassed mattress showroom distribution with direct online sales and trial model", pattern: "direct distribution" },
  ],
  productize: [
    { company: "Basecamp", description: "Turned internal project management practices into a commercial SaaS product", pattern: "internal tool productization" },
    { company: "Slack", description: "Productized an internal communication tool built for a game studio into a standalone product", pattern: "internal tool productization" },
    { company: "Palantir", description: "Productized custom data integration consulting into a repeatable software platform", pattern: "service-to-product" },
    { company: "HubSpot", description: "Turned inbound marketing methodology into a commercial software suite", pattern: "methodology productization" },
  ],
  data_layer: [
    { company: "Plaid", description: "Built the financial data infrastructure layer that banking apps depend on", pattern: "data infrastructure" },
    { company: "Segment", description: "Created a customer data platform that became the data routing layer for companies", pattern: "data platform" },
    { company: "Clearbit", description: "Built a business data enrichment layer used by sales and marketing platforms", pattern: "data enrichment" },
    { company: "Flatiron Health", description: "Aggregated oncology data from clinics into a research-grade data platform", pattern: "industry data platform" },
  ],
  franchise: [
    { company: "McDonald's", description: "Standardized restaurant operations into a replicable franchise model", pattern: "franchise standardization" },
    { company: "Orangetheory", description: "Turned a boutique fitness concept into a scalable franchise with standardized technology", pattern: "technology-enabled franchise" },
    { company: "The UPS Store", description: "Franchised shipping and business services with centralized logistics infrastructure", pattern: "service franchise" },
    { company: "Home Instead", description: "Franchised in-home senior care with standardized training and matching systems", pattern: "care franchise" },
  ],
};

/**
 * Get fallback precedents for a given direction ID.
 * Returns 2-3 entries or empty array if direction not found.
 */
export function getFallbackPrecedents(directionId: string): PrecedentEntry[] {
  const entries = PRECEDENT_LIBRARY[directionId];
  if (!entries) return [];
  return entries.slice(0, 3);
}
