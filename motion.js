/* Maddie Journey v2.4 — minimal Anime.js motion enhancement.
 * This is deliberately optional. If the CDN is unreachable, the entire
 * read-only UI remains operational and visible without JS animation.
 * Only a few containers animate on a true screen change; no loops or bounces.
 */
(function(root,doc){
  'use strict';
  let previousScreen='';
  let dialogWasOpen=false;

  function reduceMotion(){
    return typeof root.matchMedia==='function' &&
      root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function animateSafely(target,options){
    if(!target||!root.anime||typeof root.anime.animate!=='function')return;
    try { root.anime.animate(target,options); } catch(err) {
      // Browser/animation-library failures must never affect monitoring pages.
    }
  }
  function refresh(screen){
    const page=screen||'overview';
    if(!doc||typeof doc.querySelector!=='function')return;
    if(reduceMotion()||doc.visibilityState==='hidden'){
      previousScreen=page;
      dialogWasOpen=!!doc.querySelector('[role="dialog"]');
      return;
    }
    const changed=page!==previousScreen;
    if(changed&&typeof doc.querySelectorAll==='function'){
      const nodes=page==='welcome'?
        doc.querySelectorAll('.landing-header,.landing-hero-inner'):
        doc.querySelectorAll('.page-header,.overview-summary-grid,.overview-spotlight,.overview-insight-grid,.screen-summary');
      Array.from(nodes).slice(0,4).forEach(function(el,index){
        animateSafely(el,{
          opacity:{from:.84,to:1},
          y:{from:6,to:0},
          duration:230,
          delay:index*35,
          ease:'outCubic'
        });
      });
    }
    const dialog=doc.querySelector('[role="dialog"]');
    if(dialog&&!dialogWasOpen){
      animateSafely(dialog,{
        opacity:{from:.88,to:1},
        y:{from:7,to:0},
        duration:190,
        ease:'outCubic'
      });
    }
    previousScreen=page;
    dialogWasOpen=!!dialog;
  }
  root.MJ_MOTION=Object.freeze({refresh:refresh});
  function initial(){
    refresh(doc.querySelector('.landing-shell')?'welcome':'overview');
  }
  if(doc.readyState==='loading'&&typeof doc.addEventListener==='function'){
    doc.addEventListener('DOMContentLoaded',initial,{once:true});
  }else{
    initial();
  }
})(window,document);
