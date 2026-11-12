/* Maddie Journey v3.1 — dependency-free read-only smoke checks.
   Run from repository root: node tests/smoke.js
   Simulated interactions; browser/device visual QA is separate. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const files=['index.html','data.js','data-adapter.js','app.js','operations.css','palette.css','landing.css','workspace.css','reader.css','refined.css','mono.css','motion.js'];
const src=Object.fromEntries(files.map(name=>[name,read(name)]));
const results=[];
function check(name,fn){fn();results.push(name);console.log('PASS '+name);}

function boot(initial={},hash='',mutateFixture){
  const mem={...initial},events={},nodes={},downloads=[];
  let currentDownloadBlob=null;
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
      click(){downloads.push({filename:this.download,text:currentDownloadBlob&&currentDownloadBlob.text,mime:currentDownloadBlob&&currentDownloadBlob.type});},remove(){},addEventListener(){},querySelectorAll(){return[{addEventListener(){}}];},
      querySelector(){return{focus(){},addEventListener(){}};}};}
  };
  const win={handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},scrollTo(){}};
  const loc={hash};
  const store={getItem(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},setItem(k,v){mem[k]=v;}};
  new Function('window',src['data.js'])(win);
  if(mutateFixture)mutateFixture(win.MJ_SEED);
  new Function('window',src['data-adapter.js'])(win);
  function TestBlob(chunks,options){this.text=chunks.join('');this.type=options.type;}
  const testURL={createObjectURL(blob){currentDownloadBlob=blob;return 'blob:test-download';},revokeObjectURL(){}};
  new Function('window','document','localStorage','sessionStorage','location','setTimeout','Blob','URL',src['app.js'])(
    win,doc,store,store,loc,()=>{},TestBlob,testURL);
  return{
    win,doc,mem,loc,downloads,html:()=>mount.innerHTML,
    click(name,attrs={}){
      events.click({target:{dataset:{},closest(selector){return selector==='[data-action]'?{dataset:{action:name,...attrs}}:null;}},preventDefault(){}});
    },
    changeField(name,value){
      events.change({target:{dataset:{field:name},value,checked:true}});
    },
    setFilter(name,value){
      events.change({target:{dataset:{ui:name},value,checked:true}});
    },
    key(key,opts={}){
      const ev={key,ctrlKey:false,metaKey:false,shiftKey:false,target:{tagName:'BODY'},
        preventDefault(){this.prevented=true;},...opts};
      events.keydown(ev);
      return ev;
    },
    navigate(tab){this.click('nav',{tab});}
  };
}

check('Files parse; reader CSS is last and PNG/JPEG media are preserved',()=>{
  new Function(src['data.js']);new Function(src['data-adapter.js']);new Function(src['app.js']);new Function(src['motion.js']);
  assert(src['index.html'].indexOf('reader.css')>src['index.html'].indexOf('workspace.css'));
  assert(src['landing.css'].includes('assets/madhalloween.jpg'));
  assert(!src['app.js'].includes('assets/madhouse-logo.png'));
  assert(!src['index.html'].includes('assets/madhouse-logo.png'));
  assert(!src['index.html'].includes('.webp'));
});

const user=boot();
check('Source adapter returns safe copies and reports all five integrations as disconnected',()=>{
  const a=user.win.MJ_SOURCE_ADAPTER;
  assert(a&&a.mode==='sample'&&a.readOnly);
  assert.equal(a.getSources().length,5);
  assert(a.getSources().every(x=>x.state==='not-connected'&&x.lastSynced===null));
  assert.equal(a.getProvenance().recordCount,51);
  const copy=a.getSnapshot();
  assert.equal(copy.employees.length,51);
  assert(a.validateSnapshot(copy));
  copy.employees[0].name='Accidental change';
  assert(user.win.MJ_SEED.employees[0].name!=='Accidental change');
  assert(!a.validateSnapshot({divisions:[],employees:[{id:'fake',division:'missing'}],stages:[],kit:[]}));
  assert(src['index.html'].indexOf('data-adapter.js')>src['index.html'].indexOf('data.js'));
  assert(src['index.html'].indexOf('data-adapter.js')<src['index.html'].indexOf('app.js'));
});

check('Monitoring overview presents eight comparable divisions and milestones',()=>{
  user.navigate('overview');
  const html=user.html();
  assert(html.includes('overview-summary-grid'));
  assert(html.includes('overview-division-rail'));
  assert.equal((html.match(/class="monitor-division-row"/g)||[]).length,8);
  assert.equal((html.match(/class="overview-stage-row"/g)||[]).length,8);
  assert(html.includes('overview-milestone-list'));
  assert(html.includes('overview-followups'));
  assert(!html.includes('Hours Studied'));
  assert(src['index.html'].indexOf('refined.css')>src['index.html'].indexOf('reader.css'));
});

check('No access gate, saved persona, chooser or editable source controls remain',()=>{
  for(const absent of ['workspaceModal(', 'workspaceChosen', 'data-action="select-viewer"', 'data-action="choose-workspace"', 'maddie-journey-viewer-v2', 'function changeField(', 'function openRecordEditor(']){
    assert(!src['app.js'].includes(absent),absent);
  }
  assert(!src['reader.css'].includes('/* A first-visit chooser'));
  assert(src['reader.css'].includes('.workspace-subnav'));
});

check('Landing is a single focused hero without card strips or percentage badges',()=>{
  user.navigate('welcome');
  const html=user.html();
  assert(html.includes('landing-hero'));
  assert(!html.includes('assets/madhouse-logo.png'));
  assert(html.includes('data-nav="overview"'));
  assert(!html.includes('data-nav="divisions"'));
  for(const forbidden of ['landing-audiences','landing-shortcuts','landing-audience-card','landing-shortcut','Who is using the dashboard?','89%']){
    assert(!html.includes(forbidden),'Unexpected landing element: '+forbidden);
  }
  user.navigate('overview');
  assert(user.html().includes('Organization overview'));
  assert(!user.html().includes('workspace-gate'));
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

check('Employee directory supports search, division scope, stable sort and clearing',()=>{
  user.navigate('employees');
  assert(user.html().includes('data-ui="employeeSort"'));
  assert(user.html().includes('51 of 51 employees'));
  const person=user.win.MJ_SEED.employees[0];
  user.setFilter('query',person.id);
  assert(user.html().includes('1 of 51 employees'),person.id);
  assert(user.html().includes(person.id));
  assert(user.html().includes('data-action="clear-search"'));
  user.setFilter('employeeSort','kpi');
  assert(user.html().includes('data-ui="employeeSort"'));
  assert(user.html().includes('1 of 51 employees'));
  user.click('clear-search');
  assert(user.html().includes('51 of 51 employees'));
  user.click('set-scope',{division:'design'});
  const expected=user.win.MJ_SEED.employees.filter(e=>e.division==='design').length;
  assert(user.html().includes(expected+' of '+expected+' employees'));
});

check('Directory CSV exports only visible rows and does not modify employee data',()=>{
  user.navigate('employees');
  const before=JSON.stringify(user.win.MJ_SEED.employees);
  const id=user.win.MJ_SEED.employees[2].id;
  user.setFilter('query',id);
  user.click('export-csv');
  const file=user.downloads.at(-1);
  assert.equal(file.filename,'maddie-journey-directory-visible.csv');
  assert(file.mime.startsWith('text/csv'));
  assert.equal(file.text.trim().split('\r\n').length,2);
  assert(file.text.includes(id));
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),before);
});

check('CSV formula-like values are protected when exported from sample fixtures',()=>{
  const isolated=boot({},'#employees',fixture=>{fixture.employees[0].name='=SUM(1,2)';});
  isolated.click('export-csv');
  const file=isolated.downloads.at(-1);
  assert(file.text.includes('"'+"'"+'=SUM(1,2)"'));
  assert.equal(isolated.win.MJ_SEED.employees[0].name,'=SUM(1,2)');
});

check('Data Sources discloses sample quality checks without implying source verification',()=>{
  user.navigate('sources');
  const q=user.win.MJ_SOURCE_ADAPTER.getQualityReport();
  assert(q.structureValid);
  assert.equal(q.issueCount,0);
  assert.equal(q.uniqueEmployeeIds,51);
  assert.equal(q.divisionCount,8);
  assert.equal(q.stageCount,7);
  assert.equal(q.kitItemCount,11);
  const h=user.html();
  assert(h.includes('Sample data integrity'));
  assert(h.includes('Structural checks on the fictional fixture only'));
  assert(h.includes('Structure checks passed'));
  assert(h.includes('Not connected'));
});

check('An invalid sample fixture shows a recoverable screen instead of an app crash',()=>{
  const broken=boot({},'#overview',fixture=>{fixture.employees[0].division='nonexistent';});
  const h=broken.html();
  assert(h.includes('Sample data unavailable'));
  assert(h.includes('Reload dashboard'));
  assert(!h.includes('workspace-sidebar'));
});

check('Division employee list shortcut selects a visible List tab',()=>{
  user.click('goto-division',{division:'rmd'});
  assert(user.html().includes('data-tab="list"'));
  user.click('division-tab',{tab:'list'});
  assert(user.html().includes('class="table department-table"'));
  assert(user.html().includes('data-tab="list"'));
});

check('Keyboard search works across desktop platforms without hijacking typing',()=>{
  user.navigate('overview');
  const ctrl=user.key('k',{ctrlKey:true});
  assert(ctrl.prevented);
  assert(user.html().includes('data-ui="query"'));
  user.navigate('overview');
  const command=user.key('k',{metaKey:true});
  assert(command.prevented);
  assert(user.html().includes('data-ui="query"'));
  user.navigate('overview');
  const slash=user.key('/');
  assert(slash.prevented);
  assert(user.html().includes('data-ui="query"'));
  user.navigate('overview');
  const typing=user.key('/',{target:{tagName:'INPUT'}});
  assert(!typing.prevented);
  assert(user.html().includes('Organization overview'));
});

check('Escape closes the mobile navigation drawer',()=>{
  user.navigate('overview');
  user.click('mobile');
  assert(user.html().includes('layout menu-open'));
  user.key('Escape');
  assert(!user.html().includes('layout menu-open'));
});

check('Attendance exposes both weekly and monthly read-only breakdowns',()=>{
  user.navigate('attendance');
  assert(user.html().includes('class="panel compact-details attendance-breakdown"'));
  assert(user.html().includes('data-ui="frequency"'));
  assert(user.html().includes('Weekly and monthly summary'));
  user.setFilter('frequency','weekly');
  assert(user.html().includes('value="weekly" selected'));
  user.setFilter('frequency','monthly');
  assert(user.html().includes('value="monthly" selected'));
  assert(user.html().includes('Late arrivals'));
  assert(user.html().includes('Approved leaves'));
});

check('Desktop sidebar collapses to icon navigation and remembers the state',()=>{
  user.navigate('overview');
  assert(user.html().includes('id="primary-navigation"'));
  assert(user.html().includes('data-action="toggle-sidebar"'));
  assert(user.html().includes('aria-label="Collapse sidebar"'));
  assert(!user.html().includes('sidebar-collapsed'));
  user.click('toggle-sidebar');
  assert(user.html().includes('sidebar-collapsed'));
  assert(user.html().includes('aria-label="Expand sidebar"'));
  assert.equal(user.mem['maddie-journey-sidebar-collapsed'],'true');
  assert.equal((user.html().match(/class="workspace-mainnav-item /g)||[]).length,5);
  user.click('toggle-sidebar');
  assert(!user.html().includes('sidebar-collapsed'));
  assert.equal(user.mem['maddie-journey-sidebar-collapsed'],'false');
  const returning=boot({'maddie-journey-sidebar-collapsed':'true'},'#journey');
  assert(returning.html().includes('sidebar-collapsed'));
  assert(returning.html().includes('data-nav="journey"'));
});

check('One Inter font and neutral backgrounds are the final theme',()=>{
  const css=src['mono.css'],html=src['index.html'];
  assert(html.includes('family=Inter'));
  assert(css.includes('font-family:"Inter",sans-serif!important'));
  assert(css.includes('--mono-bg:#ffffff'));
  assert(css.includes('--mono-bg:#080808'));
  assert(css.includes('--mono-accent:#db3c7c'));
  assert(css.includes('.overview-summary-grid .overview-summary-tile'));
  assert(html.indexOf('mono.css')>html.indexOf('refined.css'));
  assert(!html.includes('.webp'));
});

check('Anime.js v4 is optional, reduced-motion aware and limits its motion',()=>{
  const html=src['index.html'],code=src['motion.js'];
  assert(html.includes('animejs@4.5.0/dist/bundles/anime.umd.min.js'));
  assert(html.indexOf('motion.js')>html.indexOf('app.js'));
  assert(code.includes('prefers-reduced-motion: reduce'));
  assert(code.includes("doc.visibilityState==='hidden'"));
  assert(!code.includes('loop:true'));
  const made=[],fakeNodes=[{name:'header'},{name:'hero'}];
  const doc={
    readyState:'complete',visibilityState:'visible',
    querySelector(selector){return selector==='.landing-shell'?{}:null;},
    querySelectorAll(){return fakeNodes;}
  };
  const win={anime:{animate(node,params){made.push({node,params});}},matchMedia(){return{matches:false}}};
  new Function('window','document',code)(win,doc);
  assert.equal(made.length,2);
  win.MJ_MOTION.refresh('welcome');
  assert.equal(made.length,2);
  const still=[],reduced={anime:{animate(){still.push(true);}},
    matchMedia(){return{matches:true}}};
  new Function('window','document',code)(reduced,doc);
  assert.equal(still.length,0);
  const noCDN={matchMedia(){return{matches:false}}};
  new Function('window','document',code)(noCDN,doc);
  assert(typeof noCDN.MJ_MOTION.refresh==='function');
});

check('Every rendered screen uses handled action names',()=>{
  const handlers=new Set([...src['app.js'].matchAll(/if\(name==='([^']+)'\)/g)].map(m=>m[1]));
  for(const tab of ['overview','divisions','employees','milestones','journey','kit','attendance','kpi','approvals','sources','audit']){
    user.navigate(tab);
    for(const m of user.html().matchAll(/data-action="([^"]+)"/g)){
      assert(handlers.has(m[1]),'Unimplemented '+m[1]+' on '+tab);
    }
  }
});

check('Navigation stays focused with one landing destination',()=>{
  user.navigate('welcome');
  const landing=user.html();
  assert(!landing.includes('landing-header-cta'));
  assert.equal((landing.match(/data-nav="overview"/g)||[]).length,1);
  assert(!landing.includes('data-nav="divisions"'));
  user.navigate('overview');
  assert(!user.html().includes('workspace-subnav-caption'));
  assert(!user.html().includes('sidebar-return-link'));
  user.navigate('employees');
  user.click('open',{id:'MJ-003'});
  assert(!user.html().includes('profile-action-buttons'));
  assert(user.html().includes('employee-modal-tabs'));
  user.click('close');
});
check('Unrecognized employee ID cannot break the viewer',()=>{
  user.navigate('employees');
  user.click('open',{id:'NONEXISTENT'});
  assert(!user.html().includes('role="dialog"'));
  assert(user.html().includes('All Maddies'));
});
check('The optional mobile drawer animates only on entrance',()=>{
  const made=[],drawer={id:'drawer'};
  let open=false;
  const doc={
    readyState:'complete',visibilityState:'visible',
    querySelector(q){return q==='.layout.menu-open .workspace-sidebar'&&open?drawer:null;},
    querySelectorAll(){return[];}
  };
  const win={anime:{animate(el,options){made.push({el,options});}},matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(win,doc);
  assert.equal(made.length,0);
  open=true;win.MJ_MOTION.refresh('overview');
  assert.equal(made.length,1);
  assert.equal(made[0].el,drawer);
  win.MJ_MOTION.refresh('overview');
  assert.equal(made.length,1);
});
check('Logo-free landing and attention-first dashboard are structurally sound',()=>{
  user.navigate('welcome');
  assert(!user.html().includes('<img'));
  assert(user.html().includes('Clarity across'));
  assert(user.html().includes('Enter workspace'));
  assert(src['mono.css'].includes('height:100dvh'));
  assert(src['mono.css'].includes('body:has(.landing-shell)'));
  assert(src['mono.css'].includes('background-size:cover!important'));
  user.navigate('overview');
  assert(user.html().includes('overview-monitor-grid'));
  assert(user.html().indexOf('overview-followups')<user.html().indexOf('overview-division-rail'));
  assert(!user.html().includes('sidebar-official-logo'));
  assert(user.html().includes('brand-product-name'));
});
check('Four monitoring signals route to existing read-only screens',()=>{
  user.navigate('overview');
  const part=user.html().split('class="overview-summary-grid"')[1].split('</section>')[0];
  assert.equal((part.match(/class="overview-summary-tile tone-[^"]+ overview-signal"/g)||[]).length,4);
  for(const tab of ['employees','journey','kit','kpi'])assert(part.includes('data-action="nav" data-tab="'+tab+'"'));
});
check('Triage list counts unique people and retains category coverage',()=>{
  user.navigate('overview');
  user.click('work-view',{mode:'list'});
  user.click('attention-filter',{kind:'all'});
  user.click('attention-more');
  const full=user.html();
  const ids=full.split('class="work-list-row"').slice(1).map(part=>part.split('data-action="open" data-id="')[1]?.split('"')[0]).filter(Boolean);
  assert(ids.length>8);
  assert.equal(new Set(ids).size,ids.length);
  const count=full.split('class="queue-count" aria-live="polite">')[1]?.split('</span>')[0]?.match(/[0-9]+/g);
  assert(count&&count.length===2);
  assert.equal(ids.length,Number(count[0]));
  assert(Number(count[1])>=ids.length);
  user.click('attention-filter',{kind:'kpi'});
  user.click('attention-more');
  const kpiIds=user.html().split('class="work-list-row"').slice(1).map(part=>part.split('data-action="open" data-id="')[1]?.split('"')[0]).filter(Boolean);
  assert.equal(new Set(kpiIds).size,kpiIds.length);
  assert.equal(kpiIds.length,user.win.MJ_SEED.employees.filter(e=>!e.kpiValidated).length);
});
check('Keyboard focus is restored after in-place priority filter change',()=>{
  const fresh=boot({},'#overview');
  let focused=0;
  fresh.doc.querySelectorAll=selector=>selector==='[data-action]'?
    [{dataset:{action:'attention-filter',kind:'kpi'},focus(){focused++;}}]:[];
  fresh.click('attention-filter',{kind:'kpi'});
  assert.equal(focused,1);
  assert(fresh.html().includes('aria-pressed="true">KPI'));
});
check('Phase 1 design tokens and compact navigation are consistent',()=>{
  const css=src['mono.css'];
  for(const token of ['--mj-space-1','--mj-space-4','--mj-radius-panel','--mj-type-section','--mj-control-min']){
    assert(css.includes(token),token);
  }
  user.navigate('overview');
  const h=user.html();
  assert(!h.includes('workspace-sidebar-caption'));
  assert(h.includes('data-action="nav" data-tab="sources"'));
  assert(h.includes('Sample · Not connected'));
  assert(!h.includes('51 fictional employees · Read-only preview'));
});
check('Phase 2 attendance snapshot reflects verified concerns and unverified entries',()=>{
  const team=user.win.MJ_SEED.employees;
  const affected=team.filter(e=>e.attendance.some(r=>
    r.verified&&((r.type==='Late'&&r.approval!=='Excused')||
    (r.type==='Absent'&&r.approval==='Unapproved')))).length;
  const unverified=team.reduce((n,e)=>n+e.attendance.filter(r=>!r.verified).length,0);
  user.navigate('overview');
  const h=user.html();
  assert(h.includes('class="monitor-pulse-primary-count">'+affected+'</span>'));
  assert(h.includes(unverified+' attendance entries await verification'));
  assert(h.includes('data-action="nav" data-tab="attendance"'));
  assert(h.includes('fictional records only'));
});
check('Phase 2 division comparison is derived from the eight real fixture groups',()=>{
  user.navigate('overview');
  const h=user.html();
  const matrix=h.split('class="overview-division-rail monitor-division-matrix"')[1]?.split('</section>')[0];
  assert(matrix);
  assert.equal((matrix.match(/class="monitor-division-row"/g)||[]).length,8);
  for(const division of user.win.MJ_SEED.divisions){
    const subset=user.win.MJ_SEED.employees.filter(e=>e.division===division.id);
    assert(matrix.includes('data-division="'+division.id+'"'));
    assert(matrix.includes('Open '+division.name+': '+subset.length+' people'));
  }
  const first=user.win.MJ_SEED.divisions[0];
  user.click('goto-division',{division:first.id});
  assert(user.html().includes(first.name));
  assert(user.html().includes('division-tabs'));
});
check('Phase 2 triage explains priority and signals without duplicate people',()=>{
  user.navigate('overview');
  user.click('work-view',{mode:'list'});
  user.click('attention-filter',{kind:'all'});
  const h=user.html();
  assert(h.includes('class="monitor-priority-cue monitor-priority-'));
  assert(h.includes('class="monitor-signal-text"'));
  assert(h.includes('other signals for this person')||h.includes('other signal for this person'));
  assert(!h.includes('Critical'));
});
check('Phase 3 division tabs preserve shareable subview routes',()=>{
  user.click('goto-division',{division:'rmd'});
  assert.equal(user.loc.hash,'#division/rmd');
  user.click('division-tab',{tab:'list'});
  assert.equal(user.loc.hash,'#division/rmd/list');
  assert(user.html().includes('department-table'));
  const reload=boot({},'#division/rmd/list');
  assert(reload.html().includes('department-table'));
  user.click('division-tab',{tab:'chart'});
  assert.equal(user.loc.hash,'#division/rmd/chart');
  assert(user.html().includes('org-canvas'));
  const reloadChart=boot({},'#division/rmd/chart');
  assert(reloadChart.html().includes('org-canvas'));
  user.click('division-tab',{tab:'summary'});
  assert.equal(user.loc.hash,'#division/rmd');
});
check('Phase 3 division follow-ups use one issue per person with accurate detail links',()=>{
  user.click('goto-division',{division:'rmd'});
  const h=user.html(),section=h.split('class="panel division-next"')[1]?.split('</section>')[0];
  assert(section);
  assert(section.includes('Highest-priority recorded signal'));
  assert(section.includes('monitor-priority-cue'));
  assert(section.includes('data-detail="attendance"')||section.includes('data-detail="kpi"'));
  assert(!h.includes('division-next-actions'));
  const ids=[...section.matchAll(/data-action="open" data-id="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
});
check('Phase 3 employee preview browses only division members and retains detail',()=>{
  user.click('goto-division',{division:'rmd'});
  user.click('division-tab',{tab:'list'});
  const team=user.win.MJ_SEED.employees.filter(e=>e.division==='rmd').sort((a,b)=>a.name.localeCompare(b.name));
  assert(team.length>1);
  user.click('open',{id:team[0].id,detail:'kpi'});
  let h=user.html();
  assert(h.includes('employee-context-bar'));
  assert(h.includes('1 of '+team.length));
  assert(h.includes('data-action="viewer-prev" aria-label="No previous employee" disabled'));
  assert(h.includes('data-tab="kpi" aria-current="page"'));
  user.click('viewer-next');
  h=user.html();
  assert(h.includes('EMPLOYEE · '+team[1].id));
  assert(h.includes('2 of '+team.length));
  assert(h.includes('data-tab="kpi" aria-current="page"'));
  user.click('viewer-prev');
  assert(user.html().includes('EMPLOYEE · '+team[0].id));
  user.click('close');
  assert(user.html().includes('department-table'));
  assert.equal(user.loc.hash,'#division/rmd/list');
});
check('Phase 3 directory reader stays within filtered result set',()=>{
  user.navigate('employees');
  user.setFilter('query','MJ-003');
  user.click('open',{id:'MJ-003'});
  const h=user.html();
  assert(h.includes('1 of 1'));
  assert(h.includes('data-action="viewer-prev" aria-label="No previous employee" disabled'));
  assert(h.includes('data-action="viewer-next" aria-label="No next employee" disabled'));
  user.click('viewer-next');
  assert(user.html().includes('EMPLOYEE · MJ-003'));
  user.click('close');
  assert(user.html().includes('value="MJ-003"'));
});
check('Phase 3 employee to division drill-down highlights the selected person',()=>{
  user.navigate('overview');
  user.click('open',{id:'MJ-003',detail:'journey'});
  assert(user.html().includes(' of 51'));
  const division=user.win.MJ_SEED.employees.find(e=>e.id==='MJ-003').division;
  user.click('viewer-division',{division});
  const h=user.html();
  assert(!h.includes('role="dialog"'));
  assert(h.includes('department-table'));
  assert(h.includes('department-focus-row'));
  assert.equal(user.loc.hash,'#division/'+division+'/list');
  assert(h.includes(user.win.MJ_SEED.employees.find(e=>e.id==='MJ-003').name));
});
check('Phase 4 journey distributions count each person and every checklist task',()=>{
  user.navigate('journey');
  const staff=user.win.MJ_SEED.employees;
  const expectedTasks=staff.reduce((n,e)=>n+e.journey.flat().filter(Boolean).length,0);
  const possible=staff.reduce((n,e)=>n+e.journey.flat().length,0);
  const html=user.html(),section=html.split('class="panel journey-distribution"')[1]?.split('</section>')[0];
  assert(section);
  assert(section.includes(expectedTasks+' / '+possible+' checklist tasks completed'));
  assert.equal((section.match(/class="report-distribution-cell"/g)||[]).length,8);
  const counts=[...section.matchAll(/<td><strong>(\d+) \/ 51<\/strong><\/td>/g)].map(m=>Number(m[1]));
  assert.equal(counts.length,8);
  assert.equal(counts.reduce((a,b)=>a+b,0),51);
  user.click('journey-view',{mode:'table'});
  assert(user.html().includes('tasks · '));
  user.click('set-scope',{division:'media'});
  const media=staff.filter(e=>e.division==='media');
  const scoped=user.html().split('class="panel journey-distribution"')[1]?.split('</section>')[0];
  assert(scoped.includes(' / '+media.length+'</strong>'));
});
check('Phase 4 KPI table contributions exactly reconcile to weighted score',()=>{
  const e=user.win.MJ_SEED.employees[2];
  const parts=[['division',15],['individual',45],['values',15],['behavior',25]];
  const contributions=parts.map(([k,w])=>e.scores[k]*w/100);
  const weighted=Math.round(contributions.reduce((a,b)=>a+b,0)*100)/100;
  user.navigate('employees');
  user.click('open',{id:e.id,detail:'kpi'});
  const html=user.html(),comp=html.split('class="table kpi-composition-table"')[1]?.split('</table>')[0];
  assert(comp);
  for(const point of contributions)assert(comp.includes(point.toFixed(2)+' pts'));
  assert(comp.includes(weighted.toFixed(2)+' / 100'));
  assert(comp.includes('<td>100%</td>'));
  assert(html.includes('Demo validation flag unset'));
  user.click('detail',{tab:'preview'});
  for(const point of contributions)assert(user.html().includes(point.toFixed(2)+' weighted points'));
  user.click('close');
});
check('Phase 4 attendance audit counts verified, pending and concern entries exactly',()=>{
  const staff=user.win.MJ_SEED.employees,all=staff.flatMap(e=>e.attendance);
  const verified=all.filter(r=>r.verified),pending=all.length-verified.length;
  const affected=staff.filter(e=>e.attendance.some(r=>r.verified&&
    ((r.type==='Late'&&r.approval!=='Excused')||(r.type==='Absent'&&r.approval==='Unapproved')))).length;
  const concerns=verified.filter(r=>(r.type==='Late'&&r.approval!=='Excused')||
    (r.type==='Absent'&&r.approval==='Unapproved')).length;
  user.navigate('attendance');
  const panel=user.html().split('class="panel attendance-audit-panel"')[1]?.split('</section>')[0];
  assert(panel);
  assert(panel.includes(verified.length+' / '+all.length));
  assert(panel.includes(affected+' / '+staff.length+' people affected'));
  assert(panel.includes('>'+concerns+'</strong>'));
  assert(panel.includes('>'+pending+'</strong>'));
  assert(panel.includes('No records does not mean perfect attendance'));
  assert(user.html().includes('attendance-breakdown" open'));
});
check('Phase 4 attendance monthly buckets reconcile event classifications',()=>{
  user.navigate('attendance');
  const section=user.html().split('class="table attendance-period-table"')[1]?.split('</table>')[0];
  const items=user.win.MJ_SEED.employees.flatMap(e=>e.attendance).filter(r=>r.verified);
  const periods=[...new Set(items.map(r=>r.date.slice(0,7)))].sort().reverse().slice(0,12);
  assert.equal((section.match(/<tr><th scope="row">20\d\d-/g)||[]).length,periods.length);
  const key=periods[0],batch=items.filter(r=>r.date.startsWith(key));
  const late=batch.filter(r=>r.type==='Late').length;
  const absent=batch.filter(r=>r.type==='Absent').length;
  const excused=batch.filter(r=>r.type==='Late'&&r.approval==='Excused').length;
  const approved=batch.filter(r=>r.type==='Leave'&&r.approval==='Approved').length;
  const concerns=batch.filter(r=>(r.type==='Late'&&r.approval!=='Excused')||
    (r.type==='Absent'&&r.approval==='Unapproved')).length;
  assert(section.includes('<th scope="row">'+key+'</th><td>'+batch.length+'</td><td>'+
    late+'</td><td>'+absent+'</td><td>'+excused+'</td><td>'+approved+'</td><td>'+concerns+'</td>'));
  user.setFilter('frequency','weekly');
  assert(user.html().includes('value="weekly" selected'));
});
check('Phase 4 review status tables never infer missing dates or approvals',()=>{
  user.navigate('employees');
  user.click('open',{id:'MJ-001',detail:'approvals'});
  let h=user.html(),table=h.split('class="table-wrap review-record-table"')[1]?.split('</table>')[0];
  assert(table);
  assert(table.includes('Recorded date'));
  assert.equal((table.match(/<tr><td>0[1-4]<\/td>/g)||[]).length,4);
  assert(table.includes('Approved'));
  assert(h.includes('4 / 4 stages show an endorsed or approved status'));
  assert(h.includes('not evidence of a verified chronological audit trail'));
  user.click('close');
  user.click('open',{id:'MJ-002',detail:'approvals'});
  h=user.html();
  assert(h.includes('0 / 4 stages show an endorsed or approved status'));
  assert(h.includes('Not recorded'));
  assert(h.includes('No recorded comment'));
  user.click('close');
});
check('Phase 4 division comparison KPI and denominators agree with the fixture',()=>{
  user.navigate('overview');
  const table=user.html().split('class="overview-division-rail monitor-division-matrix"')[1]?.split('</section>')[0];
  assert(table);
  assert.equal((table.match(/class="monitor-division-row"/g)||[]).length,8);
  for(const d of user.win.MJ_SEED.divisions){
    const team=user.win.MJ_SEED.employees.filter(e=>e.division===d.id);
    const scores=team.map(e=>Math.round((e.scores.division*.15+e.scores.individual*.45+
      e.scores.values*.15+e.scores.behavior*.25)*100)/100);
    const avg=Math.round(scores.reduce((sum,x)=>sum+x,0)/team.length);
    const pending=team.filter(e=>e.review.division.status!=='Endorsed').length;
    const row=table.split('data-division="'+d.id+'"')[1]?.split('</button>')[0];
    assert(row,d.id);
    assert(row.includes('class="monitor-division-kpi"')||row.includes('monitor-division-kpi'));
    assert(row.includes('>'+avg+'%</b>'),d.id+' score');
    assert(row.includes('>'+pending+' / '+team.length+'</b>'),d.id+' reviews');
  }
  assert(table.includes('not combined task totals'));
  assert(table.includes('Official KPI data is disconnected'));
});
console.log('\n'+results.length+' smoke tests passed. Physical-device visual QA is separate.');
