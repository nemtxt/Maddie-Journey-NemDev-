/* Maddie Journey v1.7 — dependency-free smoke tests.
   Run from the repository root: node tests/smoke.js
   These are simulated interaction tests, not browser visual tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=function(p){return fs.readFileSync(path.join(root,p),'utf8');};
const seedCode=read('data.js');
const appCode=read('app.js');
const html=read('index.html');
const css=read('operations.css');
const landingCss=read('landing.css');
const executed=[];

function test(name,body){body();executed.push(name);console.log('PASS',name);}
function boot(existing){
  const mem=existing||{},events={},nodes={};
  const appRoot={innerHTML:'',querySelector:function(q){return q==='[role="dialog"]'?{focus(){}}:null;}};
  nodes.app=appRoot;
  const doc={
    title:'',documentElement:{dataset:{theme:'dark'}},
    body:{appendChild(el){nodes[el.id]=el;}},
    getElementById(id){return nodes[id]||null;},
    querySelector(q){return q==='meta[name="theme-color"]'?{setAttribute(){}}:null;},
    querySelectorAll(){return[];},
    addEventListener(name,fn){events[name]=fn;},
    createElement(tag){return {tagName:tag,id:'',className:'',textContent:'',setAttribute(){},remove(){},addEventListener(){},querySelectorAll(){return[{addEventListener(){}}];},querySelector(){return{focus(){},addEventListener(){}};}};}
  };
  const win={handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},scrollTo(){}};
  const loc={hash:''};
  const store={getItem(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},setItem(k,v){mem[k]=v;}};
  new Function('window',seedCode)(win);
  new Function('window','document','localStorage','sessionStorage','location','setTimeout',appCode)(win,doc,store,store,loc,()=>{});
  return {
    win,doc,loc,html:()=>appRoot.innerHTML,
    state(){return JSON.parse(mem['maddie-journey-demo-v3']);},
    click(name,attrs={}){
      events.click({
        target:{dataset:{},closest(selector){return selector==='[data-action]'?{dataset:{action:name,...attrs}}:null;}},
        preventDefault(){}
      });
    },
    field(name,value){events.change({target:{dataset:{field:name},value}});}
  };
}

test('Source files parse and load order is correct',()=>{
  new Function(seedCode);new Function(appCode);
  assert(html.indexOf('theme.css')<html.indexOf('operations.css'));
  assert(html.indexOf('operations.css')<html.indexOf('landing.css'));
  assert(css.includes('.org-tier')&&css.includes('.queue-filter'));
  assert(landingCss.includes('assets/madhalloween-hero.webp'));
});

const app=boot();

test('Fixture has 51 employees across eight populated departments',()=>{
  assert.equal(app.win.MJ_SEED.employees.length,51);
  assert.equal(app.win.MJ_SEED.divisions.length,8);
  assert(app.win.MJ_SEED.divisions.every(d=>app.win.MJ_SEED.employees.some(e=>e.division===d.id)));
});

test('Welcome landing uses real Madhouse logo and accessible paths',()=>{
  assert(app.html().includes('assets/madhouse-logo.png'));
  assert(app.html().includes('Maddie Journey'));
  assert(app.html().includes('data-action="landing-role"'));
  assert.equal((app.html().match(/class="landing-audience-card"/g)||[]).length,3);
  assert(app.html().includes('data-nav="sources"'));
});

test('Landing audience choices open the intended demo workspaces',()=>{
  app.click('landing-role',{role:'head'});
  assert(app.html().includes('My departments'));
  app.click('nav',{tab:'welcome'});
  assert(app.html().includes('landing-hero'));
  app.click('landing-role',{role:'executive'});
  assert(app.html().includes('Organization overview'));
  app.click('nav',{tab:'welcome'});
  app.click('landing-role',{role:'hr'});
  assert(app.html().includes('People &amp; Culture overview'));
});

test('Home contains actionable worklist and transparent source status',()=>{
  assert(app.html().includes('Needs attention'));
  assert(app.html().includes('No live Airtable or Google sync'));
  assert(app.html().includes('Division snapshot'));
});

test('Attention filter is functional and concise',()=>{
  app.click('attention-filter',{kind:'onboarding'});
  assert(app.html().includes('data-kind="onboarding" class="queue-filter active'));
  assert(!app.html().includes('HR inputs'));
});

test('All divisions render clickable six-level sample org charts',()=>{
  app.click('nav',{tab:'divisions'});
  for(const d of app.win.MJ_SEED.divisions){
    app.click('open-org',{division:d.id});
    assert.equal(app.loc.hash,'#division/'+d.id);
    assert(app.html().includes('Fictional reporting structure'));
    assert.equal((app.html().match(/class="org-person"/g)||[]).length,
      app.win.MJ_SEED.employees.filter(e=>e.division===d.id).length);
  }
});

test('Department tabs keep employees in centered previews',()=>{
  app.click('division-tab',{tab:'team'});
  assert(app.html().includes('Preview charts'));
  app.click('open',{id:'MJ-003',detail:'preview'});
  assert(app.html().includes('employee-modal'));
  app.click('close');
});

test('All eleven navigation screens render',()=>{
  for(const tab of ['overview','divisions','employees','milestones','journey','kit','attendance','kpi','approvals','sources','audit']){
    app.click('nav',{tab});
    assert(app.html().includes('<h1>'),tab);
  }
});

test('Airtable and Google providers are never shown as live',()=>{
  app.click('nav',{tab:'sources'});
  for(const name of ['Airtable','Google Sheets','Google Drive','Google Docs','Email'])assert(app.html().includes(name));
  assert((app.html().match(/Not connected/g)||[]).length>=5);
});

test('Assigned evaluator can edit but CEO preview cannot',()=>{
  app.click('choose-workspace');app.click('select-viewer',{id:'aj'});
  app.click('open',{id:'MJ-003',detail:'kpi'});
  app.field('score.division','92');
  assert.equal(app.state().employees[2].scores.division,92);
  app.click('close');app.click('choose-workspace');app.click('select-viewer',{id:'ceo'});
  app.click('open',{id:'MJ-003',detail:'kpi'});
  app.field('score.division','11');
  assert.equal(app.state().employees[2].scores.division,92);
});

test('Old saved records migrate without losing KPI edits',()=>{
  const legacy=JSON.parse(JSON.stringify(app.win.MJ_SEED));
  legacy.version=5;legacy.employees.forEach(e=>{delete e.orgLevel;delete e.reportsTo;});
  legacy.employees[1].scores.division=99;
  const old=boot({'maddie-journey-demo-v3':JSON.stringify(legacy)}).state();
  assert.equal(old.version,6);
  assert.equal(old.employees.length,51);
  assert.equal(old.employees[1].scores.division,99);
  assert(old.employees.every(e=>Number.isInteger(e.orgLevel)&&e.orgLevel>=1&&e.orgLevel<=6));
});

console.log('\n'+executed.length+' smoke tests passed. Browser visual review is separate.');
