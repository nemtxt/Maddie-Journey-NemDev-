/* Maddie Journey v3.3 — optional Anime.js v4 micro-transitions.
 * No dependency for UI visibility, data, navigation or accessibility.
 * No list staggering. At most two screen surfaces animate.
 */
(function(root,doc){
 'use strict';
 let previousScreen='',dialogWasOpen=false,menuWasOpen=false;
 function reduceMotion(){
   return typeof root.matchMedia==='function'&&
     root.matchMedia('(prefers-reduced-motion: reduce)').matches;
 }
 function canAnimate(){
   if(!doc||doc.visibilityState==='hidden'||reduceMotion())return false;
   if(root.navigator&&root.navigator.connection&&root.navigator.connection.saveData)return false;
   return !!(root.anime&&typeof root.anime.animate==='function');
 }
 function animateSafely(el,options){
   if(!el||el.isConnected===false||!canAnimate())return;
   try{root.anime.animate(el,options);}catch(err){
     // Visual enhancement must never break functionality if Anime.js fails.
   }
 }
 function refresh(screen){
   const page=screen||'overview';
   if(!doc||typeof doc.querySelector!=='function')return;
   // Mobile navigation has dialog semantics; do not animate it as two dialogs.
   const dialog=doc.querySelector('.employee-modal[role="dialog"],.workspace-modal[role="dialog"]');
   const drawer=doc.querySelector('.layout.menu-open .workspace-sidebar');
   const menuIsOpen=!!drawer;
   if(canAnimate()){
     if(page!==previousScreen&&typeof doc.querySelectorAll==='function'){
       const selector=page==='welcome'?'.landing-header,.landing-hero-inner':'.page-header,.screen-summary';
       Array.from(doc.querySelectorAll(selector)).slice(0,2).forEach(function(el){
         animateSafely(el,{opacity:{from:.96,to:1},y:{from:3,to:0},
           duration:165,delay:0,ease:'out(3)'});
       });
     }
     if(dialog&&!dialogWasOpen)animateSafely(dialog,{
       opacity:{from:.96,to:1},y:{from:4,to:0},duration:155,delay:0,ease:'out(3)'
     });
     if(menuIsOpen&&!menuWasOpen)animateSafely(drawer,{
       opacity:{from:.97,to:1},x:{from:-6,to:0},duration:150,delay:0,ease:'out(3)'
     });
   }
   previousScreen=page;dialogWasOpen=!!dialog;menuWasOpen=menuIsOpen;
 }
 function feedback(kind){
   if(!canAnimate()||!doc||typeof doc.querySelector!=='function')return;
   const selectors={
     attention:'.work-queue .queue-count',directory:'.directory-results-count',
     journey:'.journey-distribution-total',attendance:'.attendance-audit-panel .panel-head',
     milestone:'.milestone-tabs',division:'.division-tabs'
   };
   const selector=selectors[kind];
   if(!selector)return;
   // Only a small status label settles. No row/list or chart animations.
   animateSafely(doc.querySelector(selector),{
     opacity:{from:.94,to:1},duration:110,delay:0,ease:'out(3)'
   });
 }
 root.MJ_MOTION=Object.freeze({refresh:refresh,feedback:feedback});
 function initial(){refresh(doc.querySelector('.landing-shell')?'welcome':'overview');}
 if(doc.readyState==='loading'&&typeof doc.addEventListener==='function')
   doc.addEventListener('DOMContentLoaded',initial,{once:true});
 else initial();
})(window,document);
