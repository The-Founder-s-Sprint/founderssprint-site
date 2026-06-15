# Explore engine tests (do NOT upload to Bluehost — repo only)

Run before and after ANY change to keywords, nodes, scoring, or the mobile module:

    node tests/search-harness.js explore.js          # matcher: must stay ≥ 91.7% top-1 / 100% top-3 (72-query battery)
    npm i jsdom && node tests/mobile-smoke.js .      # mobile card-stack: 24 checks
    node tests/desktop-smoke.js .                    # desktop constellation + L3 deep links: 8 checks
    node tests/resize-smoke.js .                     # breakpoint crossing (frozen-hero regression): 10 checks

Baseline recorded 10 Jun 2026 (explore.js?v=16): matcher 66/72 top-1, 72/72 top-3 · 69 nodes (49 L3).
    node tests/labels-smoke.js .                     # label NaN + selected-state size variation: 3 checks
    node tests/search-persist-check.js .             # search persistence + 30s idle: 6 checks
    node tests/geo-ui-check.js .                     # geo context UI + expansion contract: 8 checks
    node tests/spotlight-check.js .                  # search spotlight (label-hide regression): 4 checks
    node tests/taxonomy-parity.js                    # explore fallback mirrors beta/taxonomy.js: structure + slug parity
    node tests/booking-l3-check.js <site-root>       # converged-from-shared taxonomy + L3 ?spec= booking links: 13 checks
