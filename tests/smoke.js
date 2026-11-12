/* Maddie Journey v2.1 — dependency-free read-only smoke checks.
   Run from repository root: node tests/smoke.js
   Simulated interactions; browser/device visual QA is separate. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const files=['index.html','data.js','app.js','operations.css','palette.css','landing.css','workspace.css','reader.css'];
const src=Object.fromEntries(files.map(name=>[name,read(name)]));
const results=[];
function check(name,fn){fn();results.push(name);console.log('PASS '+name);}

function boot(initial={},hash=''){
  const mem={...initial},events={},nodes={};
  const mount={innerHTML:'',querySelector(selector){return selector==='[role="dialog"]'?{focus(){},querySelectorAll(){return [];}}:null;}};
  nodes.app=mount;
  const doc={
    title:'',activeElement:null,documentElement:{dataset:{theme:'light'}},
    body:{appendChild(el){nodes[el.id]=el;}},
    getElementById(id){return nodes[id]||null;},
    querySelector(q){return q==='meta[name="theme-color"]'?{setAttribute(){}}:null;},
    querySelectorAll(){return[];},
    addEventListener(name,fn){events[name]=fn;},
    createElement(tag){return{tagName:tag,id:'',className:'',textContent:'',setAttribute(){},
      remove(){},addEventListener(){},querySelectorAll(){return[{addEventListener(){}}];},
      querySelector(){return{focus(){},addEventListener(){}};}};}
  };
  const win={handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},scrollTo(){}};
  const loc={hash};
  const store={getItem(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},setItem(k,v){mem[k]=v;}};
  new Function('window',src['data.js'])(win);
  new Function('window','document','localStorage','sessionStorage','location','setTimeout',src['app.js'])(win,doc,store,store,loc,()=>{});
  return{
    win,doc,mem,loc,html:()=>mount.innerHTML,
    click(name,attrs={}){
      events.click({target:{dataset:{},closest(selector){return selector==='[data-action]'?{dataset:{action:name,...attrs}}:null;}},preventDefault(){}});
    },
    changeField(name,value){
      events.change({target:{dataset:{field:name},value,checked:true}});
    },
    navigate(tab){this.click('nav',{tab});},
    selectViewer(id,category='hr'){
      this.click('workspace-category',{category});
      this.click('select-viewer',{id});
    }
  };
}

check('Files parse; reader CSS is last and PNG/JPEG media are preserved',()=>{
  new Function(src['data.js']);new Function(src['app.js']);
  assert(src['index.html'].indexOf('reader.css')>src['index.html'].indexOf('workspace.css'));
  assert(src['landing.css'].includes('assets/madhalloween.jpg'));
  assert(src['app.js'].includes('assets/madhouse-logo.png'));
  assert(!src['index.html'].includes('.webp'));
});

const user=boot();
check('No access gate, saved persona, chooser or editable source controls remain',()=>{
  for(const absent of ['workspaceModal(', 'workspaceChosen', 'data-action="select-viewer"', 'data-action="choose-workspace"', 'maddie-journey-viewer-v2', 'function changeField(', 'function openRecordEditor(']){
    assert(!src['app.js'].includes(absent),absent);
  }
  assert(!src['reader.css'].includes('/* A first-visit chooser'));
  assert(src['reader.css'].includes('.workspace-subnav'));
});

check('Landing links directly to HR, Division and Executive screens without a popup',()=>{
  assert(user.html().includes('landing-hero'));
  assert(user.html().includes('assets/madhouse-logo.png'));
  assert(!user.html().includes('Who is using the dashboard?'));
  assert(user.html().includes('class="landing-audience-card" data-nav="employees"'));
  assert(user.html().includes('class="landing-audience-card" data-nav="divisions"'));
  assert(user.html().includes('class="landing-audience-card" data-nav="overview"'));
  user.navigate('overview');
  assert(user.html().includes('Organization overview'));
  assert(!user.html().includes('workspace-gate'));
  assert(!user.html().includes('role-choice'));
});

check('Sidebar has exactly five primary sections with correct destinations',()=>{
  user.navigate('overview');
  const h=user.html();
  const main=h.match(/class="workspace-mainnav-item/g)||[];
  assert.equal(main.length,5);
  for(const label of ['Dashboard','People','Journey','Performance','Data &amp; Sources'])assert(h.includes(label),label);
  for(const dest of ['overview','employees','journey','kpi','sources'])assert(h.includes('data-nav="'+dest+'"'),dest);
});

check('Top subnavigation changes with context and supports direct links',()=>{
  const configs={
    overview:[['overview','Overview'],['divisions','Divisions']],
    employees:[['employees','Directory'],['milestones','Milestones']],
    journey:[['journey','Journey board'],['kit','Welcome Kit'],['attendance','Attendance']],
    kpi:[['kpi','KPI scorecards'],['approvals','Reviews']],
    sources:[['sources','Data sources'],['audit','About the prototype']]
  };
  for(const [tab,links] of Object.entries(configs)){
    user.navigate(tab);
    const h=user.html(),sub=h.split('class="workspace-subnav-links"')[1]?.split('</nav>')[0]||'';
    assert(sub,tab);
    assert.equal((sub.match(/data-nav="/g)||[]).length,links.length,tab);
    for(const [dest,label] of links){
      assert(sub.includes('data-nav="'+dest+'"'),tab+': '+dest);
      assert(sub.includes(label),tab+': '+label);
    }
  }
});

check('All eleven screens accessible to any visitor, read-only',()=>{
  const screens=['overview','divisions','employees','milestones','journey','kit','attendance','kpi','approvals','sources','audit'];
  for(const tab of screens){
    user.navigate(tab);
    const h=user.html();
    assert(h.includes('<h1>'),tab);
    assert(h.includes('workspace-sidebar'),tab);
    assert(h.includes('workspace-subnav'),tab);
    assert(!h.includes('Who is using the dashboard?'),tab);
  }
  assert.equal(user.win.MJ_SEED.employees.length,51);
  assert.equal(user.win.MJ_SEED.divisions.length,8);
});

check('All eight divisions allow Summary, Board, List and Org chart',()=>{
  for(const d of user.win.MJ_SEED.divisions){
    user.click('goto-division',{division:d.id});
    assert(user.html().includes('data-nav="divisions"'));
    for(const [tab,fragment] of [['summary','Division'],['board','department-board'],['list','department-table'],['chart','org-canvas']]){
      user.click('division-tab',{tab});
      assert(user.html().includes(fragment),d.id+': '+tab);
    }
  }
});

check('Journey Kanban and table still cover all 51 sample employees',()=>{
  user.navigate('journey');
  assert(user.html().includes('class="journey-kanban"'));
  assert.equal((user.html().match(/class="journey-lane"/g)||[]).length,8);
  user.click('journey-view',{mode:'table'});
  assert.equal((user.html().match(/class="journey-stage-pill"/g)||[]).length,51);
  user.click('set-scope',{division:'media'});
  const count=user.win.MJ_SEED.employees.filter(e=>e.division==='media').length;
  assert.equal((user.html().match(/class="journey-stage-pill"/g)||[]).length,count);
  user.click('journey-view',{mode:'board'});
  assert(user.html().includes('class="journey-kanban"'));
});

check('Employee modal is view only for every tab',()=>{
  user.navigate('employees');
  for(const detail of ['preview','info','journey','kit','attendance','kpi','approvals','milestones']){
    user.click('open',{id:'MJ-003',detail});
    const h=user.html();
    assert(h.includes('employee-modal'),detail);
    for(const forbidden of ['data-field=','data-stage=','data-kit=','data-action="review"','Save record','Add record','Record event','data-action="milestone-edit"','type="checkbox"']){
      assert(!h.includes(forbidden),detail+': '+forbidden);
    }
    user.click('close');
  }
});

check('Milestones and sample disciplinary information no longer depend on viewer identity',()=>{
  user.navigate('milestones');
  user.click('milestone-category',{kind:'discipline'});
  assert(!user.html().includes('HR-only details'));
  assert(!user.html().includes('HR-managed information'));
  const someone=user.win.MJ_SEED.employees.find(e=>(e.disciplinaryActions||[]).length);
  if(someone){
    user.click('open',{id:someone.id,detail:'milestones'});
    assert(user.html().includes('Disciplinary actions'));
    assert(!user.html().includes('not available in this preview'));
    user.click('close');
  }
});

check('Search, follow-up Board/List and source status keep functioning',()=>{
  user.click('quick-search');
  assert(user.html().includes('data-ui="query"'));
  user.navigate('overview');
  user.click('attention-filter',{kind:'all'});
  user.click('work-view',{mode:'board'});
  assert(user.html().includes('class="work-board"'));
  user.click('work-view',{mode:'list'});
  assert(user.html().includes('class="work-list-table"'));
  user.navigate('sources');
  for(const source of ['Airtable','Google Sheets','Google Drive','Google Docs','Email']){
    assert(user.html().includes(source),source);
  }
});

check('Mobile menu and backdrop close properly',()=>{
  user.navigate('overview');
  user.click('mobile');
  assert(user.html().includes('layout menu-open'));
  assert(user.html().includes('workspace-scrim'));
  user.click('mobile');
  assert(!user.html().includes('layout menu-open'));
});

check('No old role choice or record-edit actions can affect the fictional fixture',()=>{
  const old=JSON.stringify(user.win.MJ_SEED.employees);
  for(const action of ['choose-workspace','select-viewer','review','new-record','milestone-edit','reset'])user.click(action,{id:'giezelle',step:'division',decision:'Endorsed'});
  user.changeField('score.division','0');
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),old);
  assert(!Object.prototype.hasOwnProperty.call(user.mem,'maddie-journey-demo-v3'));
});

check('Direct deep links work without a viewer choice',()=>{
  for(const hash of ['#overview','#employees','#journey','#sources','#division/media']){
    const fresh=boot({'maddie-journey-viewer-v2':'aj'},hash);
    assert(fresh.html().includes('workspace-sidebar'),hash);
    assert(!fresh.html().includes('Who is using the dashboard?'),hash);
    if(hash.startsWith('#division/'))assert(fresh.html().includes('Media'),hash);
  }
  user.navigate('welcome');
  assert(user.html().includes('landing-hero'));
});

console.log('\n'+results.length+' smoke tests passed. Physical-device visual QA is separate.');
