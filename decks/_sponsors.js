/* The Founder's Sprint — in-deck service-provider slide (platform-owned, shared across decks).
   Injects ONE branded "Recommended providers" slide just before the closing slide, matched to the
   deck's discipline. Non-destructive: it adds a slide, never edits the lesson content. Must load
   SYNCHRONOUSLY *before* the deck engine (which caches the slide list at init).
   Impressions/clicks log to provider_impressions for the directory's pay-per-introduction billing. */
(function(){
  "use strict";
  var SB   = 'https://ivedeivyotwevjxvcuoe.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';

  // discipline (from /decks/<discipline>/...) -> relevant provider categories, in priority order
  var DISC_CATS = {
    marketing:  ['design','digital'],
    investment: ['legal','banking'],
    strategy:   ['legal','unbs'],
    financial:  ['banking','legal'],
    product:    ['unbs','digital']
  };
  var CAT_LABEL = { design:'Design & branding', digital:'Digital marketing', legal:'Legal & registration',
                    unbs:'Standards & certification', banking:'Banking & finance' };
  var DIR_URL = 'https://founderssprint.co/directory.html';

  function disc(){ var m=location.pathname.match(/\/decks\/([a-z]+)\//i); return m?m[1].toLowerCase():null; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function href(p){ var w=(p.website||'').trim(); if(!w) return DIR_URL; return /^https?:\/\//.test(w)?w:'https://'+w; }

  var D = disc(); var CATS = DISC_CATS[D];
  if(!CATS || !CATS.length) return;

  // ---- 1) synchronous: inject placeholder slide before the closing slide (so the engine counts it) ----
  var closing = document.getElementById('s-close');
  if(!closing){ var all=document.querySelectorAll('section.slide'); closing = all.length?all[all.length-1]:null; }
  if(!closing || !closing.parentNode) return;
  var slide = document.createElement('section');
  slide.className = 'slide s-paper'; slide.id = 'fs-sponsor-slide';
  slide.setAttribute('data-surface','paper'); slide.setAttribute('data-title','Service providers');
  slide.innerHTML = '<div class="fs-sp-wrap" id="fs-sponsor-body"></div>';
  closing.parentNode.insertBefore(slide, closing);

  // styles (self-contained; paper surface)
  var css = ''
    + '#fs-sponsor-slide.slide{flex-direction:column;justify-content:center;align-items:stretch;padding:7vh 7vw;overflow:hidden}'
    + '#fs-sponsor-slide .fs-sp-eyebrow{font-family:"Josefin Sans",sans-serif;font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#C8531F;margin-bottom:14px}'
    + '#fs-sponsor-slide .fs-sp-h{font-family:"Cormorant Garamond","Fraunces",Georgia,serif;font-weight:500;font-size:clamp(26px,3.4vw,42px);line-height:1.08;color:#1A1A1A;margin:0 0 8px}'
    + '#fs-sponsor-slide .fs-sp-sub{font-family:"Inter",system-ui,sans-serif;font-size:clamp(13px,1.3vw,16px);color:#5A564F;margin:0 0 26px;max-width:760px}'
    + '#fs-sponsor-slide .fs-sp-groups{display:flex;gap:30px;flex-wrap:wrap}'
    + '#fs-sponsor-slide .fs-sp-cat{font-family:"Josefin Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9A3E16;margin-bottom:12px}'
    + '#fs-sponsor-slide .fs-sp-cards{display:flex;gap:14px;flex-wrap:wrap}'
    + '#fs-sponsor-slide .fs-sp-card{position:relative;display:flex;flex-direction:column;gap:5px;width:230px;background:#FBF7EE;border:1px solid rgba(26,26,26,.16);border-top:3px solid #C8531F;padding:16px 16px 14px;text-decoration:none;transition:transform .15s,box-shadow .15s}'
    + '#fs-sponsor-slide .fs-sp-card:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(26,26,26,.10)}'
    + '#fs-sponsor-slide .fs-sp-logo{width:34px;height:34px;object-fit:contain;margin-bottom:2px}'
    + '#fs-sponsor-slide .fs-sp-ini{width:34px;height:34px;border-radius:50%;background:#1A1A1A;color:#EFE7D8;display:flex;align-items:center;justify-content:center;font-family:"Cormorant Garamond",serif;font-size:17px;margin-bottom:2px}'
    + '#fs-sponsor-slide .fs-sp-name{font-family:"Josefin Sans",sans-serif;font-weight:700;font-size:15px;color:#1A1A1A}'
    + '#fs-sponsor-slide .fs-sp-tag{font-family:"Inter",sans-serif;font-size:12px;line-height:1.4;color:#5A564F}'
    + '#fs-sponsor-slide .fs-sp-badge{align-self:flex-start;font-family:"Josefin Sans",sans-serif;font-size:8.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3D7A4E;border:1px solid rgba(61,122,78,.4);padding:2px 6px;margin-top:2px}'
    + '#fs-sponsor-slide .fs-sp-badge.feat{color:#9A3E16;border-color:rgba(154,62,22,.45)}'
    + '#fs-sponsor-slide .fs-sp-go{font-family:"Josefin Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C8531F;margin-top:6px}'
    + '#fs-sponsor-slide .fs-sp-allcta{display:inline-block;margin-top:26px;font-family:"Josefin Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5A564F;text-decoration:none}'
    + '#fs-sponsor-slide .fs-sp-allcta:hover{color:#C8531F}'
    + '#fs-sponsor-slide .fs-sp-note{margin-top:18px;font-family:"Inter",sans-serif;font-size:11px;color:#A09888}'
    + '#fs-sponsor-slide .fs-sp-heroes{display:flex;flex-direction:column;gap:14px;margin-top:4px}'
    + '#fs-sponsor-slide .fs-sp-hero{display:flex;gap:24px;align-items:center;background:#1A1A1A;color:#EFE7D8;border-left:4px solid #C8531F;padding:24px 28px;text-decoration:none;transition:transform .15s}'
    + '#fs-sponsor-slide .fs-sp-hero:hover{transform:translateY(-2px)}'
    + '#fs-sponsor-slide .fs-hero-media{flex-shrink:0;width:92px;height:92px;display:flex;align-items:center;justify-content:center;background:#23252D;border:1px solid rgba(239,231,216,.12)}'
    + '#fs-sponsor-slide .fs-hero-logo{max-width:74px;max-height:74px;object-fit:contain}'
    + '#fs-sponsor-slide .fs-hero-ini{font-family:"Cormorant Garamond",serif;font-size:42px;color:#EFE7D8}'
    + '#fs-sponsor-slide .fs-hero-badge{font-family:"Josefin Sans",sans-serif;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#C9923A;display:block;margin-bottom:7px}'
    + '#fs-sponsor-slide .fs-hero-name{font-family:"Cormorant Garamond",serif;font-size:clamp(24px,2.8vw,34px);font-weight:500;line-height:1.1;display:block}'
    + '#fs-sponsor-slide .fs-hero-tag{font-family:"Inter",sans-serif;font-size:14px;color:rgba(239,231,216,.78);display:block;margin-top:7px;max-width:620px;line-height:1.45}'
    + '#fs-sponsor-slide .fs-hero-go{font-family:"Josefin Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#E2723F;display:inline-block;margin-top:13px}'
    + '#fs-sponsor-slide .fs-sp-also{margin-top:16px;font-family:"Inter",sans-serif;font-size:12.5px;color:#5A564F}'
    + '#fs-sponsor-slide .fs-sp-also a{color:#9A3E16;text-decoration:none}'
    + '@media(max-width:760px){#fs-sponsor-slide .fs-sp-card{width:100%}#fs-sponsor-slide .fs-sp-hero{flex-direction:column;align-items:flex-start;gap:14px}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // ---- 2) async: fetch matched providers (RLS returns only active, unexpired) and fill ----
  var inF = 'category=in.('+CATS.join(',')+')';
  fetch(SB+'/rest/v1/directory_providers?'+inF+'&select=id,category,company_name,description,website,logo_url,logo_dark_url,banner_tagline,tier,featured,position&order=featured.desc,position.asc&limit=12',
        { headers:{ apikey:ANON, Authorization:'Bearer '+ANON } })
    .then(function(r){ return r.ok?r.json():[]; }).catch(function(){ return []; })
    .then(function(rows){
      var list=(rows||[]).filter(function(p){ return p.tier==='verified'||p.tier==='featured'||p.tier==='corporate'; });
      fill(list);
    });

  function heroHTML(p){
    var logo=p.logo_dark_url||p.logo_url;
    var media=logo?('<img class="fs-hero-logo" src="'+esc(logo)+'" alt="">'):('<span class="fs-hero-ini">'+esc((p.company_name||'?').trim().slice(0,1))+'</span>');
    var tag=p.banner_tagline||p.description||CAT_LABEL[p.category]||'';
    return '<a class="fs-sp-hero" href="'+esc(href(p))+'" target="_blank" rel="noopener" data-pid="'+esc(p.id)+'">'
      +'<div class="fs-hero-media">'+media+'</div>'
      +'<div class="fs-hero-body"><span class="fs-hero-badge">Featured partner · '+esc(CAT_LABEL[p.category]||p.category)+'</span>'
      +'<span class="fs-hero-name">'+esc(p.company_name)+'</span>'
      +(tag?'<span class="fs-hero-tag">'+esc(String(tag).slice(0,170))+'</span>':'')
      +'<span class="fs-hero-go">Visit '+esc(p.company_name)+' →</span></div></a>';
  }
  function cardHTML(p){
    var tag=p.banner_tagline||p.description||CAT_LABEL[p.category]||'';
    var logo=p.logo_url?('<img class="fs-sp-logo" src="'+esc(p.logo_url)+'" alt="">'):('<span class="fs-sp-ini">'+esc((p.company_name||'?').trim().slice(0,1))+'</span>');
    return '<a class="fs-sp-card" href="'+esc(href(p))+'" target="_blank" rel="noopener" data-pid="'+esc(p.id)+'">'
      +logo+'<span class="fs-sp-name">'+esc(p.company_name)+'</span>'
      +(tag?'<span class="fs-sp-tag">'+esc(String(tag).slice(0,90))+'</span>':'')
      +'<span class="fs-sp-badge">Verified</span><span class="fs-sp-go">Visit →</span></a>';
  }
  var ALLCTA='<a class="fs-sp-allcta" href="'+DIR_URL+'" target="_blank" rel="noopener">See all providers in the directory →</a>'
    +'<div class="fs-sp-note">Partners pay to appear here; their presence isn’t an endorsement of any specific outcome.</div>';

  function fill(list){
    var body=document.getElementById('fs-sponsor-body'); if(!body) return;
    if(!list.length){
      body.innerHTML='<div class="fs-sp-eyebrow">Recommended partners</div>'
        +'<h2 class="fs-sp-h">Providers who can help you act on this</h2>'
        +'<a class="fs-sp-allcta" href="'+DIR_URL+'" target="_blank" rel="noopener">Browse the full provider directory →</a>';
      return;
    }
    var featured=list.filter(function(p){ return p.featured; });
    var verified=list.filter(function(p){ return !p.featured; });
    var html;
    if(featured.length){
      // Featured tier takes over the slide as a full sponsor placement; verified get an "also vetted" line.
      var heroes=featured.slice(0,2).map(heroHTML).join('');
      var also=verified.length
        ? '<div class="fs-sp-also">Also vetted for this discipline: '
          + verified.slice(0,5).map(function(p){ return '<a href="'+esc(href(p))+'" target="_blank" rel="noopener" data-pid="'+esc(p.id)+'">'+esc(p.company_name)+'</a>'; }).join(' · ')
          + '</div>'
        : '';
      html='<div class="fs-sp-eyebrow">Featured partner</div>'
        +'<h2 class="fs-sp-h">A partner who can help you act on this</h2>'
        +'<div class="fs-sp-heroes">'+heroes+'</div>'+also;
    } else {
      // Verified rail, grouped by category (preserves discipline order)
      var byCat={}; verified.forEach(function(p){ (byCat[p.category]=byCat[p.category]||[]).push(p); });
      var groups=CATS.filter(function(c){ return byCat[c]; }).map(function(cat){
        return '<div class="fs-sp-group"><div class="fs-sp-cat">'+esc(CAT_LABEL[cat]||cat)+'</div>'
          +'<div class="fs-sp-cards">'+byCat[cat].slice(0,3).map(cardHTML).join('')+'</div></div>';
      }).join('');
      html='<div class="fs-sp-eyebrow">Recommended partners</div>'
        +'<h2 class="fs-sp-h">Providers who can help you act on this</h2>'
        +'<p class="fs-sp-sub">Vetted service providers from The Founder’s Sprint directory, matched to this discipline. Verified by us — reach out directly.</p>'
        +'<div class="fs-sp-groups">'+groups+'</div>';
    }
    body.innerHTML=html+ALLCTA;
    [].slice.call(body.querySelectorAll('[data-pid]')).forEach(function(a){
      a.addEventListener('click', function(){ log([a.getAttribute('data-pid')], true); });
    });
    watchView(list.map(function(p){ return p.id; }));
  }

  var logged=false;
  function watchView(ids){
    var sl=document.getElementById('fs-sponsor-slide'); if(!sl) return;
    function check(){ if(!logged && sl.classList.contains('active')){ logged=true; log(ids,false); try{mo.disconnect();}catch(e){} } }
    var mo=new MutationObserver(check); mo.observe(sl,{attributes:true,attributeFilter:['class']}); check();
  }
  function log(ids, clicked){
    if(!ids||!ids.length) return;
    try{
      fetch(SB+'/rest/v1/provider_impressions',{ method:'POST', keepalive:true,
        headers:{ apikey:ANON, Authorization:'Bearer '+ANON, 'Content-Type':'application/json', Prefer:'return=minimal' },
        body:JSON.stringify(ids.map(function(id){ return { provider_id:id, surface:'deck', context:D, clicked:!!clicked }; })) }).catch(function(){});
    }catch(e){}
  }
})();
