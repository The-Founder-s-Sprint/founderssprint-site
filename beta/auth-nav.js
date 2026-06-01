/**
 * auth-nav.js v2 — Sitewide auth state + mobile hamburger
 *
 * Auth: Shows profile avatar with dropdown (Dashboard, Sign out)
 * Mobile: Adds hamburger toggle for nav links at ≤1100px
 */
(function() {
  'use strict';

  var SB_URL = 'https://ivedeivyotwevjxvcuoe.supabase.co';
  var sbKey = 'sb-' + SB_URL.split('//')[1].split('.')[0] + '-auth-token';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';

  function getSession() {
    try {
      var stored = JSON.parse(localStorage.getItem(sbKey) || '{}');
      if (!stored.access_token) return null;
      if (stored.expires_at && (Date.now() / 1000) > (stored.expires_at - 60)) return null;
      return stored;
    } catch(e) { return null; }
  }

  // Fetch coach avatar from Supabase if user is a coach
  function fetchAvatar(email, cb) {
    var url = SB_URL + '/rest/v1/coaches?select=avatar_url,first_name&founderssprint_email=eq.' + encodeURIComponent(email) + '&limit=1';
    fetch(url, {
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Accept': 'application/json' }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data && data[0]) cb(data[0]); })
    .catch(function() {});
  }

  function updateNav() {
    var session = getSession();
    var ctaContainer = document.querySelector('.nav .cta, nav .cta');
    if (!ctaContainer) return;

    if (session && session.user) {
      var email = session.user.email || '';
      var initials = email.split('@')[0].charAt(0).toUpperCase();

      // Render avatar dropdown
      ctaContainer.innerHTML =
        '<div class="auth-avatar-wrap" style="position:relative">' +
          '<button class="auth-avatar-btn" onclick="this.parentElement.classList.toggle(\'open\')" style="' +
            'width:32px;height:32px;border-radius:50%;border:2px solid rgba(239,231,216,0.3);' +
            'background:#5A564F;color:#efe7d8;font-family:Inter,system-ui;font-size:12px;font-weight:600;' +
            'cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0">' +
            '<span class="auth-initials">' + initials + '</span>' +
          '</button>' +
          '<div class="auth-dropdown" style="' +
            'display:none;position:absolute;top:40px;right:0;background:#1a1a1a;border:1px solid rgba(239,231,216,0.12);' +
            'min-width:180px;z-index:999;padding:8px 0">' +
            '<div style="padding:8px 16px 10px;font-family:Inter,system-ui;font-size:11px;color:rgba(239,231,216,0.4);border-bottom:1px solid rgba(239,231,216,0.08);margin-bottom:4px">' + email + '</div>' +
            '<a href="/dashboard.html" style="display:block;padding:10px 16px;font-family:\'Josefin Sans\',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(239,231,216,0.7);text-decoration:none">Dashboard</a>' +
            '<a href="#" onclick="localStorage.removeItem(\'' + sbKey + '\');window.location.reload();return false" style="display:block;padding:10px 16px;font-family:\'Josefin Sans\',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(239,231,216,0.7);text-decoration:none">Sign out</a>' +
          '</div>' +
        '</div>';

      // Inject dropdown toggle CSS
      if (!document.getElementById('auth-nav-css')) {
        var style = document.createElement('style');
        style.id = 'auth-nav-css';
        style.textContent =
          '.auth-avatar-wrap.open .auth-dropdown{display:block!important}' +
          '.auth-dropdown a:hover{background:rgba(239,231,216,0.06)!important;color:#efe7d8!important}' +
          '.auth-avatar-btn:hover{border-color:rgba(239,231,216,0.5)!important}';
        document.head.appendChild(style);
      }

      // Close dropdown when clicking elsewhere
      document.addEventListener('click', function(e) {
        var wrap = document.querySelector('.auth-avatar-wrap');
        if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
      });

      // Try to load profile photo
      fetchAvatar(email, function(coach) {
        if (coach.avatar_url) {
          var btn = document.querySelector('.auth-avatar-btn');
          if (btn) btn.innerHTML = '<img src="' + coach.avatar_url + '" style="width:100%;height:100%;object-fit:cover">';
        }
      });
    }
  }

  // ── MOBILE HAMBURGER ──────────────────────────────────────────────────────
  function addHamburger() {
    var nav = document.querySelector('.nav, nav');
    var links = nav ? nav.querySelector('.links, .nav-links') : null;
    if (!nav || !links) return;

    // Only add if not already present
    if (nav.querySelector('.hamburger')) return;

    var btn = document.createElement('button');
    btn.className = 'hamburger';
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    btn.style.cssText = 'display:none;background:none;border:none;cursor:pointer;padding:4px;flex-direction:column;gap:5px;z-index:60';

    btn.addEventListener('click', function() {
      btn.classList.toggle('active');
      links.classList.toggle('mobile-open');
    });

    // Insert before the CTA section
    var cta = nav.querySelector('.cta');
    if (cta) nav.insertBefore(btn, cta);
    else nav.appendChild(btn);

    // Inject hamburger CSS
    if (!document.getElementById('hamburger-css')) {
      var style = document.createElement('style');
      style.id = 'hamburger-css';
      style.textContent =
        '.hamburger span{display:block;width:20px;height:2px;background:#efe7d8;transition:all 250ms}' +
        '.hamburger.active span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}' +
        '.hamburger.active span:nth-child(2){opacity:0}' +
        '.hamburger.active span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}' +
        '@media(max-width:1100px){' +
          '.hamburger{display:flex!important}' +
          '.nav .links,.nav-links{display:none!important;position:absolute;top:100%;left:0;right:0;' +
            'background:rgba(15,13,10,0.96);flex-direction:column;padding:20px 32px;gap:16px;' +
            'border-bottom:1px solid rgba(239,231,216,0.1);backdrop-filter:blur(8px)}' +
          '.nav .links.mobile-open,.nav-links.mobile-open{display:flex!important}' +
        '}';
      document.head.appendChild(style);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { updateNav(); addHamburger(); });
  } else {
    updateNav();
    addHamburger();
  }
})();
