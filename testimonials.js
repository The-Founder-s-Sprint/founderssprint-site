/* ============================================================
   The Founder's Sprint — Testimonials (shared data)
   Single source of truth for all quotes across the site.
   Both index.html and explore/explore.js read from this file.

   Schema (hybrid model):
   ─────────────────────────────────────────────────────────────
   id          string    unique slug
   name        string    display name (full or abbreviated)
   company     string    company name
   role        string    title / position
   photo       string?   path to photo (relative to beta/)
   initials    string    fallback when no photo
   text        string    the quote body
   highlight   string?   excerpt to <mark> on surfaces that support it
   cohort      string?   e.g. "Cohort 7"
   coach_id    string?   links to COACHES[].id in explore.js
   discipline  string?   "marketing"|"finance"|"investment"|"strategy"|"product"
   surfaces    string[]  where this quote may appear:
                         "homepage"  — §5 Social Proof tabbed panels
                         "coach"     — explore page coach profile rows
                         "social"    — social media / marketing emails
                         "directory" — public directory page
   weight      number    sort priority within a surface (1 = first)
   founder_id  string?   optional link to a platform founder profile (Phase 2+)
   ─────────────────────────────────────────────────────────────
   ============================================================ */

window.FS_TESTIMONIALS = [

  // ────────────────────────────────────────────────────────────
  //  TEDDY RUGE — Marketing & Branding
  // ────────────────────────────────────────────────────────────

  // Homepage featured (real testimonial with photo)
  {
    id: 'shamim-nirere',
    name: 'Shamim Nirere',
    company: 'Izere Education',
    role: 'Founder & MD',
    photo: 'endorsements/Shamim.jpg',
    initials: 'SN',
    text: "Izere Education’s go-to-market strategy, building systems, and scaling for growth has been shaped by continuous mentorship and coaching from Teddy. I have gotten valuable feedback on how to streamline our work and keep improving our solutions. Izere Education has grown into a well-run entity with proper corporate governance, systems, and continuous growth. Teddy has equally taught me how to be bold as an African entrepreneur.",
    highlight: "I have gotten valuable feedback on how to streamline our work and keep improving our solutions.",
    cohort: null,
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['homepage', 'coach', 'social'],
    weight: 1,
    founder_id: null,
  },

  // Homepage featured (real testimonial with photo)
  {
    id: 'ben-wokorach',
    name: 'Ben Wokorach',
    company: 'Wokober Education Foundation',
    role: 'Founder & Executive Director',
    photo: 'endorsements/Wokorach-Ben.jpg',
    initials: 'BW',
    text: "Since 2024, Teddy Ruge has been one of the most influential mentors in Wokober's journey. Through his guidance on branding, communications, positioning, and intellectual property, he challenged us to think beyond being a great initiative and begin building a scalable, world-class organization. What I value most is his rare mix of sharp honesty and authentic vulnerability — openly sharing both successes and struggles in entrepreneurship in a way that makes the mentorship deeply practical, human, and inspiring.",
    highlight: "He challenged us to think beyond being a great initiative and begin building a scalable, world-class organization.",
    cohort: null,
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['homepage', 'coach', 'social'],
    weight: 2,
    founder_id: null,
  },

  // Homepage featured (real testimonial with photo)
  {
    id: 'john-wasswa',
    name: 'John Viannie Wasswa',
    company: 'Cyanase',
    role: 'Founder',
    photo: 'endorsements/vianne-john.jpg',
    initials: 'JW',
    text: "Teddy's mentorship played a key role in shaping our thinking around product building. His guidance helped us turn the idea of group savings into a working feature, which remains a core part of Cyanase today.",
    highlight: "His guidance helped us turn the idea of group savings into a working feature, which remains a core part of Cyanase today.",
    cohort: null,
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['homepage', 'coach', 'social'],
    weight: 3,
    founder_id: null,
  },

  // Coach profile quotes
  {
    id: 'naima-a',
    name: 'Naima A.',
    company: 'Kibanda Foods',
    role: 'Founder',
    photo: null,
    initials: 'NA',
    text: "Teddy didn’t hand me a brand. He pulled one out of me I didn’t know was there. Six weeks in, our positioning was sharper than what we had after two years of agency work.",
    highlight: null,
    cohort: 'Cohort 7',
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['coach'],
    weight: 1,
    founder_id: null,
  },
  {
    id: 'daudi-m',
    name: 'Daudi M.',
    company: 'Polepole Logistics',
    role: 'Founder',
    photo: null,
    initials: 'DM',
    text: "The clearest thinker on African brand I’ve worked with. He made me cut three quarters of my deck — and the meetings got easier the same week.",
    highlight: null,
    cohort: 'Cohort 9',
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['coach'],
    weight: 2,
    founder_id: null,
  },
  {
    id: 'ife-o',
    name: 'Ife O.',
    company: 'Suuna Studio',
    role: 'Founder',
    photo: null,
    initials: 'IO',
    text: "I came in for a logo. I left with a category. That reframe alone justified the entire sprint.",
    highlight: null,
    cohort: 'Cohort 11',
    coach_id: 'teddy-ruge',
    discipline: 'marketing',
    surfaces: ['coach', 'social'],
    weight: 3,
    founder_id: null,
  },

  // ────────────────────────────────────────────────────────────
  //  BARRY WOJEGA — Financial Modelling
  // ────────────────────────────────────────────────────────────

  // Homepage featured
  {
    id: 'kevin-asiimwe',
    name: 'Kevin Asiimwe',
    company: 'Sawa Pay',
    role: 'Founder',
    photo: null,
    initials: 'KA',
    text: "I’d been guessing at my numbers for two years. Barry made me rebuild my financial model from first principles — every assumption tested, every projection defensible. When I walked into my next investor meeting, I didn’t just have a spreadsheet. I had conviction.",
    highlight: "every assumption tested, every projection defensible.",
    cohort: null,
    coach_id: 'barry-wojega',
    discipline: 'finance',
    surfaces: ['homepage'],
    weight: 1,
    founder_id: null,
  },

  // Coach profile quotes
  {
    id: 'hanan-k',
    name: 'Hanan K.',
    company: 'Acacia Health',
    role: 'Founder',
    photo: null,
    initials: 'HK',
    text: "Barry made the spreadsheet feel honest. The number we walked into the room with was one I could defend, line by line. We closed in 11 weeks.",
    highlight: null,
    cohort: 'Cohort 6',
    coach_id: 'barry-wojega',
    discipline: 'finance',
    surfaces: ['coach'],
    weight: 1,
    founder_id: null,
  },
  {
    id: 'geoffrey-n',
    name: 'Geoffrey N.',
    company: 'Maramoja Mobility',
    role: 'Founder',
    photo: null,
    initials: 'GN',
    text: "He killed three of my assumptions in 20 minutes and saved me a year of building on sand. Worth the entire programme.",
    highlight: null,
    cohort: 'Cohort 8',
    coach_id: 'barry-wojega',
    discipline: 'finance',
    surfaces: ['coach'],
    weight: 2,
    founder_id: null,
  },
  {
    id: 'lulu-r',
    name: 'Lulu R.',
    company: 'Solo Solar',
    role: 'Founder',
    photo: null,
    initials: 'LR',
    text: "I came in scared of finance. I left running monthly reviews myself. He teaches the mechanics, not just the answers.",
    highlight: null,
    cohort: 'Cohort 10',
    coach_id: 'barry-wojega',
    discipline: 'finance',
    surfaces: ['coach'],
    weight: 3,
    founder_id: null,
  },

  // ────────────────────────────────────────────────────────────
  //  JOSEPH KALEMA — Investment Readiness
  // ────────────────────────────────────────────────────────────

  // Homepage featured
  {
    id: 'daniel-okello',
    name: 'Daniel Okello',
    company: 'FarmBeat',
    role: 'Founder',
    photo: null,
    initials: 'DO',
    text: "Joseph told me to throw out my pitch deck on day one. He was right. What we rebuilt was leaner, sharper, and got us in front of three investors I’d been chasing for months — without a single warm intro.",
    highlight: "He was right.",
    cohort: null,
    coach_id: 'joseph-kalema',
    discipline: 'investment',
    surfaces: ['homepage'],
    weight: 1,
    founder_id: null,
  },

  // Coach profile quotes
  {
    id: 'aminah-s',
    name: 'Aminah S.',
    company: 'Nuru Pay',
    role: 'Founder',
    photo: null,
    initials: 'AS',
    text: "Joseph rebuilt my deck in three sessions. I went from ‘pass’ to a term sheet in the same quarter, with two competing offers.",
    highlight: null,
    cohort: 'Cohort 5',
    coach_id: 'joseph-kalema',
    discipline: 'investment',
    surfaces: ['coach'],
    weight: 1,
    founder_id: null,
  },
  {
    id: 'tendai-g',
    name: 'Tendai G.',
    company: 'Vumbi Foods',
    role: 'Founder',
    photo: null,
    initials: 'TG',
    text: "He doesn’t teach the pitch. He teaches the room — who’s in it, what they want, what they fear. That changed everything.",
    highlight: null,
    cohort: 'Cohort 7',
    coach_id: 'joseph-kalema',
    discipline: 'investment',
    surfaces: ['coach'],
    weight: 2,
    founder_id: null,
  },
  {
    id: 'dele-a',
    name: 'Dele A.',
    company: 'Lekki Labs',
    role: 'Founder',
    photo: null,
    initials: 'DA',
    text: "Joseph is the coach you want when the meeting is in two weeks and the deck is still wrong. He moves fast and he’s almost always right.",
    highlight: null,
    cohort: 'Cohort 12',
    coach_id: 'joseph-kalema',
    discipline: 'investment',
    surfaces: ['coach'],
    weight: 3,
    founder_id: null,
  },

  // ────────────────────────────────────────────────────────────
  //  MOSES OKUDU — Strategy & Team Building
  // ────────────────────────────────────────────────────────────

  // Homepage featured (programme-level, not coach-specific)
  {
    id: 'sarah-nakirya',
    name: 'Sarah Nakirya',
    company: 'Pulse Health',
    role: 'Co-founder',
    photo: null,
    initials: 'SN',
    text: "Five coaches. Five disciplines. I came out with more clarity than two years of accelerator alumni Slack groups. The deliverables alone are worth what I paid — but the network of founders running it with me is what made it stick.",
    highlight: "I came out with more clarity than two years of accelerator alumni Slack groups.",
    cohort: null,
    coach_id: null,
    discipline: 'programme',
    surfaces: ['homepage'],
    weight: 1,
    founder_id: null,
  },

  // Coach profile quotes
  {
    id: 'wanjiru-p',
    name: 'Wanjiru P.',
    company: 'Tula Health',
    role: 'Founder',
    photo: null,
    initials: 'WP',
    text: "Moses gave us the org chart we’d been arguing about for nine months in a single afternoon. The hires we made after that finally stuck.",
    highlight: null,
    cohort: 'Cohort 6',
    coach_id: 'moses-okudu',
    discipline: 'strategy',
    surfaces: ['coach'],
    weight: 1,
    founder_id: null,
  },
  {
    id: 'kwame-b',
    name: 'Kwame B.',
    company: 'Adwoa Renewables',
    role: 'Founder',
    photo: null,
    initials: 'KB',
    text: "Strategy that survives Monday morning. He’s the rare coach who has actually run the playbook he’s teaching.",
    highlight: null,
    cohort: 'Cohort 8',
    coach_id: 'moses-okudu',
    discipline: 'strategy',
    surfaces: ['coach'],
    weight: 2,
    founder_id: null,
  },
  {
    id: 'esi-t',
    name: 'Esi T.',
    company: 'Mawu Mobility',
    role: 'Founder',
    photo: null,
    initials: 'ET',
    text: "He told us what we needed to hear, not what we wanted. We restructured the leadership team within six weeks and our shipping velocity doubled.",
    highlight: null,
    cohort: 'Cohort 11',
    coach_id: 'moses-okudu',
    discipline: 'strategy',
    surfaces: ['coach'],
    weight: 3,
    founder_id: null,
  },

  // ────────────────────────────────────────────────────────────
  //  PATRICK NGOLOBE — Product Dev & Pricing
  // ────────────────────────────────────────────────────────────

  // Homepage featured
  {
    id: 'ruth-mugisha',
    name: 'Ruth Mugisha',
    company: 'Nuru',
    role: 'Founder',
    photo: null,
    initials: 'RM',
    text: "I’d never priced a product before — just guessed. Patrick walked me through three frameworks in one session and we re-priced by Friday. Revenue doubled in 60 days. The Sprint pays for itself before you finish it.",
    highlight: "Revenue doubled in 60 days.",
    cohort: null,
    coach_id: 'patrick-ngolobe',
    discipline: 'product',
    surfaces: ['homepage'],
    weight: 1,
    founder_id: null,
  },

  // Coach profile quotes
  {
    id: 'sade-o',
    name: 'Sade O.',
    company: 'Habari Health',
    role: 'Founder',
    photo: null,
    initials: 'SO',
    text: "Patrick caught a pricing mistake that was leaking 30% of margin. We fixed it in one session and our path to profitability moved up by a year.",
    highlight: null,
    cohort: 'Cohort 7',
    coach_id: 'patrick-ngolobe',
    discipline: 'product',
    surfaces: ['coach'],
    weight: 1,
    founder_id: null,
  },
  {
    id: 'ronald-l',
    name: 'Ronald L.',
    company: 'Boda Pay',
    role: 'Founder',
    photo: null,
    initials: 'RL',
    text: "He pushed us to ship the smallest possible version. We hated him for two weeks. Then we got our first 100 customers and changed our minds.",
    highlight: null,
    cohort: 'Cohort 9',
    coach_id: 'patrick-ngolobe',
    discipline: 'product',
    surfaces: ['coach'],
    weight: 2,
    founder_id: null,
  },
  {
    id: 'chiamaka-i',
    name: 'Chiamaka I.',
    company: 'Niyo Studio',
    role: 'Founder',
    photo: null,
    initials: 'CI',
    text: "Best PMF conversations I’ve had. He has a sixth sense for the difference between real signal and founder hope.",
    highlight: null,
    cohort: 'Cohort 11',
    coach_id: 'patrick-ngolobe',
    discipline: 'product',
    surfaces: ['coach', 'social'],
    weight: 3,
    founder_id: null,
  },

];

/* ────────────────────────────────────────────────────────────
   Helper functions — used by both homepage and explore page
   ──────────────────────────────────────────────────────────── */

window.FS_Testimonials = {

  /**
   * Get all quotes for a specific surface, optionally filtered by coach.
   * Returns sorted by weight (ascending).
   */
  getBySurface(surface, coachId) {
    return window.FS_TESTIMONIALS
      .filter(q => q.surfaces.includes(surface) && (!coachId || q.coach_id === coachId))
      .sort((a, b) => a.weight - b.weight);
  },

  /**
   * Get all quotes for a specific coach across all surfaces.
   */
  getByCoach(coachId) {
    return window.FS_TESTIMONIALS
      .filter(q => q.coach_id === coachId)
      .sort((a, b) => a.weight - b.weight);
  },

  /**
   * Get all quotes for a specific discipline.
   */
  getByDiscipline(discipline) {
    return window.FS_TESTIMONIALS
      .filter(q => q.discipline === discipline)
      .sort((a, b) => a.weight - b.weight);
  },

  /**
   * Get a single quote by id.
   */
  getById(id) {
    return window.FS_TESTIMONIALS.find(q => q.id === id) || null;
  },

  /**
   * Build an avatar element — photo <img> if available, initials <div> if not.
   * colorClass: CSS class for the initials background (e.g. 'c-terra', 'c-ochre')
   */
  renderAvatar(quote, colorClass) {
    if (quote.photo) {
      return `<img class="proof-avatar-img" src="${quote.photo}" alt="${quote.name}" loading="lazy">`;
    }
    return `<div class="proof-avatar ${colorClass || ''}">${quote.initials}</div>`;
  },
};
