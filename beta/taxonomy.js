/* =========================================================================
   The Founder's Sprint — COACHING TAXONOMY (single source of truth)
   -------------------------------------------------------------------------
   The 3-level coaching taxonomy used across the platform:
     L1  discipline  — what the COHORT delivers in full (5 disciplines)
     L2  module      — a coherent course / deep-dive within a discipline
                       (e.g. "Pitch Craft"). A GROUPING + discovery label.
                       NEVER its own purchasable SKU.
     L3  specialty   — the ATOMIC BOOKABLE UNIT = one 2-hour 1:1 deep-dive.
                       single = 1 L3 · pick3 = any 3 L3s · cohort = all L3s.

   Pricing model (locked — see FS_Course_Structure_And_Pricing.md):
     - A founder buys L3 specialties, not disciplines. An L1 is too dense for
       one 2-hour session; the whole discipline is only delivered in the cohort.
     - Because each L3 is a distinct, dense 2-hour deep-dive, picking the 3 L3s
       under one L2 (e.g. all of Pitch Craft) is fair scope, not double-paying.
       The only guardrail: L2 must never also be sold as a single session.

   This file is the intended SHARED definition for booking AND discovery.
   `beta/book/book.js` consumes it today. The constellation explorer
   (`beta/explore/explore.js`, owned by a separate session) currently hardcodes
   the same structure — convergence onto this file is a coordinated follow-up.
   If you change names/slugs here, coordinate with the explorer session: the
   L3 NAMES are a shared contract (explore.js matches on them).
   ========================================================================= */
(function (root) {
  'use strict';

  var DISCIPLINES = [
    {
      key: 'marketing', label: 'Marketing & Branding', coach: 'Teddy Ruge', color: '#C8531F',
      l2: [
        { name: 'Brand Strategy',     l3: ['Brand Positioning', 'Messaging Architecture', 'Visual Identity'] },
        { name: 'Go-to-Market',       l3: ['Market Entry', 'Channel Mix', 'Launch Sequencing'] },
        { name: 'Growth & Discovery', l3: ['Content Strategy', 'SEO & Discoverability', 'Customer Research'] },
      ]
    },
    {
      key: 'finance', label: 'Financial Modelling', coach: 'Barry Wojega', color: '#C9923A',
      l2: [
        { name: 'Unit Economics',       l3: ['CAC & LTV', 'Payback Period', 'Contribution Margin'] },
        { name: 'Financial Planning',   l3: ['Revenue Forecasting', 'Burn Rate & Runway', 'Cash Flow Management', 'Tax & Compliance'] },
        { name: 'Capital Architecture', l3: ['Valuation Methods', 'Cap Table Design', 'Term Sheet Analysis'] },
      ]
    },
    {
      key: 'investment', label: 'Investment Readiness', coach: 'Joseph Kalema', color: '#8AAB5C',
      l2: [
        { name: 'Pitch Craft',        l3: ['Pitch Deck Structure', 'Investor Narrative', 'Executive Summary'] },
        { name: 'Investor Relations', l3: ['Investor Targeting', 'Due Diligence Prep', 'Data Room'] },
        { name: 'Funding Strategy',   l3: ['Pre-seed Rounds', 'Seed Rounds', 'Grants & DFIs'] },
      ]
    },
    {
      key: 'strategy', label: 'Strategy & Team Building', coach: 'Moses Engwau Okudu', color: '#5F7A45',
      l2: [
        { name: 'Competitive Strategy', l3: ['Market Analysis', 'Positioning & Moats', 'Scenario Planning'] },
        { name: 'Team Architecture',    l3: ['Hiring Strategy', 'Culture Design', 'Org Structure', 'Payroll & HR Compliance'] },
        { name: 'Operational Systems',  l3: ['Process Design', 'OKRs & KPIs', 'Decision Frameworks', 'Legal & Registration'] },
      ]
    },
    {
      key: 'product', label: 'Product Dev & Pricing', coach: 'Patrick Ngolobe', color: '#A59B8C',
      l2: [
        { name: 'Product-Market Fit',  l3: ['Problem Validation', 'Solution Testing', 'PMF Signals'] },
        { name: 'Product Development', l3: ['MVP Design', 'Roadmapping', 'Iteration Cycles', 'Payments & Mobile Money'] },
        { name: 'Pricing Strategy',    l3: ['Value-Based Pricing', 'Competitive Pricing', 'Price Testing'] },
      ]
    },
  ];

  // Stable slug for an L3 name — the booking key (e.g. "CAC & LTV" -> "cac-and-ltv").
  function slugify(name) {
    return String(name).toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // One-line description of every L3 specialty — "what it means / what it covers".
  // Keyed by slug. Additive metadata (no name/slug change), surfaced as tooltips
  // in the mentor apply picker and reusable by booking/discovery.
  var DESC = {
    // Marketing & Branding
    'brand-positioning': 'How you claim and own a distinct place in customers’ minds versus the alternatives.',
    'messaging-architecture': 'The structured hierarchy of what you say — core promise, pillars, and proof points.',
    'visual-identity': 'The logo, colour, type and imagery system that makes a brand instantly recognisable.',
    'market-entry': 'Choosing where and how to launch into a new market or customer segment.',
    'channel-mix': 'Selecting and balancing the paid, owned and earned channels that reach your customers.',
    'launch-sequencing': 'Planning the order and timing of activities for a product or market launch.',
    'content-strategy': 'Deciding what to publish, for whom, and how it drives real growth.',
    'seo-and-discoverability': 'Getting found in search and AI answers by the people already looking for you.',
    'customer-research': 'Learning what customers truly need through interviews, surveys and behaviour.',
    // Financial Modelling
    'cac-and-ltv': 'Weighing what it costs to win a customer against what they’re worth over time.',
    'payback-period': 'How long a customer’s revenue takes to recover the cost of acquiring them.',
    'contribution-margin': 'What each sale earns after variable costs — the unit-level profit.',
    'revenue-forecasting': 'Projecting future sales from pipeline, history and grounded assumptions.',
    'burn-rate-and-runway': 'How fast you spend cash and how many months of runway it leaves you.',
    'cash-flow-management': 'Timing money in and out so the business never runs dry.',
    'tax-and-compliance': 'Meeting URA and statutory obligations cleanly, without surprises.',
    'valuation-methods': 'How a company’s worth is estimated ahead of a raise or sale.',
    'cap-table-design': 'Structuring ownership, option pools and dilution across shareholders.',
    'term-sheet-analysis': 'Reading and negotiating the terms an investor puts on the table.',
    // Investment Readiness
    'pitch-deck-structure': 'The slides and flow investors expect, in the order that actually lands.',
    'investor-narrative': 'The story that makes your business compelling and genuinely fundable.',
    'executive-summary': 'The one-page distillation that earns you the first meeting.',
    'investor-targeting': 'Finding the right investors by stage, sector and thesis fit.',
    'due-diligence-prep': 'Getting the business ready to withstand investor scrutiny.',
    'data-room': 'Organising the documents investors review before they commit.',
    'pre-seed-rounds': 'Raising the earliest capital on idea and first signs of traction.',
    'seed-rounds': 'Raising to prove the model and reach product-market fit.',
    'grants-and-dfis': 'Winning non-dilutive money from grants and development finance.',
    // Strategy & Team Building
    'market-analysis': 'Sizing a market and reading its trends, segments and dynamics.',
    'positioning-and-moats': 'Building durable advantages rivals can’t easily copy.',
    'scenario-planning': 'Preparing for multiple futures and the moves each one demands.',
    'hiring-strategy': 'Deciding who to hire, when, and how to attract them.',
    'culture-design': 'Shaping the values and behaviours that define how a team works.',
    'org-structure': 'Designing roles, teams and reporting lines as you scale.',
    'payroll-and-hr-compliance': 'Paying people correctly and meeting employment law.',
    'process-design': 'Turning how work gets done into repeatable, reliable systems.',
    'okrs-and-kpis': 'Setting goals and the metrics that track progress toward them.',
    'decision-frameworks': 'Structured ways to make faster, clearer decisions under uncertainty.',
    'legal-and-registration': 'Incorporating and meeting the legal basics of running a company.',
    // Product Dev & Pricing
    'problem-validation': 'Confirming the problem is real and worth solving before you build.',
    'solution-testing': 'Checking your solution actually solves it, with real users.',
    'pmf-signals': 'Reading the signals that show you’ve reached product-market fit.',
    'mvp-design': 'Scoping the smallest product that delivers value and teaches you most.',
    'roadmapping': 'Sequencing what to build, and when, against clear priorities.',
    'iteration-cycles': 'Building, measuring and learning in tight, repeating loops.',
    'payments-and-mobile-money': 'Integrating MTN, Airtel and other payment rails founders rely on.',
    'value-based-pricing': 'Pricing to the value customers receive, not just your costs.',
    'competitive-pricing': 'Setting price against what the market and rivals charge.',
    'price-testing': 'Experimenting to find the price that maximises uptake and margin.',
  };

  // Flat index of every L3 specialty with its parents — the bookable catalogue.
  var SPECIALTIES = [];
  DISCIPLINES.forEach(function (d) {
    d.l2.forEach(function (m) {
      m.l3.forEach(function (name) {
        SPECIALTIES.push({
          slug: slugify(name),
          name: name,
          desc: DESC[slugify(name)] || '',
          l2: m.name,
          disciplineKey: d.key,
          disciplineLabel: d.label,
          coach: d.coach,
          color: d.color,
        });
      });
    });
  });

  var BY_SLUG = {};
  SPECIALTIES.forEach(function (s) { BY_SLUG[s.slug] = s; });

  root.FS_TAXONOMY = {
    disciplines: DISCIPLINES,
    specialties: SPECIALTIES,        // ~49 L3 leaves — the bookable units
    bySlug: BY_SLUG,
    slugify: slugify,
    get: function (slug) { return BY_SLUG[slug] || null; },
    descriptions: DESC,
    describe: function (slug) { return DESC[slug] || (BY_SLUG[slug] && BY_SLUG[slug].desc) || ''; },
    count: SPECIALTIES.length,
  };
})(window);
