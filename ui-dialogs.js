/* =========================================================================
   The Founder's Sprint — branded dialogs (fsConfirm / fsPrompt / fsAlert)
   Replaces the unbranded native window.confirm / prompt / alert across the
   role dashboards. Self-contained: injects its own scoped CSS and themes
   itself from the host page's brand CSS variables (with safe fallbacks), so
   it looks correct on the dark Command Centre, the ops dashboard, and the
   lighter coach / founder portals alike.

   API (all return Promises):
     await fsConfirm(message, { title, okText, cancelText, danger })  -> bool
     await fsPrompt (message, { title, okText, defaultValue, placeholder, required }) -> string | null
     await fsAlert  (message, { title, okText })                      -> void

   Keyboard: Enter = confirm/submit, Esc = cancel. Click the backdrop = cancel.
   ========================================================================= */
(function () {
  if (window.fsConfirm) return; // idempotent

  var injected = false;
  function injectCSS() {
    if (injected) return; injected = true;
    var css = '\
.fsd-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;\
background:rgba(18,16,12,0.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .18s ease;}\
.fsd-overlay.fsd-in{opacity:1;}\
.fsd-card{width:min(440px,94vw);background:var(--card,var(--bg,#F6F0E3));color:var(--ink,#1A1A1A);\
border:1px solid rgba(26,26,26,0.10);border-top:3px solid var(--terra,#C8531F);border-radius:0 0 24px 0;overflow:hidden;\
box-shadow:0 30px 70px -24px rgba(0,0,0,0.55);transform:translateY(8px) scale(.985);transition:transform .2s cubic-bezier(.25,.46,.45,.94);}\
.fsd-overlay.fsd-in .fsd-card{transform:translateY(0) scale(1);}\
.fsd-body{padding:26px 26px 20px;}\
.fsd-eyebrow{font-family:var(--sans,"Josefin Sans",sans-serif);font-size:9px;font-weight:700;letter-spacing:.22em;\
text-transform:uppercase;color:var(--terra,#C8531F);margin:0 0 10px;}\
.fsd-msg{font-family:var(--font,"Inter",system-ui,sans-serif);font-size:14px;line-height:1.55;color:var(--ink,#1A1A1A);\
margin:0;white-space:pre-line;}\
.fsd-input{width:100%;box-sizing:border-box;margin-top:16px;padding:11px 13px;font-size:14px;\
font-family:var(--font,"Inter",system-ui,sans-serif);color:var(--ink,#1A1A1A);background:rgba(255,255,255,0.55);\
border:1px solid rgba(26,26,26,0.22);border-radius:0;outline:none;transition:border-color .15s;}\
.fsd-input:focus{border-color:var(--terra,#C8531F);}\
.fsd-actions{display:flex;justify-content:flex-end;gap:10px;padding:16px 26px 22px;}\
.fsd-btn{font-family:var(--sans,"Josefin Sans",sans-serif);font-size:11px;font-weight:700;letter-spacing:.16em;\
text-transform:uppercase;padding:12px 22px;border-radius:0;cursor:pointer;border:1px solid transparent;transition:opacity .15s,border-color .15s,color .15s,transform .12s;}\
.fsd-btn:active{transform:scale(.985);}\
.fsd-card .fsd-btn-cancel{background:none;color:var(--ink,#1A1A1A);border-color:rgba(26,26,26,0.28);}\
.fsd-card .fsd-btn-cancel:hover{border-color:var(--ink,#1A1A1A);background:rgba(26,26,26,0.05);}\
.fsd-card .fsd-btn-ok{background:var(--terra-deep,#9A3E16);color:#EFE7D8;}\
.fsd-card .fsd-btn-ok:hover{opacity:.9;}\
.fsd-card .fsd-btn-danger{background:#1A1A1A;color:#EFE7D8;}\
.fsd-card .fsd-btn-danger:hover{opacity:.9;}\
@media (prefers-reduced-motion: reduce){.fsd-overlay,.fsd-card,.fsd-btn{transition:none;}}';
    var s = document.createElement('style');
    s.setAttribute('data-fsd', '1');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // kind: 'confirm' | 'prompt' | 'alert'
  function open(kind, message, opts) {
    injectCSS();
    opts = opts || {};
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var overlay = document.createElement('div');
      overlay.className = 'fsd-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      var defTitle = kind === 'alert' ? 'Notice' : (kind === 'prompt' ? 'Input needed' : 'Please confirm');
      var title = opts.title != null ? opts.title : defTitle;
      var okText = opts.okText || (kind === 'confirm' ? 'Confirm' : 'OK');
      var cancelText = opts.cancelText || 'Cancel';
      var okClass = opts.danger ? 'fsd-btn-danger' : 'fsd-btn-ok';

      // Inline colours so no host stylesheet (or preview sandbox) can strip the
      // fill — affirmative = terra-deep + paper, destructive = ink + paper.
      var okStyle = opts.danger
        ? 'background:#1A1A1A;color:#EFE7D8;border-color:#1A1A1A'
        : 'background:var(--terra-deep,#9A3E16);color:#EFE7D8;border-color:var(--terra-deep,#9A3E16)';
      var cancelStyle = 'background:transparent;color:var(--ink,#1A1A1A);border-color:rgba(26,26,26,0.28)';

      var inputHTML = '';
      if (kind === 'prompt') {
        inputHTML = '<input class="fsd-input" type="text" value="' + esc(opts.defaultValue || '') +
          '" placeholder="' + esc(opts.placeholder || '') + '">';
      }
      var actionsHTML = '<button type="button" class="fsd-btn fsd-btn-cancel" style="' + cancelStyle + '">' + esc(cancelText) + '</button>' +
        '<button type="button" class="fsd-btn ' + okClass + '" style="' + okStyle + '">' + esc(okText) + '</button>';
      if (kind === 'alert') {
        actionsHTML = '<button type="button" class="fsd-btn ' + okClass + '" style="' + okStyle + '">' + esc(okText) + '</button>';
      }

      overlay.innerHTML =
        '<div class="fsd-card">' +
          '<div class="fsd-body">' +
            (title ? '<p class="fsd-eyebrow">' + esc(title) + '</p>' : '') +
            '<p class="fsd-msg">' + esc(message) + '</p>' +
            inputHTML +
          '</div>' +
          '<div class="fsd-actions">' + actionsHTML + '</div>' +
        '</div>';

      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('fsd-in'); });

      var input = overlay.querySelector('.fsd-input');
      var okBtn = overlay.querySelector('.' + okClass);
      var cancelBtn = overlay.querySelector('.fsd-btn-cancel');

      var done = false;
      function close(result) {
        if (done) return; done = true;
        document.removeEventListener('keydown', onKey, true);
        overlay.classList.remove('fsd-in');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          try { if (prev && prev.focus) prev.focus(); } catch (e) {}
          resolve(result);
        }, 160);
      }

      function accept() {
        if (kind === 'prompt') {
          var v = input ? input.value : '';
          if (opts.required && !v.trim()) { if (input) input.focus(); return; }
          close(v);
        } else if (kind === 'alert') {
          close(undefined);
        } else {
          close(true);
        }
      }
      function cancel() {
        if (kind === 'prompt') close(null);
        else if (kind === 'alert') close(undefined);
        else close(false);
      }

      okBtn.addEventListener('click', accept);
      if (cancelBtn) cancelBtn.addEventListener('click', cancel);
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) cancel(); });

      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        else if (e.key === 'Enter') {
          // In prompt, Enter from the input submits; elsewhere Enter = OK.
          if (kind !== 'prompt' || document.activeElement === input || document.activeElement === okBtn) {
            e.preventDefault(); accept();
          }
        }
      }
      document.addEventListener('keydown', onKey, true);

      setTimeout(function () { (input || okBtn).focus(); if (input) input.select(); }, 30);
    });
  }

  window.fsConfirm = function (message, opts) { return open('confirm', message, opts); };
  window.fsPrompt = function (message, opts) { return open('prompt', message, opts); };
  window.fsAlert = function (message, opts) { return open('alert', message, opts); };
})();
