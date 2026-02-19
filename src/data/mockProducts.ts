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
  socialSignals: { platform: string; signal: string; volume: string }[];
  competitors: string[];
  assumptionsMap: { assumption: string; challenge: string }[];
  flippedIdeas: FlippedIdea[];
  confidenceScores: {
    adoptionLikelihood: number;
    feasibility: number;
    emotionalResonance: number;
  };
}

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Tamagotchi (1996)",
    category: "Electronic Toys",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    description:
      "Handheld digital pet simulator by Bandai that became a global phenomenon in the late 90s. Players fed, cleaned, and played with their virtual pets to keep them alive.",
    specs: "38mm × 49mm × 17mm, LCD display, 3 buttons, CR2032 battery",
    revivalScore: 9,
    era: "90s",
    sources: [
      { label: "eBay Listings (2024)", url: "https://www.ebay.com/sch/i.html?_nkw=tamagotchi+original" },
      { label: "Reddit r/nostalgia", url: "https://reddit.com/r/nostalgia" },
      { label: "Bandai Official", url: "https://www.bandai.com" },
      { label: "TikTok #Tamagotchi", url: "https://www.tiktok.com/tag/tamagotchi" },
    ],
    reviews: [
      { text: "The anxiety of keeping it alive during school was real — I miss it!", sentiment: "positive" },
      { text: "Battery life was terrible and the screen was too small.", sentiment: "negative" },
      { text: "Wish it had more interaction options and customization.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "TikTok", signal: "#tamagotchi nostalgia content", volume: "280M+ views" },
      { platform: "Reddit", signal: "r/tamagotchi community", volume: "45K members" },
      { platform: "Pinterest", signal: "90s toy aesthetic boards", volume: "12M+ pins" },
    ],
    competitors: ["Nintendo Tomodachi Life", "Nintendogs", "My Tamagotchi Forever (app)"],
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
        feasibilityNotes: "E-ink rings already exist (RingConn). Battery challenge solvable. Est. BOM $22–38.",
        scores: { feasibility: 8, desirability: 9, profitability: 8, novelty: 9 },
        risks: "Screen size limits interaction; requires companion app; niche market segmentation.",
      },
      {
        name: "PetDAO – Blockchain Companion",
        description: "Social pet ecosystem where pets are tradeable NFTs with genetics. Breed two pets together, trade offspring, enter global tournaments.",
        visualNotes: "Rich art style, 3D animated pets, marketplace UI",
        reasoning: "Axie Infinity proved digital pet economics work. Combine nostalgia with social economy.",
        feasibilityNotes: "Web3 infrastructure mature. Moderation and speculative economy risks are real.",
        scores: { feasibility: 6, desirability: 7, profitability: 9, novelty: 7 },
        risks: "Crypto market volatility; regulatory uncertainty; requires large community to function.",
      },
      {
        name: "CalmPet – Mindfulness Companion",
        description: "A screenless, tactile device (like a smooth stone) that vibrates gently when your virtual pet needs attention. Anti-anxiety / sensory toy for adults.",
        visualNotes: "Smooth pebble form factor, LED glow, companion app for status checks",
        reasoning: "Adults with anxiety/ADHD respond well to tangible fidget objects. Pet care without screen addiction.",
        feasibilityNotes: "Simple vibration motor + BLE chip. Manufacturing cost ~$8–15. Premium positioning at $49–79.",
        scores: { feasibility: 9, desirability: 8, profitability: 7, novelty: 8 },
        risks: "Niche market; requires consistent emotional engagement from users to sustain habit.",
      },
    ],
    confidenceScores: { adoptionLikelihood: 8, feasibility: 8, emotionalResonance: 10 },
  },
  {
    id: "2",
    name: "Polaroid OneStep Express",
    category: "Photography",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    description:
      "The iconic instant camera that defined social photography before smartphones. Created tangible memories instantly, requiring no lab processing.",
    specs: "600-type film, fixed focus lens, built-in flash, ~89×108mm prints",
    revivalScore: 8,
    era: "80s",
    sources: [
      { label: "Etsy Vintage Cameras", url: "https://www.etsy.com/search?q=polaroid+camera+vintage" },
      { label: "Polaroid Originals", url: "https://www.polaroid.com" },
      { label: "Instagram #Polaroid", url: "https://www.instagram.com/explore/tags/polaroid/" },
      { label: "Amazon Instax Market", url: "https://www.amazon.com/s?k=instax+camera" },
    ],
    reviews: [
      { text: "Nothing beats the excitement of watching a photo develop in your hands.", sentiment: "positive" },
      { text: "Film is so expensive. $2 per shot is hard to justify.", sentiment: "negative" },
      { text: "The unpredictability is both the charm and the frustration.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "Instagram", signal: "#polaroid aesthetic posts", volume: "52M+ posts" },
      { platform: "TikTok", signal: "Photo developing ASMR", volume: "180M+ views" },
      { platform: "Pinterest", signal: "Polaroid wall display boards", volume: "8M+ pins" },
    ],
    competitors: ["Fujifilm Instax Mini", "Kodak Mini Shot", "HP Sprocket"],
    assumptionsMap: [
      { assumption: "Photo must be printed on the spot", challenge: "Batch printing: take 24 photos, get a printed roll later" },
      { assumption: "Single use per film cartridge", challenge: "Reusable/erasable instant photo paper" },
      { assumption: "Square/white border aesthetic is fixed", challenge: "Shape-shifting prints: circles, custom frames, video frames" },
      { assumption: "Film chemistry is analog only", challenge: "Digital-to-physical: upload from phone, print with vintage aesthetic" },
    ],
    flippedIdeas: [
      {
        name: "RetroPrint – Phone-to-Physical",
        description: "A portable printer that converts digital photos into vintage-look instant prints. Filter engine applies authentic chemical aging, grain, and color shifts.",
        visualNotes: "Compact printer with retro design, companion app with 50+ film simulations",
        reasoning: "People already love Lo-Fi filters on digital. Make the physical output match. Eliminates film cost problem.",
        feasibilityNotes: "Zink paper technology exists. Add AI film simulation layer. Est. BOM $18. Retail at $89–129.",
        scores: { feasibility: 9, desirability: 9, profitability: 8, novelty: 7 },
        risks: "Fujifilm Instax Link already partially addresses this. Differentiation via AI aesthetics is key.",
      },
      {
        name: "DelayedSnap – Printed Monthly Boxes",
        description: "A subscription camera that holds your photos digitally and auto-prints the 10 best moments each month, mailed as a curated photo set.",
        visualNotes: "Minimal camera, branded monthly envelope, letter-press style packaging",
        reasoning: "Anticipation + curation adds emotional value. Converts casual digital photography into physical keepsakes.",
        feasibilityNotes: "Camera hardware + cloud + printing fulfillment. Operational complexity high. D2C subscription model ~$14/mo.",
        scores: { feasibility: 6, desirability: 8, profitability: 7, novelty: 9 },
        risks: "Supply chain complexity; requires strong editorial/AI curation to justify premium.",
      },
    ],
    confidenceScores: { adoptionLikelihood: 8, feasibility: 7, emotionalResonance: 9 },
  },
  {
    id: "3",
    name: "Lego Technic 8880 Super Car (1994)",
    category: "Construction Toys",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop",
    description:
      "A landmark Lego Technic set featuring a fully functional V8 engine, working suspension, and gearbox. Defined engineering-based toy design for decades.",
    specs: "1477 pieces, working V8, 4WD, steering, gearbox. Dimensions: 48×19×15cm",
    revivalScore: 8,
    era: "90s",
    sources: [
      { label: "Bricklink Market", url: "https://www.bricklink.com" },
      { label: "eBay Collectibles", url: "https://www.ebay.com/sch/i.html?_nkw=lego+technic+8880" },
      { label: "Reddit r/lego", url: "https://reddit.com/r/lego" },
      { label: "Kickstarter Modular Builds", url: "https://www.kickstarter.com/discover/categories/design" },
    ],
    reviews: [
      { text: "Building the V8 engine felt like real engineering — my son loves it too.", sentiment: "positive" },
      { text: "Instructions are confusing and some pieces are proprietary.", sentiment: "negative" },
      { text: "Price has gone insane on the collector market — over $400 now.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "YouTube", signal: "LEGO Technic review/build videos", volume: "500M+ views" },
      { platform: "Reddit", signal: "r/lego MOC communities", volume: "680K members" },
      { platform: "TikTok", signal: "LEGO satisfying build content", volume: "320M+ views" },
    ],
    competitors: ["Meccano", "K'NEX", "STEM robot kits (Makeblock)", "Snap Circuits"],
    assumptionsMap: [
      { assumption: "Instructions are fixed/printed", challenge: "AR instruction overlay that adapts to your build pace" },
      { assumption: "Static display after build", challenge: "Modular ecosystem: parts transfer between sets" },
      { assumption: "Child or collector audience only", challenge: "Professional desk models for engineers/architects" },
      { assumption: "No connectivity/electronics required", challenge: "IoT Technic: built models connect to apps for monitoring" },
    ],
    flippedIdeas: [
      {
        name: "TechnicAR – Guided Build Platform",
        description: "A tablet/phone app with AR that shows exactly which piece goes where, in 3D, with real-time error detection. Works with any existing Technic set.",
        visualNotes: "Clean AR overlay on bricks, progress tracker, exploded 3D view mode",
        reasoning: "Instruction confusion is the #1 complaint. AR solves it while adding tech appeal. Subscription model for premium set overlays.",
        feasibilityNotes: "ARKit/ARCore mature. Computer vision for brick ID feasible. $3.99/mo subscription or one-time $19.99.",
        scores: { feasibility: 8, desirability: 9, profitability: 8, novelty: 8 },
        risks: "Requires significant content library investment; Apple Vision Pro could disrupt approach.",
      },
      {
        name: "OfficeKit – Desk Engineer Models",
        description: "Premium desk-scale functional mechanical models (engines, presses, clocks) using precision metal + resin parts. Targeted at engineers, designers, and executives.",
        visualNotes: "Matte metal finish, glass display dome, premium packaging — think 'adult collectible engineering'",
        reasoning: "Positioned between LEGO and luxury desk accessories. $150–400 price range. High margin.",
        feasibilityNotes: "CNC machined aluminum parts + 3D resin for detailed pieces. Manufacturing in Vietnam/Taiwan feasible.",
        scores: { feasibility: 7, desirability: 8, profitability: 9, novelty: 8 },
        risks: "High unit cost; niche audience; requires strong brand positioning and retail partnerships.",
      },
    ],
    confidenceScores: { adoptionLikelihood: 7, feasibility: 8, emotionalResonance: 8 },
  },
  {
    id: "4",
    name: "Game Boy Color (1998)",
    category: "Gaming Hardware",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
    description:
      "Nintendo's iconic handheld gaming console that brought color gaming to millions of children worldwide. Defined portable gaming culture.",
    specs: "2.32″ reflective color LCD, Z80 CPU, 32KB RAM, cartridge-based, 2× AA batteries",
    revivalScore: 9,
    era: "90s",
    sources: [
      { label: "eBay GBC Listings", url: "https://www.ebay.com/sch/i.html?_nkw=game+boy+color" },
      { label: "Reddit r/gameboy", url: "https://reddit.com/r/gameboy" },
      { label: "Product Hunt (Analogue Pocket)", url: "https://www.producthunt.com/posts/analogue-pocket" },
      { label: "TikTok #GameBoy", url: "https://www.tiktok.com/tag/gameboy" },
    ],
    reviews: [
      { text: "Best gaming experience of my childhood. Still works perfectly 25 years later.", sentiment: "positive" },
      { text: "Screen needed external light to see in dim conditions.", sentiment: "negative" },
      { text: "The cartridge format created a huge physical library but storage is bulky.", sentiment: "neutral" },
    ],
    socialSignals: [
      { platform: "TikTok", signal: "Game Boy nostalgia & modding content", volume: "640M+ views" },
      { platform: "Reddit", signal: "r/gameboy modding/collecting", volume: "110K members" },
      { platform: "Etsy", signal: "Custom painted Game Boys", volume: "15K+ listings" },
    ],
    competitors: ["Analogue Pocket", "RG35XX (Anbernic)", "Steam Deck", "Nintendo Switch Lite"],
    assumptionsMap: [
      { assumption: "Must use cartridge media", challenge: "Digital-physical hybrid: cartridges that are smart USB-C sticks" },
      { assumption: "One person plays at a time", challenge: "Shared screen gaming: two players on one split device" },
      { assumption: "Games are purchased separately", challenge: "Curated game subscription, streamed to vintage-aesthetic hardware" },
      { assumption: "Hardware is primary product", challenge: "Hardware as peripheral for phone: BTLE controller that replicates GBC feel" },
    ],
    flippedIdeas: [
      {
        name: "ChromaPocket – Modern Retro Console",
        description: "A Game Boy form-factor device with 4K OLED display, open-source OS, plays retro ROMs + modern indie games, with hot-swap modular cartridge dock for physical collections.",
        visualNotes: "Translucent colored shells (like original GBC), CNC aluminum frame, clicky buttons",
        reasoning: "Analogue Pocket proved massive demand (sold out in minutes). Expand with better display, open ecosystem, indie game store.",
        feasibilityNotes: "ARM SoC available. OLED 3.5″ ~$12 BOM. Full BOM ~$55–80. Retail $179–249.",
        scores: { feasibility: 8, desirability: 10, profitability: 8, novelty: 7 },
        risks: "IP/ROM legal concerns; competing directly with Analogue Pocket which has strong brand.",
      },
      {
        name: "GameClip – Phone Grip Gaming Controller",
        description: "A retro-aesthetic BTLE Game Boy controller that clips around any phone. Subscription app provides curated retro + indie games optimized for the physical button layout.",
        visualNotes: "Game Boy color palette options, satisfying d-pad, analog shoulder buttons, 10-hour battery",
        reasoning: "Everyone already has a powerful gaming device in their pocket. Remove hardware complexity, add physical nostalgia layer.",
        feasibilityNotes: "Razer Kishi proven the category. Differentiation: retro aesthetic + curated game subscription. BOM $15. Retail $69.",
        scores: { feasibility: 9, desirability: 8, profitability: 7, novelty: 6 },
        risks: "Market crowded with phone controllers; subscription churn risk; iOS limitations for game apps.",
      },
    ],
    confidenceScores: { adoptionLikelihood: 9, feasibility: 8, emotionalResonance: 10 },
  },
];
