/* MADDIE CENTRAL | 2027 — low-cost motion orchestration, trial only.
   No external library, network, timers for polling, or data mutation.
   Content remains visible without motion, and reduced-motion disables enhancement. */
(function(win,doc){
  'use strict';
  const root=doc.getElementById('app');
  if(!root)return;
  const reduced=()=>typeof win.matchMedia==='function'&&win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=()=>typeof win.matchMedia==='function'&&win.matchMedia('(hover: none), (pointer: coarse)').matches;
  let lastMain=null,observer=null;
  function cancelObserver(){
    if(observer&&typeof observer.disconnect==='function')observer.disconnect();
    observer=null;
  }
  function animateElement(el,frames,options){
    if(!el||typeof el.animate!=='function'||reduced())return;
    try{
      const animation=el.animate(frames,options);
      if(animation&&animation.finished&&typeof animation.finished.catch==='function')animation.finished.catch(()=>{});
    }catch(_){/* Unsupported animation properties must never block navigation. */}
  }
  function enter(){
    if(reduced()){cancelObserver();return;}
    const main=root.querySelector?.('#main-content');
    if(!main||main===lastMain)return;
    lastMain=main;
    cancelObserver();
    const primary=main.querySelectorAll?.('.mc-editorial-hero,.mc-summary-hero,.page-heading,.workspace-panel')||[];
    if(primary.length)animateElement(primary[0],
      [{opacity:.25,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],
      {duration:390,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
    const targets=Array.from(main.querySelectorAll?.(
      '.mc-metric-card,.mc-editorial-category,.mc-focus-row,.mc-profile-card,.mc-link-tile,.quick-link'
    )||[]).slice(0,18);
    const visible=[];
    for(const el of targets){
      const rect=el.getBoundingClientRect?.();
      if(!rect||rect.top<((win.innerHeight||850)+90))visible.push(el);
    }
    // Cap delays to prevent stagger fatigue on executive dashboards.
    visible.slice(0,10).forEach((el,i)=>animateElement(el,
      [{opacity:.40,transform:'translate3d(0,11px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],
      {duration:360,delay:Math.min(i*32,160),easing:'cubic-bezier(.22,1,.36,1)',fill:'none'}));
    if(typeof win.IntersectionObserver==='function'){
      const visibleSet=new WeakSet(visible);
      observer=new win.IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          observer?.unobserve(entry.target);
          if(visibleSet.has(entry.target))continue;
          animateElement(entry.target,
            [{opacity:.6,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],
            {duration:340,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
        }
      },{threshold:.12,rootMargin:'0px 0px 60px 0px'});
      targets.forEach(el=>observer.observe(el));
    }
  }
  function panel(){
    if(reduced())return;
    const current=root.querySelector?.('.mc-focus-overview #mc-metrics,.mc-focus-priorities #mc-insights,.mc-focus-updates #mc-activity,.mc-focus-explore #mc-links');
    animateElement(current,
      [{opacity:.3,transform:'translate3d(0,13px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],
      {duration:330,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
  }
  function hover(event){
    if(reduced()||coarse())return;
    const el=event.target?.closest?.('.mc-metric-card,.mc-editorial-category,.mc-profile-card');
    if(!el)return;
    const rect=el.getBoundingClientRect?.();
    if(!rect||!rect.width||!rect.height)return;
    el.style?.setProperty('--mc-pointer-x',Math.min(100,Math.max(0,100*(event.clientX-rect.left)/rect.width))+'%');
    el.style?.setProperty('--mc-pointer-y',Math.min(100,Math.max(0,100*(event.clientY-rect.top)/rect.height))+'%');
  }
  root.addEventListener?.('pointermove',hover,{passive:true});
  win.MC_MOTION={enter,panel,reduced};
  // App script runs before this module, so animate the initial content now.
  enter();
})(window,document);
