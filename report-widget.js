/* The Founder's Sprint — "Report a problem" widget.
   Self-contained: injects its own button + modal + styles. Include anywhere:
     <script src="/report-widget.js" data-area="Founder dashboard" data-role="founder" defer></script>
   Writes to public.bug_reports. Attributes to the signed-in user when a Supabase
   session is present (RLS: bug_auth_insert), else files an anonymous report
   (RLS: bug_anon_insert). Privileged fields are locked by RLS, so this can only
   ever create a 'new', unassigned report — it is not a privileged surface.
   JS errors are captured in memory and attached ONLY if the user opens the form
   and submits — never auto-logged (that would be spammy and an abuse vector). */
(function(){
  if (window.__fsReport) return; window.__fsReport = true;
  var ME = document.currentScript || (function(){ var s=document.getElementsByTagName('script'); return s[s.length-1]; })();
  var AREA = (ME && ME.dataset && ME.dataset.area) || (window.FS_REPORT_CONTEXT && window.FS_REPORT_CONTEXT.area) || '';
  var ROLE = (ME && ME.dataset && ME.dataset.role) || (window.FS_REPORT_CONTEXT && window.FS_REPORT_CONTEXT.role) || '';
  // Reports go through the rate-limited API (5/min/IP), not browser→Supabase —
  // that path bypassed both Cloudflare and the API's limiter.
  var API_BASE = '';  // same-origin → Cloudflare /api/* proxy → api.founderssprint.co
  var STORE_KEY = 'sb-ivedeivyotwevjxvcuoe-auth-token';

  // ---- capture the most recent JS error (only used if the user reports) ----
  var lastError = '';
  function note(msg){ lastError = String(msg||'').slice(0, 1800); }
  window.addEventListener('error', function(e){
    try { note((e.message||'error') + (e.filename ? (' @ '+e.filename+':'+e.lineno+':'+e.colno) : '') + (e.error && e.error.stack ? ('\n'+e.error.stack) : '')); } catch(_){}
  });
  window.addEventListener('unhandledrejection', function(e){
    try { var r=e.reason; note('unhandledrejection: ' + ((r && (r.stack||r.message)) || r)); } catch(_){}
  });

  function session(){
    try {
      var raw = localStorage.getItem(STORE_KEY); if(!raw) return null;
      var o = JSON.parse(raw); var s = o.currentSession || o;
      if (s && s.access_token) return { token:s.access_token, uid:(s.user&&s.user.id)||null, email:(s.user&&s.user.email)||null };
    } catch(_){}
    return null;
  }

  var css = ''
    + '#fsr-btn{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:7px;'
    +   'background:#1A1A1A;color:#EFE7D8;border:1px solid rgba(239,231,216,.25);border-radius:0 0 12px 0;'
    +   'padding:8px 13px;font:600 11px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.06em;'
    +   'cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.2);opacity:.82;transition:opacity .15s;}'
    + '#fsr-btn:hover{opacity:1;}'
    + '#fsr-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(16,14,11,.55);display:none;align-items:center;justify-content:center;padding:18px;}'
    + '#fsr-ov.on{display:flex;}'
    + '#fsr-modal{background:#EFE7D8;color:#1A1A1A;max-width:440px;width:100%;border-top:3px solid #C8531F;border-radius:0 0 20px 0;'
    +   'padding:22px 22px 20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.3);max-height:92vh;overflow:auto;}'
    + '#fsr-modal h3{font-size:18px;margin:0 0 3px;font-weight:600;}'
    + '#fsr-modal .fsr-sub{font-size:12px;color:#5A564F;margin:0 0 14px;line-height:1.5;}'
    + '#fsr-modal label{display:block;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5A564F;margin:12px 0 4px;}'
    + '#fsr-modal input,#fsr-modal textarea,#fsr-modal select{width:100%;box-sizing:border-box;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.15);'
    +   'padding:10px 11px;font-size:15px;font-family:inherit;color:#1A1A1A;border-radius:0;}'
    + '#fsr-modal input:focus,#fsr-modal textarea:focus,#fsr-modal select:focus{outline:none;border-color:#C8531F;}'
    + '#fsr-modal textarea{min-height:74px;resize:vertical;}'
    + '#fsr-modal .fsr-row{display:flex;gap:14px;align-items:center;margin-top:18px;}'
    + '#fsr-send{flex:1;background:#C8531F;color:#fff;border:none;padding:12px;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;}'
    + '#fsr-send:hover{background:#9A3E16;} #fsr-send:disabled{opacity:.5;cursor:default;}'
    + '#fsr-cancel{background:none;border:none;color:#5A564F;font-size:12px;cursor:pointer;text-decoration:underline;}'
    + '#fsr-msg{font-size:12px;margin-top:10px;min-height:16px;}'
    + '#fsr-ctx{font-size:11px;color:#8a8378;margin-top:12px;line-height:1.5;}'
    + '@media print{#fsr-btn{display:none;}}'
    + '@media(max-width:700px){#fsr-btn{padding:6px 9px;font-size:10px;letter-spacing:.04em;opacity:.55;box-shadow:none;}#fsr-btn:hover,#fsr-btn:active{opacity:1;}}';

  function el(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstChild; }

  function build(){
    var style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);

    var btn=el('<button id="fsr-btn" type="button" aria-haspopup="dialog">'
      + '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
      + 'Report a problem</button>');
    document.body.appendChild(btn);

    var ov=el('<div id="fsr-ov" role="dialog" aria-modal="true" aria-label="Report a problem"></div>');
    ov.appendChild(el('<div id="fsr-modal">'
      + '<h3>Report a problem</h3>'
      + '<div class="fsr-sub">Tell us what went wrong. We automatically attach the page you’re on and any error the browser recorded — you don’t need to.</div>'
      + '<label for="fsr-summary">What happened</label>'
      + '<input id="fsr-summary" maxlength="300" placeholder="e.g. The payment button does nothing" autocomplete="off">'
      + '<label for="fsr-details">More detail (optional)</label>'
      + '<textarea id="fsr-details" maxlength="4000" placeholder="What were you trying to do? What did you expect?"></textarea>'
      + '<label for="fsr-sev">How much is it blocking you?</label>'
      + '<select id="fsr-sev"><option value="normal">Normal — annoying but I can continue</option>'
      +   '<option value="low">Minor — cosmetic or small</option>'
      +   '<option value="high">Blocking — I can’t finish what I came to do</option></select>'
      + '<label for="fsr-email">Your email (optional — so we can follow up)</label>'
      + '<input id="fsr-email" type="email" placeholder="you@email.com" autocomplete="email">'
      + '<div class="fsr-row"><button id="fsr-send" type="button">Send report</button>'
      +   '<button id="fsr-cancel" type="button">Cancel</button></div>'
      + '<div id="fsr-msg" role="status"></div>'
      + '<div id="fsr-ctx"></div>'
      + '</div>'));
    document.body.appendChild(ov);

    var $=function(id){ return document.getElementById(id); };
    function open(){
      var s=session();
      if(s && s.email && !$('fsr-email').value) $('fsr-email').value=s.email;
      $('fsr-ctx').textContent = 'Page: ' + location.pathname + (lastError ? ' · an error was captured and will be attached' : '');
      $('fsr-msg').textContent=''; ov.classList.add('on'); $('fsr-summary').focus();
    }
    function close(){ ov.classList.remove('on'); }
    btn.addEventListener('click', open);
    $('fsr-cancel').addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && ov.classList.contains('on')) close(); });

    $('fsr-send').addEventListener('click', function(){
      var summary=$('fsr-summary').value.trim();
      var msg=$('fsr-msg');
      if(summary.length<3){ msg.style.color='#9A3E16'; msg.textContent='Please describe what happened.'; $('fsr-summary').focus(); return; }
      var s=session();
      var body={ summary:summary, details:$('fsr-details').value.trim()||null, severity:$('fsr-sev').value||'normal',
        kind:'bug', page:location.href, area:AREA||null, reporter_role:ROLE||null,
        reporter_email:($('fsr-email').value.trim()||(s&&s.email)||null),
        user_agent:(navigator.userAgent||'').slice(0,500), console_error:lastError||null };
      $('fsr-send').disabled=true; msg.style.color='#5A564F'; msg.textContent='Sending…';
      post(body, s).then(function(){
        msg.style.color='#3D4A2E'; msg.textContent='Thank you — your report was sent.';
        $('fsr-summary').value=''; $('fsr-details').value='';
        setTimeout(function(){ close(); $('fsr-send').disabled=false; msg.textContent=''; }, 1400);
      }).catch(function(){
        $('fsr-send').disabled=false; msg.style.color='#9A3E16';
        msg.textContent='Could not send — please try again, or email hello@founderssprint.co.';
      });
    });
  }

  function post(body, s){
    var headers={ 'Content-Type':'application/json' };
    // Signed in? Pass the access token so the API can attribute the report to the
    // real account — it verifies the token server-side. We never claim an id
    // ourselves (a client-supplied reporter_user_id would be forgeable).
    if(s && s.token) headers.Authorization = 'Bearer ' + s.token;
    return fetch(API_BASE+'/api/bug-report', { method:'POST', headers:headers, body:JSON.stringify(body) })
      .then(function(r){ if(!r.ok) throw new Error('failed'); return r; });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
