/* ============================================================
   The Founder's Sprint — Explore Constellation (production)
   Refactored from the Claude Design prototype with:
   • Multi-coach architecture (COACHES array independent of taxonomy)
   • Hash-based deep linking from homepage (#marketing, #finance, etc.)
   • Coach profile slide-up wired from detail panel
   ============================================================ */

(function () {
  // ============================================================
  //   BRAND TOKENS
  // ============================================================
  const COL_PAPER = '#efe7d8';
  const COL_INK   = '#1a1a1a';
  const COL_INK2  = '#0f0d0a';   // deeper ink — chevron label plate fill

  // ============================================================
  //   MOBILE GATE
  //   Phones get a separate card-stack discovery model — the
  //   constellation doesn't initialise while mobile (CLAUDE.md
  //   "Mobile-First Discovery Engine", DESIGN.md §16). Must stay
  //   in sync with the matching @media block in explore.css.
  //   Evaluated LIVE (not once) so resizing across the breakpoint
  //   boots whichever experience becomes visible — no reload.
  // ============================================================
  const MOBILE_MQL = window.matchMedia('(max-width: 768px), (pointer: coarse) and (max-width: 932px)');
  function isMobileView() { return MOBILE_MQL.matches; }

  // ============================================================
  //   COACHES — independent of taxonomy
  //   Each coach has an id, profile data, and a list of L1/L2/L3
  //   assignments. A coach can cover an entire L1, specific L2s,
  //   or individual L3s. Multiple coaches can cover the same node.
  //   The resolver picks the most specific match for any given node.
  // ============================================================
  const COACHES = [
    {
      id: 'teddy-ruge',
      name: 'Teddy Ruge',
      role: 'Lead Marketing & Branding Coach',
      photo: '../images/coach-teddy.jpg',
      color: '#c8531f',
      rating: 4.9,
      sessions: 38,
      years: 16,
      bio: "Professional creative with over 20 years of global experience helping brands communicate effectively. Published in CNN, New York Times, Globe and Mail, and The Guardian. Founder of Qwezi Beauty (Raintree Farms Limited) and co-founder of Hive Colab — Uganda's premier coworking and startup accelerator that has worked with over 1,000 startups. Creative projects for the World Bank, Dallas Cowboys, and clients across industries.",
      quotes: [
        { who: "Naima A.", co: "Kibanda Foods · Cohort 7",  text: "Teddy didn't hand me a brand. He pulled one out of me I didn't know was there. Six weeks in, our positioning was sharper than what we had after two years of agency work." },
        { who: "Daudi M.", co: "Polepole Logistics · Cohort 9", text: "The clearest thinker on African brand I've worked with. He made me cut three quarters of my deck — and the meetings got easier the same week." },
        { who: "Ife O.",   co: "Suuna Studio · Cohort 11", text: "I came in for a logo. I left with a category. That reframe alone justified the entire sprint." },
      ],
      // Coverage: entire L1 discipline 0 (Marketing & Branding)
      covers: { l1: [0] },
      geo: { base: 'uganda', covers: ['uganda', 'eac'] },
    },
    {
      id: 'barry-wojega',
      name: 'Barry Wojega',
      role: 'Lead Financial Modelling Coach',
      photo: null,
      color: '#c9923a',
      rating: 4.8,
      sessions: 27,
      years: 19,
      bio: "Spent a decade in M&A and venture finance across East Africa before turning to founder coaching. Built models behind eight venture rounds totalling >$60M. Patient with first-time founders; ruthless with assumptions.",
      quotes: [
        { who: "Hanan K.",    co: "Acacia Health · Cohort 6",  text: "Barry made the spreadsheet feel honest. The number we walked into the room with was one I could defend, line by line. We closed in 11 weeks." },
        { who: "Geoffrey N.", co: "Maramoja Mobility · Cohort 8", text: "He killed three of my assumptions in 20 minutes and saved me a year of building on sand. Worth the entire programme." },
        { who: "Lulu R.",     co: "Solo Solar · Cohort 10", text: "I came in scared of finance. I left running monthly reviews myself. He teaches the mechanics, not just the answers." },
      ],
      covers: { l1: [1] },
      geo: { base: 'uganda', covers: ['uganda', 'eac'] },
    },
    {
      id: 'joseph-kalema',
      name: 'Joseph Kalema',
      role: 'Lead Investment Readiness Coach',
      photo: '../images/coach-joseph.jpg',
      color: '#8aab5c',
      rating: 4.9,
      sessions: 42,
      years: 21,
      bio: "Investment Manager with 15+ years in private equity, development finance, and fund management across East Africa. Coaches founders on what makes a deck land — and what kills it — with the chequebook side of the table fully visible.",
      quotes: [
        { who: "Aminah S.",  co: "Nuru Pay · Cohort 5",  text: "Joseph rebuilt my deck in three sessions. I went from 'pass' to a term sheet in the same quarter, with two competing offers." },
        { who: "Tendai G.",  co: "Vumbi Foods · Cohort 7", text: "He doesn't teach the pitch. He teaches the room — who's in it, what they want, what they fear. That changed everything." },
        { who: "Dele A.",    co: "Lekki Labs · Cohort 12", text: "Joseph is the coach you want when the meeting is in two weeks and the deck is still wrong. He moves fast and he's almost always right." },
      ],
      covers: { l1: [2] },
      geo: { base: 'uganda', covers: ['uganda', 'eac'] },
    },
    {
      id: 'moses-okudu',
      name: 'Moses Engwau Okudu',
      role: 'Lead Strategy & Team Building Coach',
      photo: '../images/coach-moses.jpg',
      color: '#5f7a45',   // brightened moss for dark surfaces — brand moss #3d4a2e is illegible on near-black
      rating: 4.7,
      sessions: 31,
      years: 14,
      bio: "Experienced Business Development and Enterprise Support Consultant dedicated to helping leaders and SMEs build resilient, growth-oriented organisations. Deep expertise in leadership, team effectiveness, and organisational development. Supports businesses to identify, position, and capitalise on market opportunities at local, regional, and international levels — translating potential into measurable business performance and long-term value.",
      quotes: [
        { who: "Wanjiru P.", co: "Tula Health · Cohort 6",  text: "Moses gave us the org chart we'd been arguing about for nine months in a single afternoon. The hires we made after that finally stuck." },
        { who: "Kwame B.",   co: "Adwoa Renewables · Cohort 8", text: "Strategy that survives Monday morning. He's the rare coach who has actually run the playbook he's teaching." },
        { who: "Esi T.",     co: "Mawu Mobility · Cohort 11", text: "He told us what we needed to hear, not what we wanted. We restructured the leadership team within six weeks and our shipping velocity doubled." },
      ],
      covers: { l1: [3] },
      geo: { base: 'uganda', covers: ['uganda', 'eac'] },
    },
    {
      id: 'patrick-ngolobe',
      name: 'Patrick Ngolobe',
      role: 'Lead Product Dev & Pricing Coach',
      photo: '../images/coach-ngolobe.jpg',
      color: '#a59b8c',
      rating: 4.8,
      sessions: 24,
      years: 12,
      bio: "Seasoned business strategist and leadership development expert with over 20 years of experience. Specialises in product design and development (MVP, MVF), customer acquisition, and market development. A certified professional coach who has mentored over 500 businesses with a funding program value of over USD 50M across Fintech, Agritech, HealthTech, and more.",
      quotes: [
        { who: "Sade O.",    co: "Habari Health · Cohort 7",  text: "Patrick caught a pricing mistake that was leaking 30% of margin. We fixed it in one session and our path to profitability moved up by a year." },
        { who: "Ronald L.",  co: "Boda Pay · Cohort 9", text: "He pushed us to ship the smallest possible version. We hated him for two weeks. Then we got our first 100 customers and changed our minds." },
        { who: "Chiamaka I.",co: "Niyo Studio · Cohort 11", text: "Best PMF conversations I've had. He has a sixth sense for the difference between real signal and founder hope." },
      ],
      covers: { l1: [4] },
      geo: { base: 'uganda', covers: ['uganda', 'eac'] },
    },
  ];

  // Build lookup indexes from COACHES
  const COACH_BY_ID = new Map();
  COACHES.forEach(c => COACH_BY_ID.set(c.id, c));

  // Resolve the best coach for a given node (l1Idx, l2Idx, l3Idx).
  // Priority: exact L3 match > L2 match > L1 match > first coach.
  // Returns the COACH object (or null).
  function resolveCoach(l1Idx, l2Idx, l3Idx) {
    let bestCoach = null;
    let bestSpecificity = -1;
    for (const c of COACHES) {
      const cov = c.covers;
      // Check L3 specificity (highest)
      if (cov.l3 && cov.l3.some(t => t[0] === l1Idx && t[1] === l2Idx && t[2] === l3Idx)) {
        if (3 > bestSpecificity) { bestCoach = c; bestSpecificity = 3; }
      }
      // Check L2 specificity
      if (cov.l2 && cov.l2.some(t => t[0] === l1Idx && t[1] === l2Idx)) {
        if (2 > bestSpecificity) { bestCoach = c; bestSpecificity = 2; }
      }
      // Check L1 specificity
      if (cov.l1 && cov.l1.includes(l1Idx)) {
        if (1 > bestSpecificity) { bestCoach = c; bestSpecificity = 1; }
      }
    }
    return bestCoach;
  }

  // Get ALL coaches that cover a node (for future multi-coach display)
  function resolveAllCoaches(l1Idx, l2Idx, l3Idx) {
    const result = [];
    for (const c of COACHES) {
      const cov = c.covers;
      if (cov.l3 && cov.l3.some(t => t[0] === l1Idx && t[1] === l2Idx && t[2] === l3Idx)) {
        result.push({ coach: c, specificity: 3 }); continue;
      }
      if (cov.l2 && cov.l2.some(t => t[0] === l1Idx && t[1] === l2Idx)) {
        result.push({ coach: c, specificity: 2 }); continue;
      }
      if (cov.l1 && cov.l1.includes(l1Idx)) {
        result.push({ coach: c, specificity: 1 }); continue;
      }
    }
    result.sort((a, b) => b.specificity - a.specificity);
    return result.map(r => r.coach);
  }

  // ============================================================
  //   TAXONOMY — sourced from the shared single source of truth
  //   (beta/taxonomy.js → window.FS_TAXONOMY). The hardcoded array
  //   below is a byte-faithful FALLBACK kept only for when the
  //   include hasn't loaded; a parity test guards that it mirrors
  //   the shared contract exactly. L3 NAMES are the booking
  //   contract (slugs derive from them) — do not rename here.
  // ============================================================
  // l1Short is explorer-only presentation (two-line node label) and
  // isn't carried in the shared file — mapped by discipline key.
  const L1_SHORT = {
    marketing:  ["MARKETING","& BRANDING"],
    finance:    ["FINANCIAL","MODELLING"],
    investment: ["INVESTMENT","READINESS"],
    strategy:   ["STRATEGY","& TEAM"],
    product:    ["PRODUCT DEV","& PRICING"],
  };
  function buildTaxonomyFromShared(T) {
    return T.disciplines.map(function (d) {
      return {
        l1: d.label,
        l1Short: L1_SHORT[d.key] || [String(d.label).toUpperCase(), ''],
        color: d.color,
        key: d.key,
        l2: d.l2.map(function (m) { return { name: m.name, l3: m.l3.slice() }; }),
      };
    });
  }
  const TAXONOMY_FALLBACK = [
    {
      l1: "Marketing & Branding",   l1Short: ["MARKETING","& BRANDING"],
      color: '#c8531f',
      l2: [
        { name: "Brand Strategy",     l3: ["Brand Positioning","Messaging Architecture","Visual Identity"] },
        { name: "Go-to-Market",       l3: ["Market Entry","Channel Mix","Launch Sequencing"] },
        { name: "Growth & Discovery", l3: ["Content Strategy","SEO & Discoverability","Customer Research"] },
      ]
    },
    {
      l1: "Financial Modelling",    l1Short: ["FINANCIAL","MODELLING"],
      color: '#c9923a',
      l2: [
        { name: "Unit Economics",        l3: ["CAC & LTV","Payback Period","Contribution Margin"] },
        { name: "Financial Planning",    l3: ["Revenue Forecasting","Burn Rate & Runway","Cash Flow Management","Tax & Compliance"] },
        { name: "Capital Architecture",  l3: ["Valuation Methods","Cap Table Design","Term Sheet Analysis"] },
      ]
    },
    {
      l1: "Investment Readiness",   l1Short: ["INVESTMENT","READINESS"],
      color: '#8aab5c',
      l2: [
        { name: "Pitch Craft",         l3: ["Pitch Deck Structure","Investor Narrative","Executive Summary"] },
        { name: "Investor Relations",  l3: ["Investor Targeting","Due Diligence Prep","Data Room"] },
        { name: "Funding Strategy",    l3: ["Pre-seed Rounds","Seed Rounds","Grants & DFIs"] },
      ]
    },
    {
      l1: "Strategy & Team Building", l1Short: ["STRATEGY","& TEAM"],
      color: '#5f7a45',   // brightened moss (display variant) — keeps the moss identity but reads against ink
      l2: [
        { name: "Competitive Strategy",l3: ["Market Analysis","Positioning & Moats","Scenario Planning"] },
        { name: "Team Architecture",   l3: ["Hiring Strategy","Culture Design","Org Structure","Payroll & HR Compliance"] },
        { name: "Operational Systems", l3: ["Process Design","OKRs & KPIs","Decision Frameworks","Legal & Registration"] },
      ]
    },
    {
      l1: "Product Dev & Pricing",  l1Short: ["PRODUCT DEV","& PRICING"],
      color: '#a59b8c',
      l2: [
        { name: "Product-Market Fit",  l3: ["Problem Validation","Solution Testing","PMF Signals"] },
        { name: "Product Development", l3: ["MVP Design","Roadmapping","Iteration Cycles","Payments & Mobile Money"] },
        { name: "Pricing Strategy",    l3: ["Value-Based Pricing","Competitive Pricing","Price Testing"] },
      ]
    },
  ];

  // Live taxonomy: build from the shared file when present (5 disciplines),
  // else use the local fallback. Node ids/colours/coach coverage are unchanged.
  const SHARED_TAX = (window.FS_TAXONOMY &&
    Array.isArray(window.FS_TAXONOMY.disciplines) &&
    window.FS_TAXONOMY.disciplines.length === 5) ? window.FS_TAXONOMY : null;
  const TAXONOMY = SHARED_TAX ? buildTaxonomyFromShared(SHARED_TAX) : TAXONOMY_FALLBACK;

  // L3 → booking slug. Prefer the shared slugify so explorer and booking
  // can never drift; fall back to the identical deterministic rule.
  const specSlug = (SHARED_TAX && SHARED_TAX.slugify) ? SHARED_TAX.slugify : function (name) {
    return String(name).toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // ============================================================
  //   AVAILABILITY DATA (placeholder — will come from API)
  // ============================================================
  const ONETOONE_SLOTS = [
    { date: 'Mon 7 Sep', time: '10:00 – 12:00 EAT', dur: '2 hr' },
    { date: 'Wed 9 Sep', time: '14:00 – 16:00 EAT', dur: '2 hr' },
    { date: 'Fri 11 Sep', time: '09:00 – 11:00 EAT', dur: '2 hr' },
    { date: 'Mon 14 Sep', time: '10:00 – 12:00 EAT', dur: '2 hr' },
  ];
  const COHORT_SCHEDULE = [
    { label: 'Cohort A',  dates: '7 Sep – 9 Oct 2026',   seats: 9,  status: 'open' },
    { label: 'Cohort B',  dates: '12 Oct – 13 Nov 2026', seats: 12, status: 'open' },
    { label: 'Cohort C',  dates: '16 Nov – 18 Dec 2026', seats: 12, status: 'open' },
  ];

  // ============================================================
  //   L3 DESCRIPTIONS
  // ============================================================
  const L3_DESC = {
    "Brand Positioning":       "Define where your venture sits in the founder's mind — and why alternatives feel wrong by comparison.",
    "Messaging Architecture":  "Build a layered messaging framework: tagline, value props, proof points, and the stories that make them land.",
    "Visual Identity":         "Typography, colour, logo system, and the visual cues that make your brand recognisable at a glance.",
    "Market Entry":            "First-market strategy — which geography, which segment, which beachhead gives you the fastest path to signal.",
    "Channel Mix":             "Paid, organic, referral, partnerships: which channels carry your first 1,000 customers and in what ratio.",
    "Launch Sequencing":       "The calendar from soft-launch to public launch: timing, dependencies, contingencies, and the metrics that say 'go'.",
    "Content Strategy":        "What to publish, where, how often, and how it compounds — a content engine, not a content calendar.",
    "SEO & Discoverability":   "Structured content, semantic markup, and authority signals that make AI search engines cite you as the answer.",
    "Customer Research":       "Interviews, surveys, and field observation that surface the real problem — not the one you assume exists.",
    "CAC & LTV":               "Customer acquisition cost vs lifetime value: the ratio that tells you whether growth is a flywheel or a fire.",
    "Payback Period":          "How many months until a cohort of customers pays back what you spent to acquire them — and why it matters for cash.",
    "Contribution Margin":     "Revenue minus variable costs per unit: the number that tells you whether your business model actually works.",
    "Revenue Forecasting":     "Bottom-up revenue projections grounded in real conversion rates, pipeline data, and defensible assumptions.",
    "Burn Rate & Runway":      "Monthly cash out, remaining runway, and the decisions that extend it — before the bank balance forces your hand.",
    "Cash Flow Management":    "Timing of cash in vs cash out: the operational discipline that keeps a growing company solvent.",
    "Valuation Methods":       "DCF, comparable multiples, and venture methods: when to use each and how to defend the number.",
    "Cap Table Design":        "Clean cap table architecture: founder splits, option pools, and the structure investors expect to see.",
    "Term Sheet Analysis":     "Line-by-line term sheet breakdown: what's standard, what's aggressive, and what you should push back on.",
    "Pitch Deck Structure":    "Slide-by-slide architecture of a deck that survives the first 30 seconds and earns the next 10 minutes.",
    "Investor Narrative":      "The story that threads your pitch: why now, why you, why this market — told in the language investors speak.",
    "Executive Summary":       "The one-page document that gets you the meeting: concise, specific, and impossible to put down.",
    "Investor Targeting":      "Which funds, which partners, which cheque sizes — and the warm paths that get your deck read.",
    "Due Diligence Prep":      "The documents, data, and answers you need ready before the investor asks: financials, legal, team, IP.",
    "Data Room":               "A structured, investor-ready data room: what goes in, what stays out, and how to organise it for speed.",
    "Pre-seed Rounds":         "Raising your first outside capital: angels, pre-seed funds, and the milestones that unlock each.",
    "Seed Rounds":             "The seed round playbook: timing, sizing, lead investors, and the metrics that close institutional cheques.",
    "Grants & DFIs":           "Non-dilutive capital: grant programs, development finance, and the application craft that wins them.",
    "Market Analysis":         "Competitive landscape mapping: who's in the market, what they do well, and where the white space is.",
    "Positioning & Moats":     "Defensibility strategy: network effects, data advantages, switching costs, and the moats that compound.",
    "Scenario Planning":       "Three futures for your market — base, bull, bear — and the decisions you make differently in each.",
    "Hiring Strategy":         "Who to hire first, second, and tenth: role sequencing that matches your stage and budget.",
    "Culture Design":          "Intentional culture: values, rituals, and norms that attract the right people and repel the wrong ones.",
    "Org Structure":           "Reporting lines, decision rights, and the org chart that lets a 5-person team operate like a 50-person one.",
    "Process Design":          "Repeatable workflows for the things your team does every week: shipping, hiring, customer support, finance.",
    "OKRs & KPIs":             "Objectives, key results, and the metrics that tell you whether you're winning — not just busy.",
    "Decision Frameworks":     "How your team makes decisions: who decides, who's consulted, who's informed, and how fast.",
    "Problem Validation":      "Is this a real problem, for real people, who will pay real money? The research that answers before you build.",
    "Solution Testing":        "Prototypes, concierge tests, and painted doors: the cheapest way to learn whether your solution works.",
    "PMF Signals":             "Retention curves, NPS, organic pull: the leading indicators that say you've found product-market fit.",
    "MVP Design":              "The smallest product that tests your riskiest assumption — not a miniature version of your grand vision.",
    "Roadmapping":             "A living roadmap: what to build next, what to defer, and how to communicate priorities to your team and investors.",
    "Iteration Cycles":        "Ship, measure, learn, repeat: the cadence and rituals that turn a team into a learning machine.",
    "Value-Based Pricing":     "Price anchored to customer value, not cost: the strategy that captures margin you're currently leaving behind.",
    "Competitive Pricing":     "Market-relative pricing: when to match, when to undercut, and when to charge a premium.",
    "Price Testing":           "A/B tests, willingness-to-pay studies, and the experiments that find the price your market will bear.",
    "Tax & Compliance":        "URA obligations made plain: income tax, VAT, PAYE, withholding and the filing calendar that keeps you penalty-free.",
    "Legal & Registration":    "From URSB incorporation to contracts, IP and licences — the legal foundation investors and partners expect to see.",
    "Payroll & HR Compliance": "Paying a team properly: PAYE, NSSF, employment contracts and the labour-law basics that keep you out of trouble.",
    "Payments & Mobile Money": "Getting paid in East Africa: MTN and Airtel mobile money, card gateways and the integrations that move cash reliably.",
  };

  // ============================================================
  //   SEARCH KEYWORDS (per discipline + per L3 synonyms)
  // ============================================================
  const DISCIPLINE_KEYWORDS = {
    0: "marketing branding brand identity visual voice tone messaging campaign advertising ads promotion publicity pr media press launch storytelling social media website funnel awareness reach engagement audience community distribution customer acquisition leads find customers get clients more sales grow revenue graphic design email marketing influencer growth marketing get noticed visibility online presence digital marketing market my business",
    1: "finance financial money numbers accounting bookkeeping books model modelling spreadsheet budget profit profitability loss metrics roi accountant cfo audit bank loan debt financing expenses overhead costs am i making money are we profitable manage my finances",
    2: "investment investor investors raise capital funding angel vc venture capital seed round accelerator incubator demo day cohort investor ready warm intro impact investing get funding need money to grow",
    3: "strategy strategic team people hiring talent staff co-founder culture values mission vision org structure organisation leadership management delegation roles responsibilities competitive competition competitor positioning risk goals metrics operations governance board advisory mentor decision making scaling grow my team build a team",
    4: "product development pricing price charge cost mvp prototype build ship feature roadmap iteration agile sprint pmf product market fit validation testing user testing ux ui design tiers packages subscription saas freemium engineering developer app software what to build how to price",
  };

  // Synonyms and related terms per L3 specialty — dramatically improves search hit rate
  const L3_KEYWORDS = {
    "Brand Positioning":       "differentiation differentiate unique selling proposition usp value proposition value prop positioning statement target audience ideal customer perception identity niche category category creation blue ocean competitive advantage what makes us different why choose us why us stand out get noticed crowded market saturated market premium luxury affordable budget aspirational trust credibility authority reputation perception meaning relevance resonance rebrand refresh reposition pivot identity crisis who are we what do we stand for brand promise mission vision values personality archetype tone perception map brand pyramid essence positioning map against competitors look the same as everyone commoditised undifferentiated me too me-too lookalike same as competitors how do i stand out we blend in nobody remembers us forgettable memorable distinctiveness salience top of mind market positioning brand positioning competitive positioning perceptual map point of difference reason to choose only one who does what we do best in class go to brand reference brand thought leader trusted brand household name brand equity brand value brand strength weak brand strong brand brand perception how customers see us mindshare share of mind brand recall unaided awareness aided awareness brand association what we are known for own a word own a category flanking repositioning upmarket downmarket mass premium positioning ladder competitor positioning map why us over them elevator positioning",
    "Messaging Architecture":  "messaging message copywriting copy tagline slogan strapline elevator pitch value proposition one liner one-liner hook headline subhead body copy story narrative key messages talking points communication words language wording phrasing about page about us website copy web copy landing page hero section call to action cta email subject line tone of voice brand voice how to describe my business explain what we do what do you do clarity confusing jargon simplify simplifying complex ideas plain language words that sell persuasion persuasive influence value ladder benefits not features feature vs benefit so what proof points objection handling faq messaging framework message house pillars proof reasons to believe rtb people dont get what we do confusing pitch nobody understands us mixed messages inconsistent messaging messaging hierarchy primary message secondary message supporting message proof point benefit statement feature benefit translation problem agitate solve pas aida before after bridge storybrand donald miller make it clear cut the jargon plain english speak human conversational copy punchy copy crisp copy boilerplate company boilerplate press boilerplate positioning line descriptor category descriptor what we do in one sentence explain to my grandmother explain simply pitch in a sentence website headline homepage copy value statement mission statement vision statement messaging matrix audience specific messaging segment messaging persona messaging",
    "Visual Identity":         "visual identity design logo logomark wordmark icon favicon colours colors colour palette color palette fonts typeface typography type kerning graphics imagery photography illustration iconography look and feel style guide styleguide brand guidelines brand book brandbook brand kit asset library aesthetic mood board moodboard creative direction art direction figma canva adobe illustrator photoshop indesign template templates mockup business card letterhead packaging signage merch swag presentation deck design ui kit design system rebrand refresh modernise modernize outdated dated amateur unprofessional polished professional consistent inconsistent looks cheap looks unprofessional our logo is bad need a new logo design help make it look premium brand identity system primary logo secondary logo logo lockup logo variations monogram emblem wordmark symbol mascot brand colours brand palette primary colour secondary colour accent colour hex codes pantone cmyk rgb font pairing heading font body font type hierarchy grid system spacing layout brand photography image style illustration style graphic elements patterns textures brand application stationery merch apparel social templates pitch template email signature visual consistency on brand off brand brand audit refresh the brand visual refresh new look feel premium look luxury feel minimal clean modern bold playful corporate look our brand looks dated",
    "Market Entry":            "go to market go-to-market gtm market entry launch strategy enter new market expansion expand new country geography region territory beachhead first market which market where to start pick a market localisation localization adapt international cross border cross-border east africa uganda kampala kenya nairobi rwanda tanzania drc congo burundi south sudan regional pilot pilot market test market soft launch phased rollout when to launch timing first customers early adopters beachhead segment niche down landing zone wedge entry barrier market readiness which city which region expand to kenya scale to new market launch in a new country distribution partner local partner channel partner regulatory entry import entry strategy market selection country selection prioritise markets market prioritisation ease of entry market readiness regulatory environment ease of doing business localisation translation local payment local language cultural fit product market fit by market beachhead market wedge market launch market first market to enter sequencing markets expand regionally expand across borders trade within east africa eac common market afcfta cross border trade export to kenya export to drc enter rwanda enter tanzania set up in nairobi set up in kampala distributor model franchise model partner led entry direct entry pilot in one city test in one region",
    "Channel Mix":             "channels channel mix distribution distribution channels reach acquisition customer acquisition where to find customers how to get customers how to get users get more clients more leads paid ads paid advertising google ads meta ads facebook ads instagram ads tiktok ads organic social referral word of mouth wom partnerships partner affiliate affiliates resellers agents instagram linkedin tiktok facebook youtube twitter x whatsapp whatsapp business sms ussd radio billboard flyers events expos trade shows community grassroots door to door field sales direct sales telesales cold calling cold email outbound inbound content marketing influencer marketing ambassador programme growth hacking viral loop k factor seo email marketing newsletter drip campaign automation hubspot mailchimp crm sales funnel pipeline lead generation demand generation channel strategy multichannel omnichannel offline online which channel works best how to reach my customers cant get customers low traffic no leads acquisition cost too high acquisition channels channel strategy channel mix paid organic earned owned media performance marketing growth loops referral programme refer a friend loyalty programme affiliate marketing creator marketing ugc user generated content community led growth product led growth plg sales led growth inbound marketing outbound sales bdr sdr field marketing event marketing activation roadshow market days expos pop up retail kiosk agent network reseller network whatsapp marketing whatsapp broadcast sms blast bulk sms ussd campaign radio advert tv advert billboard branding van church announcements market announcements boda branding which channels convert best cheapest channel highest roi channel where are my customers can not reach customers stuck on one channel diversify channels",
    "Launch Sequencing":       "launch sequencing launch plan launch planning timeline schedule roadmap pre launch pre-launch teaser waitlist beta soft launch go live public launch rollout phased launch launch day launch week launch event countdown checklist milestones dependencies critical path sequence order of operations announcement press release media outreach pr embargo influencer seeding stakeholder readiness internal comms launch calendar campaign calendar coming soon early access founder access vip list grand opening opening day product launch market launch relaunch big bang rolling launch when should i launch are we ready not ready launch readiness postpone delay launch how to launch a product successfully botched launch flopped failed launch launch readiness checklist go no go decision launch criteria phased rollout staged rollout wave launch invite only closed beta open beta early access waitlist build a waitlist pre orders pre launch hype build anticipation teaser campaign reveal countdown timer launch day plan launch runbook launch comms plan internal launch external launch press kit media kit launch partners launch event ribbon cutting demo day showcase relaunch second launch v2 launch when is the right time to launch are we ready to launch should we delay launch postponed launch missed launch window soft opening trial run dress rehearsal",
    "Content Strategy":        "content content strategy content marketing content plan content calendar editorial calendar blog blog posts articles long form video short form reels shorts tiktok youtube podcast podcasting newsletter email marketing social media posts captions thought leadership publishing what to post how often posting schedule consistency content pillars topics themes ideas content ideas writers block repurpose repurposing distribution amplification engagement reach impressions followers audience growth community building authority credibility expertise educate inform entertain inspire seo content keyword content evergreen trending hooks storytelling personal brand build an audience grow on linkedin go viral nobody engages low engagement no one sees my posts content that converts lead magnet gated content ebook webinar content engine content machine content flywheel content pillars content buckets content mix content types educational content promotional content behind the scenes founder content build in public content series content franchise hero hub hygiene content topic clusters keyword clusters content calendar template posting cadence consistency batching content batch create repurpose content atomise content one piece many posts long form to short form thread carousel infographic case study white paper lead magnet gated content webinar live stream linkedin posts what do i post run out of ideas content ideas content that gets engagement grow my following build an audience personal branding founder brand",
    "SEO & Discoverability":   "seo search engine optimisation optimization google search ranking rank rankings keywords keyword research meta tags title tags meta description backlinks link building organic traffic search traffic serp featured snippet rich snippet schema structured data json ld sitemap crawl index indexing technical seo on page off page domain authority page authority page rank site speed core web vitals mobile friendly alt text internal links anchor text ai search aeo answer engine optimisation generative engine optimisation geo perplexity chatgpt claude gemini ai overviews citations be the answer get cited llm visibility findability discoverability get found online get found on google show up in search how to rank higher not showing up on google invisible online no organic traffic searchability google my business google business profile maps local seo search visibility organic search google ranking improve ranking climb the rankings first page of google page one seo strategy keyword strategy long tail keywords search intent on page seo off page seo technical seo site audit broken links 404 redirects canonical tags robots txt xml sitemap google search console google analytics ga4 bing search local search near me searches google business profile reviews stars citations nap consistency content seo pillar pages topic authority eeat expertise authoritativeness trust link building guest posts digital pr ai search optimisation answer engine get cited by chatgpt show up in ai answers llm seo generative search nobody finds us online not ranking invisible on google improve organic traffic",
    "Customer Research":       "customer research user research market research interviews customer interviews surveys questionnaire focus groups user testing field research ethnography observation persona personas buyer persona ideal customer profile icp segmentation segment journey mapping customer journey empathy map jobs to be done jtbd needs wants pain points frustrations desires motivations triggers insights discovery voice of customer voc feedback understand my customer who is my customer who are my users target market demographics psychographics behaviour behavior attitudes mom test talking to customers customer development problem space willingness to pay validation early adopters lead users do people want this who would buy this i dont know my customer guessing assumptions hypothesis customer discovery user interviews discovery interviews problem interviews solution interviews jobs to be done framework jtbd switch interview customer surveys nps survey csat survey product survey google forms typeform survey monkey usability sessions user testing sessions card sorting tree testing diary study contextual inquiry shadowing field visits market visits talk to users get out of the building gob mom test the mom test rob fitzpatrick customer segments target segment beachhead segment early adopters innovators ideal customer profile icp buyer persona user persona empathy map customer journey map touchpoints pain points gain points who is my customer i do not know my users understand my market validate demand qualitative quantitative research insights synthesis affinity mapping",
    "CAC & LTV":               "cac customer acquisition cost ltv lifetime value cltv ltv cac ratio payback unit economics cost per lead cpl cost per acquisition cpa cost per click cpc cost per mille cpm conversion rate funnel economics blended cac paid cac organic cac marketing efficiency marketing roi return on ad spend roas marketing spend how much to spend on marketing acquisition efficiency profitable customers unprofitable expensive customers cheap acquisition retention cohort revenue per user arpu arppu churn impact payback period spending too much on ads ads not profitable cant afford to acquire customers acquisition too expensive efficient growth capital efficient burn multiple magic number sales efficiency customer acquisition cost calculation blended cac paid cac fully loaded cac cost to acquire a customer ltv to cac ratio 3 to 1 ratio ltv cac payback months cohort ltv contribution ltv gross ltv net ltv retention curve retention rate churn rate logo churn revenue churn net revenue retention nrr expansion revenue upsell cross sell average order value aov average revenue per user arpu repeat purchase rate frequency cost per click cost per lead cost per install cost per acquisition cpa cpl cpc cpm conversion rate lead to customer marketing roi marketing payback are my ads worth it ads losing money acquisition too expensive scale profitably efficient growth burn multiple sales efficiency unit economics dont work",
    "Payback Period":          "payback payback period break even breakeven roi return on investment recovery recoup time to recover cash cycle months to payback when do i make my money back how long until profitable recoup investment time to value cash positive cash negative self sustaining sustainable profitable per customer gross margin payback cac payback contribution payback investment recovery upfront cost recover costs how long to break even when will this pay for itself amortise depreciation capex recovery time to recover costs cost recovery when do i recoup how long to make money back months to break even break even point break even analysis break even month payback in months capital payback investment payback cac payback period customer payback contribution payback cash payback when will it pay for itself when does this become profitable how long until cash positive recover my investment recoup upfront costs upfront investment recovery period amortisation period return timeline payback timeline how long before profit",
    "Contribution Margin":     "contribution margin gross margin gross profit profit per unit unit profit unit profitability variable cost variable costs cogs cost of goods sold direct costs marginal cost per unit economics how much do i make per sale margin per product margin per service product margins service margins low margin high margin thin margins improving margins margin expansion cost reduction reduce cogs pricing power markup mark up landed cost wholesale cost retail margin bill of materials bom losing money on each sale negative margin selling at a loss not making enough per sale margin too thin squeeze price floor contribution margin per unit gross profit margin gross margin percentage margin percentage unit margin per unit profit per unit economics cost of goods sold cogs cost of sales direct cost variable cost marginal cost landed cost input cost raw material cost bill of materials bom wholesale price cost price selling price markup margin markup margin vs markup blended margin product mix margin service margin improve margins expand margins protect margins margin erosion margin squeeze thin margins low margin business high margin business making a loss per sale negative unit economics losing money on every order how much profit per sale price covers cost selling below cost",
    "Revenue Forecasting":     "revenue forecast forecasting sales forecast revenue projection projections financial projection model assumptions drivers bottom up top down growth rate growth assumptions trajectory pipeline weighted pipeline run rate arr mrr recurring revenue monthly recurring annual recurring how much will we make next month next quarter next year financial planning fp&a budget target revenue target sales target conservative base case aggressive scenario best case worst case sensitivity excel spreadsheet google sheets revenue model bookings vs revenue deferred revenue seasonality predict sales how much revenue can we expect realistic numbers hockey stick top line revenue model revenue forecast sales forecast financial forecast bottoms up forecast top down forecast driver based model assumption sheet growth assumptions monthly recurring revenue mrr annual recurring revenue arr run rate booking forecast pipeline forecast weighted pipeline win rate sales velocity new revenue expansion revenue churn forecast revenue projection three year projection five year financial plan p and l forecast budget vs actual variance analysis rolling forecast scenario forecast base case forecast best case worst case how much revenue next year predict sales realistic revenue numbers investor projections hockey stick growth top line growth revenue ramp",
    "Burn Rate & Runway":      "burn burn rate net burn gross burn monthly spend cash burn expenses opex overhead cash remaining cash balance months of runway runway zero cash date out of cash running out of money how long can we survive how many months left cash crunch cash crisis emergency need to raise extend runway lengthen runway reduce burn cut costs cut expenses layoffs redundancy belt tightening conservation mode lean default alive default dead survival ramen profitable bridge financing months left low on cash about to run out cash position spend rate cost discipline cash burn rate net burn gross burn monthly burn weekly burn cash burn calculation months of runway runway calculation runway left zero cash date cash out date out of money running low on cash low cash how long can we last survive how many months of cash extend the runway lengthen runway stretch runway reduce burn cut burn reduce spend trim costs cut costs reduce headcount layoffs redundancies cost cutting belt tightening conservation mode survival mode default alive default dead get to profitability ramen profitable break even before cash runs out bridge round emergency funding cash crisis we are bleeding cash spending too fast",
    "Cash Flow Management":    "cash flow cashflow working capital liquidity invoicing invoice receivables accounts receivable ar payables accounts payable ap timing cash in cash out collections debtors creditors net terms payment terms 30 days 60 days late payments overdue chasing payments treasury float bridge cash gap seasonal cyclical managing cash making payroll meet payroll rent salaries supplier payments cash conversion cycle dso days sales outstanding when payments come in when bills are due cash forecast 13 week cash flow short on cash cash tight cant pay suppliers waiting to get paid clients not paying mobile money settlement bank reconciliation petty cash cash flow forecast cash flow statement direct cash flow indirect cash flow operating cash flow free cash flow working capital management working capital cycle cash conversion cycle days sales outstanding dso days payable outstanding dpo days inventory outstanding receivables management collections process chasing invoices overdue invoices aging report debtor days creditor days payment terms net 30 net 60 advance payment deposit milestone billing invoice financing factoring supplier credit trade credit overdraft bank overdraft cash buffer cash reserve float petty cash mobile money settlement bank reconciliation reconcile accounts seasonal cash flow lumpy revenue cash gap cash tight short on cash cannot pay suppliers waiting on payments clients paying late slow paying customers",
    "Tax & Compliance":        "tax taxes ura uganda revenue authority income tax corporation tax corporate tax company tax vat value added tax 18 percent paye pay as you earn withholding tax wht 6 percent local service tax lst presumptive tax rental tax capital gains tax excise duty stamp duty customs duty import duty efris electronic invoicing e invoicing fiscal device tin tax identification number tax clearance certificate tcc tax return filing deadline returns provisional tax instalment tax penalty penalties interest fines tax compliance statutory compliance regulatory compliance tax planning tax advisor accountant nita data protection nssf deductions tax holiday tax exemption tax incentive how much tax do i owe do i need to register for vat when to file taxes urssb tax audit am i paying too much tax double taxation paye returns monthly returns annual returns ura uganda revenue authority tax registration register for tax tin number tax identification number income tax individual income tax corporation tax 30 percent corporate tax vat registration vat threshold 150 million output vat input vat vat returns monthly vat paye computation paye bands paye returns withholding tax 6 percent 15 percent wht exemption local service tax presumptive tax small business tax rental income tax capital gains excise duty import duty customs efris electronic fiscal receipt e invoicing fiscal device tax invoice tax clearance certificate tcc provisional tax advance tax tax assessment tax audit tax penalty late filing penalty interest on tax tax compliance status filing deadlines tax calendar tax agent tax consultant do i pay tax how much tax do i owe when are taxes due am i tax compliant double taxation tax dispute objection nita data protection registration url",
    "Valuation Methods":       "valuation value worth company worth how much is my company worth how much is my startup worth pre money pre-money post money post-money dcf discounted cash flow multiples revenue multiple ebitda multiple comparable companies comps precedent transactions venture method scorecard method berkus method risk factor summation enterprise value equity value fair value fair market value overvalued undervalued asking valuation negotiating valuation cap valuation cap safe convertible early stage valuation seed valuation arr multiple what are we worth justify valuation defend valuation investor pushback down round up round flat round step up dilution at valuation company valuation startup valuation business valuation how to value a startup how much is my company worth what is my business worth pre money valuation post money valuation valuation cap discounted cash flow dcf net present value npv terminal value comparable company analysis trading comps transaction comps revenue multiple arr multiple ebitda multiple price to sales saas multiples venture capital method first chicago method scorecard valuation berkus method risk factor summation method dilution waterfall fully diluted valuation justify my valuation defend valuation negotiate valuation investor lowball down round flat round up round step up valuation expectations realistic valuation overvalued startup valuation too high",
    "Cap Table Design":        "cap table capitalisation table capitalization table equity ownership shares shareholding stake stakes options option pool esop employee stock vesting vesting schedule cliff four year vesting one year cliff dilution anti dilution founder split founder equity co founder equity cofounder split shareholders agreement shareholder register share certificate how much equity to give advisor equity advisor shares convertible note safe simple agreement for future equity pre money post money fully diluted ownership percentage equity split fair split unfair split equity dispute giving away too much equity protect my equity ursb ordinary shares preference shares share classes share transfer 50 50 split who owns what capitalisation table cap table management cap table modelling equity split founder shares founder equity split co founder split equity allocation option pool employee stock option pool esop size 10 percent pool vesting schedule four year vesting one year cliff monthly vesting reverse vesting acceleration single trigger double trigger dilution math anti dilution fully diluted shares outstanding ownership percentage shareholding structure share classes ordinary shares preference shares founder shares advisor shares safe note convertible note pre money shares post money shares pro rata how much equity for a cofounder how much for an advisor how much for early employees giving away equity protect founder ownership ursb share register stamp duty on shares carta pulley",
    "Term Sheet Analysis":     "term sheet terms conditions clauses negotiation negotiate liquidation preference liq pref 1x participating non participating anti dilution full ratchet weighted average pro rata pro-rata rights board seat board composition control protective provisions veto rights drag along tag along right of first refusal rofr information rights participation rights option pool shuffle valuation cap discount mfn investor friendly founder friendly red flags what to watch for gotchas fine print lawyer legal review sign or not vesting reverse vesting founder vesting what does this clause mean is this a good deal exploding offer no shop confidentiality term sheet review understand my term sheet term sheet negotiation key terms economic terms control terms valuation cap discount rate liquidation preference one x non participating participating preferred anti dilution full ratchet broad based weighted average narrow based pro rata rights pre emptive rights board composition board seat independent director protective provisions veto rights drag along rights tag along rights co sale right of first refusal rofr no shop exclusivity confidentiality information rights founder vesting reverse vesting option pool shuffle pay to play redemption rights conversion rights is this term sheet fair red flags in term sheet what does this clause mean should i sign this safe convertible note simple agreement",
    "Pitch Deck Structure":    "pitch deck pitchdeck slide deck slides presentation deck structure pitch story problem solution product market opportunity tam business model traction revenue go to market competition team ask use of funds financials milestones appendix demo how to pitch how to make a pitch deck deck template slide order ten slides twelve slides sequoia guy kawasaki narrative flow opening slide closing slide hook one liner elevator pitch storytelling demo day investor presentation seed deck pre seed deck my deck is too long my deck is confusing investors dont get my pitch deck feedback deck review redesign deck pitch deck design investor deck seed pitch deck pre seed deck demo day deck the perfect pitch deck slide by slide title slide problem slide solution slide product slide demo slide market size slide tam sam som slide business model slide revenue model slide traction slide growth slide go to market slide competition slide competitive matrix team slide founder slide financials slide projections slide the ask slide use of funds slide vision slide closing slide appendix sequoia template ycombinator deck airbnb deck guy kawasaki 10 20 30 rule storyline narrative arc deck flow how long should my deck be number of slides design my deck deck feedback my deck is too text heavy investors lose interest in my deck",
    "Investor Narrative":      "investor narrative story founder story why now why us why this why this market thesis investment thesis conviction compelling narrative vision mission purpose big vision ambition the dream passion authenticity credibility track record unique insight secret contrarian belief inflection point timing wave tailwind macro trend market shift founder market fit storytelling emotional resonance memorable pitch the story behind why should i invest make it compelling boring pitch no narrative whats the story selling the vision painting the picture the journey origin story the narrative the story investment story why now slide why now timing macro tailwind market timing inflection point unique insight founder insight secret what we know that others dont contrarian thesis non consensus bet vision narrative ten year vision mission driven purpose driven category creation story problem story origin story founder journey founder market fit why we are the team to win compelling story emotional pitch make investors believe paint the vision sell the dream the big idea the wedge to the platform land and expand storytelling for investors my pitch is boring no compelling story whats our angle hook the investor",
    "Executive Summary":       "executive summary exec summary one pager onepager overview brief memo investment memo summary teaser deal teaser first impression cold email cold outreach email to investor intro email deck summary blurb description elevator paragraph snapshot highlights key points concise clear punchy short version tldr summary document company overview the gist quick overview blurb about us paragraph what we do in one line investor brief one page summary one pager one page summary executive summary investment summary investment memo deal memo company one pager investor one pager startup summary teaser deck the gist tldr summary cold email to investors intro email investor email outreach email blurb company blurb short description elevator description boilerplate description what we do paragraph problem solution traction ask in one page concise summary punchy summary investor brief two minute pitch in writing send before the meeting leave behind document forwarded to other investors first touch first impression document",
    "Investor Targeting":      "investor targeting who to pitch right investors investor list target investors investor research vc venture capital firm angel angels angel network family office hnwi high net worth dfi development finance fund manager gp lp limited partner syndicate lead investor follow on warm intro warm introduction cold email outreach connections network crunchbase dealroom signal openvc investor database pipeline crm portfolio fit thesis fit thesis match stage match seed stage geography match sector focus check size cheque size ticket size dry powder mandate impact investor africa focused uganda investors east africa investors who invests in my sector find the right investor build investor pipeline relevant investors not a fit wrong investors find investors where to find investors looking for investors which investors should i target who should i pitch to investor list build investor list target investor list right investors for my stage right investors for my sector relevant investors who invests in my space find the right investors which vcs invest in africa angel investors in uganda east africa investors local investors diaspora investors impact investors sector focused investors stage focused investors seed investors pre seed investors investor research investor mapping investor crm pipeline of investors warm introductions getting introduced cold outreach to investors cold email investors reach out to vcs crunchbase signal nfx openvc africa list investor database thesis fit check size fit who should i pitch making a target list shotgun versus rifle approach personalised outreach",
    "Due Diligence Prep":      "due diligence dd diligence prep prepare for due diligence investor diligence documents legal financial commercial technical compliance audit review records contracts agreements ip intellectual property trademark patent ready prepared organised organized background check references reference calls verification proof evidence documentation data room checklist legal structure corporate governance board minutes shareholder agreements employment contracts customer contracts cap table financials management accounts kpis metrics tech audit code review pass diligence red flags clean up before raising what investors ask for diligence questions diligence checklist gettng diligence ready audit ready due diligence preparation get diligence ready diligence checklist legal due diligence financial due diligence commercial due diligence technical due diligence diligence questionnaire diligence request list document request investor questions clean up the company corporate housekeeping cap table clean up contracts in order ip assignment ip ownership employee agreements customer contracts supplier contracts compliance check regulatory check financial statements management accounts audited accounts kpi backup metrics verification reference checks customer references background checks code audit security audit tech diligence pass due diligence survive diligence what investors check before they invest diligence red flags",
    "Data Room":               "data room dataroom virtual data room vdr investor data room files documents folder shared drive organise organize structure investor access secure share docsend google drive dropbox notion sharepoint box index table of contents categories sections folders financials legal corporate ip hr contracts cap table pitch deck access control permissions view tracking confidential nda watermark clean professional organised investor portal share documents with investors what goes in a data room set up a data room diligence room document room virtual data room set up a data room investor data room data room structure data room index data room checklist what goes in a data room organise documents for investors document room deal room secure document sharing docsend google drive folder dropbox folder notion data room sharepoint data room box folder access controls view tracking who viewed my documents nda before access watermark documents confidential folder financials folder legal folder corporate documents folder cap table folder contracts folder ip folder hr folder pitch deck financial model investor updates share documents with investors professional data room investor ready documents",
    "Pre-seed Rounds":         "pre seed pre-seed preseed first round first money friends and family fnf 3fs friends family fools angel round angel investment micro fund pre revenue pre-revenue idea stage early stage concept stage initial capital startup capital seed capital bootstrap bootstrapping self funded fools gold love money starting capital need money to start how to fund my idea first cheque first investment minimum viable capital small raise raising 50k raising 100k first external money grant before revenue runway to mvp get to traction before seed fundraising raising money raise money find money for my startup need money to grow first funding pre seed round raising pre seed first round of funding first external funding friends and family round angel round earliest funding idea stage funding pre revenue funding pre product funding bootstrap to pre seed how much to raise at pre seed pre seed valuation pre seed cheque size safe note pre seed convertible note raise on a safe first investors first cheque angel cheque micro vc pre seed fund how to raise my first round need capital to start need money to build mvp runway to seed get to traction first money in friends family fools love money raising 20k 50k 100k 200k seed before seed",
    "Seed Rounds":             "seed seed round seed funding seed stage institutional round lead investor priced round seed extension sizing the round how much to raise round size commitment soft commit hard commit closing the round oversubscribed allocation pro rata follow on bridge runway eighteen months milestone based tranche tranches first institutional money raising 500k raising a million series seed seed plus building the round momentum fomo close the round wiring funds traction for seed seed metrics what investors want at seed fundraising raising money raise money seed round raising a seed seed financing institutional seed first institutional round priced seed round seed extension seed plus bridge to series a how much to raise at seed seed round size seed valuation seed cheque lead investor for seed finding a lead anchor investor fill the round oversubscribed seed round closing a seed round seed metrics seed traction what you need to raise a seed mrr for seed arr for seed raise 500k raise a million raise 1m to 3m runway 18 months milestone based seed convertible to priced",
    "Grants & DFIs":           "grant grants non dilutive non-dilutive free money no equity grant funding grant application apply for grants proposal grant proposal proposal writing concept note log frame logical framework theory of change impact measurement m&e monitoring evaluation reporting donor donors development finance dfi dfis bilateral multilateral concessional blended finance patient capital catalytic capital usaid mastercard foundation gates foundation bill and melinda gates fcdo dfid sida danida giz norad afd world bank ifc afdb aecf africa enterprise challenge fund abi finance abi development udb uganda development bank yield uganda gei tony elumelu foundation gsma innovation fund research grant startup grant youth fund women fund government programme public funding climate fund agriculture grant where to find grants am i eligible for grants win a grant grant deadlines funding free funding where to get funding grant funding apply for grants grant opportunities open grants grant calls request for proposals rfp request for applications rfa expression of interest eoi concept note full proposal grant writing winning grants non dilutive funding free funding no equity funding donor funding development funding catalytic grant innovation grant research and development grant climate grant agriculture grant agtech grant womens fund youth fund startup grant matching grant challenge fund aecf africa enterprise challenge fund gsma innovation fund google for startups black founders fund tony elumelu foundation mastercard foundation usaid grants world bank ifc afdb dfc swedish sida danida giz fcdo uk aid aboi finance abi udb uganda development bank yield fund pearl capital where can i get a grant am i eligible grant deadlines grant reporting monitoring evaluation log frame theory of change impact metrics",
    "Market Analysis":         "market analysis market research competition competitive landscape competitor analysis competitors rivals tam total addressable market sam serviceable addressable market som serviceable obtainable market market size market sizing how big is the market bottom up top down market opportunity growth rate cagr compound annual growth industry analysis sector analysis trends market trends market dynamics porter five forces threat of substitutes bargaining power barriers to entry disruption incumbents whitespace gap in the market market map landscape map benchmarking who are my competitors is the market big enough market attractiveness addressable market sizing the opportunity demand drivers market research market analysis industry research industry analysis market study market sizing exercise tam sam som calculation total addressable market serviceable available market serviceable obtainable market bottom up market sizing top down market sizing market value market volume market growth rate cagr market trends emerging trends industry trends market drivers demand drivers market segmentation customer segments competitor research competitor analysis competitive landscape competitive matrix competitor benchmarking direct competitors indirect competitors substitutes porter five forces swot pestle macro analysis whitespace market gap underserved market market opportunity is the market big enough how many potential customers market potential addressable customers",
    "Positioning & Moats":     "moat moats competitive moat defensibility defensible barrier to entry barriers competitive advantage sustainable advantage unfair advantage differentiation switching cost switching costs lock in lock-in network effects two sided marketplace economies of scale scale advantage brand moat brand loyalty habit proprietary technology proprietary data data moat data advantage ip patent trademark trade secret regulatory moat licence exclusive partnership first mover advantage last mover advantage flywheel why cant competitors copy us whats stopping competition durable advantage hard to replicate defend market share copycats being copied competitors copying us protect the business competitive moat economic moat durable competitive advantage sustainable competitive advantage defensibility defensible business barriers to entry high barriers switching costs high switching costs customer lock in vendor lock in network effects direct network effects indirect network effects two sided network economies of scale scale economies supply side economies demand side cost advantage proprietary technology proprietary data data network effects intellectual property patents trademarks trade secrets exclusive contracts exclusive partnerships regulatory licences first mover advantage incumbency brand moat counter positioning process power cornered resource scale flywheel why cant someone copy us whats our edge what protects us competitors will copy us easily copied no moat hard to defend",
    "Scenario Planning":       "scenario planning scenarios contingency contingency plan what if worst case best case base case downside upside planning for uncertainty risk risks risk management risk register strategic planning pivot pivoting adapt adaptability resilience resilient antifragile stress test sensitivity analysis monte carlo plan b plan c optionality flexibility hedging tail risk black swan macro risk political risk regulatory risk currency risk forex devaluation economic shock recession what could go wrong preparing for the worst future planning long term planning strategic options decision tree war gaming goes wrong things go wrong what if everything fails it all falls apart prepare for the worst worst case what if it all goes wrong scenario analysis scenario modelling what if analysis sensitivity analysis stress testing best case base case worst case downside scenario upside scenario contingency planning contingency plan plan b plan c business continuity risk planning risk assessment risk register risk mitigation key risks biggest risks what could go wrong things going wrong if it all goes wrong if we miss targets if funding falls through if a competitor enters if costs rise currency devaluation forex risk political instability regulatory change policy change supply shock demand shock recession planning economic downturn pivot options strategic options optionality hedge our bets prepare for uncertainty future proofing war gaming pre mortem premortem",
    "Hiring Strategy":         "hiring hire recruit recruitment recruiting talent acquisition first hire key hires who to hire who to hire first team build build a team headcount hiring plan roles job description jd compensation salary benchmark salary bands equity for employees culture fit screening interview interviewing assessment reference check engineer developer software engineer designer product manager marketer salesperson sales rep operations finance head of growth coo cto cmo vp lead senior junior when to hire full time part time contractor freelancer agency outsource offshore remote hire intern graduate cant find good people hiring is hard who do i need talent gap scaling the team make a great hire avoid bad hires hiring plan recruitment plan talent strategy who to hire first first ten hires key roles to fill critical hires hiring roadmap org design hiring sequence build my founding team hire a cofounder hire a cto hire a developer hire engineers hire a designer hire a product manager hire sales hire marketing hire operations hire finance hire a manager senior hire junior hire graduate trainee intern internship full time part time fractional executive fractional cto contractor freelancer consultant agency outsource offshore nearshore remote hiring distributed team where to find talent sourcing candidates job adverts job boards linkedin recruiting referrals employee referral interview process structured interview scorecard hiring rubric assessment work sample take home test reference checks make an offer compensation package equity offer cant find good people hiring is hard talent gap retention of staff",
    "Culture Design":          "culture company culture culture design values core values mission purpose vision workplace culture remote culture team norms rituals ways of working belonging culture code culture deck handbook employee handbook toxic culture bad culture good culture healthy culture retention turnover attrition quitting engagement employee engagement satisfaction morale motivation happiness meaning psychological safety trust transparency autonomy mastery purpose diversity inclusion equity dei onboarding culture fit values fit performance culture accountability culture feedback culture remote team distributed team async building culture how to keep good people people are leaving low morale toxic team company culture building culture culture building team culture organisational culture work culture remote work culture hybrid culture culture values core values value definition mission and vision purpose statement culture deck culture handbook employee handbook code of conduct ways of working operating principles team norms team rituals all hands town hall standups one on ones feedback culture radical candor psychological safety trust building belonging inclusion diversity equity dei employee engagement engagement survey pulse survey enps morale motivation recognition rewards retention staff retention reduce turnover attrition why are people leaving toxic culture culture problems culture fit values fit performance culture high performance accountability ownership autonomy founder culture set the tone lead by example",
    "Org Structure":           "org structure organisational structure organizational design org chart organisation chart reporting lines reporting structure hierarchy flat structure flat organisation departments functions teams squads pods roles responsibilities raci who does what who reports to who leadership team exec team management layers middle management span of control centralised decentralised matrix functional divisional restructure reorg reorganisation team topology scaling the org growing pains scaling people management structure how to structure my company too many managers unclear roles role clarity accountability gaps silos cross functional organisational design org design organisation structure organizational structure org chart organogram reporting structure reporting lines chain of command hierarchy flat organisation tall organisation layers of management delayering departments functions business units divisions teams squads tribes pods cross functional teams matrix organisation functional structure divisional structure roles and responsibilities role clarity job titles job descriptions raci responsibility assignment decision rights spans and layers span of control direct reports manager to ic ratio restructure reorganise reorg scale the organisation organisational scaling growing the team structure as we grow when to add managers middle management layer unclear who does what overlapping roles silos coordination problems",
    "Process Design":          "process process design business process workflow workflows sop sops standard operating procedure systems systematise systematize automation automate efficiency repeatability repeatable playbook operations manual documentation document processes handoff handoffs delegation delegate onboarding process training checklists quality control qc consistency standardisation scaling operations scaling without me founder dependency founder bottleneck bottleneck remove yourself work in vs work on systems thinking lean six sigma kaizen continuous improvement operational excellence process map flowchart everything depends on me cant scale chaos disorganised operations inefficient manual work too manual process design business process process mapping process documentation map a process document a process workflow design workflow automation standard operating procedures sop write an sop operating procedures operations playbook ops manual runbook checklists templates forms approval workflow handoff between teams handover delegation framework escalation path onboarding workflow employee onboarding customer onboarding training documentation knowledge base wiki internal docs quality assurance quality control consistency standardisation repeatable process scalable process systematise the business systemise operations reduce founder dependency get out of the day to day remove the bottleneck stop being the bottleneck everything runs through me business runs without me automate manual work zapier make integrations workflow tools too manual chaotic operations disorganised",
    "OKRs & KPIs":             "okr okrs objectives and key results kpi kpis key performance indicators metrics measurement tracking dashboard scorecard performance targets goals goal setting milestones progress north star metric one metric that matters leading indicators lagging indicators input metrics output metrics vanity metrics actionable metrics accountability weekly review monthly review quarterly review qbr business review reporting cadence what to measure how to track success measure what matters set goals align the team goal alignment not hitting targets no clear goals measuring the wrong things data driven metrics that matter performance management okr framework objectives and key results setting okrs quarterly okrs company okrs team okrs okr examples kpis key performance indicators business metrics performance metrics success metrics tracking metrics metrics dashboard kpi dashboard scorecard balanced scorecard north star metric one metric that matters input metrics output metrics leading indicators lagging indicators actionable metrics vanity metrics metrics that matter goal setting goal framework smart goals stretch goals targets quarterly targets annual targets milestones weekly metrics monthly review quarterly business review qbr performance review measure progress are we on track measure success what should we measure how do i track performance align the team on goals goal alignment cascading goals",
    "Decision Frameworks":     "decision making decisions decision framework frameworks how to decide who decides raci decision rights delegation authority empowerment speed of decisions fast decisions slow decisions governance alignment consensus disagree and commit meetings too many meetings analysis paralysis bias cognitive bias data driven intuition gut feel first principles second order thinking pros and cons cost benefit trade offs prioritisation eisenhower matrix conflict resolution stakeholder alignment buy in escalation bottlenecked decisions indecision cant make decisions stuck disagreement on direction who has final say decision making framework how to make decisions decision rights who gets to decide raci decision matrix delegation of authority empowerment decentralised decision making speed of decision making fast decisions slow decisions reversible decisions irreversible decisions one way door two way door type 1 type 2 decisions disagree and commit consensus versus consent escalation when to escalate decision logs decision journal expected value decision trees cost benefit analysis pros and cons weighted decision matrix first principles thinking second order effects mental models bias in decisions analysis paralysis overthinking decisions stuck on a decision cant decide indecisive too many meetings meeting overload decision bottleneck founder bottleneck unclear who decides decision gridlock alignment buy in stakeholder alignment",
    "Problem Validation":      "problem validation customer discovery problem discovery pain point real problem worth solving validate the problem demand evidence proof do people want this will people pay does anyone need this problem interview customer interview mom test talking to customers need finding desirability viability feasibility riskiest assumption assumption testing leap of faith hypothesis problem hypothesis early signals signal vs noise burning problem painkiller vs vitamin nice to have must have is this a real problem am i building something people want solution looking for a problem no demand nobody wants it problem space problem validation validate the problem is this a real problem problem discovery customer pain pain point validation real pain burning problem hair on fire problem urgent problem painkiller versus vitamin must have versus nice to have demand validation is there demand will anyone pay willingness to pay does anyone want this who has this problem how big is the pain customer interviews problem interviews the mom test talking to potential customers get out of the building riskiest assumption leap of faith assumption desirability test problem solution fit need finding unmet need underserved need jobs to be done early signals problem hypothesis testing assumptions am i solving a real problem nobody wants my product solution looking for a problem building something nobody needs validate before building",
    "Solution Testing":        "solution testing concept testing prototype prototyping experiment experiments concierge mvp wizard of oz fake door smoke test landing page test painted door validation learning build measure learn hypothesis test fail fast cheap test mockup clickable prototype interactive prototype wireframe paper prototype figma prototype no code low code rapid prototyping usability test user testing beta test pilot ab test split test multivariate qa quality assurance user feedback customer feedback does my solution work will this work test before building validate the solution proof of concept poc demo feedback loop solution testing concept test test my idea test my solution validate the solution prototype testing usability testing user testing test with users get user feedback feedback on prototype concierge mvp wizard of oz mvp fake door test painted door smoke test landing page test waitlist test pre sell pre order test demand test interest clickable prototype interactive prototype figma prototype invision prototype paper prototype wireframe mockup low fidelity high fidelity proof of concept poc pilot test beta test a b test split test experiment design hypothesis test minimum testable product cheapest test fastest test fail fast learn fast build measure learn validated learning does my solution work will people use it test before i build it",
    "PMF Signals":             "product market fit pmf product-market fit market fit do i have pmf how to know pmf retention retention curve engagement nps net promoter score sean ellis test very disappointed pull demand organic growth word of mouth virality repeat usage repeat purchase cohort retention cohort analysis churn stickiness dau mau active users daily active monthly active stickiness ratio usage frequency depth of use power users superusers love advocacy referrals customers love us cant keep up with demand pulling product out of our hands flat retention leaky bucket no retention users dont come back finding product market fit measuring pmf product market fit signals do i have product market fit how do i know if i have pmf measuring product market fit sean ellis test 40 percent very disappointed pmf survey retention as pmf signal flat retention curve smiling retention curve cohort retention strong retention organic growth word of mouth growth pull from the market demand outstripping supply cant keep up with demand customers wont shut up about it net promoter score nps high nps usage frequency daily active users monthly active users dau mau ratio stickiness engagement depth power users repeat usage repeat purchase low churn negative churn referrals organic signups inbound demand are we there yet pre pmf post pmf finding pmf chasing pmf losing pmf",
    "MVP Design":              "mvp minimum viable product mlp minimum lovable product lean startup build measure learn smallest version v1 first version scope scoping scope creep feature creep feature bloat over engineering gold plating simplest thing that works core feature core loop essential feature must have cut scope reduce scope trim features focus prioritise what to build first launch fast ship fast time to market first release walking skeleton thin slice no code prototype concierge testing too many features building too much overbuilding ship something get to market what should my mvp include keep it simple minimum viable product what is an mvp build an mvp scope my mvp mvp scope mvp features mvp feature set minimum feature set core features must have features cut features descope reduce scope smallest version first version v1 version one earliest testable product minimum lovable product mlp minimum marketable product walking skeleton thin vertical slice lean mvp no code mvp low code mvp manual mvp concierge mvp prototype as mvp launch fast ship fast time to market get to market quickly first release narrow focus do one thing well avoid scope creep avoid feature creep avoid over engineering avoid gold plating dont over build building too much too many features what should my mvp include keep it simple ship something small",
    "Roadmapping":             "roadmap roadmapping product roadmap backlog product backlog priorities prioritisation prioritization features feature list timeline releases release plan sprint planning quarterly planning what to build next now next later theme based outcome based rice scoring rice moscow must should could wont ice score weighted scoring value vs effort effort estimate stakeholder requests customer requests feature requests saying no technical debt tech debt maintenance vs new innovation explore exploit balance short term long term product strategy vision to roadmap planning what comes next too many requests competing priorities cant decide what to build product roadmap build a roadmap roadmap planning roadmapping process roadmap template now next later roadmap theme based roadmap outcome based roadmap goal oriented roadmap product backlog backlog management backlog prioritisation feature prioritisation prioritisation framework rice scoring rice prioritisation moscow method must should could wont weighted shortest job first wsjf value versus effort effort versus impact impact mapping opportunity solution tree story mapping release planning quarterly roadmap product strategy to roadmap stakeholder alignment on roadmap saying no to features handling feature requests customer requests technical debt versus features what to build next what comes after mvp planning the next quarter competing priorities cant decide priorities",
    "Iteration Cycles":        "iteration iterate iteration cycles agile scrum kanban sprint sprints sprint planning standup daily standup retrospective retro demo review velocity cadence shipping cadence release cycle deployment continuous delivery continuous integration ci cd feedback loop build measure learn loop continuous improvement kaizen lean two week sprint one week sprint story points estimation planning poker definition of done backlog grooming refinement shipping faster ship more often slow to ship velocity dropping not shipping cycle time lead time flow how to ship faster move faster development process iteration speed iterate quickly fast iteration build measure learn loop continuous improvement continuous delivery continuous deployment ci cd pipeline agile development agile methodology scrum framework kanban board sprint planning sprint review sprint retrospective retro daily standup daily scrum sprint length two week sprint one week sprint story points velocity tracking team velocity cycle time lead time flow efficiency definition of done definition of ready backlog refinement grooming shipping cadence release cadence release often ship daily ship weekly deploy frequently feedback loops short feedback loops learn from users iterate on feedback move fast we ship too slowly how to ship faster increase velocity development speed",
    "Value-Based Pricing":     "value based pricing value-based pricing willingness to pay wtp perceived value pricing power premium pricing how much to charge what to charge what should i charge setting prices price setting pricing model pricing strategy tiers tiered pricing packages packaging bundles bundling plans good better best price points subscription saas pricing per seat per user per usage usage based metered consumption based freemium free tier free trial enterprise pricing custom pricing quote based anchor price price anchoring decoy effect psychology of pricing charm pricing value metric pricing page undercharging underpriced leaving money on the table raise prices price increase capture value price my product how to price my product pricing my product what should i charge for my product how to set my price product pricing value based pricing value pricing price on value willingness to pay how much will customers pay perceived value pricing to value capture value pricing power premium pricing charge more raise prices price increase pricing strategy pricing model how to price what to charge set my price price points pricing tiers tiered pricing good better best three tiers packaging plans pricing plans bundle pricing unbundling subscription pricing saas pricing per seat pricing per user pricing usage based pricing consumption pricing metered pricing freemium model free tier free trial paid tiers enterprise tier custom pricing quote based pricing anchor pricing price anchoring decoy pricing psychological pricing charm pricing value metric the right price for my product am i charging enough undercharging underpriced leaving money on the table pricing page",
    "Competitive Pricing":     "competitive pricing competitor pricing market rate going rate benchmark price benchmarking comparison price comparison undercutting undercut matching price match premium economy mid market mid-range positioning on price price war race to the bottom commoditisation price competition discount discounting price floor price ceiling mystery shopping market research what competitors charge how much do competitors charge are we too expensive are we too cheap underpriced overpriced relative pricing price positioning loss leader penetration pricing skimming competitor undercut us price match guarantee competitor pricing competitive pricing strategy market pricing market rate going market rate price benchmarking price comparison compare prices to competitors undercut competitors price below market price match match competitor prices premium to market discount to market price positioning relative pricing economy pricing budget pricing mid market pricing luxury pricing price war price competition race to the bottom commoditised market commodity pricing price taker price maker loss leader pricing penetration pricing price skimming competitor price tracking mystery shopping what do competitors charge are we cheaper are we more expensive too expensive compared to competitors too cheap priced ourselves too low priced too high relative to market",
    "Price Testing":           "price testing pricing experiment ab test pricing page conversion rate price elasticity elasticity discount test free trial conversion paywall freemium conversion van westendorp price sensitivity meter conjoint analysis maxdiff willingness to pay survey gabor granger demand curve optimal price price point testing price increase test grandfathering grandfather pricing early bird launch pricing promotional pricing seasonal pricing dynamic pricing experiment with pricing find the right price test price points does price affect conversion how to test pricing price optimisation revenue optimisation price testing test pricing pricing experiment a b test pricing test price points price experiment conversion rate optimisation pricing page conversion price elasticity demand elasticity price sensitivity van westendorp price sensitivity meter gabor granger conjoint analysis maxdiff willingness to pay survey wtp survey price ladder price metric test paywall test freemium conversion test trial conversion discount experiment promo code test launch pricing introductory pricing early bird pricing founding member pricing grandfather existing customers price grandfathering raise prices without losing customers test a price increase optimal price point revenue maximising price find the right price does price affect signups how to test my pricing experiment with price",
    "Payroll & HR Compliance": "payroll pay staff paying employees salaries wages nssf national social security fund 10 percent 15 percent employer contribution employee contribution paye pay as you earn statutory deductions gratuity severance employment contract contract of service offer letter employment act 2006 labour law labor law minimum wage working hours overtime annual leave sick leave maternity leave paternity leave notice period probation termination dismissal redundancy disciplinary payslip pay slip net pay gross pay deductions casual worker contractor vs employee independent contractor work permit foreign staff kcca compliance hr compliance statutory compliance how to run payroll register for nssf am i compliant employment compliance staff benefits pension payroll processing run payroll pay employees pay staff staff salaries salary payments wage payments monthly payroll payroll calculation gross to net net pay take home pay statutory deductions paye deduction nssf deduction nssf contribution 10 percent employee 10 percent employer national social security fund register with nssf nssf compliance nssf remittance lst local service tax gratuity end of service severance pay terminal benefits pension employment contract contract of employment offer letter appointment letter job contract employment act 2006 uganda labour laws labour law compliance minimum wage working hours overtime pay annual leave sick leave maternity leave paternity leave public holidays notice period probation period termination dismissal redundancy retrenchment disciplinary procedure fair dismissal unfair dismissal payslip generation casual workers contract workers contractor versus employee misclassification work permits for expats foreign workers hr compliance employment compliance am i compliant with labour law how to register for nssf how to run payroll in uganda",
    "Legal & Registration":    "legal registration company registration register a company incorporate incorporation ursb uganda registration services bureau registrar of companies certificate of incorporation business name name reservation name search company name memorandum and articles memarts memorandum articles of association limited company private limited llc sole proprietor partnership ngo cbo registration tin investment licence uia uganda investment authority kcca trading licence sector licence bank of uganda licence nita data protection registration permits permits and licences contracts contract drafting nda non disclosure agreement terms and conditions terms of service privacy policy founders agreement shareholders agreement ip protection trademark registration patent copyright legal structure legal entity which entity should i register lawyer attorney legal advice corporate governance compliance regulatory statutory annual returns do i need to register my business how to register a company in uganda company registration register a company register my business business registration how to register a company in uganda ursb uganda registration services bureau registrar of companies certificate of incorporation incorporate a company company incorporation business name registration reserve a name name search name reservation company name search memorandum and articles of association memarts memorandum articles private limited company limited by shares limited by guarantee sole proprietorship business name partnership deed ngo registration cbo registration company secretary registered office shareholders directors company forms form 18 form 20 annual returns filing annual returns tin registration investment licence uia certificate kcca trading licence operating licence sector specific licence bank of uganda licence financial services licence nema licence unbs certification product certification data protection nita registration permits and licences business permits contracts contract drafting review a contract service agreement nda non disclosure agreement memorandum of understanding mou terms and conditions terms of service privacy policy website terms founders agreement co founders agreement shareholders agreement employment contracts intellectual property protection register a trademark trademark registration patent application copyright protection brand protection legal structure choosing a legal entity which business structure do i need a lawyer legal advice corporate governance statutory compliance regulatory compliance",
    "Payments & Mobile Money": "payments payment getting paid collect payments accept payments mobile money momo mtn mobile money mtn momo airtel money mobile money api collections payouts disbursements bulk payments ussd push stk merchant code till number agent payment gateway gateway integration flutterwave pesapal dpo pay ioTec yo uganda beyonic interswitch cellulant pegpay card payments visa mastercard debit card credit card online payments checkout payment link invoicing settlement reconciliation chargeback refund kyc float wallet e wallet digital wallet qr code pay with phone bank transfer eft rtgs swift cross border payments remittance stablecoin crypto how to accept mobile money integrate payments add a payment option payment failed transactions failing collect money from customers accept payments collect payments getting paid online payments take payments receive money payment collection payment processing mobile money mtn mobile money mtn momo airtel money mobile money integration mobile money api momo api collection api disbursement api payouts bulk payments bulk disbursements salary disbursement mobile money merchant merchant code till number agent banking ussd push stk push payment prompt payment gateway gateway integration flutterwave pesapal dpo group direct pay online ioTec pay yo uganda beyonic eversend chipper interswitch cellulant pegpay xente card payments visa mastercard debit cards credit cards card processing online checkout payment button payment link invoice payment recurring payments subscription billing settlement t plus one settlement reconciliation payment reconciliation chargebacks refunds dispute resolution kyc compliance float management e wallet digital wallet stored value qr code payments scan to pay tap to pay bank transfer eft rtgs swift international payments cross border payments remittances receive money from abroad diaspora payments stablecoin usdc crypto payments how to accept mobile money add mobile money to my app integrate payments add a payment option which payment provider payment failures failed transactions transaction failures collect money from customers get paid by customers",
  };

  // ============================================================
  //   SEARCH INTENT LAYER — goal-level queries
  //   Founders often describe the outcome they want ("I want to
  //   make more money"), not a course name. Each rule recognises
  //   goal language and boosts the specialties that answer it, so
  //   vague queries still land on bookable paths. Boosts add on
  //   top of the token matcher — they never suppress an exact
  //   match — and matter increasingly beyond the ITM market where
  //   founders won't share our vocabulary.
  // ============================================================
  const INTENT_RULES = [
    { // earn more — revenue/profit growth as a stated goal
      re: /(make|making|earn|earning|generate|bring in).{0,28}(money|profit|income|cash)|more (money|revenue|sales|profit|income)|increase (my )?(revenue|sales|profits?|income)|grow (my )?(revenue|sales|income|profits?)|boost (my )?(sales|revenue)|double (my )?(sales|revenue)/,
      boosts: { 'Value-Based Pricing': 5, 'PMF Signals': 4.5, 'Channel Mix': 4.2, 'Contribution Margin': 3.8, 'Brand Positioning': 3.4, 'CAC & LTV': 3 } },
    { // demand — can't find buyers
      re: /(get|find|win|attract|reach).{0,16}(customers|clients|buyers|users)|nobody (is )?buying|no (one is )?buying|no sales|cant sell|can not sell|sales are (low|down|slow)/,
      boosts: { 'Channel Mix': 5, 'Customer Research': 4.4, 'Brand Positioning': 4, 'Problem Validation': 3.8, 'Content Strategy': 3.4 } },
    { // bleeding — losing money / cost pressure
      re: /losing money|loss making|costs? (are )?(too )?(high|eating|killing)|expenses (are )?(too )?high|spending too much|not profitable|barely break(ing)? even/,
      boosts: { 'Contribution Margin': 5, 'Cash Flow Management': 4.4, 'Burn Rate & Runway': 4.2, 'Value-Based Pricing': 3.8, 'CAC & LTV': 3.4 } },
    { // capital — needs outside money
      re: /(need|raise|raising|looking for|searching for).{0,16}(capital|funding|investment|money to (grow|start|build|expand))|need money|get funding|fund my (business|startup|idea)|where.{0,20}(funding|investors)/,
      boosts: { 'Pre-seed Rounds': 5, 'Grants & DFIs': 4.6, 'Seed Rounds': 4.4, 'Investor Targeting': 4, 'Pitch Deck Structure': 3.4 } },
    { // orientation — doesn't know where to start
      re: /where (do|should) i (start|begin)|(dont|do not) know (where to (start|begin)|what to do)|just (started|starting)|new founder|first time founder|starting (a|my) business|have an idea/,
      boosts: { 'Problem Validation': 5, 'Customer Research': 4.4, 'MVP Design': 4.2, 'Market Analysis': 3.8, 'Legal & Registration': 3.4 } },
    { // plateau — growth stalled
      re: /not growing|stopped growing|stuck|plateau|flat ?lin|slow(ed)? growth|growth (has )?stalled|cant grow|can not grow/,
      boosts: { 'PMF Signals': 5, 'Channel Mix': 4.4, 'OKRs & KPIs': 3.9, 'Positioning & Moats': 3.6, 'Value-Based Pricing': 3.3 } },
    { // competition pressure
      re: /compet(itors?|ition).{0,12}(beating|killing|cheaper|winning|copying|taking)|losing (to|customers to) compet|crowded market|too much competition/,
      boosts: { 'Positioning & Moats': 5, 'Market Analysis': 4.4, 'Brand Positioning': 4.2, 'Competitive Pricing': 3.8 } },
    { // team pain
      re: /(team|staff|people|employees?) (is |are )?(keep |keeps )?(quitting|leaving|fighting|underperforming)|cant (find|keep) (good )?(people|staff|talent)|manage my team|team problems/,
      boosts: { 'Culture Design': 5, 'Hiring Strategy': 4.5, 'Org Structure': 4, 'Payroll & HR Compliance': 3.5, 'Decision Frameworks': 3.2 } },
    { // investor readiness
      re: /(impress|convince|attract|find|meet|ready for|talk to).{0,12}investors?|investor ready|investment ready|fundable|due diligence ready/,
      boosts: { 'Pitch Deck Structure': 5, 'Investor Narrative': 4.5, 'Data Room': 4.2, 'Due Diligence Prep': 4, 'Investor Targeting': 3.8, 'Valuation Methods': 3.4 } },
    { // legitimacy — compliance worry
      re: /stay out of trouble|legal trouble|am i legal|trouble with (ura|the law|government|kcca)|get (compliant|legit|legal)|formali[sz]e|make (it|my business) official/,
      boosts: { 'Legal & Registration': 5, 'Tax & Compliance': 4.6, 'Payroll & HR Compliance': 4 } },
    { // pricing confidence
      re: /charge more|raise (my )?prices?|too cheap|undercharg|overcharg|worth more|charging enough|right price|price.{0,10}right/,
      boosts: { 'Value-Based Pricing': 5, 'Price Testing': 4.4, 'Competitive Pricing': 4, 'Contribution Margin': 3.4 } },
    { // collections — getting paid
      re: /(customers?|clients?) (are )?not paying|cant collect|chasing payments?|get paid (faster|on time)|late payments?/,
      boosts: { 'Cash Flow Management': 5, 'Payments & Mobile Money': 4.4 } },
    { // visibility — wants to be known
      re: /get (noticed|famous|known|seen|discovered)|be (famous|known|visible)|nobody knows (us|my|about)|more (visibility|exposure|attention)|build (an |my )?audience/,
      boosts: { 'Brand Positioning': 5, 'Content Strategy': 4.5, 'SEO & Discoverability': 4.2, 'Channel Mix': 3.8 } },
    { // founder overload
      re: /work(ing)? too (much|hard)|burn(ing|t)? ?out|everything depends on me|cant take a (break|holiday)|do everything myself/,
      boosts: { 'Process Design': 5, 'Org Structure': 4.4, 'Decision Frameworks': 4, 'Hiring Strategy': 3.6 } },
  ];
  function intentBoosts(rawQ) {
    const out = {};
    for (const rule of INTENT_RULES) {
      if (!rule.re.test(rawQ)) continue;
      for (const name in rule.boosts) out[name] = Math.max(out[name] || 0, rule.boosts[name]);
    }
    return out;
  }

  // ============================================================
  //   GEO CONTEXT LAYER — SOM/SAM/TAM expansion harness
  //   Every African country, capital, key commercial hub, demonym
  //   and economic bloc is indexed. A query like "best marketing
  //   strategy for reaching customers in Lusaka, Zambia" detects
  //   {zambia · SADC}, boosts the geo-relevant specialties, and
  //   resolves the best coach by geographic coverage (coaches.geo)
  //   — falling back to the founding team until a coach covering
  //   that geography joins. Adding a Zambian coach later requires
  //   ONLY a coaches row with geo.covers: ['zambia','sadc'].
  //   NOTE on AES (Mali/Burkina Faso/Niger): kept under the ecowas
  //   market-region tag for coach-coverage purposes; this is a
  //   commercial region grouping, not a membership claim.
  // ============================================================
  // [key, Display, 'capital,hub,hub…', 'demonym/adjective…', 'bloc,bloc…'] — all terms lowercase ascii
  const GEO_COUNTRIES = [
    ['algeria','Algeria','algiers,oran','algerian','amu'],
    ['angola','Angola','luanda','angolan','sadc,eccas'],
    ['benin','Benin','porto-novo,cotonou','beninese','ecowas'],
    ['botswana','Botswana','gaborone','botswanan,motswana','sadc'],
    ['burkina-faso','Burkina Faso','ouagadougou,bobo-dioulasso','burkinabe','ecowas,aes'],
    ['burundi','Burundi','gitega,bujumbura','burundian','eac,comesa,eccas'],
    ['cabo-verde','Cabo Verde','praia,mindelo','cape verdean,cape verde','ecowas'],
    ['cameroon','Cameroon','yaounde,douala','cameroonian','eccas'],
    ['car','Central African Republic','bangui','central african republic','eccas'],
    ['chad','Chad','ndjamena','chadian','eccas'],
    ['comoros','Comoros','moroni','comorian','comesa,sadc'],
    ['congo-rep','Republic of Congo','brazzaville,pointe-noire','congo-brazzaville','eccas'],
    ['cote-divoire','Côte d\'Ivoire','yamoussoukro,abidjan','ivorian,ivory coast','ecowas'],
    ['djibouti','Djibouti','djibouti','djiboutian','igad,comesa'],
    ['drc','DR Congo','kinshasa,lubumbashi,goma','congolese,drc,dr congo,democratic republic of congo,congo','eac,sadc,eccas,comesa'],
    ['egypt','Egypt','cairo,alexandria,giza','egyptian','comesa'],
    ['equatorial-guinea','Equatorial Guinea','malabo,bata','equatoguinean','eccas'],
    ['eritrea','Eritrea','asmara','eritrean','igad'],
    ['eswatini','Eswatini','mbabane,manzini','swazi,swaziland','sadc,comesa'],
    ['ethiopia','Ethiopia','addis ababa,dire dawa','ethiopian','igad,comesa'],
    ['gabon','Gabon','libreville','gabonese','eccas'],
    ['gambia','The Gambia','banjul,serekunda','gambian','ecowas'],
    ['ghana','Ghana','accra,kumasi,tamale','ghanaian','ecowas'],
    ['guinea','Guinea','conakry','guinean','ecowas'],
    ['guinea-bissau','Guinea-Bissau','bissau','guinea-bissau','ecowas'],
    ['kenya','Kenya','nairobi,mombasa,kisumu','kenyan','eac,comesa,igad'],
    ['lesotho','Lesotho','maseru','basotho','sadc'],
    ['liberia','Liberia','monrovia','liberian','ecowas'],
    ['libya','Libya','tripoli,benghazi','libyan','amu,comesa'],
    ['madagascar','Madagascar','antananarivo','malagasy','sadc,comesa'],
    ['malawi','Malawi','lilongwe,blantyre','malawian','sadc,comesa'],
    ['mali','Mali','bamako','malian','ecowas,aes'],
    ['mauritania','Mauritania','nouakchott','mauritanian','amu'],
    ['mauritius','Mauritius','port louis','mauritian','sadc,comesa'],
    ['morocco','Morocco','rabat,casablanca,marrakesh,tangier','moroccan','amu'],
    ['mozambique','Mozambique','maputo,beira','mozambican','sadc'],
    ['namibia','Namibia','windhoek','namibian','sadc'],
    ['niger','Niger','niamey','nigerien','ecowas,aes'],
    ['nigeria','Nigeria','abuja,lagos,kano,port harcourt,ibadan','nigerian','ecowas'],
    ['rwanda','Rwanda','kigali','rwandan,rwandese','eac,comesa'],
    ['sao-tome','São Tomé & Príncipe','sao tome','santomean','eccas'],
    ['senegal','Senegal','dakar','senegalese','ecowas'],
    ['seychelles','Seychelles','victoria','seychellois','sadc,comesa'],
    ['sierra-leone','Sierra Leone','freetown','sierra leonean','ecowas'],
    ['somalia','Somalia','mogadishu,hargeisa','somali','eac,igad,comesa'],
    ['south-africa','South Africa','pretoria,johannesburg,cape town,durban,bloemfontein','south african','sadc'],
    ['south-sudan','South Sudan','juba','south sudanese','eac,igad'],
    ['sudan','Sudan','khartoum,port sudan','sudanese','comesa,igad'],
    ['tanzania','Tanzania','dodoma,dar es salaam,arusha,zanzibar','tanzanian','eac,sadc'],
    ['togo','Togo','lome','togolese','ecowas'],
    ['tunisia','Tunisia','tunis,sfax','tunisian','amu,comesa'],
    ['uganda','Uganda','kampala,entebbe,jinja,gulu,mbarara','ugandan','eac,comesa,igad'],
    ['zambia','Zambia','lusaka,ndola,kitwe','zambian','sadc,comesa'],
    ['zimbabwe','Zimbabwe','harare,bulawayo','zimbabwean','sadc,comesa'],
  ];
  // Bloc search terms → bloc key (markets founders actually name)
  const GEO_BLOC_TERMS = {
    'eac': 'eac', 'east african community': 'eac', 'east africa': 'eac',
    'sadc': 'sadc', 'southern africa': 'sadc',
    'ecowas': 'ecowas', 'west africa': 'ecowas',
    'comesa': 'comesa',
    'eccas': 'eccas', 'central africa': 'eccas',
    'amu': 'amu', 'maghreb': 'amu', 'north africa': 'amu',
    'igad': 'igad', 'horn of africa': 'igad',
    'aes': 'aes', 'sahel': 'aes',
    'afcfta': 'afcfta', 'pan african': 'afcfta', 'pan-african': 'afcfta', 'across africa': 'afcfta', 'all of africa': 'afcfta',
  };
  const GEO_BLOC_LABEL = {
    eac: 'East Africa (EAC)', sadc: 'Southern Africa (SADC)', ecowas: 'West Africa (ECOWAS)',
    comesa: 'COMESA', eccas: 'Central Africa (ECCAS)', amu: 'North Africa (Maghreb)',
    igad: 'Horn of Africa (IGAD)', aes: 'Sahel (AES)', afcfta: 'Africa-wide (AfCFTA)',
  };

  // Build term → geo lookup + one boundary-anchored matcher (longest first,
  // so "south sudan" wins over "sudan", "nigeria" never half-matches "niger").
  const GEO_TERM_MAP = new Map();
  const GEO_BY_KEY = new Map();
  GEO_COUNTRIES.forEach(row => {
    const [key, display, cities, adj, blocs] = row;
    const entry = { key, display, blocs: blocs.split(',') };
    GEO_BY_KEY.set(key, entry);
    const baseName = display.normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // Côte d'Ivoire → cote d'ivoire
      .toLowerCase().replace(/[^a-z\s\-']/g, ' ').replace(/\s+/g, ' ').trim();
    const terms = [baseName].concat(cities.split(','), adj.split(','));
    terms.forEach(t => { t = t.trim(); if (t) GEO_TERM_MAP.set(t, entry); });
  });
  Object.keys(GEO_BLOC_TERMS).forEach(t => GEO_TERM_MAP.set(t, { bloc: GEO_BLOC_TERMS[t] }));
  const GEO_RE = new RegExp('\\b(' +
    Array.from(GEO_TERM_MAP.keys())
      .sort((a, b) => b.length - a.length)
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') + ')\\b', 'g');

  // detectGeo('…customers in lusaka zambia') →
  //   { countries:[zambia], blocs:[sadc,comesa], label:'Zambia · Southern Africa (SADC)' }
  function detectGeo(rawQ) {
    GEO_RE.lastIndex = 0;
    const countries = [], blocs = [];
    let m;
    while ((m = GEO_RE.exec(rawQ)) !== null) {
      const e = GEO_TERM_MAP.get(m[1]);
      if (!e) continue;
      if (e.bloc) { if (!blocs.includes(e.bloc)) blocs.push(e.bloc); }
      else if (!countries.includes(e.key)) {
        countries.push(e.key);
        e.blocs.forEach(b => { if (!blocs.includes(b)) blocs.push(b); });
      }
    }
    if (!countries.length && !blocs.length) return null;
    const names = countries.map(k => GEO_BY_KEY.get(k).display);
    const label = (names.length ? names.join(', ') : '') +
      (blocs.length ? (names.length ? ' · ' : '') + (GEO_BLOC_LABEL[blocs[0]] || blocs[0].toUpperCase()) : '');
    return { countries, blocs, label };
  }

  // Geo-aware coach resolution: prefer a coach whose geo.covers names the
  // country (strongest) or shares a bloc; otherwise the standard resolver
  // order stands. New-market coaches are picked up with zero engine change.
  function coachCoversGeo(c, geo) {
    const cov = (c.geo && c.geo.covers) || [];
    if (geo.countries.some(k => cov.includes(k))) return 2;
    if (geo.blocs.some(b => cov.includes(b))) return 1;
    return 0;
  }
  function resolveCoachForGeo(l1Idx, l2Idx, l3Idx, geo) {
    const all = resolveAllCoaches(l1Idx, l2Idx, l3Idx);
    if (!all.length) return null;
    if (!geo) return all[0];
    let best = all[0], bestS = coachCoversGeo(all[0], geo);
    for (let i = 1; i < all.length; i++) {
      const s = coachCoversGeo(all[i], geo);
      if (s > bestS) { best = all[i]; bestS = s; }
    }
    return best;
  }
  function geoCoverLabel(c, geo) {
    const cov = (c.geo && c.geo.covers) || [];
    const ck = geo.countries.find(k => cov.includes(k));
    if (ck) return GEO_BY_KEY.get(ck).display;
    const bk = geo.blocs.find(b => cov.includes(b));
    return bk ? (GEO_BLOC_LABEL[bk] || bk.toUpperCase()) : '';
  }

  // ============================================================
  //   HASH → L1 INDEX MAP (deep linking from homepage)
  // ============================================================
  const HASH_TO_L1 = {
    'marketing':  0,
    'finance':    1,
    'investment': 2,
    'strategy':   3,
    'product':    4,
  };

  // ============================================================
  //   GEOMETRY
  // ============================================================
  const CX = 800, CY = 580;
  const R1 = 200, R2 = 360, R3 = 520;

  // ============================================================
  //   STATE
  // ============================================================
  const state = {
    yaw: 0,
    tilt: 18,
    speed: 0.028,
    fog: 0.40,
    labelPos: 'radial',
    loadProgress: 0,
    loadStarted: 0,
    hoveredId: null,
    pinnedId: null,
    focusedL1: null,
    yawTarget: null,
    yawVelocity: 0,
    userYawOffset: 0,
    userYawVelocity: 0,
    paused: false,
    dragging: false,
    lastDragX: 0,
    searchQuery: '',
    highlightLevel: null,  // 1|2|3 — legend click "lights up" all nodes of that tier
    lastInteraction: 0,  // timestamp of last node click/hover — auto-reset after 12s
  };
  window.__constellation = { state, TAXONOMY, COACHES };

  // ============================================================
  //   BUILD NODES + CONNECTIONS
  // ============================================================
  const NODES = [];
  const CONNS = [];
  const L1_STEP = 360 / TAXONOMY.length;

  TAXONOMY.forEach((d, i) => {
    const theta = i * L1_STEP - 90;
    const coach = resolveCoach(i);
    NODES.push({
      id: `l1-${i}`, level: 1, l1Idx: i,
      name: d.l1, short: d.l1Short, color: d.color,
      coach: coach ? coach.name : '', coachRole: coach ? coach.role : '',
      coachId: coach ? coach.id : null,
      theta, r: R1, yLift: 0,
      t0: 0.30 + i * 0.04,
      ancestors: [],
    });
    CONNS.push({
      id: `c-center-l1-${i}`, fromId: 'center', toId: `l1-${i}`,
      color: d.color, weight: 1.5, opacity: 0.35,
      t0: 0.28 + i * 0.04,
    });

    d.l2.forEach((sub, j) => {
      const l2Theta = theta + (j - 1) * (L1_STEP / 4.5);
      const l2Coach = resolveCoach(i, j);
      NODES.push({
        id: `l2-${i}-${j}`, level: 2, l1Idx: i, l2Idx: j,
        name: sub.name, color: d.color,
        coach: l2Coach ? l2Coach.name : '', coachRole: l2Coach ? l2Coach.role : '',
        coachId: l2Coach ? l2Coach.id : null,
        parentName: d.l1,
        theta: l2Theta, r: R2, yLift: 0,
        t0: 0.38 + i * 0.04 + j * 0.02,
        ancestors: [`l1-${i}`],
      });
      CONNS.push({
        id: `c-l1${i}-l2${j}`, fromId: `l1-${i}`, toId: `l2-${i}-${j}`,
        color: d.color, weight: 1, opacity: 0.25,
        t0: 0.36 + i * 0.04 + j * 0.02,
      });

      const l3Len = sub.l3.length;
      const l3Spread = l3Len > 3 ? 4.2 : 6;   // tighten the fan so a 4th specialty doesn't collide with the next branch
      sub.l3.forEach((spec, k) => {
        const l3Theta = l2Theta + (k - (l3Len - 1) / 2) * l3Spread;
        const l3Coach = resolveCoach(i, j, k);
        NODES.push({
          id: `l3-${i}-${j}-${k}`, level: 3, l1Idx: i, l2Idx: j, l3Idx: k,
          name: spec, color: d.color,
          coach: l3Coach ? l3Coach.name : '', coachRole: l3Coach ? l3Coach.role : '',
          coachId: l3Coach ? l3Coach.id : null,
          l3Len,                                  // branch size — label fan + stagger adapt to it
          parentName: sub.name, grandparentName: d.l1,
          theta: l3Theta, r: R3, yLift: 0,
          t0: 0.44 + i * 0.04 + j * 0.02 + k * 0.01,
          ancestors: [`l1-${i}`, `l2-${i}-${j}`],
        });
        CONNS.push({
          id: `c-l2${i}${j}-l3${k}`, fromId: `l2-${i}-${j}`, toId: `l3-${i}-${j}-${k}`,
          color: d.color, weight: 0.6, opacity: 0.18,
          t0: 0.42 + i * 0.04 + j * 0.02 + k * 0.01,
        });
      });
    });
  });

  const NODE_MAP = new Map();
  NODES.forEach(n => NODE_MAP.set(n.id, n));

  // Global label fan order per discipline — in the selected state L3
  // labels stagger by their angular neighbour order (not per-branch
  // index), so edge labels of adjacent L2 branches can't collide.
  TAXONOMY.forEach((d, i) => {
    NODES.filter(n => n.level === 3 && n.l1Idx === i)
      .sort((a, b) => a.theta - b.theta)
      .forEach((n, idx) => { n.fanIdx = idx; });
  });

  // ============================================================
  //   DOM REFS + STATIC BUILD
  // ============================================================
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('cnst');
  const gRings  = document.getElementById('g-rings');
  const gConns  = document.getElementById('g-conns');
  const gCenter = document.getElementById('g-center');
  const gNodes  = document.getElementById('g-nodes');
  const gBurst  = document.getElementById('g-burst');
  const gHaze   = document.getElementById('g-haze');

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ---------- Atmospheric cloud cover ----------
  // Layered volumetric haze for depth (matches the brand-nebula mood:
  // terracotta upper-left, ochre upper-right, sage/moss lower, with a
  // warm accretion core, cool far banks and a faint dust band). `depth`
  // scales the yaw-parallax so the constellation visibly turns THROUGH
  // the clouds; `dur` is the slow self-drift period. Bigger soft blooms
  // sit behind, smaller crisper ones in front.
  const HAZE_ORBS = [
    // far depth banks (slow, big, weak parallax — read as distant)
    { grad: 'g-cloud-far',   x: 0.30, y: 0.18, r: 620, dur: 72, phase: 0.9, depth: 0.18, op: 0.85 },
    { grad: 'g-cloud-far',   x: 0.74, y: 0.84, r: 660, dur: 84, phase: 2.6, depth: 0.18, op: 0.80 },
    // warm accretion core behind the mark
    { grad: 'g-cloud-core',  x: 0.50, y: 0.52, r: 540, dur: 60, phase: 1.2, depth: 0.10, op: 0.9  },
    // brand corner blooms (mid layer)
    { grad: 'g-orb-terra',   x: 0.20, y: 0.30, r: 360, dur: 38, phase: 0,   depth: 0.42, op: 0.9  },
    { grad: 'g-orb-ochre',   x: 0.78, y: 0.22, r: 320, dur: 44, phase: 1.7, depth: 0.42, op: 0.9  },
    { grad: 'g-orb-sage',    x: 0.82, y: 0.72, r: 380, dur: 52, phase: 0.6, depth: 0.42, op: 0.9  },
    { grad: 'g-orb-moss',    x: 0.18, y: 0.78, r: 340, dur: 46, phase: 2.3, depth: 0.42, op: 0.9  },
    // faint near dust band (fast parallax — reads as foreground haze)
    { grad: 'g-cloud-dust',  x: 0.42, y: 0.62, r: 300, dur: 33, phase: 3.1, depth: 0.70, op: 0.9  },
    { grad: 'g-cloud-dust',  x: 0.62, y: 0.38, r: 280, dur: 29, phase: 4.4, depth: 0.70, op: 0.9  },
  ];
  // Cache haze data in JS — avoid reading DOM attributes every frame
  const hazeEls = HAZE_ORBS.map(o => {
    const ox = o.x * 1600, oy = o.y * 1000;
    const c = el('circle', {
      cx: ox, cy: oy, r: o.r,
      fill: `url(#${o.grad})`,
      opacity: 0.0,
    });
    gHaze.appendChild(c);
    return { el: c, phase: o.phase, dur: o.dur, ox, oy, r: o.r, depth: o.depth, op: o.op };
  });

  // Orbital rings
  const ringEls = [R1, R2, R3].map((r) => {
    const e = el('ellipse', {
      cx: CX, cy: CY, rx: r, ry: r,
      fill: 'none', stroke: 'rgba(239,231,216,0.08)',
      'stroke-width': 1, 'stroke-dasharray': '2 6', class: 'ring',
    });
    gRings.appendChild(e);
    return e;
  });

  // Pentagon connecting L1 nodes
  const pentagonEl = el('polygon', {
    points: '', fill: 'none', stroke: 'rgba(239,231,216,0.07)',
    'stroke-width': 1, class: 'ring',
  });
  gRings.appendChild(pentagonEl);

  // Centre mark group
  const centerGroup = el('g', { id: 'center-mark' });
  centerGroup.appendChild(el('circle', { cx: CX, cy: CY, r: 118, fill: 'url(#g-center)' }));
  const PETAL_COLS = ['#c8531f','#c9923a','#8aab5c','#3d4a2e','#777770'];
  const RAY_COLS   = ['#c8531f','#c9923a','#8aab5c','#5f7a45','#a59b8c'];  // brightened moss/stone read on the dark field
  const MARK_SCALE = 1.55;
  const petalsGroup = el('g', { id: 'center-petals', transform: `translate(${CX} ${CY})` });
  // long thin light-ray spikes — a glowing star ("choose a star; meet your coach")
  for (let i = 0; i < 10; i++) {
    const long = i % 2 === 0;
    const len = long ? 134 : 76;
    const w = long ? 3.2 : 2.0;
    const ray = el('polygon', {
      points: `0,${-len} ${w},0 0,${(len*0.14).toFixed(1)} ${-w},0`,
      fill: RAY_COLS[i % RAY_COLS.length], opacity: long ? 0.5 : 0.3,
      transform: `rotate(${i*36})`, filter: 'url(#f-glow-sm)', 'pointer-events': 'none',
    });
    petalsGroup.appendChild(ray);
  }
  // V6 petals (identity mark)
  PETAL_COLS.forEach((c, i) => {
    const src = [[50,8],[57.5,50],[50,92],[42.5,50]];
    const pts = src.map(([x,y]) => [(x-50)*MARK_SCALE, (y-50)*MARK_SCALE].join(',')).join(' ');
    const p = el('polygon', { points: pts, fill: c, opacity: 0.9, transform: `rotate(${i*72})` });
    petalsGroup.appendChild(p);
  });
  // Bright glowing core — paper halo, ink eye, tight catch-light
  petalsGroup.appendChild(el('circle', { cx: 0, cy: 0, r: 12, fill: COL_PAPER, filter: 'url(#f-glow-sm)' }));
  petalsGroup.appendChild(el('circle', { cx: 0, cy: 0, r: 5.5, fill: COL_INK }));
  petalsGroup.appendChild(el('circle', { cx: 0, cy: 0, r: 2, fill: COL_PAPER }));
  centerGroup.appendChild(petalsGroup);
  const centerHit = el('circle', {
    cx: CX, cy: CY, r: 92,
    fill: 'transparent', class: 'center-hit',
    'pointer-events': 'all',
  });
  const gHit = document.getElementById('g-hit');
  gHit.appendChild(centerHit);
  gCenter.appendChild(centerGroup);

  // Rotate the center mark via JS in the render loop (Safari doesn't reliably
  // handle CSS animations + transform-box on SVG groups).

  // ---------- Star-burst flash (intro pop, dissolves into the dust field) ----------
  const burstFlash = el('circle', { cx: CX, cy: CY, r: 20, fill: 'url(#g-center)', opacity: 0 });
  gBurst.appendChild(burstFlash);

  // ---------- Firecracker burst: fractal spark trails + ember heads ----------
  // 38 primary sparks explode from the mark; ~45% split into two shorter
  // child sparks mid-flight (one level of branching = the fractal read).
  // Each trail is an ORGANIC WAVE, not a straight ray: every spark gets
  // its own amplitude, frequency, phase and arc bend, and the wave grows
  // outward from the centre so trails leave the mark clean and ripple as
  // they fly. The tail chases the head and burns out, with a bright ember
  // at the tip that dies just as the nodes land. Intro only — everything
  // zeroes after load with no per-frame cost.
  const SPARKS = [];
  (function buildSparks() {
    const mk = (angleDeg, len, t0, width, color) => {
      const path = el('path', { d: '', fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });
      const ember = el('circle', { cx: CX, cy: CY, r: 1.6, fill: color, opacity: 0 });
      gBurst.appendChild(path); gBurst.appendChild(ember);
      SPARKS.push({
        path, ember, angle: angleDeg * Math.PI / 180, len, t0,
        dur: 0.34 + Math.random() * 0.14,
        amp: (4 + Math.random() * 10) * (len / 200),       // wave height, scaled to trail length
        freq: (1.4 + Math.random() * 1.8) * Math.PI * 2,   // 1.4–3.2 waves along the trail
        ph: Math.random() * Math.PI * 2,
        bend: (Math.random() - 0.5) * 0.6,                 // gentle arc — no two sparks fly alike
      });
    };
    const N = 38;   // +25% density
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 360 + (Math.random() - 0.5) * 9;
      const len = 100 + Math.random() * 170;   // half length — tighter, punchier burst
      const col = PETAL_COLS[i % PETAL_COLS.length];
      const t0 = 0.02 + Math.random() * 0.05;
      mk(a, len, t0, 1 + Math.random() * 0.9, col);
      if (Math.random() < 0.45) {
        const spread = 7 + Math.random() * 9;
        mk(a - spread, len * (0.4 + Math.random() * 0.25), t0 + 0.10, 0.7, col);
        mk(a + spread, len * (0.4 + Math.random() * 0.25), t0 + 0.10, 0.7, col);
      }
    }
  })();
  let sparksDone = false;
  // Sample a wavy trail point at distance d along a spark (squash echoes the tilt)
  function sparkPoint(s, d) {
    const frac = d / s.len;
    const wave = Math.sin(frac * s.freq + s.ph) * s.amp * frac   // ripple grows outward
               + s.bend * frac * frac * s.len * 0.3;             // plus a gentle arc
    const ca = Math.cos(s.angle), sa = Math.sin(s.angle);
    const x = CX + ca * d - sa * wave;
    const y = CY + (sa * d + ca * wave) * 0.92;
    return x.toFixed(1) + ' ' + y.toFixed(1);
  }

  // ---------- Particle system (star dust — bursts outward on load, then drifts) ----------
  const PARTICLE_COUNT = 84;
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 520;
    const colorIdx = Math.floor(Math.random() * PETAL_COLS.length);
    const size = 0.6 + Math.random() * 1.8;
    const speed = 0.2 + Math.random() * 0.6;
    const phase = Math.random() * Math.PI * 2;
    const drift = (Math.random() - 0.5) * 0.0003;
    const c = el('circle', {
      cx: CX + Math.cos(angle) * dist,
      cy: CY + Math.sin(angle) * dist,
      r: size,
      fill: PETAL_COLS[colorIdx],
      opacity: 0,
    });
    gBurst.appendChild(c);
    particles.push({
      el: c, angle, dist, size, speed, phase, drift,
      baseX: CX + Math.cos(angle) * dist,
      baseY: CY + Math.sin(angle) * dist,
      color: PETAL_COLS[colorIdx],
      maxOpacity: 0.12 + Math.random() * 0.28,
      depth: 0.25 + Math.random() * 0.75,   // parallax: nearer dust sweeps faster as the graph turns
      px: CX, py: CY, vx: 0, vy: 0,         // spring-integrated position — burst start at the mark
      sparkle: 0,                           // rare bright twinkle, decays exponentially
    });
  }

  // ---------- Connection lines ----------
  const connEls = new Map();
  CONNS.forEach(c => {
    const ln = el('line', {
      x1: 0, y1: 0, x2: 0, y2: 0,
      stroke: c.color, 'stroke-width': c.weight, opacity: 0,
      class: 'conn',
    });
    gConns.appendChild(ln);
    connEls.set(c.id, ln);
  });

  // ---------- Nodes ----------
  const nodeEls = new Map();
  NODES.forEach(n => {
    const g = el('g', { class: 'node', 'data-node-id': n.id });
    g.style.transform = `translate(${CX}px, ${CY}px)`;

    const hitR = n.level === 1 ? 60 : n.level === 2 ? 26 : 14;
    const hit = el('circle', { cx: 0, cy: 0, r: hitR, fill: 'transparent', class: 'node-hit' });
    g.appendChild(hit);

    if (n.level === 1) {
      n._glow = el('circle', { cx: 0, cy: 0, r: 48, fill: n.color, opacity: 0.18, filter: 'url(#f-glow-lg)' });
      n._halo = el('circle', { cx: 0, cy: 0, r: 42, fill: 'none', stroke: n.color, 'stroke-width': 0.8, 'stroke-dasharray': '1 5', opacity: 0.22 });
      n._ring = el('circle', { cx: 0, cy: 0, r: 30, fill: COL_INK, stroke: n.color, 'stroke-width': 2 });
      // 3D glass dome: rim-shade recesses the disc, sheen domes it, two
      // catch-lights read as wet glass.
      n._dome = el('circle', { cx: 0, cy: 0, r: 29, fill: 'url(#g-sph-shade)', opacity: 0.5, 'pointer-events': 'none' });
      n._sheen = el('circle', { cx: 0, cy: 0, r: 29, fill: 'url(#g-sph-hi)', opacity: 0.35, 'pointer-events': 'none' });
      n._innerDot = el('circle', { cx: 0, cy: 0, r: 4, fill: n.color });
      n._spec = el('circle', { cx: -10, cy: -11, r: 2.6, fill: COL_PAPER, opacity: 0.32 });    // specular catch-light
      n._spec2 = el('circle', { cx: -5, cy: -6, r: 1.1, fill: COL_PAPER, opacity: 0.5 });      // tight wet glint
      g.appendChild(n._glow);
      g.appendChild(n._halo);
      g.appendChild(n._ring);
      g.appendChild(n._dome);
      g.appendChild(n._sheen);
      g.appendChild(n._innerDot);
      g.appendChild(n._spec);
      g.appendChild(n._spec2);

      const t1 = el('text', { x: 0, y: -8, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: n.color, opacity: 0.95, 'font-family': "'Josefin Sans', sans-serif", 'font-size': 8.5, 'font-weight': 700, 'letter-spacing': 1, class: 'label' });
      t1.textContent = n.short[0];
      const t2 = el('text', { x: 0, y: 6, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: n.color, opacity: 0.95, 'font-family': "'Josefin Sans', sans-serif", 'font-size': 8.5, 'font-weight': 700, 'letter-spacing': 1, class: 'label' });
      t2.textContent = n.short[1];
      g.appendChild(t1); g.appendChild(t2);
      n._innerLabel = [t1, t2];

      n._coach = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'rgba(239,231,216,0.45)', 'font-family': "'Josefin Sans', sans-serif", 'font-size': 10, 'font-weight': 400, 'letter-spacing': 2.2, class: 'label' });
      n._coach.textContent = n.coach.toUpperCase();
      g.appendChild(n._coach);

    } else if (n.level === 2) {
      n._glow = el('circle', { cx: 0, cy: 0, r: 18, fill: n.color, opacity: 0.18, filter: 'url(#f-glow-sm)' });
      n._ring = el('circle', { cx: 0, cy: 0, r: 9, fill: COL_INK, stroke: n.color, 'stroke-width': 1.5 });
      n._innerDot = el('circle', { cx: 0, cy: 0, r: 3, fill: n.color });
      n._sheen = el('circle', { cx: 0, cy: 0, r: 8, fill: 'url(#g-sph-hi)', opacity: 0.5, 'pointer-events': 'none' });   // glass gloss
      g.appendChild(n._glow); g.appendChild(n._ring); g.appendChild(n._innerDot); g.appendChild(n._sheen);

      n._plate = el('path', { d: '', fill: COL_INK2, stroke: n.color, 'stroke-width': 0.8, opacity: 0, 'pointer-events': 'none' });   // chevron label tab
      g.appendChild(n._plate);
      n._label = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: n.color, 'font-family': "'Josefin Sans', sans-serif", 'font-size': 9.5, 'font-weight': 600, 'letter-spacing': 1.5, class: 'label' });
      n._label.textContent = n.name.toUpperCase();
      g.appendChild(n._label);

    } else {
      n._twPhase = Math.random() * Math.PI * 2;   // per-star twinkle offset
      n._innerDot = el('circle', { cx: 0, cy: 0, r: 3, fill: n.color, opacity: 0.7 });
      n._glowDot  = el('circle', { cx: 0, cy: 0, r: 6, fill: n.color, opacity: 0, filter: 'url(#f-glow-sm)' });
      n._sheen = el('circle', { cx: 0, cy: 0, r: 3, fill: 'url(#g-sph-hi)', opacity: 0.6, 'pointer-events': 'none' });   // glossy orb sheen
      n._tick = el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: n.color, 'stroke-width': 0.6, opacity: 0.3, class: 'tick' });
      g.appendChild(n._tick);
      g.appendChild(n._glowDot); g.appendChild(n._innerDot); g.appendChild(n._sheen);

      n._plate = el('path', { d: '', fill: COL_INK2, stroke: n.color, 'stroke-width': 0.8, opacity: 0, 'pointer-events': 'none' });   // chevron label tab
      g.appendChild(n._plate);
      n._label = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: 'rgba(239,231,216,0.78)', 'font-family': "'Inter', sans-serif", 'font-size': 10, 'font-weight': 400, 'letter-spacing': 0.3, class: 'label' });
      n._label.textContent = n.name;
      g.appendChild(n._label);
    }

    gNodes.appendChild(g);
    nodeEls.set(n.id, g);
    n._group = g;

    g.addEventListener('pointerenter', () => { state.hoveredId = n.id; updateInfoPanel(); });
    g.addEventListener('pointerleave', () => { if (state.hoveredId === n.id) { state.hoveredId = null; updateInfoPanel(); } });
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      state.lastInteraction = Date.now();
      if (state.highlightLevel) setHighlightLevel(null);   // node selection takes over from a legend highlight
      if (n.level === 1) {
        focusOnDiscipline(n.l1Idx);
      } else if (n.level === 3) {
        recenterOnNode(n);
        setTimeout(() => openDetail(n), 480);
      } else {
        if (state.pinnedId === n.id) {
          state.pinnedId = null;
          state.hoveredId = null;
          state.paused = false;
          updateInfoPanel();
        } else {
          recenterOnNode(n);
        }
      }
    });
  });

  // ============================================================
  //   LEGEND — click a tier key to light up all nodes of that level
  // ============================================================
  // Retained for node-click + frame-loop references (no longer legend-driven).
  function setHighlightLevel(lvl) {
    state.highlightLevel = (state.highlightLevel === lvl) ? null : lvl;
  }
  // Disciplines legend — glyph · name · L3 count, built from the taxonomy.
  // Click focuses that discipline's branch (reuses focusOnDiscipline).
  (function buildDisciplineLegend() {
    const box = document.getElementById('legend');
    if (!box) return;
    box.innerHTML = '<div class="legend-head">Disciplines</div>';
    TAXONOMY.forEach((d, i) => {
      const l3n = d.l2.reduce((s, sub) => s + ((sub.l3 && sub.l3.length) || 0), 0);
      const item = document.createElement('div');
      item.className = 'legend-item legend-disc';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.dataset.l1 = i;
      item.innerHTML = '<span class="legend-diamond" style="color:' + d.color + '"></span>';
      const name = document.createElement('span');
      name.className = 'legend-disc-name';
      name.textContent = d.l1;
      item.appendChild(name);
      const cnt = document.createElement('span');
      cnt.className = 'legend-disc-count';
      cnt.textContent = String(l3n).padStart(2, '0');
      item.appendChild(cnt);
      item.addEventListener('click', () => { if (typeof unfocus === 'function') unfocus(); focusOnDiscipline(i); });
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
      box.appendChild(item);
    });
  })();

  // Persistent search pill (top-right) opens the wired search overlay.
  var _searchPill = document.getElementById('search-pill');
  if (_searchPill) _searchPill.addEventListener('click', openSearch);

  // Stat strip (bottom-right) — live counts from the taxonomy + coaches.
  var _stat = document.getElementById('stat-strip');
  if (_stat) {
    var nL3 = 0, nL2 = 0;
    TAXONOMY.forEach(function (d) { nL2 += d.l2.length; d.l2.forEach(function (s) { nL3 += (s.l3 && s.l3.length) || 0; }); });
    _stat.textContent = nL3 + ' Specialties · ' + nL2 + ' Modules · ' + TAXONOMY.length + ' Disciplines · ' + COACHES.length + ' Coaches';
  }

  // ============================================================
  //   PROJECTION
  // ============================================================
  function projectAngle(thetaDeg, r, yLift, tiltDeg) {
    const a = (thetaDeg + state.yaw + state.userYawOffset) * Math.PI / 180;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const y = yLift || 0;
    const tt = tiltDeg * Math.PI / 180;
    const yp = y * Math.cos(tt) - z * Math.sin(tt);
    const zp = y * Math.sin(tt) + z * Math.cos(tt);
    const camDist = 1400;
    const persp = camDist / (camDist - zp);
    return { sx: CX + x * persp, sy: CY + yp * persp, z: zp, persp };
  }

  function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
  function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
  function smootherstep(t){ t = Math.max(0, Math.min(1, t)); return t*t*t*(t*(t*6-15)+10); }   // C2-continuous — silky in/out
  function easeOutBack(t, overshoot){
    const c1 = overshoot != null ? overshoot : 1.5;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function lerp(a,b,t){ return a + (b-a)*t; }

  // ============================================================
  //   FOCUS MODE
  // ============================================================
  function focusOnDiscipline(i) {
    state.lastInteraction = Date.now();
    state.focusedL1 = i;
    const desiredYaw = 90 - (i * L1_STEP - 90);
    state.yawTarget = normaliseAngleTowards(state.yaw, desiredYaw);
    state.userYawOffset = 0;
    state.paused = true;
    state.pinnedId = `l1-${i}`;
    state.hoveredId = state.pinnedId;
    updateInfoPanel();
  }
  function unfocus() {
    state.focusedL1 = null;
    state.yawTarget = null;
    state.paused = false;
    state.pinnedId = null;
    state.hoveredId = null;
    updateInfoPanel();
  }
  function normaliseAngleTowards(current, target) {
    let t = target;
    while (t - current > 180) t -= 360;
    while (t - current < -180) t += 360;
    return t;
  }
  function recenterOnNode(n) {
    const desiredYaw = 90 - n.theta;
    state.yawTarget = normaliseAngleTowards(state.yaw, desiredYaw);
    state.userYawOffset = 0;
    state.paused = true;
    state.pinnedId = n.id;
    state.hoveredId = n.id;
    updateInfoPanel();
  }
  window.__constellation.focusOnDiscipline = focusOnDiscipline;
  window.__constellation.unfocus = unfocus;

  // ============================================================
  //   INFO PANEL
  // ============================================================
  const infoEl   = document.getElementById('info');
  const ebEl     = document.getElementById('info-eb');
  const nameEl   = document.getElementById('info-name');
  const pathEl   = document.getElementById('info-path');
  const coachEl  = document.getElementById('info-coach');

  function updateInfoPanel() {
    const detailOpen = document.getElementById('detail').classList.contains('show');
    const activeId = state.pinnedId || state.hoveredId;
    if (!activeId || detailOpen) { infoEl.classList.remove('show'); return; }
    const n = NODE_MAP.get(activeId);
    if (!n) return;
    const labels = ['Discipline','Sub-category','Specialty'];
    infoEl.classList.add('show');
    infoEl.style.setProperty('--info-color', n.color);
    ebEl.textContent = labels[n.level - 1];
    nameEl.textContent = n.name;
    pathEl.innerHTML = '';
    const breadcrumbs = [];
    if (n.level === 1) breadcrumbs.push(n.name);
    if (n.level === 2) breadcrumbs.push(n.parentName, n.name);
    if (n.level === 3) breadcrumbs.push(n.grandparentName, n.parentName, n.name);
    breadcrumbs.forEach((s, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span'); sep.className = 'sep'; sep.textContent = '/';
        pathEl.appendChild(sep);
      }
      const span = document.createElement('span'); span.textContent = s; pathEl.appendChild(span);
    });
    coachEl.innerHTML = '';
    if (n.coach) {
      const b = document.createElement('b'); b.textContent = 'Coach'; coachEl.appendChild(b);
      coachEl.appendChild(document.createTextNode('  ·  ' + n.coach));
    }
  }

  // ============================================================
  //   DETAIL SLIDE-OUT (L3 click)
  // ============================================================
  const detailEl = document.getElementById('detail');
  let detailSelectedFormat = '1:1';
  let detailSelectedSlot = null;
  let detailCurrentNode = null;

  function renderSlots() {
    const slotsEl = detailEl.querySelector('.d-slots');
    slotsEl.innerHTML = '';
    detailSelectedSlot = null;
    if (detailSelectedFormat === '1:1') {
      ONETOONE_SLOTS.forEach((s, i) => {
        const row = document.createElement('button');
        row.className = 'slot' + (i === 0 ? ' selected' : '');
        row.innerHTML = `
          <span class="slot-date">${s.date}</span>
          <span class="slot-time">${s.time}</span>
          <span class="slot-dur">${s.dur}</span>
          <span class="slot-arrow">→</span>`;
        row.addEventListener('click', () => {
          slotsEl.querySelectorAll('.slot').forEach(x => x.classList.remove('selected'));
          row.classList.add('selected');
          detailSelectedSlot = s;
          updateBookButton();
        });
        slotsEl.appendChild(row);
      });
      detailSelectedSlot = ONETOONE_SLOTS[0];
    } else {
      let firstOpenIdx = COHORT_SCHEDULE.findIndex(c => c.status === 'open');
      COHORT_SCHEDULE.forEach((c, i) => {
        const isFull = c.status === 'full';
        const isFirstOpen = i === firstOpenIdx;
        const row = document.createElement('button');
        row.className = 'slot cohort' + (isFull ? ' full' : '') + (isFirstOpen ? ' selected' : '');
        if (isFull) row.disabled = true;
        row.innerHTML = `
          <span class="slot-date">${c.label}</span>
          <span class="slot-time">${c.dates}</span>
          <span class="slot-dur">${isFull ? 'Full' : c.seats + ' seats'}</span>
          <span class="slot-arrow">${isFull ? '' : '→'}</span>`;
        if (!isFull) {
          row.addEventListener('click', () => {
            slotsEl.querySelectorAll('.slot').forEach(x => x.classList.remove('selected'));
            row.classList.add('selected');
            detailSelectedSlot = c;
            updateBookButton();
          });
          if (isFirstOpen) detailSelectedSlot = c;
        }
        slotsEl.appendChild(row);
      });
    }
    updateBookButton();
  }
  function updateBookButton() {
    const btn = detailEl.querySelector('.d-book');
    if (!detailSelectedSlot) { btn.disabled = true; btn.textContent = 'Select a slot'; return; }
    btn.disabled = false;
    if (detailSelectedFormat === '1:1') {
      btn.textContent = `Book · ${detailSelectedSlot.date}, ${detailSelectedSlot.time} →`;
    } else {
      btn.textContent = `Reserve · ${detailSelectedSlot.label} →`;
    }
  }

  function openDetail(n) {
    detailCurrentNode = n;
    const desc = L3_DESC[n.name] || `A focused session on ${n.name} within ${n.parentName}.`;
    detailEl.style.setProperty('--detail-color', n.color);
    detailEl.querySelector('.d-eb').textContent = 'Specialty';
    detailEl.querySelector('.d-name').textContent = n.name;
    detailEl.querySelector('.d-path').innerHTML =
      `<span>${n.grandparentName}</span><span class="sep">/</span><span>${n.parentName}</span>`;
    detailEl.querySelector('.d-desc').textContent = desc;
    // L3 = the bookable unit; L2 = a track; cohort = the whole discipline / every L3
    detailEl.querySelector('.d-spec-note').innerHTML =
      `One 2-hour 1:1 deep-dive — the unit you book. Part of the <b>${escH(n.parentName)}</b> track; take all of <b>${escH(n.grandparentName)}</b> only in the full cohort.`;

    // Coach card — uses the resolved coach for this node
    const coach = n.coachId ? COACH_BY_ID.get(n.coachId) : null;
    const coachAvatar = detailEl.querySelector('.coach-avatar');
    const coachName   = detailEl.querySelector('.coach-name');
    const coachRole   = detailEl.querySelector('.coach-role');
    const initials = coach ? coach.name.split(' ').map(s => s[0]).join('').slice(0,2) : '?';
    if (coach && coach.photo) {
      coachAvatar.textContent = '';
      coachAvatar.style.background = `url('${coach.photo}') center/cover no-repeat`;
      coachAvatar.style.color = 'transparent';
      coachAvatar.style.borderColor = n.color;
    } else {
      coachAvatar.textContent = initials;
      coachAvatar.style.background = n.color + '22';
      coachAvatar.style.color = n.color;
      coachAvatar.style.borderColor = n.color;
    }
    coachName.textContent = coach ? coach.name : 'TBA';
    coachRole.textContent = coach ? coach.role : '';

    // Rating
    const r = coach ? { rating: coach.rating, sessions: coach.sessions } : { rating: 0, sessions: 0 };
    const stars = detailEl.querySelector('.coach-rating .stars');
    const filled = Math.round(r.rating);
    stars.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('span');
      s.className = 'star' + (i < filled ? ' on' : '');
      s.textContent = '★';
      stars.appendChild(s);
    }
    detailEl.querySelector('.coach-rating .rating-num').textContent = r.rating.toFixed(1);
    detailEl.querySelector('.coach-rating .rating-count').textContent = `· ${r.sessions} sessions`;

    detailSelectedFormat = '1:1';
    detailEl.querySelector('input[name="d-format"][value="1:1"]').checked = true;
    renderSlots();
    // specialty mode: hide the L1/L2 breakdown, show the booking region
    detailEl.querySelector('.d-breakdown').hidden = true;
    detailEl.classList.remove('mode-l1l2');
    detailEl.classList.add('show');
    updateInfoPanel();
  }

  // ---- L1 (discipline) & L2 (module) slide-out panels -------------------
  // Same aside, repurposed: the coach/format/slots booking region is hidden
  // (via .mode-l1l2) and a breakdown of the branch is shown instead. Content
  // is the existing copy — discipline narrative (MOBILE_L1_DESC), module
  // tagline (L2_DESC, lifted from the method pages), and the taxonomy tree.
  const L2_DESC = {
    'Brand Strategy': "Your brand is the promise the market remembers when you're not in the room.",
    'Go-to-Market': 'A great product in the wrong channel is just a secret.',
    'Growth & Discovery': 'Lasting growth is built on understanding the customer — then being found the moment they look.',
    'Unit Economics': "If a single sale doesn't make sense, a million of them won't either.",
    'Financial Planning': 'A plan is just a guess until the cash flow proves it.',
    'Capital Architecture': 'Raising money is the easy part. Structuring it so you keep your company is the craft.',
    'Pitch Craft': 'An investor decides in the time it takes to read a paragraph. Make it count.',
    'Investor Relations': "Investors don't back surprises. They back the founder who's already answered every question.",
    'Funding Strategy': 'The right money at the wrong stage is the wrong money. Know which cheque to chase.',
    'Competitive Strategy': "Your competitor isn't trying to beat you. They're trying to make you irrelevant.",
    'Team Architecture': 'A company is just a group of people who agree on what matters. Design that on purpose.',
    'Operational Systems': "A business that only runs when the founder is in the room isn't a business yet.",
    'Product-Market Fit': 'The most expensive product to build is the one nobody asked for.',
    'Product Development': 'Ship the smallest thing that proves the point. Then earn the right to build more.',
    'Pricing Strategy': 'Price is the fastest lever you have — and the one founders are most afraid to pull.',
  };
  const METHOD_KEYS = ['marketing', 'finance', 'investment', 'strategy', 'product'];
  function methodHref(l1, d) { return '../method/' + (d.key || METHOD_KEYS[l1] || '') + '.html'; }

  function l3ButtonsHTML(l1, l2Idx, specs) {
    return '<div class="d-bd-specs">' + specs.map(function (s, k) {
      return '<button class="d-bd-spec" data-open="l3" data-l1="' + l1 + '" data-l2="' + l2Idx + '" data-l3="' + k + '">' + escH(s) + '</button>';
    }).join('') + '</div>';
  }

  function openDiscipline(l1) {
    const d = TAXONOMY[l1]; if (!d) return;
    detailCurrentNode = null; detailSelectedSlot = null;
    detailEl.style.setProperty('--detail-color', d.color);
    detailEl.querySelector('.d-eb').textContent = 'Discipline';
    detailEl.querySelector('.d-name').textContent = d.l1;
    detailEl.querySelector('.d-path').innerHTML = '';
    detailEl.querySelector('.d-desc').textContent = MOBILE_L1_DESC[l1] || '';
    const specCount = d.l2.reduce(function (s, m) { return s + m.l3.length; }, 0);
    detailEl.querySelector('.d-spec-note').innerHTML =
      'The full discipline — <b>' + d.l2.length + ' modules</b>, <b>' + specCount + ' specialties</b>. ' +
      'Each specialty is one 2-hour 1:1 you can book on its own; the whole discipline is delivered end-to-end only in the cohort.';

    const coach = resolveCoach(l1);
    let bd = '';
    d.l2.forEach(function (m, j) {
      bd += '<div class="d-bd-module">' +
        '<button class="d-bd-mod-h" data-open="module" data-l1="' + l1 + '" data-l2="' + j + '">' +
          '<span class="d-bd-mod-name">' + escH(m.name) + '</span>' +
          '<span class="d-bd-mod-n">' + m.l3.length + ' specialties →</span>' +
        '</button>' +
        l3ButtonsHTML(l1, j, m.l3) +
      '</div>';
    });
    bd += '<div class="d-bd-actions">';
    if (coach) bd += '<p class="d-bd-coach">Led by <b>' + escH(coach.name) + '</b>' + (coach.role ? ' · ' + escH(coach.role) : '') + '</p>';
    bd += '<a class="d-bd-cta" href="../book/?tier=cohort">Take the whole discipline · Full Cohort →</a>';
    bd += '<a class="d-bd-link" href="' + methodHref(l1, d) + '">Read the ' + escH(d.l1) + ' method →</a>';
    bd += '</div>';

    const bdEl = detailEl.querySelector('.d-breakdown');
    bdEl.innerHTML = bd; bdEl.hidden = false;
    detailEl.classList.add('mode-l1l2', 'show');
    updateInfoPanel();
  }

  function openModule(l1, l2Idx) {
    const d = TAXONOMY[l1]; if (!d) return;
    const m = d.l2[l2Idx]; if (!m) return;
    detailCurrentNode = null; detailSelectedSlot = null;
    detailEl.style.setProperty('--detail-color', d.color);
    detailEl.querySelector('.d-eb').textContent = 'Module';
    detailEl.querySelector('.d-name').textContent = m.name;
    detailEl.querySelector('.d-path').innerHTML = '<span>' + escH(d.l1) + '</span>';
    detailEl.querySelector('.d-desc').textContent = L2_DESC[m.name] || ('A track within ' + d.l1 + '.');
    detailEl.querySelector('.d-spec-note').innerHTML =
      'A track within <b>' + escH(d.l1) + '</b> — <b>' + m.l3.length + ' specialties</b>, each a 2-hour 1:1 deep-dive. ' +
      'Take them together as a Pick&nbsp;3, or the whole discipline in the cohort.';

    const coach = resolveCoach(l1, l2Idx);
    const slugs = m.l3.map(function (s) { return specSlug(s); }).join(',');
    let bd = '<div class="d-bd-module">' +
      '<div class="d-bd-specs" style="margin-top:2px">' +
      m.l3.map(function (s, k) {
        return '<button class="d-bd-spec" data-open="l3" data-l1="' + l1 + '" data-l2="' + l2Idx + '" data-l3="' + k + '">' + escH(s) + '</button>';
      }).join('') + '</div></div>';
    bd += '<div class="d-bd-actions">';
    if (coach) bd += '<p class="d-bd-coach">Coached by <b>' + escH(coach.name) + '</b>' + (coach.role ? ' · ' + escH(coach.role) : '') + '</p>';
    bd += '<a class="d-bd-cta" href="../book/?tier=pick3&spec=' + encodeURIComponent(slugs) + '">Take the ' + escH(m.name) + ' track · Pick 3 →</a>';
    bd += '<a class="d-bd-link" href="' + methodHref(l1, d) + '">Read the ' + escH(d.l1) + ' method →</a>';
    bd += '</div>';

    const bdEl = detailEl.querySelector('.d-breakdown');
    bdEl.innerHTML = bd; bdEl.hidden = false;
    detailEl.classList.add('mode-l1l2', 'show');
    updateInfoPanel();
  }

  // Delegated clicks inside the breakdown: specialty → open L3; module → open L2.
  detailEl.querySelector('.d-breakdown').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-open]'); if (!btn) return;
    const l1 = +btn.getAttribute('data-l1');
    if (btn.getAttribute('data-open') === 'module') { openModule(l1, +btn.getAttribute('data-l2')); return; }
    const l2 = +btn.getAttribute('data-l2'), l3 = +btn.getAttribute('data-l3');
    const node = NODES.find(function (n) { return n.level === 3 && n.l1Idx === l1 && n.l2Idx === l2 && n.l3Idx === l3; });
    if (node) openDetail(node);
  });

  function closeDetail() {
    detailEl.classList.remove('show');
    state.pinnedId = null;
    detailCurrentNode = null;
    updateInfoPanel();
  }
  detailEl.querySelector('.d-close').addEventListener('click', closeDetail);
  detailEl.querySelectorAll('input[name="d-format"]').forEach(r => {
    r.addEventListener('change', () => {
      if (r.checked) {
        detailSelectedFormat = r.value;
        renderSlots();
      }
    });
  });

  // Discovery → booking at the L3 specialty. A specialty IS the bookable
  // unit (one 2-hour 1:1 deep-dive): single books exactly this L3; the
  // cohort format books the whole programme (every L3). Booking reads
  // ?tier + ?spec=<slug> — no discipline selection.
  detailEl.querySelector('.d-book').addEventListener('click', () => {
    if (!detailSelectedSlot) return;
    if (detailSelectedFormat === 'cohort') { window.location.href = '../book/?tier=cohort'; return; }
    window.location.href = '../book/?tier=single&spec=' + specSlug(detailCurrentNode.name);
  });

  // ============================================================
  //   COACH DIRECTORY (accordion below constellation)
  // ============================================================
  const dirList = document.getElementById('dir-list');
  const dirItemEls = new Map(); // coachId → dir-item element

  function starsHTML(rating) {
    const filled = Math.round(rating);
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `<span class="star${i < filled ? ' on' : ''}">★</span>`;
    }
    return html;
  }

  // ---- Real founder testimonials (captured via /share-testimonial, approved by the coach or ops) ----
  // These are the same approved submissions that power the homepage wall — surfaced per-coach here.
  const TST_URL = 'https://ivedeivyotwevjxvcuoe.supabase.co';
  const TST_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';
  const TST_BY_COACH = {};
  function escH(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function getCoachQuotesHTML(coach) {
    const list = TST_BY_COACH[coach.id] || [];
    if (!list.length) {
      return '<div class="dir-quote" style="opacity:.6"><div class="dir-quote-text">No founder testimonials yet — be the first to share your story.</div></div>';
    }
    return list.map(t => {
      const meta = [t.role_title, t.company].filter(Boolean).map(escH).join(' · ');
      return '<div class="dir-quote"><div class="dir-quote-text">“'+escH(t.testimonial)+'”</div><div class="dir-quote-author">'+escH(t.name)+(meta?' · '+meta:'')+'</div></div>';
    }).join('');
  }
  async function loadCoachTestimonials() {
    try {
      const r = await fetch(TST_URL+'/rest/v1/testimonial_submissions?status=eq.approved&select=name,role_title,company,for_target,testimonial,photo_path&order=created_at.desc&limit=300',
        { headers: { apikey: TST_ANON, Authorization: 'Bearer '+TST_ANON } });
      const rows = r.ok ? await r.json() : [];
      rows.forEach(t => { (TST_BY_COACH[t.for_target] = TST_BY_COACH[t.for_target] || []).push(t); });
    } catch (e) { /* leave empty states in place */ }
    COACHES.forEach(c => { const el = document.getElementById('dirq-'+c.id); if (el) el.innerHTML = getCoachQuotesHTML(c); });
    refreshMobileQuotes();   // hoisted from the mobile module — updates an open mobile coach card
  }

  function buildDirectory() {
    dirList.innerHTML = '';
    COACHES.forEach((coach, idx) => {
      const l1Idx = coach.covers.l1 ? coach.covers.l1[0] : null;
      const initials = coach.name.split(' ').map(s => s[0]).join('');

      const item = document.createElement('div');
      item.className = 'dir-item';
      item.dataset.coachId = coach.id;
      item.dataset.discipline = l1Idx != null ? l1Idx : 'all';
      item.style.setProperty('--dir-color', coach.color);

      item.innerHTML = `
        <button class="dir-head" type="button">
          <div class="dir-avatar"${coach.photo ? ` style="background:url('${coach.photo}') center/cover no-repeat; color:transparent;"` : ''}>${coach.photo ? '' : initials}</div>
          <div class="dir-meta">
            <div class="dir-name">${coach.name}</div>
            <div class="dir-role">${coach.role}</div>
          </div>
          <div class="dir-stats">
            <span><span class="dir-stat-val">${coach.rating.toFixed(1)}</span> <span class="dir-stars">${starsHTML(coach.rating)}</span></span>
            <span><span class="dir-stat-val">${coach.sessions}</span> sessions</span>
            <span><span class="dir-stat-val">${coach.years}</span> years</span>
          </div>
          <span class="dir-icn"></span>
        </button>
        <div class="dir-body"><div>
          <div class="dir-profile">
            <div class="dir-profile-grid">
              <div class="dir-main">
                <div class="dir-portrait" style="${coach.photo ? `background:url('${coach.photo}') center/cover no-repeat` : `background:linear-gradient(155deg,${coach.color} 0%,#1a1612 100%)`}">
                  ${coach.photo ? '' : `<span class="dir-portrait-tag">Photo · placeholder</span><span class="dir-initials">${initials}</span>`}
                </div>
                <div class="dir-stat-bar">
                  <div class="ds-item"><div class="ds-val">${coach.years}</div><div class="ds-label">Years experience</div></div>
                  <div class="ds-item"><div class="ds-val">${coach.rating.toFixed(1)}</div><div class="ds-label"><span class="stars">${starsHTML(coach.rating)}</span></div></div>
                  <div class="ds-item"><div class="ds-val">${coach.sessions}</div><div class="ds-label">Sessions delivered</div></div>
                </div>
                <p class="dir-bio">${coach.bio}</p>
                <div class="dir-section-h">What founders say</div>
                <div class="dir-quotes" id="dirq-${coach.id}">
                  ${getCoachQuotesHTML(coach)}
                </div>
                <a class="dir-testify" href="/share-testimonial.html?for=${coach.id}" target="_blank" rel="noopener"
                   style="display:inline-block;margin-top:12px;font-family:var(--sans,'Josefin Sans',sans-serif);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${coach.color};text-decoration:none;border:1px solid ${coach.color};padding:8px 14px">Worked with ${escH(coach.name.split(' ')[0])}? Share your story →</a>
              </div>
              <div class="dir-avail">
                <div class="dir-avail-h">Availability</div>
                <div class="dir-avail-sub">Next openings · East Africa Time</div>
                <div class="dir-avail-divider">1:1 Session</div>
                <div class="dir-avail-list dir-1to1"></div>
                <div class="dir-avail-divider">Next Cohort</div>
                <div class="dir-avail-list dir-cohort"></div>
                <button class="dir-book">Book Session →</button>
              </div>
            </div>
          </div>
        </div></div>
      `;

      // Directory = a coach roster, not a specialty picker. Booking selects
      // the L3 specialty (one 2-hour deep-dive) in its own accordion, so a
      // coach card opens the single-session picker with no discipline preset.
      const list1to1 = item.querySelector('.dir-1to1');
      ONETOONE_SLOTS.forEach(s => {
        const row = document.createElement('button');
        row.className = 'dir-avail-row';
        row.innerHTML = `<div><div class="da-date">${s.date}</div><div class="da-time">${s.time}</div></div><div class="da-cta">Book →</div>`;
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = '../book/?tier=single';
        });
        list1to1.appendChild(row);
      });
      const listCohort = item.querySelector('.dir-cohort');
      COHORT_SCHEDULE.forEach(c => {
        const isFull = c.status === 'full';
        const row = document.createElement('button');
        row.className = 'dir-avail-row' + (isFull ? ' full' : '');
        if (isFull) row.disabled = true;
        row.innerHTML = `<div><div class="da-date">${c.label} · ${c.dates}</div><div class="da-time">${isFull ? 'Full' : c.seats + ' seats remaining'}</div></div><div class="da-cta">${isFull ? 'Closed' : 'Reserve →'}</div>`;
        if (!isFull) {
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = '../book/?tier=cohort';
          });
        }
        listCohort.appendChild(row);
      });

      // Main "Book Session →" button in directory card
      item.querySelector('.dir-book').addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = '../book/?tier=single';
      });

      // Toggle
      item.querySelector('.dir-head').addEventListener('click', () => {
        toggleDirectoryItem(item);
      });

      dirList.appendChild(item);
      dirItemEls.set(coach.id, item);
    });

    buildDirectoryFilters();
  }

  function toggleDirectoryItem(item) {
    const isOpen = item.classList.contains('open');
    dirList.querySelectorAll('.dir-item.open').forEach(el => {
      if (el !== item) el.classList.remove('open');
    });
    if (isOpen) item.classList.remove('open');
    else item.classList.add('open');
  }

  function scrollToCoach(coachId) {
    const item = dirItemEls.get(coachId);
    if (!item) return;
    dirList.querySelectorAll('.dir-item.open').forEach(el => el.classList.remove('open'));
    item.classList.add('open');
    setTimeout(() => {
      item.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function buildDirectoryFilters() {
    const filtersEl = document.querySelector('.dir-filters');
    if (!filtersEl) return;
    TAXONOMY.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.className = 'dir-filter';
      btn.dataset.filter = String(i);
      btn.textContent = d.l1Short ? d.l1Short[0] : d.l1;
      filtersEl.appendChild(btn);
    });
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.dir-filter');
      if (!btn) return;
      filtersEl.querySelectorAll('.dir-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      dirList.querySelectorAll('.dir-item').forEach(item => {
        if (filter === 'all' || item.dataset.discipline === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
          item.classList.remove('open');
        }
      });
    });
  }

  buildDirectory();
  loadCoachTestimonials();

  // Wire coach card click in detail panel → scroll to directory
  detailEl.querySelector('.coach-card').addEventListener('click', () => {
    if (!detailCurrentNode || !detailCurrentNode.coachId) return;
    scrollToCoach(detailCurrentNode.coachId);
  });

  // ============================================================
  //   CENTRE SEARCH
  // ============================================================
  const searchEl   = document.getElementById('search');
  const searchInpt = document.getElementById('search-input');
  const searchList = document.getElementById('search-list');
  let searchOpen = false;
  let hoverTimer = null;
  let idleTimer = null;

  // Remember once, then forget: the last typed query is restored on the
  // FIRST reopen only (so an accidental close doesn't lose work). A reopen
  // where nothing new is typed doesn't re-arm it — the next engagement
  // starts clean instead of resurrecting stale text forever.
  let lastQuery = '';
  let restoreArmed = false;   // armed by typing, spent by one restore
  let typedThisOpen = false;
  function bumpIdle() {
    clearTimeout(idleTimer);
    if (!searchOpen) return;
    idleTimer = setTimeout(closeSearch, 30000);   // was 5s — too aggressive while reading results
  }
  function openSearch() {
    if (searchOpen) return;
    searchOpen = true;
    typedThisOpen = false;
    searchEl.classList.add('show');
    if (!searchInpt.value && restoreArmed && lastQuery) {
      restoreArmed = false;   // spend the one restore
      searchInpt.value = lastQuery;
      state.searchQuery = lastQuery.trim().toLowerCase();
      renderSearchResults();
    }
    setTimeout(() => searchInpt.focus(), 200);
    bumpIdle();
  }
  function closeSearch() {
    searchOpen = false;
    if (typedThisOpen && searchInpt.value.trim()) {
      lastQuery = searchInpt.value.trim();
      restoreArmed = true;   // fresh typing re-arms a single restore
    }
    searchEl.classList.remove('show');
    searchInpt.value = '';
    state.searchQuery = '';   // clears the match-dim on L3 nodes while closed
    renderSearchResults();
    clearTimeout(idleTimer);
  }
  centerHit.addEventListener('pointerenter', () => {
    clearTimeout(hoverTimer);
    centerHit.classList.add('hover');
    hoverTimer = setTimeout(openSearch, 180);
  });
  centerHit.addEventListener('pointerleave', () => {
    clearTimeout(hoverTimer);
    centerHit.classList.remove('hover');
  });
  centerHit.addEventListener('click', () => {
    clearTimeout(hoverTimer);
    openSearch();
  });
  document.getElementById('search-close').addEventListener('click', closeSearch);
  searchInpt.addEventListener('input', () => {
    typedThisOpen = true;   // fresh typing re-arms the one-shot restore on close
    state.searchQuery = searchInpt.value.trim().toLowerCase();
    renderSearchResults();
    scheduleSearchLog();
    bumpIdle();
  });
  searchInpt.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSearch(); }
    if (e.key === 'Enter') {
      const first = searchList.querySelector('.s-item');
      if (first) first.click();
    }
    bumpIdle();
  });
  ['pointermove', 'pointerdown', 'focusin'].forEach(ev => {
    searchEl.addEventListener(ev, bumpIdle);
  });

  const HAYSTACK_CACHE = new Map();
  function buildSearchHaystack(n) {
    if (HAYSTACK_CACHE.has(n.id)) return HAYSTACK_CACHE.get(n.id);
    const parts = [
      n.name,
      n.parentName || '',
      n.grandparentName || '',
      n.coach || '',
      n.coachRole || '',
      DISCIPLINE_KEYWORDS[n.l1Idx] || '',
    ];
    if (n.level === 3 && L3_DESC[n.name]) parts.push(L3_DESC[n.name]);
    if (n.level === 3 && L3_KEYWORDS[n.name]) parts.push(L3_KEYWORDS[n.name]);
    const hay = parts.join(' ').toLowerCase();
    HAYSTACK_CACHE.set(n.id, hay);
    return hay;
  }

  // ---- Tokenised, weighted, ranked matcher ----
  // Stopwords stripped so natural-language queries ("how do I price my product")
  // score on the meaningful tokens (price, product) rather than failing a verbatim match.
  const STOP = new Set("a an the of for to in into onto from out up down off no not as so if then than there here this that these those it its is are be been being am im i we us you your my me our my mine can could should would will shall do does did done how what when where which who whom why whose need needs want wants help about please very most some any all just like with without and or but".split(/\s+/));
  function tokenize(str){ return (String(str).toLowerCase().match(/[a-z0-9&+]+/g) || []); }
  const TOKENSET_CACHE = new Map();
  function nodeTokens(n){
    if (TOKENSET_CACHE.has(n.id)) return TOKENSET_CACHE.get(n.id);
    const set = new Set(tokenize(buildSearchHaystack(n)));
    TOKENSET_CACHE.set(n.id, set);
    return set;
  }
  function scoreNode(n, qTokens, rawQ){
    const name = n.name.toLowerCase();
    const hay  = buildSearchHaystack(n);
    const toks = nodeTokens(n);
    let score = 0, hits = 0;
    for (const t of qTokens){
      let s = 0;
      if (name.includes(t)) s = 6;                 // query word appears in the node's own name — strongest
      else if (toks.has(t)) s = 3;                 // exact keyword token
      else if (t.length >= 3){
        let pref = false;
        for (const tok of toks){ if (tok.startsWith(t)){ pref = true; break; } }
        if (pref) s = 1.6;                         // prefix of a keyword (fundrais→fundraising)
        else if (hay.includes(t)) s = 1.0;         // loose substring (compound / partial)
      }
      if (s > 0){ score += s; hits++; }
    }
    if (hits === 0) return 0;
    if (rawQ.length >= 4 && hay.includes(rawQ)) score += 5;          // whole raw query appears verbatim
    if (qTokens.length >= 2 && hay.includes(qTokens.join(' '))) score += 4; // content words adjacent (raise money, find investors)
    score += hits * 0.6;                                            // reward covering more of the query
    score += (n.level === 3 ? 0.7 : n.level === 2 ? 0.3 : 0);       // prefer specific specialties
    return score;
  }
  function searchMatches() {
    if (!state.searchQuery) return [];
    const rawQ = state.searchQuery;
    let qTokens = tokenize(rawQ).filter(t => t.length >= 2 && !STOP.has(t));
    if (qTokens.length === 0) qTokens = tokenize(rawQ).filter(t => t.length >= 2); // all-stopword fallback
    if (qTokens.length === 0) return [];
    const scored = [];
    const boosts = intentBoosts(rawQ);
    // Geo context: a named place pulls the geo-relevant specialties into
    // reach (entering/serving that market) without hijacking queries whose
    // tokens already name a stronger specialty (e.g. "tax in nairobi").
    lastGeo = detectGeo(rawQ);
    if (lastGeo) {
      boosts['Market Entry'] = Math.max(boosts['Market Entry'] || 0, 4);
      boosts['Channel Mix'] = Math.max(boosts['Channel Mix'] || 0, 1.6);
    }
    NODES.forEach(n => {
      let sc = scoreNode(n, qTokens, rawQ);
      const b = n.level === 3 ? (boosts[n.name] || 0) : 0;
      if (b) sc += b + (sc === 0 ? 0.8 : 0);   // goal/geo matches surface even with zero token hits
      if (sc > 0) scored.push({ n, sc });
    });
    scored.sort((a, b) => b.sc - a.sc || (b.n.level - a.n.level) || a.n.name.localeCompare(b.n.name));
    lastSearchMeta = { count: scored.length, topScore: scored.length ? scored[0].sc : 0, topNode: scored.length ? scored[0].n.name : null };
    return scored.slice(0, 8).map(x => x.n);
  }

  // ---- Search-gap logging: capture what founders type so real misses feed the next keyword/node pass ----
  let lastSearchMeta = { count: 0, topScore: 0, topNode: null };
  let lastGeo = null;   // geo context of the current query (set by searchMatches)
  let searchMatchIds = null;   // node ids of the current ranked results — drives the constellation spotlight
  const SEARCH_LOG = { url: 'https://ivedeivyotwevjxvcuoe.supabase.co', anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss' };
  const loggedQueries = new Set();
  let searchLogTimer = null;
  function looksSensitive(q) { return /[@]|\d{6,}|\+\d{6,}/.test(q); }   // skip emails / long digit runs (PII hygiene)
  function logSearchSettled() {
    const q = (state.searchQuery || '').trim();
    if (q.length < 3 || q.length > 140) return;          // ignore stray single letters / pasted essays
    if (looksSensitive(q)) return;
    if (loggedQueries.has(q)) return;                    // one log per distinct settled query per visit
    loggedQueries.add(q);
    const m = lastSearchMeta;
    try {
      fetch(SEARCH_LOG.url + '/rest/v1/search_log', {
        method: 'POST', keepalive: true,
        headers: { apikey: SEARCH_LOG.anon, Authorization: 'Bearer ' + SEARCH_LOG.anon, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ query: q.slice(0, 140), result_count: m.count, top_score: m.topScore || null, top_node: m.topNode, source: 'explore' })
      }).catch(() => {});
    } catch (e) { /* logging must never break search */ }
  }
  function scheduleSearchLog() { clearTimeout(searchLogTimer); searchLogTimer = setTimeout(logSearchSettled, 1300); }

  function resolveBestL3(clicked, query) {
    if (clicked.level === 3) return clicked;
    const branch = NODES.filter(n => {
      if (n.level !== 3) return false;
      if (clicked.level === 1) return n.l1Idx === clicked.l1Idx;
      if (clicked.level === 2) return n.l1Idx === clicked.l1Idx && n.l2Idx === clicked.l2Idx;
      return false;
    });
    if (branch.length === 0) return clicked;
    const q = (query || '').trim().toLowerCase();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];
    if (terms.length === 0) return branch[0];
    let best = null;
    let bestScore = -1;
    branch.forEach(n => {
      const hay = buildSearchHaystack(n);
      const name = n.name.toLowerCase();
      let score = 0;
      terms.forEach(t => {
        if (name.includes(t)) score += 3;
        else if (hay.includes(t)) score += 1;
      });
      if (score > bestScore) { bestScore = score; best = n; }
    });
    return best || branch[0];
  }

  function renderSearchResults() {
    const results = searchMatches();
    searchMatchIds = state.searchQuery ? new Set(results.map(n => n.id)) : null;
    searchList.innerHTML = '';
    if (!state.searchQuery) {
      searchList.innerHTML = `<div class="s-hint">Try "pitch" · "pricing" · "runway" · "brand"</div>`;
      return;
    }
    if (results.length === 0) {
      searchList.innerHTML = `<div class="s-hint">No match. Try fewer letters.</div>`;
      return;
    }
    // Geo context strip — names the detected market and whether a coach
    // covers it (founding team covers EAC; new-market coaches appear here
    // automatically once their coaches row carries geo.covers).
    if (lastGeo) {
      const covered = COACHES.some(c => coachCoversGeo(c, lastGeo) > 0);
      const strip = document.createElement('div');
      strip.className = 's-geo';
      strip.textContent = 'Market context: ' + lastGeo.label +
        (covered ? '' : ' — East Africa covered today; regional coaches joining as we expand');
      searchList.appendChild(strip);
    }
    results.forEach(n => {
      const div = document.createElement('div');
      div.className = 's-item';
      div.style.setProperty('--s-color', n.color);
      const lvl = ['L1 · Discipline','L2 · Sub-category','L3 · Specialty'][n.level - 1];
      const crumb = n.level === 3 ? `${n.grandparentName} · ${n.parentName}` :
                    n.level === 2 ? `${n.parentName}` : '';
      // Geo-aware coach annotation: prefer a coach covering the detected market
      let geoNote = '';
      if (lastGeo) {
        const gc = resolveCoachForGeo(n.l1Idx, n.l2Idx, n.l3Idx, lastGeo);
        if (gc && coachCoversGeo(gc, lastGeo) > 0) geoNote = ` · ${escH(gc.name.split(' ')[0])} covers ${escH(geoCoverLabel(gc, lastGeo))}`;
      }
      div.innerHTML = `<i class="s-dot"></i><div class="s-meta"><div class="s-name">${n.name}</div><div class="s-sub">${lvl}${crumb ? ' · ' + crumb : ''}${geoNote}</div></div>`;
      div.addEventListener('click', () => {
        const target = resolveBestL3(n, state.searchQuery);
        const desiredYaw = 90 - target.theta;
        state.yawTarget = normaliseAngleTowards(state.yaw, desiredYaw);
        state.paused = true;
        state.pinnedId = target.id; state.hoveredId = target.id;
        closeSearch();
        setTimeout(() => openDetail(target), 480);
      });
      searchList.appendChild(div);
    });
  }
  renderSearchResults();

  // ============================================================
  //   LOAD SEQUENCE
  // ============================================================
  function startLoadSequence() {
    state.loadProgress = 0;
    state.loadStarted = performance.now();
  }
  svg.addEventListener('click', (e) => {
    if (state.loadProgress < 1) { state.loadProgress = 1; }
    if (!e.target.closest('.node') && !e.target.closest('.center-hit')) {
      if (state.focusedL1 != null) unfocus();
      else if (state.pinnedId) { state.pinnedId = null; updateInfoPanel(); }
    }
  });

  // ============================================================
  //   RENDER LOOP
  // ============================================================
  const LOAD_DURATION_MS = 3600;
  let last = performance.now();
  let frameCount = 0;
  let prevSortOrder = [];  // track depth-sort order to skip unnecessary reflows

  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    // While the viewport is in mobile mode the hero is display:none —
    // keep the loop alive (so crossing back resumes instantly) but do
    // zero render work / battery drain.
    if (isMobileView()) { requestAnimationFrame(frame); return; }
    frameCount++;

    // Load progress
    if (state.loadProgress < 1) {
      const elapsed = now - state.loadStarted;
      state.loadProgress = Math.min(1, elapsed / LOAD_DURATION_MS);
    }
    const lp = state.loadProgress;

    // Yaw — spring-based physics for smooth transitions
    if (state.yawTarget != null) {
      const diff = state.yawTarget - state.yaw;
      // Spring: stiffness 0.08, damping 0.78 (tighter, 25% less bounce)
      state.yawVelocity = (state.yawVelocity + diff * 0.08) * 0.78;
      state.yaw += state.yawVelocity;
      if (Math.abs(diff) < 0.02 && Math.abs(state.yawVelocity) < 0.01) {
        state.yaw = state.yawTarget;
        state.yawTarget = null;
        state.yawVelocity = 0;
      }
    } else if (!state.paused && !state.dragging && state.focusedL1 == null) {
      const introBoost = lp < 1 ? (1 + 1.5 * (1 - lp)) : 1;
      // Organic flow: rotation speed swells and eases on two slow
      // sine periods instead of running metronome-constant.
      const flow = 1 + Math.sin(now / 9000) * 0.12 + Math.sin(now / 23000) * 0.08;
      state.yaw = (state.yaw + state.speed * introBoost * flow * dt / 16.7) % 360;
    }
    // Smooth drag inertia decay
    if (!state.dragging && Math.abs(state.userYawVelocity) > 0.01) {
      state.userYawOffset += state.userYawVelocity;
      state.userYawVelocity *= 0.94;
    } else if (!state.dragging) {
      state.userYawVelocity = 0;
    }

    // Breathe — multi-frequency organic sway
    let renderTilt = state.tilt;
    if (lp >= 1) {
      renderTilt = state.tilt
        + Math.sin(now / 2200) * 0.4
        + Math.sin(now / 3700) * 0.25;
    }
    window.__constellation.renderTilt = renderTilt;

    // Haze orbs — throttled to every 4th frame (~15fps). Yaw-coupled
    // parallax so the constellation visibly turns *through* the clouds.
    const yawRad = (state.yaw + state.userYawOffset) * Math.PI / 180;
    if (frameCount % 4 === 0) {
      const t = now / 1000;
      const hazeOp = lp < 1 ? lp * 0.9 : 0.9;
      hazeEls.forEach(h => {
        const par = (h.depth != null ? h.depth : 0.35);
        // two drift octaves (slow body + finer ripple) + depth-scaled yaw parallax
        const dx = Math.sin(t / h.dur * 2 * Math.PI + h.phase) * 80
                 + Math.sin(t / (h.dur * 0.41) + h.phase * 1.9) * 26
                 + Math.cos(yawRad * par + h.phase * 2.1) * (120 * par);
        const dy = Math.cos(t / h.dur * 2 * Math.PI + h.phase * 0.7) * 60
                 + Math.cos(t / (h.dur * 0.37) + h.phase * 2.3) * 20
                 + Math.sin(yawRad * par + h.phase * 1.4) * (72 * par);
        const sc = 1 + Math.sin(t / (h.dur * 0.7) + h.phase) * 0.06
                     + Math.sin(t / (h.dur * 0.23) + h.phase * 3.0) * 0.025;
        h.el.setAttribute('cx', (h.ox + dx).toFixed(1));
        h.el.setAttribute('cy', (h.oy + dy).toFixed(1));
        h.el.setAttribute('r', (h.r * sc).toFixed(1));
        h.el.setAttribute('opacity', (hazeOp * (h.op != null ? h.op : 1)).toFixed(3));
      });
    }

    // Star dust — bursts out of the mark on load, then drifts with
    // spring elasticity, depth parallax, twinkle sparkles.
    if (frameCount % 2 === 0) {
      const t = now / 1000;
      // Intro burst: dust target expands from the centre outward
      const burstT = lp < 1 ? easeOutCubic(clamp01((lp - 0.02) / 0.55)) : 1;
      particles.forEach(p => {
        p.angle += p.drift * dt;
        const effDist = p.dist * (0.06 + 0.94 * burstT);
        // Depth-coupled parallax: nearer dust sweeps faster with the rotation
        const rot = yawRad * 0.22 * p.depth;
        const wobbleX = Math.sin(t * p.speed + p.phase) * 9
                      + Math.sin(t * p.speed * 0.7 + p.phase * 1.3) * 4;
        const wobbleY = Math.cos(t * p.speed * 0.9 + p.phase * 0.8) * 7
                      + Math.cos(t * p.speed * 0.5 + p.phase * 1.6) * 3;
        const tx = CX + Math.cos(p.angle + rot) * effDist + wobbleX;
        const ty = CY + Math.sin(p.angle + rot) * effDist * 0.92 + wobbleY;  // slight squash echoes the tilt
        // Elastic spring toward the target — motion lags, overshoots a touch, settles
        p.vx = (p.vx + (tx - p.px) * 0.085) * 0.86;
        p.vy = (p.vy + (ty - p.py) * 0.085) * 0.86;
        p.px += p.vx; p.py += p.vy;
        p.el.setAttribute('cx', p.px.toFixed(1));
        p.el.setAttribute('cy', p.py.toFixed(1));

        // Sparkle: rare bright twinkle with exponential decay
        if (p.sparkle > 0.02) p.sparkle *= 0.90;
        else if (Math.random() < 0.0012) p.sparkle = 1;

        let op;
        if (lp < 1) {
          const fadeIn = clamp01((lp - 0.04) / 0.40);
          op = easeOutCubic(fadeIn) * p.maxOpacity * (1.8 - 0.8 * burstT);  // flares in the burst, settles to ambient
        } else {
          const pulse = 0.8 + Math.sin(t * p.speed * 1.2 + p.phase) * 0.2;
          op = p.maxOpacity * pulse;
        }
        op = Math.min(0.85, op + p.sparkle * 0.55);
        p.el.setAttribute('opacity', op.toFixed(3));
        const breathe = p.size * (0.88 + Math.sin(t * p.speed * 0.6 + p.phase * 2) * 0.12) * (1 + p.sparkle * 0.9);
        p.el.setAttribute('r', breathe.toFixed(2));
      });
    }
    // Firecracker burst + centre mark reveal
    if (lp < 1) {
      // sharp central pop — bright fast, gone fast
      const ft = clamp01(lp / 0.42);
      burstFlash.setAttribute('r', (16 + easeOutCubic(ft) * 420).toFixed(0));
      burstFlash.setAttribute('opacity', (Math.sin(Math.PI * Math.min(1, ft * 1.6)) * 0.9 * (1 - ft * 0.6)).toFixed(3));
      // fractal spark trails: wavy tails chase heads, embers die as nodes land
      SPARKS.forEach(s => {
        const p = clamp01((lp - s.t0) / s.dur);
        if (p <= 0) return;
        const head = easeOutCubic(p) * s.len;
        const tail = easeOutCubic(clamp01((p - 0.22) / 0.78)) * s.len;
        // build the visible slice of the wavy trail (6 segments)
        let d = 'M ' + sparkPoint(s, tail);
        for (let k = 1; k <= 6; k++) d += ' L ' + sparkPoint(s, tail + (head - tail) * k / 6);
        s.path.setAttribute('d', d);
        s.path.setAttribute('opacity', (Math.sin(Math.PI * Math.min(1, p * 1.1)) * 0.8).toFixed(3));
        const headPt = sparkPoint(s, head).split(' ');
        s.ember.setAttribute('cx', headPt[0]);
        s.ember.setAttribute('cy', headPt[1]);
        s.ember.setAttribute('r', Math.max(0.4, 2 - p * 1.4).toFixed(2));
        s.ember.setAttribute('opacity', (Math.pow(1 - p, 1.4) * 0.95).toFixed(3));
      });
      const centerOp = clamp01((lp - 0.10) / 0.40);
      petalsGroup.setAttribute('opacity', easeOutCubic(centerOp));
    } else {
      if (!sparksDone) {
        sparksDone = true;
        burstFlash.setAttribute('opacity', 0);
        SPARKS.forEach(s => { s.path.setAttribute('opacity', 0); s.ember.setAttribute('opacity', 0); });
      }
      petalsGroup.setAttribute('opacity', 1);
    }
    // Rotate center mark slowly (JS instead of CSS animation for Safari compat)
    const markAngle = (now / 1000) * (360 / 80);  // 80 seconds per rotation
    petalsGroup.setAttribute('transform', `translate(${CX} ${CY}) rotate(${markAngle.toFixed(1)})`);

    // Rings — throttled to every 3rd frame (tilt changes slowly)
    const tiltRad = renderTilt * Math.PI / 180;
    const ryFactor = Math.sin(tiltRad);
    if (frameCount % 3 === 0 || lp < 1) {
      const ringOp = lp < 1 ? clamp01((lp - 0.25) / 0.40) * 0.08 : 0.08;
      ringEls.forEach((e, idx) => {
        const R = [R1, R2, R3][idx];
        e.setAttribute('rx', R);
        e.setAttribute('ry', R * ryFactor);
        e.setAttribute('stroke', `rgba(239,231,216,${ringOp})`);
      });
      pentagonEl.setAttribute('stroke', `rgba(239,231,216,${ringOp * 0.9})`);
    }

    // Auto-reset: after 12 seconds of no interaction, clear selection and
    // resume rotation — but never while the founder is mid-search.
    if (state.lastInteraction && (state.pinnedId || state.focusedL1 != null) && !searchOpen) {
      const idle = Date.now() - state.lastInteraction;
      if (idle > 12000) {
        state.lastInteraction = 0;
        if (state.focusedL1 != null) unfocus();
        else { state.pinnedId = null; state.hoveredId = null; state.paused = false; updateInfoPanel(); }
        closeDetail();
      }
    }

    // Project nodes + build O(1) lookup map for connection endpoints.
    // Post-intro, every node gets a slow individual bob (phase keyed to
    // its angle) so the whole field breathes instead of turning rigidly.
    const bobT = now / 1000;
    const projected = NODES.map(n => {
      const bob = lp >= 1 ? Math.sin(bobT * 0.45 + n.theta * 0.11) * (n.level === 3 ? 5 : n.level === 2 ? 3.5 : 2) : 0;
      return { n, p: projectAngle(n.theta, n.r, n.yLift + bob, renderTilt) };
    });
    const projMap = new Map();
    projected.forEach(o => projMap.set(o.n.id, o.p));

    // Active highlight
    const activeId = state.pinnedId || state.hoveredId;
    const activeNode = activeId ? NODE_MAP.get(activeId) : null;
    const focusing = state.focusedL1 != null;

    const maxR = R3;
    const fog = state.fog;
    const labelPos = state.labelPos;

    // Update nodes
    projected.forEach(({ n, p }) => {
      const scale = p.persp;
      let sx = p.sx, sy = p.sy, introOp = 1, introScale = scale, introFlare = 0;
      if (lp < 1) {
        // Wider arrival window + softer overshoot = a silkier settle into
        // place (was a snappier 0.28 window / 2.2 overshoot).
        const localT = clamp01((lp - n.t0) / 0.34);
        const eT = easeOutBack(localT, n.level === 3 ? 1.55 : n.level === 2 ? 1.25 : 1.05);
        sx = lerp(CX, p.sx, eT);
        sy = lerp(CY, p.sy, eT);
        introOp = smootherstep(localT * 1.08);          // gentle C2 fade-in (no hard linear ramp)
        introScale = lerp(0.24, scale, smootherstep(localT));
        introFlare = Math.sin(Math.PI * localT);        // bright at mid-flight, fades as the node lands
      }
      n._group.style.transform = `translate(${sx}px, ${sy}px) scale(${introScale.toFixed(3)})`;

      const tNorm = clamp01((p.z + maxR) / (2 * maxR));
      const minOp = lerp(1, 0.08, fog);
      const baseOp = minOp + (1 - minOp) * tNorm;

      let isActive = false, isLineage = false, isSibling = false, isDimmed = !!activeNode || focusing;
      if (focusing && n.l1Idx === state.focusedL1) { isLineage = true; isDimmed = false; }
      if (activeNode) {
        if (n.id === activeNode.id) { isActive = true; isDimmed = false; }
        else if (activeNode.ancestors.includes(n.id)) { isLineage = true; isDimmed = false; }
        else if (n.ancestors.includes(activeNode.id)) { isLineage = true; isDimmed = false; }
        else if (activeNode.level === 1 && n.l1Idx === activeNode.l1Idx) { isLineage = true; isDimmed = false; }
        // Same discipline but not in the selected tree — recede but don't fully gray out
        else if (n.l1Idx === activeNode.l1Idx && n.level > 1) { isSibling = true; isDimmed = true; }
      }

      const GRAY = '#55524c';
      const GRAY_LABEL = 'rgba(239,231,216,0.38)';
      const SIBLING_DESAT = '#8a857d';
      const isGray = isDimmed && !isActive && !isLineage;
      // Active: full color. Lineage: discipline color. Siblings: desaturated. Others: gray.
      const fillCol = isActive ? n.color : isLineage ? n.color : isSibling ? SIBLING_DESAT : isGray ? GRAY : n.color;
      const labelCol = isActive ? (n.level === 3 ? '#efe7d8' : n.color)
        : isLineage ? n.color
        : isSibling ? 'rgba(239,231,216,0.30)'
        : isGray ? GRAY_LABEL
        : (n.level === 3 ? 'rgba(239,231,216,0.78)' : n.color);

      if (n.level === 1) {
        // Unselected disciplines recede hard (dim + grayscale) so the
        // selected lineage is unmistakable.
        const op = isActive ? 1 : isLineage ? 0.95 : isGray ? 0.22 : baseOp;
        n._group.style.opacity = op * introOp;
        n._glow.setAttribute('fill', isActive ? n.color : fillCol);
        n._glow.setAttribute('opacity', lp < 1 ? Math.max(0.18, introFlare * 0.65)
          : isActive ? 0.75 : isLineage ? 0.35 : isGray ? 0.02 : 0.18 * baseOp);
        n._halo.setAttribute('stroke', isActive ? n.color : fillCol);
        n._halo.setAttribute('opacity', isActive ? 0.55 : isLineage ? 0.35 : isGray ? 0.02 : 0.22 * baseOp);
        n._halo.setAttribute('r', isActive ? 48 : 42);
        n._spec.setAttribute('opacity', isGray ? 0.08 : 0.3 * Math.max(baseOp, isActive ? 1 : 0));
        n._ring.setAttribute('stroke', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        if (n._innerLabel) n._innerLabel.forEach(t => t.setAttribute('fill', isActive ? n.color : fillCol));
        const ringR = isActive ? 38 : 30;
        n._ring.setAttribute('r', ringR);
        // glass-dome shading tracks the ring; eases off on greyed discs
        if (n._dome)  { n._dome.setAttribute('r', (ringR - 1).toFixed(1));  n._dome.setAttribute('opacity', isGray ? 0.18 : 0.5); }
        if (n._sheen) { n._sheen.setAttribute('r', (ringR - 1).toFixed(1)); n._sheen.setAttribute('opacity', isGray ? 0.10 : isActive ? 0.42 : 0.35); }
        if (n._spec2) n._spec2.setAttribute('opacity', isGray ? 0.12 : 0.5);

        const dirP = projectAngle(n.theta, n.r + 60, -18, renderTilt);
        const dx = (dirP.sx - p.sx) / (scale || 1);
        const dy = (dirP.sy - p.sy) / (scale || 1);
        n._coach.setAttribute('x', dx);
        n._coach.setAttribute('y', dy);
        n._coach.setAttribute('opacity', isActive ? 0.9 : isGray ? 0.05 : isDimmed && !isLineage ? 0.04 : baseOp * 0.5);

      } else if (n.level === 2) {
        const op = isActive ? 1 : isLineage ? 0.9 : isSibling ? 0.2 : isGray ? 0.25 : baseOp;
        n._group.style.opacity = op * introOp;
        n._glow.setAttribute('fill', isActive ? n.color : fillCol);
        n._glow.setAttribute('opacity', lp < 1 ? Math.max(0.15, introFlare * 0.5)
          : isActive ? 0.6 : isLineage ? 0.12 : isSibling ? 0.04 : isGray ? 0.02 : 0.15 * baseOp);
        n._ring.setAttribute('stroke', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._label.setAttribute('fill', isActive ? n.color : labelCol);
        n._ring.setAttribute('r', isActive ? 13 : 9);

        const [dx, dy] = labelOffset(n, p, scale, labelPos, 30, -28);
        n._label.setAttribute('x', dx);
        n._label.setAttribute('y', dy);
        const labelOp = isActive ? 1 : isLineage ? 0.8 : isSibling ? 0.1 : Math.max(0, (tNorm - 0.45) * 1.8) * (isGray ? 0.15 : 1);
        n._label.setAttribute('opacity', labelOp);
        if (n._plate) {
          n._plate.setAttribute('stroke', isActive ? n.color : fillCol);
          setChevronPlate(n._plate, dx, dy, labelTextWidth(n.name.toUpperCase(), 9.5, 2), 9.5, labelOp);
        }

      } else {
        const op = isActive ? 1 : isLineage ? 0.85 : isSibling ? 0.2 : isGray ? 0.16 : 0.55 * baseOp;
        n._group.style.opacity = op * introOp;
        // Twinkle: idle stars breathe individually (size + brightness)
        const tw = Math.sin(now / 1100 + n._twPhase);
        const dotR = isActive ? 6 : isLineage ? 3.4 : 3 + tw * 0.7;
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('r', dotR.toFixed(2));
        n._innerDot.setAttribute('opacity', isActive ? 1 : 0.7 + tw * 0.18);
        if (n._sheen) {   // glossy 3D orb — sheen tracks the dot, dims on greyed nodes
          n._sheen.setAttribute('r', (dotR * 1.05).toFixed(2));
          n._sheen.setAttribute('opacity', isGray ? 0.18 : isActive ? 0.7 : 0.55);
        }
        n._glowDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._glowDot.setAttribute('opacity', lp < 1 ? (introFlare * 0.8).toFixed(3)
          : isActive ? 0.85 : isLineage ? 0.18 : 0.05 + Math.max(0, tw) * 0.06);
        n._glowDot.setAttribute('r', lp < 1 ? 6 + introFlare * 6 : isActive ? 14 : 6);
        if (n._tick) n._tick.setAttribute('stroke', isActive ? n.color : fillCol);
        n._label.setAttribute('fill', isActive ? '#efe7d8' : labelCol);

        // Staggered fan distances. In the selected (lineage) state every
        // visible label takes a 3-tier distance + alternating lift keyed
        // to its ANGULAR NEIGHBOUR order across the whole discipline
        // (fanIdx) — adjacent labels never share a tier, so they read
        // cleanly even when a full L1's ~10 specialties show at once.
        // Overlap is only tolerated while idly rotating.
        const emph = isActive || isLineage;
        const fi = n.fanIdx != null ? n.fanIdx : n.l3Idx;
        const radial = emph ? 40 + (fi % 3) * 44 : l3RadialDist(n.l3Idx, n.l3Len);
        const lift = emph ? (fi % 2 === 0 ? -66 : -34) : -48;
        const [dx, dy] = labelOffset(n, p, scale, labelPos, radial, lift);
        n._label.setAttribute('font-size', isActive ? 11.5 : emph ? (fi % 2 === 0 ? 10.5 : 9.5) : 10);
        n._label.setAttribute('x', dx);
        n._label.setAttribute('y', dy);

        if (n._tick) {
          n._tick.setAttribute('x1', 0);
          n._tick.setAttribute('y1', 0);
          n._tick.setAttribute('x2', dx);
          n._tick.setAttribute('y2', dy);
        }

        // While searching, spotlight the ranked matcher's actual results
        // (old code did a verbatim substring test against the haystack —
        // multi-word queries matched nothing and hid every label).
        let matchHide = false, isMatch = false;
        if (state.searchQuery && searchMatchIds) {
          if (searchMatchIds.has(n.id)) isMatch = true;
          else matchHide = true;
        }
        let labelOp;
        if (isActive) labelOp = 1;
        else if (isLineage) labelOp = 0.95;
        else if (isSibling) labelOp = 0;  // hide sibling L3 labels completely to avoid clutter
        else if (activeNode && isGray) labelOp = 0;  // hide unrelated L3 labels when a node is selected
        else labelOp = Math.max(0, (tNorm - 0.6) * 2.2);  // depth-based fade for idle state
        if (isGray && !activeNode) labelOp *= 0.55;
        if (isMatch) {
          // lift matches fully out of the depth fog so every result is
          // readable wherever the rotation has carried it
          labelOp = Math.max(labelOp, 0.95);
          n._group.style.opacity = Math.max(op, 0.92) * introOp;
          n._glowDot.setAttribute('opacity', 0.35);
          n._glowDot.setAttribute('r', 9);
        }
        if (matchHide) { labelOp = 0; n._group.style.opacity = 0.05 * introOp; }
        n._label.setAttribute('opacity', labelOp);
        if (n._tick) n._tick.setAttribute('opacity', labelOp * 0.5);
        if (n._plate) {
          const fsz = isActive ? 11.5 : emph ? (fi % 2 === 0 ? 10.5 : 9.5) : 10;
          n._plate.setAttribute('stroke', isActive ? n.color : fillCol);
          setChevronPlate(n._plate, dx, dy, labelTextWidth(n.name, fsz, 3), fsz, labelOp);
        }
      }

      // Legend level-highlight overlay — "light up all L1s / L2s / L3s".
      // Independent visual layer applied after per-node styling: matching tier
      // is spotlit, the rest recedes. Re-reads the opacity just set above.
      if (state.highlightLevel) {
        const onLevel = (n.level === state.highlightLevel);
        const cur = parseFloat(n._group.style.opacity) || 0;
        n._group.style.opacity = (onLevel ? Math.max(cur, 0.97) : cur * 0.1) * 1;
        if (onLevel) {
          if (n._glow)    n._glow.setAttribute('opacity', n.level === 1 ? 0.6 : 0.42);
          if (n._glowDot) { n._glowDot.setAttribute('opacity', 0.4); n._glowDot.setAttribute('r', 9); }
          if (n._label)   n._label.setAttribute('opacity', Math.max(parseFloat(n._label.getAttribute('opacity')) || 0, n.level === 1 ? 1 : 0.92));
        }
      }
    });

    // Pentagon
    const l1Projected = projected.filter(o => o.n.level === 1).map(o => `${o.p.sx},${o.p.sy}`).join(' ');
    pentagonEl.setAttribute('points', l1Projected);

    // Connections — use projMap for O(1) lookups instead of projected.find()
    CONNS.forEach(c => {
      const line = connEls.get(c.id);
      let fromX, fromY, fromZ;
      if (c.fromId === 'center') {
        fromX = CX; fromY = CY; fromZ = 0;
      } else {
        const fp = projMap.get(c.fromId);
        fromX = fp.sx; fromY = fp.sy; fromZ = fp.z;
      }
      const tp = projMap.get(c.toId);
      line.setAttribute('x1', fromX); line.setAttribute('y1', fromY);
      line.setAttribute('x2', tp.sx); line.setAttribute('y2', tp.sy);

      let introT = 1;
      if (lp < 1) {
        introT = clamp01((lp - c.t0) / 0.20);
        const sx1 = lerp(CX, fromX, introT), sy1 = lerp(CY, fromY, introT);
        const sx2 = lerp(CX, tp.sx, introT), sy2 = lerp(CY, tp.sy, introT);
        line.setAttribute('x1', sx1); line.setAttribute('y1', sy1);
        line.setAttribute('x2', sx2); line.setAttribute('y2', sy2);
      }

      const avgZ = (fromZ + tp.z) / 2;
      const tNorm = clamp01((avgZ + maxR) / (2 * maxR));
      const minOp = lerp(1, 0.08, fog);
      const baseLineOp = c.opacity * (minOp + (1 - minOp) * tNorm);
      let lineOp = baseLineOp;
      if (activeNode) {
        const ids = [c.fromId, c.toId];
        let isActiveLine = ids.includes(activeNode.id);
        const fromN = NODE_MAP.get(c.fromId);
        const toN   = NODE_MAP.get(c.toId);
        const inLin = (m) => {
          if (!m) return false;
          if (m.id === activeNode.id) return true;
          if (activeNode.ancestors.includes(m.id)) return true;
          if (m.ancestors.includes(activeNode.id)) return true;
          if (activeNode.level === 1 && m.l1Idx === activeNode.l1Idx) return true;
          return false;
        };
        const isLineageLine = !isActiveLine && (inLin(fromN) && inLin(toN));
        // Same discipline but not in the lineage tree
        const isSiblingLine = !isActiveLine && !isLineageLine &&
          ((fromN && fromN.l1Idx === activeNode.l1Idx) || (toN && toN.l1Idx === activeNode.l1Idx));
        if (isActiveLine) { lineOp = 0.95; line.setAttribute('stroke', c.color); line.setAttribute('stroke-width', '1.5'); }
        else if (isLineageLine) { lineOp = 0.8; line.setAttribute('stroke', c.color); line.setAttribute('stroke-width', '1.2'); }
        else if (isSiblingLine) { lineOp = baseLineOp * 0.12; line.setAttribute('stroke', '#8a857d'); line.setAttribute('stroke-width', '0.5'); }
        else { lineOp = baseLineOp * 0.15; line.setAttribute('stroke', '#6b6862'); line.setAttribute('stroke-width', '0.5'); }
      } else if (focusing) {
        const fromN = NODE_MAP.get(c.fromId);
        const toN   = NODE_MAP.get(c.toId);
        if ((!fromN || fromN.l1Idx === state.focusedL1 || c.fromId === 'center') && (toN ? toN.l1Idx === state.focusedL1 : true)) {
          lineOp = baseLineOp;
          line.setAttribute('stroke', c.color);
        } else {
          lineOp = baseLineOp * 0.18;
          line.setAttribute('stroke', '#6b6862');
        }
      } else {
        line.setAttribute('stroke', c.color);
        line.setAttribute('stroke-width', '0.6');
      }
      line.setAttribute('opacity', lineOp * introT);
    });

    // Depth-sort — throttled to every 3rd frame + skipped when order unchanged
    if (frameCount % 3 === 0 || lp < 1) {
      const connZ = [];
      CONNS.forEach(c => {
        let z;
        if (c.fromId === 'center') {
          z = (projMap.get(c.toId).z) / 2 - 1;
        } else {
          z = (projMap.get(c.fromId).z + projMap.get(c.toId).z) / 2 - 1;
        }
        connZ.push({ z, elem: connEls.get(c.id) });
      });
      const nodeZ = projected.map(({ n, p }) => ({ z: p.z, elem: n._group }));

      connZ.sort((a, b) => a.z - b.z);
      nodeZ.sort((a, b) => a.z - b.z);
      // Compare node order by walking the array — avoids string alloc
      let orderChanged = false;
      for (let i = 0; i < nodeZ.length; i++) {
        if ((nodeZ[i].elem.dataset.nodeId || '') !== prevSortOrder[i]) { orderChanged = true; break; }
      }
      if (orderChanged) {
        prevSortOrder = nodeZ.map(d => d.elem.dataset.nodeId || '');
        connZ.forEach(d => gConns.appendChild(d.elem));
        nodeZ.forEach(d => gNodes.appendChild(d.elem));
      }
    }

    requestAnimationFrame(frame);
  }

  // Label offset strategies
  function labelOffset(n, p, scale, mode, radialDist, yLift) {
    if (mode === 'centred') return [0, 0];
    if (mode === 'above')   return [0, -radialDist];
    const tilt = (typeof window.__constellation !== 'undefined' && window.__constellation.renderTilt != null) ? window.__constellation.renderTilt : state.tilt;
    const dirP = projectAngle(n.theta, n.r + radialDist, yLift || 0, tilt);
    return [(dirP.sx - p.sx) / (scale || 1), (dirP.sy - p.sy) / (scale || 1)];
  }

  function l3RadialDist(k, len) {
    // Staggered near/far label fan. 4-child branches get a third tier —
    // the old [62,26,62][k] returned undefined for k=3 (the four recently
    // added specialties), which produced NaN label coordinates.
    const seq = len === 4 ? [70, 26, 74, 116] : [62, 26, 62];
    const d = seq[k % seq.length];
    return d != null ? d : 62;
  }

  // Chevron label tab — a sharp ink banner with a point aimed back at the
  // node, so readable labels sit on a solid backing against the busy star
  // field (brand: sharp corners, no rounding). Only drawn when the label is
  // actually legible (op gate) so idle far labels stay clutter-free.
  function labelTextWidth(text, fs, level) {
    const per   = level === 2 ? 0.62 : 0.52;   // Josefin bold tracked vs Inter
    const track = level === 2 ? 1.5  : 0.3;    // letter-spacing
    return text.length * (fs * per + track);
  }
  function setChevronPlate(plate, lx, ly, w, fs, op) {
    if (op <= 0.42) { if (plate.getAttribute('opacity') !== '0') plate.setAttribute('opacity', 0); return; }
    const h = fs + 3.5, padX = 7, padY = 3, chev = h * 0.5;
    const hw = w / 2 + padX, hh = h / 2 + padY;
    const x0 = lx - hw, x1 = lx + hw, y0 = ly - hh, y1 = ly + hh;
    const f = v => v.toFixed(1);
    // node is toward the origin → point the chevron that way (sign of lx)
    const d = lx >= 0
      ? `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y0)} L ${f(x1)} ${f(y1)} L ${f(x0)} ${f(y1)} L ${f(x0 - chev)} ${f(ly)} Z`
      : `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y0)} L ${f(x1 + chev)} ${f(ly)} L ${f(x1)} ${f(y1)} L ${f(x0)} ${f(y1)} Z`;
    plate.setAttribute('d', d);
    plate.setAttribute('opacity', Math.min(0.82, op * 0.9).toFixed(3));   // solid dark backing; text paints on top
  }

  // ============================================================
  //   CONTROLS
  // ============================================================
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  btnPause.addEventListener('click', () => {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? 'Play' : 'Pause';
    btnPause.classList.toggle('on', state.paused);
  });
  btnReset.addEventListener('click', () => {
    state.userYawOffset = 0; state.tilt = 18; state.yawVelocity = 0; state.userYawVelocity = 0;
    state.pinnedId = null; state.hoveredId = null;
    state.paused = false; btnPause.textContent = 'Pause'; btnPause.classList.remove('on');
    if (state.focusedL1 != null) unfocus();
    closeDetail();
    updateInfoPanel();
  });

  // Drag to rotate
  // Drag to rotate — use document-level up/cancel listeners to prevent
  // state.dragging getting stuck (Safari sometimes swallows pointerup on SVG).
  svg.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.node')) return;
    if (e.target.closest('.center-hit')) return;
    state.dragging = true;
    state.lastDragX = e.clientX;
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  document.addEventListener('pointermove', (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastDragX;
    state.lastDragX = e.clientX;
    const move = dx * 0.3;
    state.userYawOffset += move;
    state.userYawVelocity = move * 0.6; // capture velocity for inertia
  });
  function endDrag(e) {
    if (!state.dragging) return;
    state.dragging = false;
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  // Safety: if pointer leaves the window entirely, stop dragging
  document.addEventListener('pointerleave', (e) => {
    if (e.target === document.documentElement) endDrag(e);
  });

  const TILT_MIN = 12;
  const TILT_MAX = 22;  // capped so top L3 labels stay below the nav bar
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.tilt = Math.max(TILT_MIN, Math.min(TILT_MAX, state.tilt + e.deltaY * 0.04));
  }, { passive: false });

  // Esc to exit
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchOpen) closeSearch();
      else if (detailEl.classList.contains('show')) closeDetail();
      else if (state.focusedL1 != null) unfocus();
    }
  });

  // ============================================================
  //   MOBILE DISCOVERY — card-stack model (search-first)
  //   Search input → discipline cards → specialty rows → coach
  //   card with booking CTA + WhatsApp share. Hash is the source
  //   of truth: '' = home, '#marketing' = discipline,
  //   '#marketing/brand-positioning' = specialty (shareable).
  // ============================================================
  const L1_TO_HASH = Object.fromEntries(Object.entries(HASH_TO_L1).map(([k, v]) => [v, k]));
  function slugify(name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function nodeBySlug(l1Idx, slug) {
    return NODES.find(n => n.level === 3 && n.l1Idx === l1Idx && slugify(n.name) === slug) || null;
  }

  const MOBILE_L1_DESC = [
    'Position, message, and launch a brand founders remember.',
    'Models, margins, and runway you can defend line by line.',
    'Decks, diligence, and the round you are about to raise.',
    'Strategy, structure, and the team that ships.',
    'Validate, build, and price what the market wants.',
  ];
  const MOBILE_CHIPS = ['Pitch deck', 'Pricing', 'Runway', 'Register my company', 'Mobile money', 'Get customers'];

  const mdEl = document.getElementById('m-discover');
  const mState = { view: 'l1', l1: null, node: null };

  function mGoHash(hash) {
    if (('#' + hash) === window.location.hash || (!hash && !window.location.hash)) { renderMobileFromHash(); return; }
    window.location.hash = hash; // hashchange → handleHash → renderMobileFromHash
  }
  function shareURL(n) {
    const base = window.location.origin + window.location.pathname;
    return base + '#' + L1_TO_HASH[n.l1Idx] + '/' + slugify(n.name);
  }
  function whatsappHref(n, coach) {
    const msg = (coach ? coach.name + ' coaches ' : '') + n.name +
      ' on The Founder’s Sprint — find the right coach for your startup: ' + shareURL(n);
    return 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  // ---- view renderers (small DOM, rebuilt per navigation) ----
  function mHeaderHTML(backHash, eyebrow, title, color) {
    return '<div class="md-head">' +
      (backHash != null ? '<button class="md-back" data-back="' + escH(backHash) + '" aria-label="Back">← Back</button>' : '') +
      '<div class="md-eb"' + (color ? ' style="color:' + color + '"' : '') + '>' + escH(eyebrow) + '</div>' +
      '<h1 class="md-title">' + title + '</h1></div>';
  }

  function renderMobileHome() {
    mState.view = 'l1';
    let html = mHeaderHTML(null, 'The Constellation', 'Find the right <em>coach.</em>');
    html += '<div class="md-search"><input id="md-input" type="search" inputmode="search" placeholder="What do you need help with?" autocomplete="off" aria-label="Search coaching topics"><div class="md-results" id="md-results"></div></div>';
    html += '<div class="md-chips">' + MOBILE_CHIPS.map(c => '<button class="md-chip" data-q="' + escH(c) + '">' + escH(c) + '</button>').join('') + '</div>';
    html += '<div class="md-section-h">Or browse the five disciplines</div>';
    html += '<div class="md-cards">';
    TAXONOMY.forEach((d, i) => {
      const coach = resolveCoach(i);
      const specCount = d.l2.reduce((s, sub) => s + sub.l3.length, 0);
      html += '<button class="md-card" data-l1="' + i + '" style="--md-c:' + d.color + '">' +
        mAvatarHTML(coach, d.color) +
        '<span class="md-card-main"><span class="md-card-name">' + escH(d.l1) + '</span>' +
        '<span class="md-card-desc">' + escH(MOBILE_L1_DESC[i] || '') + '</span>' +
        '<span class="md-card-meta">' + (coach ? escH(coach.name) + ' · ' : '') + specCount + ' specialties</span></span>' +
        '<span class="md-card-arrow">→</span></button>';
    });
    html += '</div>';
    mdEl.innerHTML = html;
    mWireCommon();
    const input = document.getElementById('md-input');
    input.addEventListener('input', () => {
      state.searchQuery = input.value.trim().toLowerCase();
      renderMobileResults();
      scheduleSearchLog();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const first = document.querySelector('#md-results .md-result'); if (first) first.click(); }
    });
    mdEl.querySelectorAll('.md-chip').forEach(ch => ch.addEventListener('click', () => {
      input.value = ch.dataset.q;
      input.dispatchEvent(new Event('input'));
      input.focus();
    }));
    mdEl.querySelectorAll('.md-card').forEach(c => c.addEventListener('click', () => {
      mGoHash(L1_TO_HASH[+c.dataset.l1]);
    }));
  }

  function renderMobileResults() {
    const listEl = document.getElementById('md-results');
    if (!listEl) return;
    if (!state.searchQuery) { listEl.innerHTML = ''; listEl.classList.remove('has'); return; }
    const results = searchMatches();
    if (!results.length) {
      listEl.innerHTML = '<div class="md-result-empty">No match yet — try fewer words.</div>';
      listEl.classList.add('has');
      return;
    }
    const geoStrip = lastGeo
      ? '<div class="md-geo">Market context: ' + escH(lastGeo.label) +
        (COACHES.some(c => coachCoversGeo(c, lastGeo) > 0) ? '' : ' — regional coaches joining as we expand') + '</div>'
      : '';
    listEl.innerHTML = geoStrip + results.map(n => {
      const crumb = n.level === 3 ? n.grandparentName + ' · ' + n.parentName :
                    n.level === 2 ? n.parentName : 'Discipline';
      let coachTxt = n.coach;
      if (lastGeo) {
        const gc = resolveCoachForGeo(n.l1Idx, n.l2Idx, n.l3Idx, lastGeo);
        if (gc) coachTxt = gc.name + (coachCoversGeo(gc, lastGeo) > 0 ? ' · covers ' + geoCoverLabel(gc, lastGeo) : '');
      }
      return '<button class="md-result" data-id="' + n.id + '" style="--md-c:' + n.color + '">' +
        '<span class="md-result-name">' + escH(n.name) + '</span>' +
        '<span class="md-result-sub">' + escH(crumb) + (coachTxt ? ' · ' + escH(coachTxt) : '') + '</span></button>';
    }).join('');
    listEl.classList.add('has');
    listEl.querySelectorAll('.md-result').forEach(r => r.addEventListener('click', () => {
      const n = NODE_MAP.get(r.dataset.id);
      if (!n) return;
      const target = n.level === 3 ? n : resolveBestL3(n, state.searchQuery);
      if (target && target.level === 3) mGoHash(L1_TO_HASH[target.l1Idx] + '/' + slugify(target.name));
      else mGoHash(L1_TO_HASH[n.l1Idx]);
    }));
  }

  function renderMobileDiscipline(l1Idx) {
    mState.view = 'l2'; mState.l1 = l1Idx;
    const d = TAXONOMY[l1Idx];
    const coach = resolveCoach(l1Idx);
    let html = mHeaderHTML('', escH(d.l1), 'Pick a <em>specialty.</em>', d.color);
    if (coach) {
      html += '<div class="md-coach-strip" style="--md-c:' + d.color + '">' + mAvatarHTML(coach, d.color) +
        '<span><span class="md-cs-name">' + escH(coach.name) + '</span><span class="md-cs-role">' + escH(coach.role) + '</span></span></div>';
    }
    html += '<div class="md-cards">';
    d.l2.forEach((sub, j) => {
      html += '<div class="md-group" style="--md-c:' + d.color + '"><div class="md-group-h">' + escH(sub.name) + '</div>';
      sub.l3.forEach((spec) => {
        html += '<button class="md-row" data-slug="' + slugify(spec) + '">' +
          '<span>' + escH(spec) + '</span><span class="md-card-arrow">→</span></button>';
      });
      html += '</div>';
    });
    html += '</div>';
    mdEl.innerHTML = html;
    mWireCommon();
    mdEl.querySelectorAll('.md-row').forEach(r => r.addEventListener('click', () => {
      mGoHash(L1_TO_HASH[l1Idx] + '/' + r.dataset.slug);
    }));
  }

  function renderMobileSpecialty(n) {
    mState.view = 'l3'; mState.l1 = n.l1Idx; mState.node = n;
    const coach = n.coachId ? COACH_BY_ID.get(n.coachId) : null;
    const desc = L3_DESC[n.name] || ('A focused session on ' + n.name + ' within ' + n.parentName + '.');
    let html = mHeaderHTML(L1_TO_HASH[n.l1Idx], n.grandparentName + ' · ' + n.parentName, escH(n.name), n.color);
    html += '<p class="md-desc">' + escH(desc) + '</p>';
    html += '<p class="md-spec-note" style="--md-c:' + n.color + '">One 2-hour 1:1 deep-dive — the bookable unit. Part of the <b>' + escH(n.parentName) + '</b> track; take the whole discipline only in the cohort.</p>';
    if (coach) {
      html += '<div class="md-coach-card" style="--md-c:' + n.color + '">' +
        '<div class="md-cc-top">' + mAvatarHTML(coach, n.color) +
        '<div><div class="md-cc-name">' + escH(coach.name) + '</div><div class="md-cc-role">' + escH(coach.role) + '</div>' +
        '<div class="md-cc-stats">' + starsHTML(coach.rating) + ' <b>' + coach.rating.toFixed(1) + '</b> · ' + coach.sessions + ' sessions · ' + coach.years + ' yrs</div></div></div>' +
        '<p class="md-cc-bio">' + escH(coach.bio) + '</p>' +
        '<div class="md-section-h">What founders say</div>' +
        '<div class="md-quotes" id="md-quotes">' + getCoachQuotesHTML(coach) + '</div>' +
        '<a class="md-testify" href="/share-testimonial.html?for=' + escH(coach.id) + '" target="_blank" rel="noopener">Worked with ' + escH(coach.name.split(' ')[0]) + '? Share your story →</a>' +
        '</div>';
    }
    html += '<div class="md-actions" style="--md-c:' + n.color + '">' +
      '<a class="md-book" href="../book/?tier=single&spec=' + specSlug(n.name) + '">Book this 1:1 deep-dive →</a>' +
      '<a class="md-cohort" href="../book/?tier=cohort">Get all 50 — join a cohort →</a>' +
      '<a class="md-share" href="' + whatsappHref(n, coach) + '" target="_blank" rel="noopener">Share on WhatsApp →</a>' +
      '</div>';
    mdEl.innerHTML = html;
    mWireCommon();
    window.scrollTo(0, 0);
  }

  function mAvatarHTML(coach, color) {
    if (coach && coach.photo) {
      return '<span class="md-avatar" style="background:url(\'' + coach.photo + '\') center/cover no-repeat;border-color:' + color + '" aria-hidden="true"></span>';
    }
    const initials = coach ? coach.name.split(' ').map(s => s[0]).join('').slice(0, 2) : '?';
    return '<span class="md-avatar" style="color:' + color + ';border-color:' + color + '" aria-hidden="true">' + escH(initials) + '</span>';
  }

  function mWireCommon() {
    mdEl.querySelectorAll('.md-back').forEach(b => b.addEventListener('click', () => mGoHash(b.dataset.back)));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mdEl.classList.remove('md-enter');
      void mdEl.offsetWidth;           // restart the slide-in transition
      mdEl.classList.add('md-enter');
    }
  }

  // Re-render live testimonials if the async fetch lands while a coach card is open
  function refreshMobileQuotes() {
    if (!isMobileView() || mState.view !== 'l3' || !mState.node) return;
    const coach = mState.node.coachId ? COACH_BY_ID.get(mState.node.coachId) : null;
    const q = document.getElementById('md-quotes');
    if (coach && q) q.innerHTML = getCoachQuotesHTML(coach);
  }

  function renderMobileFromHash() {
    const raw = window.location.hash.replace('#', '').toLowerCase();
    if (!raw) { renderMobileHome(); return; }
    const [d, slug] = raw.split('/');
    const l1Idx = HASH_TO_L1[d];
    if (l1Idx == null) { renderMobileHome(); return; }
    if (slug) {
      const n = nodeBySlug(l1Idx, slug);
      if (n) { renderMobileSpecialty(n); return; }
    }
    renderMobileDiscipline(l1Idx);
  }

  // ============================================================
  //   DEEP LINKING — read hash on load
  // ============================================================
  function handleHash() {
    if (isMobileView()) { renderMobileFromHash(); return; }
    const raw = window.location.hash.replace('#', '').toLowerCase();
    if (!raw) return;
    const [disc, slug] = raw.split('/');
    if (HASH_TO_L1[disc] == null) return;
    const l1Idx = HASH_TO_L1[disc];
    const target = slug ? nodeBySlug(l1Idx, slug) : null;   // '#marketing/brand-positioning' deep links (WhatsApp shares)
    // Wait for load animation to finish, then focus
    const waitForLoad = () => {
      if (state.loadProgress >= 1) {
        focusOnDiscipline(l1Idx);
        if (target) {
          state.pinnedId = target.id; state.hoveredId = target.id; state.paused = true;
          setTimeout(() => openDetail(target), 600);
        }
      } else {
        requestAnimationFrame(waitForLoad);
      }
    };
    waitForLoad();
  }
  window.addEventListener('hashchange', handleHash);

  // ============================================================
  //   NAV SCROLL STATE
  // ============================================================
  const navEl = document.getElementById('nav');
  if (navEl) {
    window.addEventListener('scroll', () => {
      navEl.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ============================================================
  //   GO
  // ============================================================
  let constellationBooted = false;
  function bootConstellation() {
    if (constellationBooted) return;
    constellationBooted = true;
    startLoadSequence();
    requestAnimationFrame(frame);
    // Process hash after a short delay to let the intro play
    setTimeout(handleHash, 100);
  }
  let mobileBuilt = false;
  function bootMobile() {
    mobileBuilt = true;
    renderMobileFromHash();   // card stack — no intro, no render loop, no constellation CPU on a 3G phone
  }
  if (isMobileView()) bootMobile();
  else if (!window.FS_USE_MODULE) bootConstellation();   // desktop constellation is rendered by the FSConstellation module when FS_USE_MODULE is set

  // Crossing the breakpoint at runtime (window resize, phone rotate,
  // split view) boots whichever experience just became visible — the
  // other keeps its state and resumes when crossed back.
  const onBreakpointChange = () => {
    if (isMobileView()) { if (!mobileBuilt) bootMobile(); }
    else if (!window.FS_USE_MODULE) bootConstellation();
  };
  if (MOBILE_MQL.addEventListener) MOBILE_MQL.addEventListener('change', onBreakpointChange);
  else if (MOBILE_MQL.addListener) MOBILE_MQL.addListener(onBreakpointChange);   // older Safari

  // ── Host API for the FSConstellation module ─────────────────────────────────
  // The desktop constellation is rendered by the module; explore.js still owns
  // the search matcher, coach panel, ratings, testimonials and booking. The
  // wiring script (in index.html) maps the module's node ids to our NODES by
  // (level · discipline key · name) and drives these.
  window.__fsExplore = {
    NODES: NODES,
    TAXONOMY: TAXONOMY,
    // run the real matcher for a query → ranked NODE[] (also fires search-gap logging)
    search: function (q) {
      state.searchQuery = (q == null ? '' : String(q)).trim().toLowerCase();
      var r = searchMatches();
      scheduleSearchLog();
      return r;
    },
    // open the coach slide-out for a node (resolves to the best L3 if needed)
    openDetail: function (n) { openDetail(n && n.level === 3 ? n : resolveBestL3(n, '')); },
    // open the discipline (L1) / module (L2) breakdown panels
    openDiscipline: function (l1) { openDiscipline(l1); },
    openModule: function (l1, l2) { openModule(l1, l2); },
    resolveBestL3: resolveBestL3
  };

})();
