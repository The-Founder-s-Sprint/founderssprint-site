  // ── Presenter view ─────────────────────────────────────────────────────────
  // Speaker notes CANNOT live inside this page: whatever surface the coach
  // shares — tab, window or screen — goes to the founders, drawer and all. They
  // have to be in a separate surface.
  //
  // Document Picture-in-Picture is the right one. It floats above everything
  // including fullscreen, follows the coach across tabs, and is NOT captured
  // when sharing this tab. Chrome only, so the old pop-up window remains the
  // fallback — that window is what a coach on one screen experienced as the
  // notes "replacing" the deck, because a 760×860 pop-up lands on top of it.
  var pipWin = null;

  function pipAvailable(){ return !!(window.documentPictureInPicture && window.documentPictureInPicture.requestWindow); }

  function pipSync(){
    if(!pipWin || pipWin.closed) return;
    try{
      var d = pipWin.document;
      var cur = d.getElementById('cur'), nts = d.getElementById('notes'),
          nxt = d.getElementById('next'), num = d.getElementById('pnum');
      if(num) num.textContent = (i+1)+' / '+slides.length;
      if(cur) cur.textContent = slides[i].getAttribute('data-title') || ('Slide '+(i+1));
      if(nts) nts.innerHTML = notesHTML(i);
      if(nxt) nxt.innerHTML = slides[i+1]
        ? ('Next &rarr; <b>'+(slides[i+1].getAttribute('data-title')||'')+'</b>')
        : 'End of deck';
    }catch(e){}
  }

  async function openPiP(){
    if(pipWin && !pipWin.closed){ pipSync(); return true; }
    try{
      pipWin = await window.documentPictureInPicture.requestWindow({ width: 460, height: 620 });
    }catch(e){ return false; }   // user dismissed, or the API refused

    var d = pipWin.document;
    d.body.innerHTML =
      '<div class="wrap">'
      + '<div class="bar"><span class="eyebrow">Speaker notes</span><span class="pnum" id="pnum">—</span></div>'
      + '<div class="cur" id="cur">—</div>'
      + '<div class="notes" id="notes"></div>'
      + '<div class="next" id="next"></div>'
      + '<div class="nav"><button id="pv">&larr;</button><button id="nx">&rarr;</button></div>'
      + '<div class="foot">Only you can see this. It is not shared.</div>'
      + '</div>';
    var st = d.createElement('style');
    st.textContent =
      '*{box-sizing:border-box;margin:0;padding:0}'
      + 'body{background:#14120F;color:#EDE6D6;font-family:Inter,system-ui,sans-serif;height:100%}'
      + '.wrap{display:flex;flex-direction:column;height:100vh;padding:16px 18px;gap:10px}'
      + '.bar{display:flex;justify-content:space-between;align-items:baseline}'
      + '.eyebrow{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8AAB5C}'
      + '.pnum{font-size:11px;color:#8b8578}'
      + '.cur{font-family:Georgia,serif;font-style:italic;font-size:24px;line-height:1.2;color:#fff}'
      + '.notes{flex:1;overflow:auto}'
      + '.notes ul{list-style:none}'
      + '.notes li{position:relative;padding-left:20px;margin-bottom:13px;font-size:16px;line-height:1.5}'
      + '.notes li::before{content:"";position:absolute;left:0;top:8px;width:8px;height:8px;background:#8AAB5C;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}'
      + '.notes .empty{color:#8b8578;font-style:italic}'
      + '.next{font-size:12px;color:#8b8578;border-top:1px solid rgba(237,230,214,.14);padding-top:9px}'
      + '.nav{display:flex;gap:8px}'
      + '.nav button{flex:1;padding:9px;background:#221E19;color:#EDE6D6;border:1px solid rgba(237,230,214,.18);border-radius:3px;font-size:15px;cursor:pointer}'
      + '.nav button:active{background:#2e2922}'
      + '.foot{font-size:10px;color:#6f6a60;text-align:center}';
    d.head.appendChild(st);

    // Drive the deck from the panel, so the coach can stay in it.
    d.getElementById('pv').addEventListener('click', function(){ prev(); });
    d.getElementById('nx').addEventListener('click', function(){ next(); });
    d.addEventListener('keydown', function(e){
      if(e.key==='ArrowRight'||e.key===' '){ e.preventDefault(); next(); }
      else if(e.key==='ArrowLeft'){ e.preventDefault(); prev(); }
    });
    pipWin.addEventListener('pagehide', function(){ pipWin = null; });
    pipSync();
    return true;
  }

  function openWindowFallback(){
    if(presenterWin&&!presenterWin.closed){presenterWin.focus();presSync();return;}
    presenterWin=window.open('','fsPresenter','width=760,height=860');
    if(!presenterWin){alert('Please allow pop-ups for this page to open Presenter View.');return;}
    presenterWin.document.open();presenterWin.document.write(PRESENTER_DOC);presenterWin.document.close();
    setTimeout(presSync,350);
  }

  async function openPresenter(){
    if(pipAvailable()){ if(await openPiP()) return; }
    openWindowFallback();
  }
