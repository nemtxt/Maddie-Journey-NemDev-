/* Maddie Central 2027 macOS-style finalization — offline, fictional-only tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
global.window={};
require('../data.js');
const config=require('../central/config.js');
const build=require('../central/model.js');
const summary=require('../central/summary.js');
const wire=require('../central/wireframe.js');
const macos=require('../central/macos.js');
const model=build(global.window.MJ_SEED,config);
global.window.MC_WIREFRAME=wire;
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const numbers=s=>(s.match(/\b\d+(?:,\d{3})*\b/g)||[]).map(x=>Number(x.replaceAll(',','')));
test('All nine navigation labels and 86 exact deep links are unchanged',()=>{
 const expected=['PEOPLE DIRECTORY','PAY & BENEFITS','WORKFORCE PULSE',
 'MADDIE JOURNEY','MADDIE LEARNING HUB','CULTURE & COMMUNITY',
 'TALENT ACQUISITION','PEOPLE GOVERNANCE','EXECUTIVE SCOREBOARD'];
 assert.deepEqual(config.categories.map(x=>x.label),expected);
 assert.equal(config.categories.reduce((n,c)=>n+c.subcategories.length,0),86);
 assert.equal(new Set(config.categories.map(c=>c.id)).size,9);
 assert(model.people.length===51);
 assert(model.byId.size===51);
});
test('Executive comparison is derived from existing fictional employee IDs',()=>{
 const division=model.people[0].division;
 const p=macos.totals(model,division);
 assert.equal(p.headcount,model.people.filter(x=>x.division===division).length);
 assert.equal(p.docRequested,model.collections.docs.filter(x=>x.division===division&&x.status==='Requested').length);
 assert.equal(p.docVerified,model.collections.docs.filter(x=>x.division===division&&x.status==='Approved/Verified').length);
 assert.equal(p.attendanceExceptions,model.collections.attendance.filter(x=>x.division===division&&['Late','Absent'].includes(x.status)).length);
 assert.equal(p.documents,model.collections.docs.filter(x=>x.division===division).length);
});
test('Local status overrides alter only a displayed comparison count, never the fixture',()=>{
 const record=model.collections.docs.find(r=>r.status==='Requested');
 assert(record,'need a synthetic document request');
 const base=macos.totals(model,record.division);
 const changed=macos.totals(model,record.division,{[record.recordId]:'Approved/Verified'});
 assert.equal(changed.docRequested,base.docRequested-1);
 assert.equal(changed.docVerified,base.docVerified+1);
 assert.equal(record.status,'Requested');
});
test('Division comparison only appears in People Directory and Executive Scoreboard',()=>{
 for(const c of config.categories){
   const html=macos.compareSection(model,c.id,{});
   if(['people-directory','executive-scoreboard'].includes(c.id)){
     assert(html.includes('Compare fictional divisions'),c.id);
     assert(html.includes('data-mac-compare="a"'),c.id);
     assert(html.includes('data-mac-compare="b"'),c.id);
     assert(html.includes('Derived from one masterlist'),c.id);
   }else assert.equal(html,'',c.id);
 }
 const divs=[...new Set(model.people.map(p=>p.division))].sort();
 const html=macos.compareResults(model,divs[0],divs[1]);
 assert(html.includes('Employees')&&html.includes('Attendance exceptions'));
 assert(html.includes('role="img"')&&html.includes('201 file requests'));
 assert(!html.includes('PHP '));
});
test('Quick-view profiles expose no confidential data or salary',()=>{
 const p=model.people[0];
 const html=macos.profile(p,model);
 assert(html.includes(p.name));
 assert(html.includes(p.employeeId));
 assert(html.includes('FICTIONAL EMPLOYEE SNAPSHOT'));
 assert(html.includes('<dl class="mac-profile-data">'));
 assert(html.includes('Sample start date'));
 assert(!html.includes(p.email));
 assert(!html.includes('PHP '));
 assert(!html.includes('Salary'));
 assert(!html.includes('medical diagnosis'));
 assert.equal(macos.profile({employeeId:'not-a-sample'},model),'');
});
test('Attention drawer shows count-only fictional statuses and valid deep links',()=>{
 const html=macos.alerts(model);
 assert(html.includes('Items needing review'));
 assert(html.includes('not live notifications'));
 assert(html.includes('201 file requests'));
 assert(html.includes('#/category/people-directory/employment-documents'));
 assert(!html.includes(model.people[0].name));
 assert(!html.includes('PHP '));
 assert(!html.includes(model.people[0].email));
});
test('Source-based trend is available only for workforce pulse',()=>{
 assert.equal(macos.historyCard(model,'pay-benefits'),'');
 const html=macos.historyCard(model,'workforce-pulse');
 assert(html.includes('Exceptions over time'));
 assert(html.includes('fictional late/absent'));
 assert(html.includes('No forecast')===false);
 assert(!html.includes('attendance rate is 95'));
});
test('Dialogs have accessible headings and close buttons',()=>{
 const html=macos.shellDialogs();
 for(const name of ['mac-profile-dialog','mac-alerts-dialog','data-mac-close="profile"',
 'data-mac-close="alerts"','aria-labelledby="mac-profile-title"','aria-labelledby="mac-alerts-title"']){
   assert(html.includes(name),name);
 }
 assert(!/type="password"|name="password"/.test(html));
});
test('Integration hook leaves navigation templates and config as they were',()=>{
 const app=read('central/app.js'),index=read('index.html');
 assert(app.includes('const sidebar=(current)=>'));
 assert(app.includes('const header=(cat,sub)=>'));
 assert(app.includes("const categoryPage=(cat)=>"));
 assert(app.includes("window.MC_MACOS?.mount?.(root,model,config,overrides,{cat,sub})"));
 assert(app.includes("window.MC_MACOS?.initialize?.(root,()=>model,()=>config,()=>overrides)"));
 assert(!app.includes('https://api.airtable.com'));
 assert(index.indexOf('central/macos.js')<index.indexOf('central/app.js'));
 assert(index.indexOf('central/macos.css')>index.indexOf('central/wireframe.css'));
 assert(!index.includes('data-adapter.js'));
});
test('Typography and motion follow a single source with accessibility fallbacks',()=>{
 const css=read('central/macos.css');
 for(const part of ['font-family:Inter','--mac-surface','-webkit-backdrop-filter',
 '.mac-finalized .sidebar','.mac-finalized .topbar','.mac-dialog',
 '.mac-comparison','.mac-history-card','@media(max-width:900px)',
 '@media(max-width:700px)','@media(max-width:480px)',
 '@media(prefers-reduced-motion:reduce)','@media(forced-colors:active)']){
   assert(css.includes(part),part);
 }
 assert(css.includes('.mc-white-chip'));
 assert(!css.includes('background-image:url(http'));
 assert(!css.includes('@import'));
});
test('Browser enhancement remains optional for stateless test-harness execution',()=>{
 const lightweightRoot={querySelector(){return null},classList:{add(){}},
   addEventListener(){}};
 assert.doesNotThrow(()=>macos.mount(lightweightRoot,model,config));
 assert.doesNotThrow(()=>macos.initialize(lightweightRoot,()=>model,()=>config,()=>({})));
 for(const file of ['central/macos.js','central/app.js'])
   assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
let passed=0;
for(const {name,fn} of tests){
 try{fn();passed++;console.log('PASS '+name)}
 catch(error){console.error('FAIL '+name);throw error;}
}
console.log('\n'+passed+' Maddie macOS trial finalization checks passed.');
