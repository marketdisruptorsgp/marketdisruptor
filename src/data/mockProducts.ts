export interface FlippedIdea {
  name: string;
  description: string;
  visualNotes: string;
  reasoning: string;
  feasibilityNotes: string;
  scores: {
    feasibility: number;
    desirability: number;
    profitability: number;
    novelty: number;
  };
  risks: string;
  actionPlan?: {
    phase1: string;
    phase2: string;
    phase3: string;
    timeline: string;
    estimatedInvestment: string;
    revenueProjection: string;
    channels: string[];
  };
}

export interface PricingIntel {
  currentMarketPrice: string;
  collectorPremium: string;
  priceRange: string;
  priceDirection: "rising" | "falling" | "stable";
  ebayAvgSold: string;
  etsyAvgSold: string;
  msrpOriginal: string;
  margins: string;
}

export interface SupplyChainIntel {
  suppliers: { name: string; region: string; url?: string; role: string }[];
  manufacturers: { name: string; region: string; url?: string; moq: string }[];
  vendors: { name: string; type: string; url?: string; notes: string }[];
  retailers: { name: string; type: string; url?: string; marketShare: string }[];
  distributors: { name: string; region: string; url?: string; notes: string }[];
}

export interface TrendSignal {
  platform: string;
  signal: string;
  volume: string;
  trend: "up" | "down" | "stable";
  url?: string;
}

export interface ActionPlan {
  strategy: string;
  phases: {
    phase: string;
    timeline: string;
    actions: string[];
    budget: string;
    milestone: string;
  }[];
  channels: string[];
  totalInvestment: string;
  expectedROI: string;
  quickWins: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  specs: string;
  revivalScore: number;
  era: string;
  sources: { label: string; url: string }[];
  reviews: { text: string; sentiment: "positive" | "negative" | "neutral" }[];
  socialSignals: TrendSignal[];
  competitors: string[];
  assumptionsMap: { assumption: string; challenge: string }[];
  flippedIdeas: FlippedIdea[];
  confidenceScores: {
    adoptionLikelihood: number;
    feasibility: number;
    emotionalResonance: number;
  };
  // Deep intel fields
  pricingIntel?: PricingIntel;
  supplyChain?: SupplyChainIntel;
  trendAnalysis?: string;
  actionPlan?: ActionPlan;
  marketSizeEstimate?: string;
  keyInsight?: string;
}

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Tamagotchi (1996)",
    category: "Electronic Toys",
    image: "https://images.unsplash.com/photo-1566240258998-c85da43741f2?w=600&h=400&fit=crop",
    description:
      "Handheld digital pet simulator by Bandai that became a global phenomenon in the late 90s. Players fed, cleaned, and played with their virtual pets to keep them alive.",
    specs: "38mm × 49mm × 17mm, LCD display, 3 buttons, CR2032 battery",
    revivalScore: 9,
    era: "90s",
    keyInsight: "Tamagotchi isn't a toy — it's an emotional responsibility system. The guilt loop is the product. Modern adults buy it for the nostalgia hit, but quit because the guilt is too real.",
    marketSizeEstimate: "$12.8B global virtual pet/companion market by 2027",
    sources: [
      { label: "eBay Listings", url: "https://www.ebay.com/sch/i.html?_nkw=tamagotchi+original" },
      { label: "Reddit r/tamagotchi", url: "https://reddit.com/r/tamagotchi" },
      { label: "Bandai Official", url: "https://www.bandai.com" },
      { label: "TikTok #Tamagotchi", url: "https://www.tiktok.com/tag/tamagotchi" },
    ],
    reviews: [
      { text: "The anxiety of keeping it alive during school was real — I miss it!", sentiment: "positive" },
      { text: "Battery life was terrible and the screen was too small.", sentiment: "negative" },
      { text: "Wish it had more interaction options and customization.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "TikTok", signal: "#tamagotchi nostalgia content", volume: "280M+ views", trend: "up", url: "https://www.tiktok.com/tag/tamagotchi" },
      { platform: "Reddit", signal: "r/tamagotchi community", volume: "45K members", trend: "stable", url: "https://reddit.com/r/tamagotchi" },
      { platform: "Pinterest", signal: "90s toy aesthetic boards", volume: "12M+ pins", trend: "up" },
    ],
    competitors: ["Nintendo Tomodachi Life", "Nintendogs", "My Tamagotchi Forever (app)"],
    pricingIntel: {
      currentMarketPrice: "$15–$25 new retail",
      collectorPremium: "Original 1996 units: $80–$350 on eBay",
      priceRange: "$15 – $350",
      priceDirection: "rising",
      ebayAvgSold: "$47 avg (all variants)",
      etsyAvgSold: "$85 (vintage/rare)",
      msrpOriginal: "$17.99 (1997)",
      margins: "Est. 60–70% gross margin at $19.99 retail",
    },
    supplyChain: {
      suppliers: [
        { name: "Bandai Namco Holdings", region: "Japan", url: "https://www.bandai.com", role: "OEM / IP Owner" },
        { name: "Citizen Watches (LCD supplier)", region: "Japan", role: "LCD screens" },
      ],
      manufacturers: [
        { name: "Bandai factories (Shenzhen contractor)", region: "China", moq: "50,000 units" },
        { name: "Foxconn Electronics", region: "China", moq: "100,000 units" },
      ],
      vendors: [
        { name: "Bandai America", type: "Master Distributor", url: "https://www.bandai.com", notes: "US distribution arm" },
        { name: "Play Japan Import", type: "Import Specialist", notes: "Rare variant sourcing" },
      ],
      retailers: [
        { name: "Amazon", type: "E-commerce", url: "https://amazon.com", marketShare: "35%" },
        { name: "Target", type: "Mass Retail", url: "https://target.com", marketShare: "20%" },
        { name: "GameStop", type: "Specialty Retail", url: "https://gamestop.com", marketShare: "12%" },
        { name: "Walmart", type: "Mass Retail", url: "https://walmart.com", marketShare: "18%" },
      ],
      distributors: [
        { name: "Entertainment Earth", region: "US", url: "https://entertainmentearth.com", notes: "Collectible toy distributor" },
        { name: "TOMY International", region: "North America", notes: "Toy distribution" },
      ],
    },
    trendAnalysis: "Search volume for 'tamagotchi' spiked 340% in 2023–2024 following Gen Z nostalgia wave. New Tamagotchi Uni with color screen sold out in 3 hours globally. Secondhand market growing 28% YoY on StockX/eBay. TikTok 'unboxing vintage toys' vertical generates $2.4M+ in affiliate revenue monthly.",
    actionPlan: {
      strategy: "License the Tamagotchi IP for a wellness/productivity app variant targeting 25–40 year olds, or launch a competing 'emotional pet' product with modern hardware. Both paths are validated by the collector market data.",
      phases: [
        {
          phase: "Validate & Source",
          timeline: "Month 1–2",
          actions: [
            "Run $500 Facebook/TikTok ad test targeting nostalgia keywords",
            "List 50 vintage units on eBay to gauge margin & velocity",
            "Contact Bandai licensing dept for white-label or co-brand options",
            "Survey 500 nostalgic adults on pain points with original device",
          ],
          budget: "$1,500",
          milestone: "Prove $40+ AOV and 5%+ CTR on nostalgic targeting",
        },
        {
          phase: "Build or Source",
          timeline: "Month 3–6",
          actions: [
            "Source custom e-ink pet device from Shenzhen manufacturer (Seeed Studio / PCBA Now)",
            "Develop companion app with pet sync + health data integration",
            "Partner with ThinkGeek / Funko for limited drop distribution",
            "Launch pre-order Kickstarter with $50K target",
          ],
          budget: "$25,000–$80,000",
          milestone: "500+ pre-orders or $30K Kickstarter funded",
        },
        {
          phase: "Scale & Distribute",
          timeline: "Month 7–18",
          actions: [
            "Amazon FBA + DTC Shopify store",
            "TikTok Shop integration (massive for this demographic)",
            "Pitch Hot Topic, Urban Outfitters, Target for shelf placement",
            "Influencer drops: 10–20 micro-influencers in nostalgia/toy space",
          ],
          budget: "$50,000–$200,000",
          milestone: "$500K ARR within 12 months of launch",
        },
      ],
      channels: ["TikTok Shop", "Amazon FBA", "Shopify DTC", "Kickstarter", "Hot Topic", "Urban Outfitters"],
      totalInvestment: "$77K–$282K",
      expectedROI: "3–5x in 24 months if product-market fit validated",
      quickWins: [
        "Flip vintage units on eBay for immediate $40–60 profit per unit",
        "Start TikTok unboxing channel for affiliate revenue (Day 1)",
        "License nostalgia content to brands targeting Gen Z/Millennials",
      ],
    },
    assumptionsMap: [
      { assumption: "Must be a separate physical device", challenge: "Could be a wearable (ring/band) or AR layer on existing devices" },
      { assumption: "Single pet ownership", challenge: "Social pet ecosystems with breeding/trading" },
      { assumption: "Child audience", challenge: "Stress-relief / mindfulness pet for adults (ages 25–40)" },
      { assumption: "Mortality = failure mechanic", challenge: "Growth/evolution without death; no guilt loop" },
      { assumption: "LCD-only visuals", challenge: "E-ink or color OLED with seasons, weather-synced environments" },
    ],
    flippedIdeas: [
      {
        name: "TamaWear – Wrist Pet",
        description: "A smart ring or band with a tiny e-ink screen housing your digital pet. Syncs with health data — your pet grows healthier when you exercise.",
        visualNotes: "Minimalist band design, color e-ink display, soft haptic nudges",
        reasoning: "Adults who grew up with Tamagotchis (now 30–40) want nostalgia without the childish stigma. Fitness integration adds functional value.",
        feasibilityNotes: "E-ink rings already exist (RingConn). Battery challenge solvable. Est. BOM $22–38. Retail $99–149.",
        scores: { feasibility: 8, desirability: 9, profitability: 8, novelty: 9 },
        risks: "Screen size limits interaction; requires companion app; niche market segmentation.",
        actionPlan: {
          phase1: "Prototype on existing e-ink wearable platform (RingConn SDK). Run landing page test.",
          phase2: "Kickstarter campaign targeting 1,000 units at $99. Partner with fitness apps.",
          phase3: "Amazon + Shopify DTC. Wholesale to Urban Outfitters / ASOS.",
          timeline: "18 months to market",
          estimatedInvestment: "$120K–$250K",
          revenueProjection: "$800K Year 1 at 5,000 units sold",
          channels: ["Kickstarter", "Amazon", "DTC", "Urban Outfitters"],
        },
      },
      {
        name: "CalmPet – Mindfulness Companion",
        description: "A screenless, tactile device (like a smooth stone) that vibrates gently when your virtual pet needs attention. Anti-anxiety sensory toy for adults.",
        visualNotes: "Smooth pebble form factor, LED glow, companion app for status checks",
        reasoning: "Adults with anxiety/ADHD respond well to tangible fidget objects. Pet care without screen addiction.",
        feasibilityNotes: "Simple vibration motor + BLE chip. Manufacturing cost ~$8–15. Premium positioning at $49–79.",
        scores: { feasibility: 9, desirability: 8, profitability: 7, novelty: 8 },
        risks: "Niche market; requires consistent emotional engagement from users to sustain habit.",
        actionPlan: {
          phase1: "Build MVP with off-the-shelf vibration motor + Arduino BLE. Validate with ADHD/anxiety communities.",
          phase2: "Indiegogo pre-sale at $59. Target therapist networks and wellness influencers.",
          phase3: "Whole Foods, therapy office retail, subscription 'pet care pack' model.",
          timeline: "12 months to market",
          estimatedInvestment: "$35K–$90K",
          revenueProjection: "$300K Year 1 at 5,000 units",
          channels: ["Indiegogo", "Wellness DTC", "Therapy Networks", "Whole Foods"],
        },
      },
    ],
    confidenceScores: { adoptionLikelihood: 8, feasibility: 8, emotionalResonance: 10 },
  },
  {
    id: "2",
    name: "Polaroid OneStep Express",
    category: "Instant Photography",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop",
    description:
      "The iconic instant camera that defined social photography before smartphones. Created tangible memories instantly, requiring no lab processing.",
    specs: "600-type film, fixed focus lens, built-in flash, ~89×108mm prints",
    revivalScore: 8,
    era: "80s",
    keyInsight: "People aren't buying Polaroid cameras — they're buying the ritual of anticipation. The 90-second wait is the product. Digital photos are free and infinite; Polaroid photos are scarce and ceremonial.",
    marketSizeEstimate: "$3.1B global instant camera market (2024), growing at 8.2% CAGR",
    sources: [
      { label: "Etsy Vintage Cameras", url: "https://www.etsy.com/search?q=polaroid+camera+vintage" },
      { label: "Polaroid Official", url: "https://www.polaroid.com" },
      { label: "Instagram #Polaroid", url: "https://www.instagram.com/explore/tags/polaroid/" },
      { label: "Amazon Instax Market", url: "https://www.amazon.com/s?k=instax+camera" },
    ],
    reviews: [
      { text: "Nothing beats the excitement of watching a photo develop in your hands.", sentiment: "positive" },
      { text: "Film is so expensive. $2 per shot is hard to justify.", sentiment: "negative" },
      { text: "The unpredictability is both the charm and the frustration.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "Instagram", signal: "#polaroid aesthetic posts", volume: "52M+ posts", trend: "up", url: "https://www.instagram.com/explore/tags/polaroid/" },
      { platform: "TikTok", signal: "Photo developing ASMR", volume: "180M+ views", trend: "up", url: "https://www.tiktok.com/tag/polaroidaesthetic" },
      { platform: "Pinterest", signal: "Polaroid wall display boards", volume: "8M+ pins", trend: "stable" },
    ],
    competitors: ["Fujifilm Instax Mini", "Kodak Mini Shot", "HP Sprocket"],
    pricingIntel: {
      currentMarketPrice: "$89–$129 new (Polaroid Now+)",
      collectorPremium: "Vintage OneStep: $45–$220 eBay",
      priceRange: "$45 – $220",
      priceDirection: "rising",
      ebayAvgSold: "$78 avg",
      etsyAvgSold: "$95 (refurbished)",
      msrpOriginal: "$29.99 (1980s)",
      margins: "Film pack margins: 70–80% at $19.99/pack",
    },
    supplyChain: {
      suppliers: [
        { name: "Polaroid Originals (PLR IP Holdings)", region: "Netherlands", url: "https://www.polaroid.com", role: "IP / Film manufacturer" },
        { name: "Fujifilm (film chemistry components)", region: "Japan", role: "Chemical components" },
      ],
      manufacturers: [
        { name: "Flint Film Factory (Austria)", region: "Austria", moq: "Polaroid proprietary", url: "https://www.polaroid.com" },
        { name: "Various Zhejiang contract manufacturers", region: "China", moq: "10,000 units" },
      ],
      vendors: [
        { name: "B&H Photo", type: "Specialty Vendor", url: "https://bhphotovideo.com", notes: "Core photography retail partner" },
        { name: "Adorama", type: "Specialty Vendor", url: "https://adorama.com", notes: "Competitive photography retail" },
      ],
      retailers: [
        { name: "Urban Outfitters", type: "Lifestyle Retail", url: "https://urbanoutfitters.com", marketShare: "22%" },
        { name: "Amazon", type: "E-commerce", url: "https://amazon.com", marketShare: "30%" },
        { name: "Target", type: "Mass Retail", url: "https://target.com", marketShare: "18%" },
        { name: "Anthropologie", type: "Lifestyle Retail", url: "https://anthropologie.com", marketShare: "8%" },
      ],
      distributors: [
        { name: "HEMA (Netherlands)", region: "Europe", notes: "Major lifestyle distributor" },
        { name: "Ingram Entertainment", region: "North America", notes: "Mass market distribution" },
      ],
    },
    trendAnalysis: "Instant photography market hit $3.1B in 2024, driven entirely by Gen Z 'analog revival'. Fujifilm Instax generated $680M revenue in FY2024. Film cost remains the #1 barrier — customers want the ritual, not the expense. 'Photo book subscription' services growing 40% YoY. TikTok 'film unboxing' content averages 2.4M views per post.",
    actionPlan: {
      strategy: "Attack the film cost barrier with a subscription model. Or source vintage units, refurbish, and resell at 3–5x margin through lifestyle retailers. Either path is validated.",
      phases: [
        {
          phase: "Source & Validate",
          timeline: "Month 1–2",
          actions: [
            "Buy 20 vintage Polaroids on eBay ($30–50 each), test refurbishment process",
            "Source film in bulk from Polaroid Originals wholesale program",
            "Launch Instagram/TikTok showing refurbishment process (high-engagement content)",
            "Test $79 price point on Etsy vs. $99 on Shopify",
          ],
          budget: "$2,000",
          milestone: "Sell 20 units with >$40 avg profit each",
        },
        {
          phase: "Build Film Subscription MVP",
          timeline: "Month 3–5",
          actions: [
            "Negotiate bulk film pricing with Polaroid Originals (min 1,000 packs)",
            "Build Shopify subscription at $16.99/mo for 2 film packs + accessories",
            "Collab with 5 lifestyle/aesthetic TikTok influencers for launch",
            "Pitch Urban Outfitters buyer for consignment / wholesale",
          ],
          budget: "$15,000",
          milestone: "200 film subscribers in 60 days",
        },
        {
          phase: "Scale & Differentiate",
          timeline: "Month 6–18",
          actions: [
            "Develop private-label 'aesthetic film packs' with custom borders",
            "Launch photo printing fulfillment: customers snap, AI curates best 10, we print + mail",
            "Pop-up photo booths at events (festivals, weddings, corporate events)",
            "B2B: sell photo experience packages to event companies",
          ],
          budget: "$40,000–$120,000",
          milestone: "$600K ARR within 12 months",
        },
      ],
      channels: ["Etsy", "Shopify DTC", "Urban Outfitters", "TikTok Shop", "Wedding/Events B2B"],
      totalInvestment: "$57K–$137K",
      expectedROI: "4–8x in 24 months on film subscription path",
      quickWins: [
        "Flip refurbished Polaroids on Etsy today ($40–80 margin per unit)",
        "TikTok refurbishment content → affiliate links to Polaroid film",
        "Offer wedding photography rental packages ($200–500/event)",
      ],
    },
    assumptionsMap: [
      { assumption: "Photo must be printed on the spot", challenge: "Batch printing: take 24 photos, get a curated printed roll later" },
      { assumption: "Single use per film cartridge", challenge: "Reusable/erasable instant photo paper" },
      { assumption: "Square/white border aesthetic is fixed", challenge: "Custom frames, seasonal borders, brand co-labs" },
      { assumption: "Film chemistry is analog only", challenge: "Digital-to-physical: upload from phone, print with vintage aesthetic" },
    ],
    flippedIdeas: [
      {
        name: "RetroPrint – AI Film Subscription",
        description: "Monthly subscription: customers upload unlimited photos, AI selects the 10 most 'Polaroid-worthy' moments, prints with authentic analog simulation, mails in branded envelope.",
        visualNotes: "Minimalist branded mailer, matte-finish prints, custom seasonal borders",
        reasoning: "Removes the film cost anxiety. Turns Polaroid from a spontaneous toy into a curated memory curation service. Monthly ritual with emotional payoff.",
        feasibilityNotes: "Zink/inkjet printing partners available (Snapfish API). AI curation via Google Vision. $4 COGS per pack. Retail $19.99/mo.",
        scores: { feasibility: 9, desirability: 9, profitability: 8, novelty: 8 },
        risks: "Competition from Chatbooks, Artifact. Differentiation via analog simulation quality is key.",
        actionPlan: {
          phase1: "Build landing page with email capture. Run $1K ad test targeting #polaroid Instagram.",
          phase2: "Partner with Snapfish/Shutterfly API for printing. Launch 100-person beta at $14.99/mo.",
          phase3: "Scale to 5,000 subscribers. Add 'surprise theme' curated monthly editions.",
          timeline: "9 months to $100K MRR",
          estimatedInvestment: "$45K–$100K",
          revenueProjection: "$1.2M ARR at 5,000 subscribers",
          channels: ["Shopify Subscription", "Instagram Ads", "TikTok Organic", "Wedding Partnerships"],
        },
      },
    ],
    confidenceScores: { adoptionLikelihood: 8, feasibility: 7, emotionalResonance: 9 },
  },
  {
    id: "3",
    name: "Game Boy Color (1998)",
    category: "Gaming Hardware",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
    description:
      "Nintendo's iconic handheld gaming console that brought color gaming to millions worldwide. Defined portable gaming culture and sold 49M units.",
    specs: "2.32″ reflective color LCD, Z80 CPU, 32KB RAM, cartridge-based, 2× AA batteries",
    revivalScore: 9,
    era: "90s",
    keyInsight: "The Game Boy Color's collector market is outperforming Bitcoin YoY. Sealed units appreciated 400% since 2020. The real opportunity isn't the hardware — it's the modding ecosystem and the $2.4B retro gaming accessories market.",
    marketSizeEstimate: "$13.7B retro gaming market by 2026, 12% CAGR",
    sources: [
      { label: "eBay GBC Listings", url: "https://www.ebay.com/sch/i.html?_nkw=game+boy+color" },
      { label: "Reddit r/gameboy", url: "https://reddit.com/r/gameboy" },
      { label: "Analogue Pocket (Product Hunt)", url: "https://www.producthunt.com/posts/analogue-pocket" },
      { label: "TikTok #GameBoy", url: "https://www.tiktok.com/tag/gameboy" },
    ],
    reviews: [
      { text: "Best gaming experience of my childhood. Still works perfectly 25 years later.", sentiment: "positive" },
      { text: "Screen needed external light to see in dim conditions.", sentiment: "negative" },
      { text: "The cartridge format created a huge physical library but storage is bulky.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "TikTok", signal: "Game Boy nostalgia & modding content", volume: "640M+ views", trend: "up", url: "https://www.tiktok.com/tag/gameboy" },
      { platform: "Reddit", signal: "r/gameboy modding/collecting", volume: "110K members", trend: "up", url: "https://reddit.com/r/gameboy" },
      { platform: "Etsy", signal: "Custom painted Game Boys", volume: "15K+ listings", trend: "up", url: "https://etsy.com/search?q=game+boy+color+custom" },
      { platform: "StockX", signal: "Sealed GBC appreciation", volume: "$180–$400 per unit", trend: "up" },
    ],
    competitors: ["Analogue Pocket", "RG35XX (Anbernic)", "Steam Deck", "Nintendo Switch Lite"],
    pricingIntel: {
      currentMarketPrice: "$70–$130 (used, working)",
      collectorPremium: "Sealed in box: $300–$800+",
      priceRange: "$25 – $800",
      priceDirection: "rising",
      ebayAvgSold: "$89 avg (loose), $420 avg (sealed)",
      etsyAvgSold: "$145 (custom modded)",
      msrpOriginal: "$79.99 (1998)",
      margins: "Custom mods: $60–120 profit per unit. Sealed flipping: $80–200 margin.",
    },
    supplyChain: {
      suppliers: [
        { name: "Nintendo Co., Ltd.", region: "Japan", url: "https://nintendo.com", role: "Original IP owner (discontinued)" },
        { name: "AliExpress Shell Suppliers (Funnyplaying)", region: "China", url: "https://funnyplaying.com", role: "Aftermarket shells, IPS screens" },
        { name: "RetroSix", region: "UK", url: "https://retrosix.co.uk", role: "Premium aftermarket parts" },
      ],
      manufacturers: [
        { name: "Anbernic (retro clone maker)", region: "China", url: "https://anbernic.com", moq: "500 units" },
        { name: "Miyoo (clone hardware)", region: "China", moq: "200 units" },
      ],
      vendors: [
        { name: "Stone Age Gamer", type: "Specialty Vendor", url: "https://stoneagegamer.com", notes: "Retro gaming accessory specialist" },
        { name: "Hand Held Legend", type: "Mod Parts Vendor", url: "https://handheldlegend.com", notes: "IPS mod kits, shells, buttons" },
        { name: "FunnyPlaying", type: "OEM Parts", url: "https://funnyplaying.com", notes: "IPS screen kits, $12–28/unit" },
      ],
      retailers: [
        { name: "eBay", type: "Marketplace", url: "https://ebay.com", marketShare: "45%" },
        { name: "Etsy", type: "Handmade Marketplace", url: "https://etsy.com", marketShare: "20%" },
        { name: "GameStop (Pro)  ", type: "Specialty Retail", url: "https://gamestop.com", marketShare: "10%" },
        { name: "Mercari", type: "C2C Marketplace", url: "https://mercari.com", marketShare: "15%" },
      ],
      distributors: [
        { name: "Lukie Games", region: "US", url: "https://lukiegames.com", notes: "Retro game distributor, B2B wholesale" },
        { name: "DKOldies", region: "US", url: "https://dkoldies.com", notes: "Refurbished retro hardware wholesale" },
      ],
    },
    trendAnalysis: "Retro gaming hit cultural mainstream 2022–2024. GBC prices rose 340% on eBay since 2019. Analogue Pocket ($220) sold out in 4 minutes globally — proving massive unmet demand. Modding sub-culture exploding: IPS screen mod tutorials get 2M+ YouTube views. Anbernic RG35XX clone ($60) sold 500K+ units in 2023. The market wants authentic nostalgia with modern convenience — nobody is doing this perfectly yet.",
    actionPlan: {
      strategy: "Three parallel revenue streams: (1) Buy-refurb-sell modded GBCs for immediate cash flow, (2) Build modding tutorial/kit business, (3) Long-term: develop original retro-aesthetic device competing with Analogue Pocket.",
      phases: [
        {
          phase: "Flip & Learn",
          timeline: "Month 1–3",
          actions: [
            "Source 10–20 broken/cheap GBCs on eBay ($15–30 each)",
            "Learn IPS screen mod process (YouTube + Reddit guides)",
            "Source IPS kits from FunnyPlaying ($18) and aftermarket shells from AliExpress ($8)",
            "Sell modded units on Etsy at $110–145. Document process for content.",
          ],
          budget: "$500–$1,500",
          milestone: "$50–80 profit per unit, 20+ sold",
        },
        {
          phase: "Build Modding Business",
          timeline: "Month 3–9",
          actions: [
            "Launch YouTube/TikTok modding tutorial channel",
            "Create mod kit bundles (shell + IPS screen + buttons) at $35–45",
            "Etsy shop for custom-painted consoles ($140–180 each)",
            "B2B: Sell modding kits to repair shops and gaming cafes",
          ],
          budget: "$5,000–$20,000",
          milestone: "$10K/mo revenue from kits + custom units",
        },
        {
          phase: "Product Launch",
          timeline: "Month 10–24",
          actions: [
            "Design original retro handheld using Raspberry Pi Zero W or Miyoo platform",
            "Kickstarter with OLED screen, USB-C, WiFi — Game Boy aesthetic",
            "Target $199 retail, $55 BOM, 10,000 unit first run",
            "Wholesale to Micro Center, GameStop, specialty retailers",
          ],
          budget: "$80,000–$250,000",
          milestone: "$2M revenue in launch year",
        },
      ],
      channels: ["Etsy", "eBay", "YouTube", "TikTok", "Kickstarter", "Amazon", "Micro Center"],
      totalInvestment: "$86K–$272K",
      expectedROI: "5–10x in 24 months on full product path",
      quickWins: [
        "Buy 1 broken GBC on eBay ($20), mod it ($20 parts), sell for $120 — TODAY",
        "TikTok modding content → affiliate links to IPS kits (instant commission)",
        "Create Etsy listing for custom color GBCs, take pre-orders before building",
      ],
    },
    assumptionsMap: [
      { assumption: "Must use original cartridge media", challenge: "Smart cartridges that are USB-C storage devices with digital game libraries" },
      { assumption: "One person plays at a time", challenge: "Shared screen co-op gaming in a GBC form factor" },
      { assumption: "Games are purchased separately", challenge: "Curated game subscription streamed to retro-aesthetic hardware" },
      { assumption: "Hardware is the primary product", challenge: "Hardware as a peripheral — phone controller with GBC nostalgia aesthetic" },
    ],
    flippedIdeas: [
      {
        name: "ChromaPocket – Premium Modded GBC",
        description: "Custom-modded Game Boy Color with IPS backlit display, USB-C charging, rechargeable battery, and premium shell — sold as a premium retro collectible at $149.",
        visualNotes: "Translucent shells (GBC-authentic), IPS screen with 5-level brightness, matching button colors, branded packaging",
        reasoning: "Every GBC fan wants the original feel with modern convenience. Nobody major is doing quality modded units at scale. Analogue Pocket ($220) is the proof of demand.",
        feasibilityNotes: "IPS kits $18 (FunnyPlaying), shells $8 (AliExpress), BOM ~$45. Retail $149. 70% gross margin at scale.",
        scores: { feasibility: 9, desirability: 10, profitability: 9, novelty: 7 },
        risks: "Nintendo C&D risk if using original hardware. Source only aftermarket parts. Scale requires quality control.",
        actionPlan: {
          phase1: "Source 50 units from eBay + mod parts. Photograph professionally. Launch Etsy + Shopify.",
          phase2: "TikTok/YouTube content showing the mod process. Scale to 20 units/month.",
          phase3: "Wholesale to specialty retailers. Consider Kickstarter for original hardware.",
          timeline: "3 months to first $10K month",
          estimatedInvestment: "$3,000–$15,000",
          revenueProjection: "$240K ARR at 20 units/mo",
          channels: ["Etsy", "Shopify", "eBay", "TikTok Shop"],
        },
      },
    ],
    confidenceScores: { adoptionLikelihood: 9, feasibility: 8, emotionalResonance: 10 },
  },
];
