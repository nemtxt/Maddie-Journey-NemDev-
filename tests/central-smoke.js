/* Maddie Central fictional trial — dependency-free smoke tests.
   node tests/central-smoke.js
   Never import live connectors or server credentials. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
let passed=0;
function test(label,fn){fn();console.log('PASS '+label);passed++;}
const pages=['index.html','legacy.html','central/config.js','central/model.js','central/app.js','central/styles.css','central/editorial.css','central/summary.css','data.js'];
for(const file of pages)assert(fs.existsSync(path.join(root,file)),file+' missing');
const config=require('../central/config.js');
global.window={};
require('../data.js');
const seed=global.window.MJ_SEED;
const build=require('../central/model.js');
const summary=require('../central/summary.js');
const wireframe=require('../central/wireframe.js');
const model=build(seed,config);

test('Nine workspace labels match the required order exactly',()=>{
 assert.deepEqual(config.categories.map(c=>c.label),[
 'PEOPLE DIRECTORY','PAY & BENEFITS','WORKFORCE PULSE','MADDIE JOURNEY','MADDIE LEARNING HUB',
 'CULTURE & COMMUNITY','TALENT ACQUISITION','PEOPLE GOVERNANCE','EXECUTIVE SCOREBOARD']);
 assert.equal(config.title,'MADDIE CENTRAL | 2027');
});
test('All 86 subcategories are unique, navigable, and described by type',()=>{
 assert.equal(config.totalSubcategories,86);
 assert.equal(config.categories.reduce((n,c)=>n+c.subcategories.length,0),86);
 const routes=new Set();
 for(const cat of config.categories){
   assert(cat.subcategories.length>=6);
   for(const sub of cat.subcategories){
     assert(sub.id&&sub.label&&sub.kind&&sub.classification);
     const key=cat.id+'/'+sub.id;assert(!routes.has(key),'duplicate '+key);routes.add(key);
     assert(Array.isArray(model.recordsFor(cat.id,sub.id)));
   }
 }
});
test('Exactly 51 fictional identities with unique linked Employee IDs',()=>{
 assert.equal(seed.employees.length,51);
 assert.equal(model.people.length,51);
 assert.equal(model.byId.size,51);
 assert.equal(model.metrics.headcount,51);
 assert.equal(model.metrics.divisions,8);
 assert(model.people.every(p=>/^MJ-\d{3}$/.test(p.employeeId)));
 assert(model.people.every(p=>p.email.endsWith('@example.com')));
});
test('201 file rollups are computed rather than manually typed',()=>{
 const list=model.collections.docs;
 assert.equal(list.length,51*seed.documents201.length);
 assert.equal(model.metrics.missing201,list.filter(x=>x.status==='Requested').length);
 assert.equal(model.metrics.notChecked201,list.filter(x=>x.status==='Not Started').length);
 assert.equal(model.metrics.verified201,list.filter(x=>x.status==='Approved/Verified').length);
 assert(list.every(x=>model.byId.has(x.employeeId)));
 const employment=model.recordsFor('people-directory','employment-documents');
 assert(employment.every(x=>x.documentGroup==='Employment'||x.documentGroup==='Contracts'));
});
test('Attendance excludes unverified seed entries',()=>{
 const count=model.people.flatMap(p=>p.source.attendance).filter(a=>a.verified).length;
 assert.equal(model.collections.attendance.length,count);
 assert(model.collections.attendance.every(r=>config.options.attendanceStatus.includes(r.status)));
});
test('Restricted case records are de-identified in the demo model',()=>{
 assert(model.collections.governance.length>0);
 assert(model.collections.governance.every(r=>!r.employeeId&&r.confidentiality==='Highly Restricted'));
 assert(!model.collections.governance.some(r=>/medical|disciplinary allegations/i.test(r.detail)));
});
test('Controlled dropdown option sets use one central source',()=>{
 for(const key of ['employmentStatus','documentStatus','attendanceStatus','recruitmentStatus','journeyStatus',
 'trainingStatus','eventStatus','caseStatus','priority','executiveStatus']){
   assert(Array.isArray(config.options[key])&&config.options[key].length>1);
   assert.equal(new Set(config.options[key]).size,config.options[key].length);
 }
 assert(config.options.documentStatus.includes('Returned for Correction'));
 assert(config.options.caseStatus.includes('For Authorized Decision'));
});
test('Entry point has no backend connector scripts and legacy monitor remains intact',()=>{
 const html=read('index.html'),legacy=read('legacy.html');
 assert(html.includes('central/config.js')&&html.includes('central/model.js')&&html.includes('central/app.js'));
 assert(html.includes('data.js'));
 assert(!html.includes('data-adapter.js')&&!html.includes('server/')&&!html.includes('claude'));
 assert(legacy.includes('app.js')&&legacy.includes('data-adapter.js'));
});
test('UI assets parse and preserve small-screen/reduced-motion support',()=>{
 for(const file of ['central/config.js','central/model.js','central/app.js'])assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
 const css=read('central/styles.css');
 assert(css.includes('@media(max-width:600px)')&&css.includes('@media(max-width:360px)'));
 assert(css.includes('prefers-reduced-motion:reduce'));
 assert(css.includes(':focus-visible'));
});
function boot(hash,opts={}){
 const handlers={},store={},listeners={},classes=new Set();
 const toggle={attributes:{},innerHTML:'',setAttribute(k,v){this.attributes[k]=v},focus(){this.focused=true}};
 const mount={
  innerHTML:'',classList:{
   remove(name){classes.delete(name)},
   toggle(name,force){
    const val=force===undefined?!classes.has(name):Boolean(force);
    if(val)classes.add(name);else classes.delete(name);
    return val;
   },
   contains(name){return classes.has(name)}
  },querySelector(selector){return selector==='.desktop-collapse'?toggle:null;},
  addEventListener(type,fn){
    const previous=handlers[type];
    handlers[type]=previous?(event=>{previous(event);fn(event);}):fn;
  }
 };
 const document={
  documentElement:{dataset:{}},title:'',
  getElementById(id){return id==='app'?mount:null},
  addEventListener(type,fn){listeners[type]=fn},
 };
 const loc={hash:hash||'#/home'};
 const window={
  MC_CONFIG:config,MC_DATA:model,MC_SUMMARY:summary,MC_WIREFRAME:wireframe,
  matchMedia(query){return {matches:Boolean(opts.mobile)&&/max-width:\s*900px/.test(query)}},
  addEventListener(type,fn){listeners[type]=fn}
 };
 const ctx={window,document,location:loc,
  localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},
  Blob:class{},URL:{createObjectURL(){return 'blob:demo';},revokeObjectURL(){}},
  setTimeout(){},console};
 vm.createContext(ctx);
 vm.runInContext(read('central/app.js'),ctx,{filename:'central/app.js'});
 return {window,document,loc,mount,handlers,listeners,store,classes,toggle};
}
test('Dashboard renders 9 category links and synthetic summary',()=>{
 const ctx=boot('#/home');
 const html=ctx.mount.innerHTML;
 for(const cat of config.categories)assert(html.includes(cat.label.replace(/&/g,'&amp;')));
 assert(html.includes('51 fictional employees'));
 assert(html.includes('No connected systems'));
});
test('Each category renders its required accordion link titles',()=>{
 const ctx=boot('#/home');
 for(const cat of config.categories){
  ctx.loc.hash='#/category/'+cat.id;
  ctx.window.MC_APP.render();
  const html=ctx.mount.innerHTML;
  for(const sub of cat.subcategories)assert(html.includes(sub.label.replace(/&/g,'&amp;')),cat.id+'/'+sub.id);
  assert(html.includes('<details class="accordion">'));
 }
});
test('Unprivileged role preview hides salary and governance content',()=>{
 const ctx=boot('#/category/pay-benefits/salary-masterlist');
 assert(ctx.mount.innerHTML.includes('Restricted preview'));
 assert(!ctx.mount.innerHTML.includes('PHP 25,000'));
 ctx.loc.hash='#/category/people-governance/case-status';
 ctx.window.MC_APP.render();
 assert(ctx.mount.innerHTML.includes('Restricted preview'));
});
test('Authorized simulated Finance role can inspect only fictional salary records',()=>{
 const ctx=boot('#/category/pay-benefits/salary-masterlist');
 ctx.handlers.change({target:{id:'role-select',value:'Finance'}});
 assert.equal(ctx.window.MC_APP.getRole(),'Finance');
 assert(ctx.mount.innerHTML.includes('PHP'));
 assert(ctx.mount.innerHTML.includes('51 records'));
 assert(!ctx.mount.innerHTML.includes('real payroll integration'));
});
test('Normal views support search and sorted linked tables',()=>{
 const ctx=boot('#/category/people-directory/employee-masterlist');
 assert(ctx.mount.innerHTML.includes('51 records'));
 assert(ctx.mount.innerHTML.includes('MJ-001'));
 const filter=ctx.window.MC_APP.getFilter();
 assert.equal(filter.status,'all');
 assert.equal(ctx.window.MC_APP.filteredRows(config.categories[0],config.categories[0].subcategories[0]).length,51);
});

test('All nine categories have distinct 4-8 source-derived KPI summary cards',()=>{
 const titles=new Set();
 for(const cat of config.categories){
   const result=summary.create(model,cat.id);
   assert.equal(result.title,cat.label);
   assert.equal(result.subtitle,cat.subtitle);
   assert.equal(result.asOf,model.updatedAt);
   assert.equal(result.fictional,true);
   assert(result.metrics.length>=4&&result.metrics.length<=8);
   assert(result.metrics.every(m=>m.label&&m.icon&&m.tone&&m.value!==undefined&&m.detail));
   assert(result.highlights.length>=2);
   assert(result.activity.length>=1);
   assert(result.risks.length>=1);
   assert(result.distribution.length>=2);
   assert(!titles.has(result.title));titles.add(result.title);
   for(const item of [...result.highlights,...result.activity,...result.risks]){
     if(item.to)assert(cat.subcategories.some(s=>s.id===item.to.subcategory));
   }
 }
 assert.equal(titles.size,9);
});
test('Summary rollups reconcile to fictional records instead of manually entered totals',()=>{
 const p=summary.create(model,'people-directory');
 const metricByLabel=(result,label)=>result.metrics.find(m=>m.label===label).value;
 assert.equal(metricByLabel(p,'Fictional employees'),51);
 assert.equal(metricByLabel(p,'201 file checkpoints'),model.collections.docs.length);
 assert.equal(metricByLabel(p,'Files requested'),model.collections.docs.filter(d=>d.status==='Requested').length);
 const a=summary.create(model,'workforce-pulse');
 assert.equal(metricByLabel(a,'Verified demo logs'),model.collections.attendance.length);
 assert.equal(metricByLabel(a,'Present today'),'Not tracked');
 const j=summary.create(model,'maddie-journey');
 assert.equal(metricByLabel(j,'Journey profiles'),51);
 const l=summary.create(model,'maddie-learning-hub');
 assert.equal(metricByLabel(l,'Training programs'),model.collections.training.length);
 const e=summary.create(model,'executive-scoreboard');
 assert.equal(metricByLabel(e,'Decisions required'),model.collections.decisions.filter(x=>x.status==='Decision Required').length);
});
test('Local fictional status edits recalculate dependent summary figures',()=>{
 const doc=model.collections.docs.find(d=>d.status==='Requested');
 assert(doc);
 const baseline=summary.create(model,'people-directory');
 const revised=summary.create(model,'people-directory',{[doc.recordId]:'Approved/Verified'});
 const get=(s,label)=>s.metrics.find(m=>m.label===label).value;
 assert.equal(get(revised,'Files requested'),get(baseline,'Files requested')-1);
 assert.equal(get(revised,'Verified checkpoints'),get(baseline,'Verified checkpoints')+1);
 assert.equal(doc.status,'Requested','source model was not mutated');
});
test('Sensitive category summaries expose aggregates only and no named case/pay entries',()=>{
 for(const id of ['pay-benefits','people-governance']){
   const text=JSON.stringify(summary.create(model,id));
   assert(!text.includes('PHP 25,000'));
   assert(!text.includes('"salary":')); // Navigation slugs may mention salary; no salary data appears.
   assert(!text.includes('MJ-001'));
   assert(!text.includes('employee01@example.com'));
   assert(!text.includes('Avery Santos'));
 }
 const gov=summary.create(model,'people-governance');
 assert(gov.activity.every(x=>!x.title.includes('Case Documentation')));
});
test('Nine category routes render a unique summary dashboard plus the preserved directory',()=>{
 const ctx=boot('#/home');
 for(const cat of config.categories){
   ctx.loc.hash='#/category/'+cat.id;
   ctx.window.MC_APP.render();
   const html=ctx.mount.innerHTML;
   assert(html.includes('id="mc-summary-title"'),cat.id);
   assert(html.includes('id="mc-metrics"'),cat.id);
   assert(html.includes('id="mc-insights"'),cat.id);
   assert(html.includes('id="mc-activity"'),cat.id);
   assert(html.includes('id="subcategory-directory"'),cat.id);
   assert(html.includes('mc-metric-card'),cat.id);
   assert(html.includes('mc-white-chip'),cat.id);
   assert(html.includes('Fictional sample data only'),cat.id);
   assert(html.includes('<details class="accordion">'),cat.id);
   for(const sub of cat.subcategories){
     assert(html.includes('#/category/'+cat.id+'/'+sub.id),'missing direct link '+cat.id+'/'+sub.id);
   }
 }
});
test('Summary stylesheet enforces white chips in both themes and accessible viewports',()=>{
 const html=read('index.html'),css=read('central/summary.css');
 assert(html.includes('central/summary.js'));
 assert(html.includes('central/summary.css'));
 assert(html.indexOf('central/summary.js')>html.indexOf('central/model.js'));
 assert(html.indexOf('central/summary.js')<html.indexOf('central/app.js'));
 assert(css.includes('--mc-white:#fff'));
 assert(css.includes('background:var(--mc-white)!important'));
 assert(css.includes('color:var(--mc-ink)!important'));
 assert(css.includes('@media (max-width:380px)'));
 assert(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert(css.includes('@media(forced-colors:active)'));
 assert(css.includes(':focus-visible')||read('central/styles.css').includes(':focus-visible'));
});
test('Category summaries use no external services and leave legacy monitor loaded separately',()=>{
 const summaryCode=read('central/summary.js'),index=read('index.html');
 assert(!/fetch\s*\(|XMLHttpRequest|supabase|gmail|airtable|claude/i.test(summaryCode));
 assert(!index.includes('data-adapter.js'));
 assert(read('legacy.html').includes('data-adapter.js'));
 assert.doesNotThrow(()=>new vm.Script(read('central/summary.js')));
});


test('Editorial home uses functional note-style links, vivid sample cards and three fictional identities',()=>{
 const ctx=boot('#/home'),html=ctx.mount.innerHTML;
 assert(html.includes('mc-editorial-hero'));
 assert(html.includes('mc-home-card-stack'));
 assert(html.includes('mc-stack-coral')&&html.includes('mc-stack-yellow')&&html.includes('mc-stack-blue'));
 assert(html.includes('mc-profile-grid'));
 assert.equal((html.match(/class="mc-profile-card /g)||[]).length,3);
 for(const p of model.people.slice(0,3))assert(html.includes(p.name),'missing fictional '+p.name);
 assert(html.includes('Monogram artwork is illustrative'));
 assert(html.includes('#/category/people-directory'));
 assert(html.includes('#/category/executive-scoreboard'));
 assert(!html.includes('<img '),'No headshot image references: simulated identities are CSS monograms');
});
test('Desktop sidebar toggles between full and icon-only rail and saves preference locally',()=>{
 const ctx=boot('#/home');
 assert.equal(ctx.window.MC_APP.isSidebarCollapsed(),false);
 assert(ctx.mount.innerHTML.includes('data-action="collapse"'));
 assert(ctx.mount.innerHTML.includes('aria-controls="side-menu"'));
 const trigger=action=>ctx.handlers.click({target:{closest(s){return s==='[data-action]'?{dataset:{action}}:null;}}});
 trigger('collapse');
 assert.equal(ctx.window.MC_APP.isSidebarCollapsed(),true);
 assert.equal(ctx.store['mc-trial-sidebar-collapsed'],'true');
 assert(ctx.classes.has('sidebar-collapsed'));
 assert.equal(ctx.toggle.attributes['aria-label'],'Expand sidebar');
 trigger('collapse');
 assert.equal(ctx.window.MC_APP.isSidebarCollapsed(),false);
 assert.equal(ctx.toggle.attributes['aria-label'],'Collapse sidebar');
 assert.equal(ctx.store['mc-trial-sidebar-collapsed'],'false');
});
test('Mobile navigation opens and closes independently of saved desktop rail preference',()=>{
 const ctx=boot('#/home',{mobile:true});
 const trigger=action=>ctx.handlers.click({target:{closest(s){return s==='[data-action]'?{dataset:{action}}:null;}}});
 assert.equal(ctx.window.MC_APP.isMobileNavOpen(),false);
 trigger('menu');
 assert.equal(ctx.window.MC_APP.isMobileNavOpen(),true);
 assert(ctx.classes.has('navigation-open'));
 trigger('menu');
 assert.equal(ctx.window.MC_APP.isMobileNavOpen(),false);
 assert(!ctx.classes.has('navigation-open'));
 trigger('collapse'); // hidden desktop control must never change state on mobile
 assert.equal(ctx.window.MC_APP.isSidebarCollapsed(),false);
 trigger('menu');
 ctx.listeners.keydown({key:'Escape'});
 assert.equal(ctx.window.MC_APP.isMobileNavOpen(),false);
});
test('Every navigation item keeps accessible labels when collapsed and old routes are preserved',()=>{
 const ctx=boot('#/home');
 const html=ctx.mount.innerHTML;
 assert(html.includes('aria-label="Dashboard"'));
 for(const cat of config.categories){
   assert(html.includes('title="'+cat.label.replace(/&/g,'&amp;')+'"'));
   assert(html.includes('href="#/category/'+cat.id+'"'));
 }
 for(const cat of config.categories){
   ctx.loc.hash='#/category/'+cat.id;
   ctx.window.MC_APP.render();
   assert(ctx.mount.innerHTML.includes('mc-editorial-summary'));
   assert(ctx.mount.innerHTML.includes('mc-workspace-'+cat.id));
 }
 const deep=boot('#/category/people-directory/employee-masterlist');
 assert(deep.mount.innerHTML.includes('51 records'));
});
test('Visual system keeps white chips and adapts at mobile, tablet, desktop and reduced motion',()=>{
 const index=read('index.html'),styles=read('central/editorial.css');
 assert(index.includes('central/editorial.css'));
 assert(index.indexOf('central/editorial.css')>index.indexOf('central/summary.css'));
 for(const expr of ['.sidebar-collapsed .shell','grid-template-columns:78px minmax(0,1fr)',
  '.mc-editorial-hero','.mc-profile-grid','.mc-home-card-stack','@media(max-width:900px)',
  '@media(max-width:700px)','@media(max-width:440px)','@media(prefers-reduced-motion:reduce)',
  '@media(forced-colors:active)']) assert(styles.includes(expr),expr);
 assert(styles.includes('background:#fff!important'));
 assert(styles.includes('color:#15151b!important'));
 const app=read('central/app.js');
 assert(app.includes("save('sidebar-collapsed',String(sidebarCollapsed))"));
 assert(app.includes('aside.inert=isMobile()&&!mobileNavOpen'));
 assert(app.includes("if(e.key==='Escape'&&mobileNavOpen)"));
 assert(app.includes("if(e.key!=='Tab'||!mobileNavOpen||!isMobile())return"));
});
test('Editorial layer contains no live data integrations or third-party photo URLs',()=>{
 const source=read('central/editorial.css')+read('central/app.js');
 assert(!/https?:\/\/[^'"\s]*\.(jpg|jpeg|png|webp)/i.test(source));
 assert(!/api\.airtable\.com|supabase\.co|sheets\.googleapis\.com|gmail\.googleapis\.com/i.test(source));
 assert(!read('index.html').includes('data-adapter.js'));
 assert(read('legacy.html').includes('data-adapter.js'));
});


test('Executive view tabs selectively expose the right dashboard sections',()=>{
 const ctx=boot('#/category/people-directory');
 assert(ctx.mount.innerHTML.includes('role="tablist"'));
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 assert(ctx.classes.has('mc-focus-overview'));
 assert(ctx.mount.innerHTML.includes('data-view="explore"'));
 const click=view=>ctx.handlers.click({target:{
   closest(s){return s==='[data-action]'?{dataset:{action:'view',view}}:null}
 }});
 click('priorities');
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'priorities');
 assert(ctx.classes.has('mc-focus-priorities'));
 assert(!ctx.classes.has('mc-focus-overview'));
 click('updates');assert(ctx.classes.has('mc-focus-updates'));
 click('explore');assert(ctx.classes.has('mc-focus-explore'));
 assert(ctx.mount.innerHTML.includes('id="subcategory-directory"'));
 ctx.loc.hash='#/category/people-directory/employee-masterlist';
 ctx.window.MC_APP.render();
 assert(!ctx.classes.has('mc-category-view'));
 assert(ctx.mount.innerHTML.includes('51 records'));
});
test('Category view resets to Overview on a different category while preserving routes',()=>{
 const ctx=boot('#/category/people-directory');
 ctx.handlers.click({target:{closest(s){
   return s==='[data-action]'?{dataset:{action:'view',view:'explore'}}:null;
 }}});
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'explore');
 ctx.loc.hash='#/category/workforce-pulse';
 ctx.window.MC_APP.render();
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 assert(ctx.classes.has('mc-focus-overview'));
 assert(ctx.mount.innerHTML.includes('WORKFORCE PULSE'));
});
test('Workspace sidebar offers four contextual drilldowns without expanding all 86 links',()=>{
 const ctx=boot('#/category/people-directory');
 assert(ctx.mount.innerHTML.includes('class="nav-context" open'));
 assert(ctx.mount.innerHTML.includes('IN THIS WORKSPACE'));
 assert(ctx.mount.innerHTML.includes('All 10 views'));
 for(const sub of config.categories[0].subcategories.slice(0,4)){
   assert(ctx.mount.innerHTML.includes('#/category/people-directory/'+sub.id));
 }
 const home=boot('#/home');
 assert(!home.mount.innerHTML.includes('class="nav-context" open'));
});
test('Motion module remains optional and does not depend on animation service',()=>{
 const index=read('index.html'),motion=read('central/motion.js');
 assert(index.includes('central/motion.js'));
 assert(index.includes('central/kinetic.css'));
 assert(index.indexOf('central/motion.js')>index.indexOf('central/app.js'));
 assert.doesNotThrow(()=>new vm.Script(motion));
 for(const text of ['prefers-reduced-motion: reduce','IntersectionObserver',
  'getBoundingClientRect','transform','MC_MOTION','root.addEventListener'])assert(motion.includes(text),text);
 assert(!/fetch\s*\(|XMLHttpRequest|supabase|airtable/i.test(motion));
 assert(motion.includes("typeof el.animate!=='function'")||motion.includes("typeof el.animate !== 'function'"));
});
test('Kinetic CSS fixes narrow sidebar overflow and animates without horizontal page scrolling',()=>{
 const css=read('central/kinetic.css');
 for(const expected of [
  'min-width:0!important','max-width:100%','overflow-x:clip',
  'overflow-x:hidden','grid-template-columns','transition:grid-template-columns',
  'mc-page-enter','mc-page-exit','mc-reveal-up','mc-bar-grow',
  '.mobile-scrim','opacity:0','pointer-events:none',
  '@media(max-width:900px)','@media(max-width:600px)','@media(max-width:380px)',
  '@media(prefers-reduced-motion:reduce)','@media(forced-colors:active)'
 ])assert(css.includes(expected),expected);
 assert(css.includes('width:min(315px,calc(100vw - 20px))'));
});
test('Executive tabs use valid destinations and allow all 86 underlying views',()=>{
 const ctx=boot('#/category/executive-scoreboard');
 const html=ctx.mount.innerHTML;
 for(const view of ['overview','priorities','updates','explore'])assert(html.includes('data-view="'+view+'"'));
 for(const sub of config.categories[8].subcategories)assert(html.includes('#/category/executive-scoreboard/'+sub.id));
 assert(html.includes('aria-selected="true"'));
 assert(html.includes('aria-controls="mc-metrics"'));
 assert(html.includes('aria-controls="mc-insights"'));
 assert(html.includes('aria-controls="mc-activity"'));
 assert(html.includes('aria-controls="mc-links"'));
});
test('Collapsed sidebar leaves live DOM in place for smooth transition and keeps focus target',()=>{
 const source=read('central/app.js');
 const part=source.slice(source.indexOf("if(action==='collapse')"),source.indexOf("if(action==='theme')"));
 assert(part.includes("save('sidebar-collapsed'"));
 assert(part.includes('syncNavigation()'));
 assert(!part.includes('render()'));
 assert(part.includes('toggle.focus()'));
 assert(source.includes("document.startViewTransition"));
 assert(source.includes("window.MC_MOTION?.enter()"));
});


test('Accessible keyboard arrows cycle executive focus tabs without changing route',()=>{
 const ctx=boot('#/category/people-directory');
 let prevented=0;
 const key=(current,name)=>{
   ctx.listeners.keydown({
     key:name,target:{dataset:{view:current},closest(s){
       return s==='.mc-section-tabs [role="tab"]'?this:null;
     }},
     preventDefault(){prevented++;}
   });
 };
 key('overview','ArrowRight');
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'priorities');
 key('priorities','End');
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'explore');
 key('explore','ArrowRight');
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 key('overview','Home');
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 assert.equal(prevented,4);
 assert(ctx.classes.has('mc-focus-overview'));
});
test('Contextual All views retains ordinary category navigation from a detail screen',()=>{
 const ctx=boot('#/category/people-directory/employee-masterlist');
 let prevented=false;
 ctx.handlers.click({preventDefault(){prevented=true},target:{closest(s){
   return s==='[data-action]'?{dataset:{action:'view-link',view:'explore'}}:null;
 }}});
 assert.equal(prevented,false);
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 assert(ctx.mount.innerHTML.includes('href="#/category/people-directory" data-action="view-link"'));
});
test('Reduced-motion CSS does not expose closed off-canvas mobile navigation',()=>{
 const css=read('central/kinetic.css');
 const reduce=css.slice(css.indexOf('@media(prefers-reduced-motion:reduce)'));
 assert(reduce.includes('Preserve the mobile drawer'));
 assert(reduce.includes('.sidebar,.mobile-scrim'));
 assert(reduce.includes('animation:none!important;transition:none!important'));
 assert(!reduce.includes('.sidebar{transform:none!important}'));
 const offscreen=css.indexOf('transform:translate3d(-104%,0,0)');
 const opened=css.indexOf('.navigation-open .sidebar{transform:translate3d(0,0,0)}');
 assert(offscreen>0&&opened>offscreen);
});


test('Wireframe adaptation uses the existing 51 fictional identities and existing category schema',()=>{
 const overview=wireframe.home(model,config,summary,{}, {period:'month',alertFilter:'all'});
 assert(overview.includes('wf-executive'));
 assert(overview.includes('51 fictional people'));
 assert(overview.includes('9 workspaces'));
 assert(overview.includes('No live sync'));
 assert(overview.includes('Headcount by division'));
 assert(overview.includes('Executive monitoring matrix'));
 assert(overview.includes('Needs attention'));
 assert(overview.includes('data-action="wf-period"'));
 assert(overview.includes('data-action="wf-alert-filter"'));
 assert(!overview.includes('54 people across'));
 assert(!overview.includes('PHP 1.84M'));
 assert(!overview.includes('Connected sources'));
 assert(!overview.includes('178 candidates'));
});
test('Wireframe alert amounts are derived from fictional records, not hardcoded counts',()=>{
 const d=wireframe.cleanOverrides(model);
 const list=wireframe.allAlerts(d);
 assert.equal(list.length,5);
 assert.equal(list.find(a=>a.id==='documents').count,d.docs.filter(r=>r.status==='Requested').length);
 assert.equal(list.find(a=>a.id==='attendance').count,d.attendance.filter(r=>['Late','Absent'].includes(r.status)).length);
 assert.equal(list.find(a=>a.id==='decisions').count,d.decisions.filter(r=>r.status==='Decision Required').length);
 const first=d.docs.find(r=>r.status==='Requested');assert(first);
 const revised=wireframe.cleanOverrides(model,{[first.recordId]:'Approved/Verified'});
 assert.equal(wireframe.allAlerts(revised).find(a=>a.id==='documents').count,list.find(a=>a.id==='documents').count-1);
 assert.equal(first.status,'Requested');
});
test('Wireframe executive period and severity filters produce distinct functional views',()=>{
 const w=wireframe.home(model,config,summary,{}, {period:'week',alertFilter:'all'});
 const q=wireframe.home(model,config,summary,{}, {period:'quarter',alertFilter:'high'});
 assert(w.includes('aria-pressed="true">Week</button>'));
 assert(q.includes('aria-pressed="true">Quarter</button>'));
 assert(q.includes('aria-pressed="true">High</button>'));
 assert(w.includes('Next 7 days'));
 assert(q.includes('Next 90 days'));
 assert(!q.includes('Documents not reviewed</strong>'));
});
test('Nine category wireframe panels have matching functional visualizations',()=>{
 const expected={
 'people-directory':'Headcount by division',
 'pay-benefits':'Benefit readiness tracker',
 'workforce-pulse':'Late and absent demo records by weekday',
 'maddie-journey':'Employee journey stages',
 'maddie-learning-hub':'Course participation example',
 'culture-community':'Scheduled sample activities',
 'talent-acquisition':'Requisition pipeline',
 'people-governance':'Governance case stages',
 'executive-scoreboard':'Source-based demo coverage'
 };
 for(const c of config.categories){
   const html=wireframe.category(model,c,{}, {calendarMonth:11});
   assert(html.includes('wf-category-feature'),c.id);
   assert(html.includes(expected[c.id]),c.id);
   assert(html.includes('Fictional sample data'),c.id);
   assert(!html.includes('54 people across'),c.id);
   assert(!html.includes('PHP 1.84M'),c.id);
 }
});
test('Wireframe governance never leaks sample names, identifiers, salary or evidence',()=>{
 const cat=config.categories.find(c=>c.id==='people-governance');
 const html=wireframe.category(model,cat,{});
 assert(html.includes('no employee names'));
 assert(!html.includes(model.people[0].name));
 assert(!html.includes(model.people[0].employeeId));
 assert(!html.includes('PHP '));
 assert(!html.includes('Case Documentation'));
});
test('Wireframe uses one searchable navigation source across all 9 workspaces and 86 views',()=>{
 const html=wireframe.palette(config);
 assert(html.includes('id="mc-command"'));
 assert(html.includes('id="mc-command-input"'));
 assert(html.includes('role')||html.includes('Search'));
 const link=wireframe.results(config,'Employee Masterlist');
 assert(link.includes('#/category/people-directory/employee-masterlist'));
 assert(wireframe.results(config,'zzzzzz-not-real').includes('No matching demo navigation'));
 const broad=wireframe.results(config,'');
 assert(broad.includes('#/category/people-directory'));
 const script=read('central/wireframe.js');
 assert(!/fetch\s*\(|XMLHttpRequest|api\.airtable\.com|sheets\.googleapis\.com/.test(script));
});
test('Executive deadline view uses documented fictional dates only',()=>{
 const d=wireframe.cleanOverrides(model);
 const rows=wireframe.deadlineRows(d);
 assert(rows.length>10);
 assert(rows.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.dueDate)));
 assert(rows.every(r=>r.category&&r.sub&&config.categories.some(c=>c.id===r.category&&c.subcategories.some(s=>s.id===r.sub))));
 assert(rows.every((r,i)=>!i||rows[i-1].dueDate<=r.dueDate));
});
test('Wireframe assets are connected to the trial entrypoint and dashboard render paths',()=>{
 const index=read('index.html'),app=read('central/app.js'),css=read('central/wireframe.css');
 assert(index.includes('central/wireframe.css'));
 assert(index.includes('central/wireframe.js'));
 assert(index.indexOf('central/wireframe.js')<index.indexOf('central/app.js'));
 assert(app.includes('MC_WIREFRAME?.home'));
 assert(app.includes('MC_WIREFRAME?.category'));
 assert(app.includes('MC_WIREFRAME?.palette'));
 assert(app.includes("if(action==='wf-period')"));
 assert(app.includes("if(action==='wf-alert-filter')"));
 assert(app.includes("if(action==='wf-calendar')"));
 assert(app.includes("e.key).toLowerCase()==='k'"));
 assert(css.includes('prefers-reduced-motion:reduce'));
 assert(css.includes('@media(max-width:600px)'));
 assert(!index.includes('data-adapter.js'));
});
test('Every route still renders fictional wireframe sections plus existing sample controls',()=>{
 const ctx=boot('#/home');
 assert(ctx.mount.innerHTML.includes('wf-executive'));
 assert(ctx.mount.innerHTML.includes('mc-command'));
 for(const c of config.categories){
   ctx.loc.hash='#/category/'+c.id;
   ctx.window.MC_APP.render();
   assert(ctx.mount.innerHTML.includes('wf-category-feature'),c.id);
   assert(ctx.mount.innerHTML.includes('id="mc-metrics"'),c.id);
   assert(ctx.mount.innerHTML.includes('id="subcategory-directory"'),c.id);
 }
 ctx.loc.hash='#/category/people-directory/employee-masterlist';
 ctx.window.MC_APP.render();
 assert(ctx.mount.innerHTML.includes('51 records'));
});
test('Wireframe period, attention filter and calendar controls preserve route and sample records',()=>{
 const ctx=boot('#/home');
 const trigger=(action,extras)=>ctx.handlers.click({target:{closest(s){
   return s==='[data-action]'?{dataset:{action,...extras}}:null;
 }}});
 trigger('wf-period',{period:'quarter'});
 assert.equal(ctx.window.MC_APP.getWireframePeriod(),'quarter');
 assert(ctx.mount.innerHTML.includes('Next 90 days'));
 trigger('wf-alert-filter',{filter:'high'});
 assert.equal(ctx.window.MC_APP.getWireframeAlertFilter(),'high');
 ctx.loc.hash='#/category/culture-community';
 ctx.window.MC_APP.render();
 trigger('wf-calendar',{month:'11'});
 assert.equal(ctx.window.MC_APP.getWireframeCalendarMonth(),11);
 assert(ctx.mount.innerHTML.includes('December 2026'));
 assert.equal(ctx.window.MC_APP.getCategoryFocus(),'overview');
 assert.equal(ctx.window.MC_APP.model.people.length,51);
});

console.log('\n'+passed+' Maddie Central fictional-trial tests passed. Manual browser and device tests still required.');
