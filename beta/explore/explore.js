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
    },
    {
      id: 'moses-okudu',
      name: 'Moses Engwau Okudu',
      role: 'Lead Strategy & Team Building Coach',
      photo: '../images/coach-moses.jpg',
      color: '#3d4a2e',
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
  //   TAXONOMY
  // ============================================================
  const TAXONOMY = [
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
        { name: "Financial Planning",    l3: ["Revenue Forecasting","Burn Rate & Runway","Cash Flow Management"] },
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
      color: '#3d4a2e',
      l2: [
        { name: "Competitive Strategy",l3: ["Market Analysis","Positioning & Moats","Scenario Planning"] },
        { name: "Team Architecture",   l3: ["Hiring Strategy","Culture Design","Org Structure"] },
        { name: "Operational Systems", l3: ["Process Design","OKRs & KPIs","Decision Frameworks"] },
      ]
    },
    {
      l1: "Product Dev & Pricing",  l1Short: ["PRODUCT DEV","& PRICING"],
      color: '#a59b8c',
      l2: [
        { name: "Product-Market Fit",  l3: ["Problem Validation","Solution Testing","PMF Signals"] },
        { name: "Product Development", l3: ["MVP Design","Roadmapping","Iteration Cycles"] },
        { name: "Pricing Strategy",    l3: ["Value-Based Pricing","Competitive Pricing","Price Testing"] },
      ]
    },
  ];

  // ============================================================
  //   AVAILABILITY DATA (placeholder — will come from API)
  // ============================================================
  const ONETOONE_SLOTS = [
    { date: 'Mon 14 Jul', time: '10:00 – 12:00 EAT', dur: '2 hr' },
    { date: 'Wed 16 Jul', time: '14:00 – 16:00 EAT', dur: '2 hr' },
    { date: 'Fri 18 Jul', time: '09:00 – 11:00 EAT', dur: '2 hr' },
    { date: 'Mon 21 Jul', time: '10:00 – 12:00 EAT', dur: '2 hr' },
  ];
  const COHORT_SCHEDULE = [
    { label: 'Cohort A',  dates: '6 Jul – 3 Aug 2026',  seats: 0,  status: 'full' },
    { label: 'Cohort B',  dates: '10 Aug – 7 Sep 2026', seats: 4,  status: 'open' },
    { label: 'Cohort C',  dates: '14 Sep – 12 Oct 2026',seats: 12, status: 'open' },
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
  };

  // ============================================================
  //   SEARCH KEYWORDS (per discipline + per L3 synonyms)
  // ============================================================
  const DISCIPLINE_KEYWORDS = {
    0: "marketing branding brand logo voice tone messaging campaign launch growth content social media seo advertising storytelling customer acquisition awareness funnel leads reach engagement audience distribution channels increase sales grow revenue find customers get clients graphic design email marketing newsletter digital marketing online presence website visibility influencer promotion publicity launch planning go live public relations media coverage press",
    1: "finance financial model modelling spreadsheet revenue forecast burn rate runway cash flow unit economics cac ltv valuation cap table term sheet budget projection numbers money profit loss p&l balance sheet tax planning tax compliance ura withholding tax vat stamp duty nssf employer obligations payroll accounting bookkeeping audit statutory obligation regulatory compliance company registration ursb tin certificate business license",
    2: "investment fundraising raise capital pitch deck investor angel seed series grant funding round due diligence data room term sheet pre-seed dfi money funding donors partners accelerator incubator usaid mastercard foundation gates foundation dfid sida danida european union un agencies impact investment social enterprise blended finance smart money patient capital",
    3: "strategy team hiring culture org structure competitive analysis moat scenario planning okr kpi process decision framework operations leadership management people hr talent organisation recruit staff employees contractors freelancers remote team scaling growing pains co-founder conflict board governance advisory board mentors",
    4: "product development pricing mvp roadmap iteration ship build feature pmf product-market fit validation testing prototype ux ui design tiers packages offering product testing user testing beta testing quality assurance qa launch readiness go to market product launch app development software saas mobile app web app",
  };

  // Synonyms and related terms per L3 specialty — dramatically improves search hit rate
  const L3_KEYWORDS = {
    "Brand Positioning":       "differentiation unique selling proposition usp target audience perception identity niche competitive advantage what makes us different why choose us stand out crowded market category creation blue ocean positioning statement value prop promise trust credibility authority premium luxury affordable aspirational rebrand refresh pivot identity crisis who are we",
    "Messaging Architecture":  "copywriting tagline elevator pitch value proposition story narrative key messages communication words slogan headline hook one-liner about page website copy landing page email subject line tone of voice brand voice how to describe my business explain what we do clarity confusion simplifying complex ideas words that sell persuasion influence",
    "Visual Identity":         "design logo colours colors fonts typography graphics look feel style guide brand kit aesthetic brand book mockup template figma canva creative direction photography art direction mood board palette visual language iconography illustration rebrand refresh modernize outdated identity professional polished amateur",
    "Market Entry":            "go-to-market gtm launch country expansion geography first market beachhead reach territory distribution where to start which market enter new market international cross-border east africa uganda kenya rwanda localization pilot test market soft launch when to launch how to enter timing first customers early adopters",
    "Channel Mix":             "distribution reach social media paid ads organic referral partnerships affiliates instagram linkedin tiktok facebook google youtube twitter x whatsapp marketing channels acquisition where to find customers how to get users growth hacking viral loop ambassador programme influencer digital marketing offline events word of mouth community grassroots increase sales grow revenue more customers more clients get more business sales strategy pipeline lead generation cold calling outbound inbound email marketing newsletter drip campaign automation mailchimp hubspot",
    "Launch Sequencing":       "timeline schedule campaign pre-launch beta soft launch go live rollout calendar milestones journey countdown checklist dependencies launch day event press release media coverage announcement PR communications stakeholder readiness not ready when to launch launch plan launch planning sequence order of operations product launch market launch public launch opening day",
    "Content Strategy":        "blog posts articles video social media editorial calendar thought leadership publishing content marketing keywords seo writing podcast newsletter email marketing inbound what to post how often content creation content plan topics ideas engagement followers audience building authority credibility sharing repurpose",
    "SEO & Discoverability":   "google search ranking keywords optimization meta tags backlinks ai search citations authority discoverability findability organic traffic search engine perplexity chatgpt claude ai overviews featured snippets schema structured data domain authority page rank how to get found online visibility indexed crawled",
    "Customer Research":       "interviews surveys focus groups user research persona journey mapping feedback insights discovery empathy customer understanding who is my customer target market demographics psychographics behaviour patterns needs pain points desires frustrations jobs to be done jtbd design thinking observation",
    "CAC & LTV":               "customer acquisition cost lifetime value payback ratio economics efficiency cost per lead conversion cost per click cpc cpa cost per acquisition how much to spend marketing roi return on ad spend roas unit economics healthy ratio profitable customers expensive cheap efficient",
    "Payback Period":          "break even roi return on investment recovery time months cash cycle when do i make money back how long until profitable recoup investment payback months time to value cash positive self-sustaining sustainable",
    "Contribution Margin":     "gross margin profit per unit variable costs cogs cost of goods economics unit profitability how much do i make per sale margin analysis product margins service margins low margin high margin improving margins cost reduction",
    "Revenue Forecasting":     "projections sales forecast pipeline prediction model assumptions growth rate trajectory how much will we make next month quarter year financial planning budget targets top line bottom line conservative aggressive realistic scenario modelling excel spreadsheet",
    "Burn Rate & Runway":      "monthly spend expenses cash remaining months survival capital efficiency zero date running out of money how long can we survive cash crunch emergency fundraise extend runway reduce costs cut expenses layoffs belt tightening conservation mode default alive default dead",
    "Cash Flow Management":    "working capital liquidity invoicing receivables payables timing cash in cash out treasury late payments cash crunch float bridge managing money when payments come in when bills are due seasonal cyclical managing payroll making payroll rent expenses tax planning tax return ura filing quarterly annual vat withholding tax paye corporate tax compliance accountant bookkeeper financial statements",
    "Valuation Methods":       "worth dcf discounted cash flow multiples comparable companies enterprise value how much is my company worth pre-money post-money overvalued undervalued fair value negotiation what are we worth startup valuation early stage valuation revenue multiple arr valuation",
    "Cap Table Design":        "equity ownership shares options vesting dilution esop pool founder split shareholders agreement co-founder equity how much equity to give vesting schedule cliff four year one year advisor shares convertible note safe equity split fair unfair dilution protection company registration ursb certificate of incorporation memorandum articles of association shareholders register share classes ordinary preference stamp duty transfer tax business name registration",
    "Term Sheet Analysis":     "terms conditions negotiation clauses liquidation preference anti-dilution pro-rata rights board seats control protective provisions drag along tag along participation rights investor friendly founder friendly red flags what to watch for lawyer review legal",
    "Pitch Deck Structure":    "slides presentation story problem solution market traction team ask demo day format how to pitch investors deck template slide order sequence narrative flow opening closing hook ten slides twelve slides appendix backup slides competition slide financial slide",
    "Investor Narrative":      "story why now why us why this market thesis conviction founder story compelling narrative vision mission purpose big picture dream ambition passion credibility track record unique insight contrarian belief timing wave tailwind macro trend",
    "Executive Summary":       "one pager overview brief memo summary document introduction teaser first impression email to investor cold outreach deck summary blurb description paragraph overview snapshot highlights key points concise clear punchy",
    "Investor Targeting":      "vc venture capital angel network family office dfi fund partners who to pitch warm intro reach out connections crunchbase dealroom investor database pipeline outreach cold email warm introduction portfolio companies thesis match stage match geography match sector focus cheque size ticket size",
    "Due Diligence Prep":      "documents legal financial compliance audit review records contracts ip intellectual property ready prepared organized background check references verification proof evidence documentation legal structure corporate governance board minutes shareholder agreements employment contracts",
    "Data Room":               "files documents folder shared drive organize investor access virtual data room portal google drive dropbox notion sharepoint organized structured clean professional index table of contents categories sections access permissions version control confidential nda",
    "Pre-seed Rounds":         "first money friends family angel micro fund initial capital pre-revenue early stage bootstrap fools gold love money starting from scratch need money to start how to fund my idea bootstrapping side hustle self-funded first cheque minimum viable capital",
    "Seed Rounds":             "seed funding round lead investor institutional raise series sizing commitment certification accreditation closing the round oversubscribed allocation pro-rata follow-on bridge extension runway twelve to eighteen months milestone-based tranche",
    "Grants & DFIs":           "free money non-dilutive grant application usaid mastercard foundation dfid world bank programme donor funds certification proposal writing log frame theory of change impact measurement social enterprise development finance bilateral multilateral concessional blended finance patient capital catalytic capital nssf ura tax incentive tax exemption free zone special economic zone export processing innovation fund research grant startup grant youth fund women fund government programme public funding bilateral aid",
    "Market Analysis":         "competition landscape research tam sam som market size competitors benchmarking industry trends total addressable market serviceable addressable serviceable obtainable market opportunity how big is the market growth rate cagr market dynamics forces disruption threats substitutes",
    "Positioning & Moats":     "defensibility barrier competitive advantage differentiation switching costs network effects lock-in moat first mover advantage last mover scale economies of scale brand loyalty habit proprietary technology data advantage patent trademark trade secret regulatory barrier license certification",
    "Scenario Planning":       "contingency what if worst case best case planning risk strategy pivot adapt uncertainty future planning stress test sensitivity analysis downside protection upside capture optionality flexibility resilience antifragile black swan tail risk macro political economic regulatory",
    "Hiring Strategy":         "recruit talent hire team build roles job description compensation culture fit first hire key hires who to hire first engineer developer designer marketer salesperson operations finance coo cto cmo when to hire full time part time contractor freelancer agency outsource nssf paye employer obligations statutory deductions labour law employment contract probation termination notice period staff management human resources hr payroll benefits social security pension",
    "Culture Design":          "values mission purpose workplace remote team norms rituals belonging culture code handbook toxic culture good culture bad culture retention turnover engagement satisfaction happiness meaning purpose autonomy mastery belonging psychological safety diversity inclusion equity",
    "Org Structure":           "reporting hierarchy flat structure departments roles responsibilities org chart leadership team architecture scale managing people management span of control centralized decentralized matrix functional divisional how to structure my team growing pains scaling people reorganization",
    "Process Design":          "workflows sop standard operating procedure systems automation efficiency repeatability playbook operations manual documentation handoff delegation onboarding training checklists quality control consistency scaling without me founder dependency bottleneck systems thinking statutory obligation regulatory compliance annual returns filing deadlines governance corporate secretary board resolutions minutes record keeping audit trail",
    "OKRs & KPIs":             "goals objectives key results metrics tracking dashboard performance measurement targets milestones progress north star metric leading indicators lagging indicators vanity metrics actionable metrics scoreboard accountability weekly monthly quarterly review what to measure how to track success failure",
    "Decision Frameworks":     "raci who decides delegation authority speed governance alignment accountability consensus meetings too many meetings slow decisions fast decisions bias action analysis paralysis data-driven intuition gut feel disagreement conflict resolution alignment stakeholder management communication",
    "Problem Validation":      "customer discovery pain point need demand evidence proof real problem worth solving research does anyone want this will people pay for this problem interview mom test talking to customers need finding desirability viability feasibility assumption risk",
    "Solution Testing":        "prototype experiment test concierge wizard of oz fake door landing page validation learning build measure learn hypothesis test fail fast cheap test smoke test mockup clickable demo interactive wireframe paper prototype no-code low-code rapid prototyping product testing user testing beta testing usability testing ab testing split testing quality assurance qa focus groups user feedback customer feedback",
    "PMF Signals":             "product market fit retention engagement nps net promoter score pull organic growth repeat cohort churn stickiness active users daily weekly monthly usage frequency depth of use power users love advocacy referral word of mouth when do i have pmf how to know pmf",
    "MVP Design":              "minimum viable product lean startup build measure learn smallest version prototype ship fast first version scope creep feature bloat over-engineering simplest thing that works core feature essential functionality cut scope reduce complexity focus prioritize what to build first",
    "Roadmapping":             "roadmap backlog priorities features timeline releases plan sprint agile what to build next quarterly planning prioritization framework rice moscow ice scoring stakeholder requests customer requests technical debt maintenance innovation exploration exploitation balance short term long term vision",
    "Iteration Cycles":        "agile sprint retrospective ship learn improve velocity cadence deployment release cycle feedback loop continuous improvement kaizen lean scrum kanban two week sprint daily standup demo review planning estimation story points shipping faster",
    "Value-Based Pricing":     "willingness to pay perceived value premium pricing power how much to charge what to charge tiers packages bundles plans pricing model subscription saas per seat per use usage based freemium free trial enterprise pricing custom pricing negotiation discounting anchor price psychology",
    "Competitive Pricing":     "benchmark market rate comparison undercutting matching premium economy mid-range pricing strategy race to bottom price war commoditization differentiation on price competitor pricing analysis mystery shopping market research how much do competitors charge underpriced overpriced leaving money on the table",
    "Price Testing":           "ab test experiment pricing page conversion rate elasticity discount trial free tier freemium pricing experiment van westendorp conjoint analysis willingness to pay survey price sensitivity demand curve optimal price price increase price decrease grandfathering early bird launch pricing promotional pricing seasonal",
  };

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

      sub.l3.forEach((spec, k) => {
        const spread = 6;
        const l3Theta = l2Theta + (k - 1) * spread;
        const l3Coach = resolveCoach(i, j, k);
        NODES.push({
          id: `l3-${i}-${j}-${k}`, level: 3, l1Idx: i, l2Idx: j, l3Idx: k,
          name: spec, color: d.color,
          coach: l3Coach ? l3Coach.name : '', coachRole: l3Coach ? l3Coach.role : '',
          coachId: l3Coach ? l3Coach.id : null,
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

  // ---------- Atmospheric haze orbs ----------
  const HAZE_ORBS = [
    { grad: 'g-orb-terra', x: 0.20, y: 0.30, r: 360, dur: 38, phase: 0   },
    { grad: 'g-orb-ochre', x: 0.78, y: 0.22, r: 320, dur: 44, phase: 1.7 },
    { grad: 'g-orb-sage',  x: 0.82, y: 0.72, r: 380, dur: 52, phase: 0.6 },
    { grad: 'g-orb-moss',  x: 0.18, y: 0.78, r: 340, dur: 46, phase: 2.3 },
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
    return { el: c, phase: o.phase, dur: o.dur, ox, oy, r: o.r };
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
  centerGroup.appendChild(el('circle', { cx: CX, cy: CY, r: 80, fill: 'url(#g-center)' }));
  const PETAL_COLS = ['#c8531f','#c9923a','#8aab5c','#3d4a2e','#777770'];
  const MARK_SCALE = 1.8;
  const petalsGroup = el('g', { id: 'center-petals', transform: `translate(${CX} ${CY})` });
  PETAL_COLS.forEach((c, i) => {
    const src = [[50,8],[57.5,50],[50,92],[42.5,50]];
    const pts = src.map(([x,y]) => [(x-50)*MARK_SCALE, (y-50)*MARK_SCALE].join(',')).join(' ');
    const p = el('polygon', { points: pts, fill: c, opacity: 0.85, transform: `rotate(${i*72})` });
    petalsGroup.appendChild(p);
  });
  // Open circle eye — paper ring with ink center (V6 mark signature)
  petalsGroup.appendChild(el('circle', { cx: 0, cy: 0, r: 14, fill: COL_PAPER }));
  petalsGroup.appendChild(el('circle', { cx: 0, cy: 0, r: 6, fill: COL_INK }));
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

  // ---------- Particle system (replaces starburst) ----------
  const PARTICLE_COUNT = 60;
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
      n._ring = el('circle', { cx: 0, cy: 0, r: 30, fill: COL_INK, stroke: n.color, 'stroke-width': 2 });
      n._innerDot = el('circle', { cx: 0, cy: 0, r: 4, fill: n.color });
      g.appendChild(n._glow);
      g.appendChild(n._ring);
      g.appendChild(n._innerDot);

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
      g.appendChild(n._glow); g.appendChild(n._ring); g.appendChild(n._innerDot);

      n._label = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: n.color, 'font-family': "'Josefin Sans', sans-serif", 'font-size': 11, 'font-weight': 600, 'letter-spacing': 1.8, class: 'label' });
      n._label.textContent = n.name.toUpperCase();
      g.appendChild(n._label);

    } else {
      n._innerDot = el('circle', { cx: 0, cy: 0, r: 3, fill: n.color, opacity: 0.7 });
      n._glowDot  = el('circle', { cx: 0, cy: 0, r: 6, fill: n.color, opacity: 0, filter: 'url(#f-glow-sm)' });
      n._tick = el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: n.color, 'stroke-width': 0.6, opacity: 0.3, class: 'tick' });
      g.appendChild(n._tick);
      g.appendChild(n._glowDot); g.appendChild(n._innerDot);

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
    detailEl.classList.add('show');
    updateInfoPanel();
  }
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
  // Map L1 discipline names → booking URL keys
  const DISC_URL_KEY = {
    'Marketing & Branding': 'marketing',
    'Financial Modelling': 'finance',
    'Investment Readiness': 'investment',
    'Strategy & Team Building': 'strategy',
    'Product Dev & Pricing': 'product',
  };

  detailEl.querySelector('.d-book').addEventListener('click', () => {
    if (!detailSelectedSlot) return;
    const n = detailCurrentNode;
    const discKey = DISC_URL_KEY[n.grandparentName] || DISC_URL_KEY[n.parentName] || 'marketing';
    window.location.href = '../book/?tier=single&disc=' + discKey;
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

  // Build quote rows for a coach from shared testimonials data (or fall back to inline)
  function getCoachQuotesHTML(coach) {
    // Prefer shared testimonials.js data if loaded
    if (window.FS_Testimonials) {
      const quotes = window.FS_Testimonials.getBySurface('coach', coach.id);
      if (quotes.length) {
        return quotes.map(q => `
          <div class="dir-quote">
            <div class="dir-quote-text">“${q.text}”</div>
            <div class="dir-quote-author">${q.name} · ${q.company}${q.cohort ? ' · ' + q.cohort : ''}</div>
          </div>
        `).join('');
      }
    }
    // Fallback: inline quotes on the coach object (backwards compatible)
    return (coach.quotes || []).map(q => `
      <div class="dir-quote">
        <div class="dir-quote-text">“${q.text}”</div>
        <div class="dir-quote-author">${q.who} · ${q.co}</div>
      </div>
    `).join('');
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
                <div class="dir-quotes">
                  ${getCoachQuotesHTML(coach)}
                </div>
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

      // Map L1 index → booking disc key
      const DIR_DISC_KEYS = ['marketing', 'finance', 'investment', 'strategy', 'product'];
      const coachDiscKey = l1Idx != null ? DIR_DISC_KEYS[l1Idx] : 'marketing';

      // Populate availability
      const list1to1 = item.querySelector('.dir-1to1');
      ONETOONE_SLOTS.forEach(s => {
        const row = document.createElement('button');
        row.className = 'dir-avail-row';
        row.innerHTML = `<div><div class="da-date">${s.date}</div><div class="da-time">${s.time}</div></div><div class="da-cta">Book →</div>`;
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = '../book/?tier=single&disc=' + coachDiscKey;
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
        window.location.href = '../book/?tier=single&disc=' + coachDiscKey;
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

  function bumpIdle() {
    clearTimeout(idleTimer);
    if (!searchOpen) return;
    idleTimer = setTimeout(closeSearch, 5000);
  }
  function openSearch() {
    if (searchOpen) return;
    searchOpen = true;
    searchEl.classList.add('show');
    setTimeout(() => searchInpt.focus(), 200);
    bumpIdle();
  }
  function closeSearch() {
    searchOpen = false;
    searchEl.classList.remove('show');
    searchInpt.value = '';
    state.searchQuery = '';
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
    state.searchQuery = searchInpt.value.trim().toLowerCase();
    renderSearchResults();
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

  function searchMatches() {
    if (!state.searchQuery) return [];
    const q = state.searchQuery;
    return NODES.filter(n => buildSearchHaystack(n).includes(q)).slice(0, 8);
  }

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
    searchList.innerHTML = '';
    if (!state.searchQuery) {
      searchList.innerHTML = `<div class="s-hint">Try "pitch" · "pricing" · "runway" · "brand"</div>`;
      return;
    }
    if (results.length === 0) {
      searchList.innerHTML = `<div class="s-hint">No match. Try fewer letters.</div>`;
      return;
    }
    results.forEach(n => {
      const div = document.createElement('div');
      div.className = 's-item';
      div.style.setProperty('--s-color', n.color);
      const lvl = ['L1 · Discipline','L2 · Sub-category','L3 · Specialty'][n.level - 1];
      const crumb = n.level === 3 ? `${n.grandparentName} · ${n.parentName}` :
                    n.level === 2 ? `${n.parentName}` : '';
      div.innerHTML = `<i class="s-dot"></i><div class="s-meta"><div class="s-name">${n.name}</div><div class="s-sub">${lvl}${crumb ? ' · ' + crumb : ''}</div></div>`;
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
      state.yaw = (state.yaw + state.speed * introBoost * dt / 16.7) % 360;
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

    // Haze orbs — throttled to every 4th frame (~15fps). Pure decoration.
    if (frameCount % 4 === 0) {
      const t = now / 1000;
      const hazeOp = lp < 1 ? lp * 0.9 : 0.9;
      hazeEls.forEach(h => {
        const dx = Math.sin(t / h.dur * 2 * Math.PI + h.phase) * 80;
        const dy = Math.cos(t / h.dur * 2 * Math.PI + h.phase * 0.7) * 60;
        const sc = 1 + Math.sin(t / (h.dur * 0.7) + h.phase) * 0.05;
        h.el.setAttribute('cx', h.ox + dx);
        h.el.setAttribute('cy', h.oy + dy);
        h.el.setAttribute('r', h.r * sc);
        h.el.setAttribute('opacity', hazeOp);
      });
    }

    // Particles — smooth drift with organic motion (replaces starburst)
    if (frameCount % 2 === 0) {
      const t = now / 1000;
      particles.forEach(p => {
        // Gentle orbital drift
        p.angle += p.drift * dt;
        // Organic position with noise-like sine layers
        const wobbleX = Math.sin(t * p.speed + p.phase) * 8
                      + Math.sin(t * p.speed * 0.7 + p.phase * 1.3) * 4;
        const wobbleY = Math.cos(t * p.speed * 0.9 + p.phase * 0.8) * 6
                      + Math.cos(t * p.speed * 0.5 + p.phase * 1.6) * 3;
        const x = CX + Math.cos(p.angle) * p.dist + wobbleX;
        const y = CY + Math.sin(p.angle) * p.dist + wobbleY;
        p.el.setAttribute('cx', x.toFixed(1));
        p.el.setAttribute('cy', y.toFixed(1));

        // Fade in smoothly during load, gentle pulse after
        let op;
        if (lp < 1) {
          const fadeIn = clamp01((lp - 0.05) / 0.5);
          op = easeOutCubic(fadeIn) * p.maxOpacity;
        } else {
          const pulse = 0.85 + Math.sin(t * p.speed * 1.2 + p.phase) * 0.15;
          op = p.maxOpacity * pulse;
        }
        p.el.setAttribute('opacity', op.toFixed(3));
        // Subtle size breathing
        const breathe = p.size * (0.9 + Math.sin(t * p.speed * 0.6 + p.phase * 2) * 0.1);
        p.el.setAttribute('r', breathe.toFixed(2));
      });
    }
    // Center mark fade-in (smooth, no flash)
    if (lp < 1) {
      const centerOp = clamp01((lp - 0.15) / 0.45);
      petalsGroup.setAttribute('opacity', easeOutCubic(centerOp));
    } else {
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

    // Auto-reset: after 12 seconds of no interaction, clear selection and resume rotation
    if (state.lastInteraction && (state.pinnedId || state.focusedL1 != null)) {
      const idle = Date.now() - state.lastInteraction;
      if (idle > 12000) {
        state.lastInteraction = 0;
        if (state.focusedL1 != null) unfocus();
        else { state.pinnedId = null; state.hoveredId = null; state.paused = false; updateInfoPanel(); }
        closeDetail();
      }
    }

    // Project nodes + build O(1) lookup map for connection endpoints
    const projected = NODES.map(n => ({ n, p: projectAngle(n.theta, n.r, n.yLift, renderTilt) }));
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
      let sx = p.sx, sy = p.sy, introOp = 1, introScale = scale;
      if (lp < 1) {
        const localT = clamp01((lp - n.t0) / 0.28);
        const eT = easeOutCubic(localT);
        sx = lerp(CX, p.sx, eT);
        sy = lerp(CY, p.sy, eT);
        introOp = clamp01(localT * 1.2);
        introScale = lerp(0.3, scale, eT);
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

      const GRAY = '#6b6862';
      const GRAY_LABEL = 'rgba(239,231,216,0.55)';
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
        const op = isActive ? 1 : isLineage ? 0.95 : isGray ? 0.45 : baseOp;
        n._group.style.opacity = op * introOp;
        n._glow.setAttribute('fill', isActive ? n.color : fillCol);
        n._glow.setAttribute('opacity', isActive ? 0.75 : isLineage ? 0.35 : isGray ? 0.06 : 0.18 * baseOp);
        n._ring.setAttribute('stroke', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        if (n._innerLabel) n._innerLabel.forEach(t => t.setAttribute('fill', isActive ? n.color : fillCol));
        const ringR = isActive ? 38 : 30;
        n._ring.setAttribute('r', ringR);

        const dirP = projectAngle(n.theta, n.r + 60, -18, renderTilt);
        const dx = (dirP.sx - p.sx) / (scale || 1);
        const dy = (dirP.sy - p.sy) / (scale || 1);
        n._coach.setAttribute('x', dx);
        n._coach.setAttribute('y', dy);
        n._coach.setAttribute('opacity', isActive ? 0.9 : isGray ? 0.15 : isDimmed && !isLineage ? 0.06 : baseOp * 0.5);

      } else if (n.level === 2) {
        const op = isActive ? 1 : isLineage ? 0.9 : isSibling ? 0.2 : isGray ? 0.5 : baseOp;
        n._group.style.opacity = op * introOp;
        n._glow.setAttribute('fill', isActive ? n.color : fillCol);
        n._glow.setAttribute('opacity', isActive ? 0.6 : isLineage ? 0.12 : isSibling ? 0.04 : isGray ? 0.05 : 0.15 * baseOp);
        n._ring.setAttribute('stroke', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._label.setAttribute('fill', isActive ? n.color : labelCol);
        n._ring.setAttribute('r', isActive ? 13 : 9);

        const [dx, dy] = labelOffset(n, p, scale, labelPos, 30, -28);
        n._label.setAttribute('x', dx);
        n._label.setAttribute('y', dy);
        const labelOp = isActive ? 1 : isLineage ? 0.8 : isSibling ? 0.1 : Math.max(0, (tNorm - 0.45) * 1.8) * (isGray ? 0.45 : 1);
        n._label.setAttribute('opacity', labelOp);

      } else {
        const op = isActive ? 1 : isLineage ? 0.85 : isSibling ? 0.2 : isGray ? 0.35 : 0.55 * baseOp;
        n._group.style.opacity = op * introOp;
        n._innerDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._innerDot.setAttribute('r', isActive ? 6 : isLineage ? 3 : 3);
        n._glowDot.setAttribute('fill', isActive ? n.color : fillCol);
        n._glowDot.setAttribute('opacity', isActive ? 0.85 : isLineage ? 0.15 : 0);
        n._glowDot.setAttribute('r', isActive ? 14 : 6);
        if (n._tick) n._tick.setAttribute('stroke', isActive ? n.color : fillCol);
        n._label.setAttribute('fill', isActive ? '#efe7d8' : labelCol);

        const radial = l3RadialDist(n.l3Idx);
        const [dx, dy] = labelOffset(n, p, scale, labelPos, radial, -48);
        n._label.setAttribute('x', dx);
        n._label.setAttribute('y', dy);

        if (n._tick) {
          n._tick.setAttribute('x1', 0);
          n._tick.setAttribute('y1', 0);
          n._tick.setAttribute('x2', dx);
          n._tick.setAttribute('y2', dy);
        }

        let matchHide = false;
        if (state.searchQuery) {
          const hay = buildSearchHaystack(n);
          if (!hay.includes(state.searchQuery)) matchHide = true;
        }
        let labelOp;
        if (isActive) labelOp = 1;
        else if (isLineage) labelOp = 0.95;
        else if (isSibling) labelOp = 0;  // hide sibling L3 labels completely to avoid clutter
        else if (activeNode && isGray) labelOp = 0;  // hide unrelated L3 labels when a node is selected
        else labelOp = Math.max(0, (tNorm - 0.6) * 2.2);  // depth-based fade for idle state
        if (isGray && !activeNode) labelOp *= 0.55;
        if (matchHide) { labelOp = 0; n._group.style.opacity = 0.05 * introOp; }
        n._label.setAttribute('opacity', labelOp);
        if (n._tick) n._tick.setAttribute('opacity', labelOp * 0.5);
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

  function l3RadialDist(k) { return [62, 26, 62][k]; }

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
  //   DEEP LINKING — read hash on load
  // ============================================================
  function handleHash() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash && HASH_TO_L1[hash] != null) {
      // Wait for load animation to finish, then focus
      const waitForLoad = () => {
        if (state.loadProgress >= 1) {
          focusOnDiscipline(HASH_TO_L1[hash]);
        } else {
          requestAnimationFrame(waitForLoad);
        }
      };
      waitForLoad();
    }
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
  startLoadSequence();
  requestAnimationFrame(frame);
  // Process hash after a short delay to let the intro play
  setTimeout(handleHash, 100);

})();
