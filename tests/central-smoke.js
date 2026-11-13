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
const pages=['index.html','legacy.html','central/config.js','central/model.js','central/app.js','central/styles.css','data.js'];
for(const file of pages)assert(fs.existsSync(path.join(root,file)),file+' missing');
const config=require('../central/config.js');
global.window={};
require('../data.js');
const seed=global.window.MJ_SEED;
const build=require('../central/model.js');
const summary=require('../central/summary.js');
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
function boot(hash){
 const handlers={},store={},listeners={},mount={
  innerHTML:'',classList:{remove(){},toggle(){}},querySelector(){return null;},
  addEventListener(type,fn){handlers[type]=fn}
 };
 const document={
  documentElement:{dataset:{}},title:'',
  getElementById(id){return id==='app'?mount:null},
  addEventListener(type,fn){listeners[type]=fn},
 };
 const loc={hash:hash||'#/home'};
 const window={
  MC_CONFIG:config,MC_DATA:model,MC_SUMMARY:summary,
  addEventListener(type,fn){listeners[type]=fn}
 };
 const ctx={window,document,location:loc,
  localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},
  Blob:class{},URL:{createObjectURL(){return 'blob:demo';},revokeObjectURL(){}},
  setTimeout(){},console};
 vm.createContext(ctx);
 vm.runInContext(read('central/app.js'),ctx,{filename:'central/app.js'});
 return {window,document,loc,mount,handlers,listeners};
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

console.log('\n'+passed+' Maddie Central fictional-trial tests passed. Manual browser and device tests still required.');
