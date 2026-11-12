/* Maddie Journey v2.5 — optional, low-amplitude Anime.js v4 transitions.
 * Never depend on the library for visibility, navigation, rendering or data.
 * The dashboard remains fully functional if the CDN is blocked.
 */
(function(root,doc){
  'use strict';
  let previousScreen='';
  let dialogWasOpen=false;
  let menuWasOpen=false;
  function reduceMotion(){
    return typeof root.matchMedia==='function' &&
      root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function animateSafely(target,options){
    if(!target||!root.anime||typeof root.anime.animate!=='function')return;
    try{root.anime.animate(target,options);}catch(err){
      // Motion is decorative; never interrupt monitoring or dialogs.
    }
  }
  function refresh(screen){
    const page=screen||'overview';
    if(!doc||typeof doc.querySelector!=='function')return;
    const dialog=doc.querySelector('[role="dialog"]');
    const drawer=doc.querySelector('.layout.menu-open .workspace-sidebar');
    const menuIsOpen=!!drawer;
    if(reduceMotion()||doc.visibilityState==='hidden'){
      previousScreen=page;
      dialogWasOpen=!!dialog;
      menuWasOpen=menuIsOpen;
      return;
    }
    if(page!==previousScreen&&typeof doc.querySelectorAll==='function'){
      const targets=page==='welcome'?
        doc.querySelectorAll('.landing-header,.landing-hero-inner'):
        doc.querySelectorAll('.page-header,.overview-summary-grid,.overview-monitor-grid,.overview-spotlight,.screen-summary');
      Array.from(targets).slice(0,4).forEach(function(el,index){
        animateSafely(el,{opacity:{from:.9,to:1},y:{from:6,to:0},
          duration:240,delay:index*30,ease:'out(3)'});
      });
    }
    if(dialog&&!dialogWasOpen){
      animateSafely(dialog,{opacity:{from:.92,to:1},y:{from:6,to:0},
        duration:190,ease:'out(3)'});
    }
    if(menuIsOpen&&!menuWasOpen){
      animateSafely(drawer,{opacity:{from:.96,to:1},x:{from:-12,to:0},
        duration:210,ease:'out(3)'});
    }
    previousScreen=page;
    dialogWasOpen=!!dialog;
    menuWasOpen=menuIsOpen;
  }
  root.MJ_MOTION=Object.freeze({refresh:refresh});
  function initial(){refresh(doc.querySelector('.landing-shell')?'welcome':'overview');}
  if(doc.readyState==='loading'&&typeof doc.addEventListener==='function'){
    doc.addEventListener('DOMContentLoaded',initial,{once:true});
  }else{initial();}
})(window,document);
