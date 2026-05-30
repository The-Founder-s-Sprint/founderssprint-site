/**
 * sponsors.js — Reusable programme sponsor strip
 *
 * Fetches corporate sponsors from directory_providers table and renders
 * a "Programme supported by" logo strip with taglines.
 *
 * Usage: Add <div id="sponsor-strip"></div> where you want the strip,
 * then include this script. It self-initializes on DOMContentLoaded.
 *
 * Works on any page — no Supabase client needed (raw fetch).
 */
(function() {
  'use strict';

  var SUPABASE_URL  = 'https://ivedeivyotwevjxvcuoe.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function buildItem(s) {
    var url = s.website || '#';
    if (url !== '#' && !url.match(/^https?:\/\//)) url = 'https://' + url;
    var h = '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;opacity:0.7;flex-shrink:0;padding:0 24px">';
    if (s.logo_url) {
      h += '<img src="' + esc(s.logo_url) + '" alt="' + esc(s.company_name) + '" style="height:28px;width:auto;filter:grayscale(100%)">';
    } else {
      h += '<span style="font-family:\'Josefin Sans\',sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;white-space:nowrap">' + esc(s.company_name) + '</span>';
    }
    if (s.banner_tagline) {
      h += '<span style="font-family:\'Josefin Sans\',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.08em;color:#777770;text-transform:uppercase;white-space:nowrap">' + esc(s.banner_tagline) + '</span>';
    }
    h += '</a>';
    return h;
  }

  function renderStrip(sponsors, container) {
    if (!sponsors.length) { container.style.display = 'none'; return; }

    // Inject keyframes once
    if (!document.getElementById('sponsor-scroll-css')) {
      var style = document.createElement('style');
      style.id = 'sponsor-scroll-css';
      style.textContent = '@keyframes sponsor-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}';
      document.head.appendChild(style);
    }

    var html = '<div style="padding:24px 0;overflow:hidden">';
    html += '<div style="text-align:center;font-family:\'Josefin Sans\',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#777770;margin-bottom:16px">Programme supported by</div>';

    // Build items — duplicate the set for seamless infinite scroll
    var items = '';
    sponsors.forEach(function(s) { items += buildItem(s); });

    html += '<div style="display:flex;align-items:center;animation:sponsor-scroll 20s linear infinite;width:max-content">';
    html += items + items; // doubled for seamless loop
    html += '</div>';
    html += '</div>';
    container.innerHTML = html;

    // Pause on hover
    var track = container.querySelector('[style*="animation"]');
    if (track) {
      container.addEventListener('mouseenter', function() { track.style.animationPlayState = 'paused'; });
      container.addEventListener('mouseleave', function() { track.style.animationPlayState = 'running'; });
    }
  }

  function loadSponsors() {
    var containers = document.querySelectorAll('[data-sponsors], #sponsor-strip');
    if (!containers.length) return;

    var url = SUPABASE_URL + '/rest/v1/directory_providers?select=company_name,logo_url,banner_tagline,website&tier=in.(corporate,programme_partner,strategic_partner)&status=eq.active&order=company_name';

    fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Accept': 'application/json'
      }
    })
    .then(function(res) { return res.ok ? res.json() : []; })
    .then(function(sponsors) {
      containers.forEach(function(el) { renderStrip(sponsors, el); });
    })
    .catch(function() {
      containers.forEach(function(el) { el.style.display = 'none'; });
    });
  }

  // Self-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSponsors);
  } else {
    loadSponsors();
  }
})();
