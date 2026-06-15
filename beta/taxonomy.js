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

  // Flat index of every L3 specialty with its parents — the bookable catalogue.
  var SPECIALTIES = [];
  DISCIPLINES.forEach(function (d) {
    d.l2.forEach(function (m) {
      m.l3.forEach(function (name) {
        SPECIALTIES.push({
          slug: slugify(name),
          name: name,
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
    count: SPECIALTIES.length,
  };
})(window);
