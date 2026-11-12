/* Maddie Journey v2.0 — dependency-free read-only smoke checks.
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

check('Landing opens before dashboard and uses authentic logo',()=>{
  assert(user.html().includes('landing-hero'));
  assert(user.html().includes('assets/madhouse-logo.png'));
  assert(user.html().includes('data-action="landing-role"'));
});

check('Direct first entry asks for workspace category then specific person',()=>{
  user.navigate('overview');
  assert(user.html().includes('Who is using the dashboard?'));
  assert(user.html().includes('data-category="hr"'));
  assert(user.html().includes('data-category="head"'));
  assert(user.html().includes('data-category="executive"'));
  assert(!user.html().includes('workspace-sidebar'));
  user.click('workspace-category',{category:'hr'});
  assert(user.html().includes('Choose your preview identity'));
  assert(user.html().includes('GIEZELLE'));
  assert(user.html().includes('KURT'));
  user.click('select-viewer',{id:'giezelle'});
  assert(user.html().includes('People &amp; Culture overview'));
  assert.equal(user.mem['maddie-journey-viewer-v2'],'giezelle');
});

check('51 employees, eight divisions and all main navigation destinations remain',()=>{
  assert.equal(user.win.MJ_SEED.employees.length,51);
  assert.equal(user.win.MJ_SEED.divisions.length,8);
  for(const tab of ['overview','divisions','employees','milestones','journey','kit','attendance','kpi','approvals','sources','audit']){
    user.navigate(tab);
    assert(user.html().includes('<h1>'),tab);
    assert(user.html().includes('workspace-sidebar'),tab);
  }
});

check('Navigation has one grouped sidebar, contextual top bar and viewer switch',()=>{
  user.navigate('overview');
  assert(!user.html().includes('workspace-rail'));
  assert(!user.html().includes('workspace-toplinks'));
  assert(user.html().includes('reader-sidebar-status'));
  assert(user.html().includes('data-action="quick-search"'));
  assert(user.html().includes('data-action="choose-workspace"'));
  assert(user.html().includes('Sample data'));
  user.click('quick-search');
  assert(user.html().includes('data-ui="query"'));
});

check('Viewer switching changes perspective without modifying any source data',()=>{
  user.click('choose-workspace');
  assert(user.html().includes('Who is using the dashboard?'));
  user.selectViewer('aj','head');
  assert(user.html().includes('My departments'));
  assert.equal(user.mem['maddie-journey-viewer-v2'],'aj');
  user.click('choose-workspace');
  user.selectViewer('ceo','executive');
  assert(user.html().includes('Organization overview'));
  assert.equal(user.mem['maddie-journey-viewer-v2'],'ceo');
});

check('Returning viewer opens direct Journey link without another chooser',()=>{
  const returning=boot({'maddie-journey-viewer-v2':'aj'},'#journey');
  assert(returning.html().includes('Journey board'));
  assert(!returning.html().includes('Who is using the dashboard?'));
});

check('Journey Kanban has all seven stages plus Completed',()=>{
  user.navigate('journey');
  assert(user.html().includes('class="journey-kanban"'));
  assert.equal((user.html().match(/class="journey-lane"/g)||[]).length,8);
  for(let i=0;i<8;i++)assert(user.html().includes('data-stage-index="'+i+'"'));
  assert(user.html().includes('data-action="choose-scope"'));
  assert(user.html().includes('Fictional')||user.html().includes('sample'));
});

check('Journey Table lists all 51 employees and department filter works',()=>{
  user.click('journey-view',{mode:'table'});
  assert(user.html().includes('class="table journey-table"'));
  assert.equal((user.html().match(/class="journey-stage-pill"/g)||[]).length,51);
  user.click('set-scope',{division:'rmd'});
  const count=user.win.MJ_SEED.employees.filter(e=>e.division==='rmd').length;
  assert.equal((user.html().match(/class="journey-stage-pill"/g)||[]).length,count);
  user.click('journey-view',{mode:'board'});
  assert(user.html().includes('class="journey-kanban"'));
});

check('All eight department boards and charts still open previews',()=>{
  for(const d of user.win.MJ_SEED.divisions){
    user.click('goto-division',{division:d.id});
    user.click('division-tab',{tab:'board'});
    assert(user.html().includes('department-board'),d.id);
    user.click('division-tab',{tab:'chart'});
    assert(user.html().includes('Fictional reporting structure'),d.id);
  }
});

check('Every employee detail panel is read-only, including HR',()=>{
  user.click('choose-workspace');user.selectViewer('giezelle','hr');
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

check('Illegal action and change events cannot edit fixture or local storage',()=>{
  const before=JSON.stringify(user.win.MJ_SEED.employees);
  user.click('review',{step:'division',decision:'Endorsed'});
  user.click('new-record');
  user.click('milestone-edit',{kind:'promotion'});
  user.click('reset');
  user.changeField('score.division','0');
  user.changeField('profile.name','Changed');
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),before);
  assert.equal(Object.prototype.hasOwnProperty.call(user.mem,'maddie-journey-demo-v3'),false);
  assert(!src['app.js'].includes('function openRecordEditor('));
  assert(!src['app.js'].includes('function changeField('));
});

check('Existing worklist board/list, source transparency and mobile drawer still work',()=>{
  user.navigate('overview');
  user.click('attention-filter',{kind:'all'});
  user.click('work-view',{mode:'board'});
  assert(user.html().includes('class="work-board"'));
  user.click('work-view',{mode:'list'});
  assert(user.html().includes('class="work-list-table"'));
  user.navigate('sources');
  for(const name of ['Airtable','Google Sheets','Google Drive','Google Docs','Email']){
    assert(user.html().includes(name));
  }
  assert((user.html().match(/Not connected/g)||[]).length>=5);
  user.click('mobile');
  assert(user.html().includes('layout menu-open'));
  user.click('mobile');
  assert(!user.html().includes('layout menu-open'));
});

check('Legacy browser-edited sample data is ignored but not overwritten',()=>{
  const legacy=JSON.stringify({version:6,employees:[]});
  const prior=boot({'maddie-journey-viewer-v2':'kurt','maddie-journey-demo-v3':legacy},'#overview');
  assert(prior.html().includes('People &amp; Culture overview'));
  assert.equal(prior.mem['maddie-journey-demo-v3'],legacy);
  assert.equal(prior.win.MJ_SEED.employees.length,51);
});

console.log('\n'+results.length+' smoke tests passed. Rendered desktop/mobile browser QA is separate.');
