/* Maddie Journey v3.3 — dependency-free read-only smoke checks.
   Run from repository root: node tests/smoke.js
   Simulated interactions; browser/device visual QA is separate. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const files=['index.html','data.js','data-adapter.js','icons.js','monitoring.js','app.js','operations.css','palette.css','landing.css','workspace.css','reader.css','refined.css','mono.css','motion.js'];
const src=Object.fromEntries(files.map(name=>[name,read(name)]));
const results=[];
function check(name,fn){fn();results.push(name);console.log('PASS '+name);}

function boot(initial={},hash='',mutateFixture,configureRuntime){
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
  new Function('window',src['icons.js'])(win);
  new Function('window',src['monitoring.js'])(win);
  if(configureRuntime)configureRuntime(win,doc);
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
    navigate(tab){this.click('nav',{tab});},
    typeSearch(value){
      const el={dataset:{ui:'query'},value,selectionStart:value.length,
        focus(){},setSelectionRange(){}};
      doc.activeElement=el;events.input({target:el});return el;
    }
  };
}

check('Files parse; reader CSS is last and PNG/JPEG media are preserved',()=>{
  new Function(src['data.js']);new Function(src['data-adapter.js']);new Function(src['icons.js']);new Function(src['monitoring.js']);new Function(src['app.js']);new Function(src['motion.js']);
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
    employees:[['employees','Directory'],['milestones','Milestones'],['calendar','Calendar']],
    journey:[['journey','Journey board'],['kit','Welcome Kit'],['files201','201 Files'],['attendance','Attendance']],
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

check('All thirteen screens accessible to any visitor, read-only',()=>{
  const screens=['overview','divisions','employees','milestones','calendar','journey','kit','files201','attendance','kpi','approvals','sources','audit'];
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
  assert(comp.includes('<td class="report-num">100%</td>'));
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
  assert(section.includes('<th scope="row">'+key+'</th><td class="report-num">'+batch.length+
    '</td><td class="report-num">'+late+'</td><td class="report-num">'+absent+
    '</td><td class="report-num">'+excused+'</td><td class="report-num">'+approved+
    '</td><td class="report-num">'+concerns+'</td>'));
  user.setFilter('frequency','weekly');
  assert(user.html().includes('value="weekly" selected'));
});
check('Phase 4 review status tables never infer missing dates or approvals',()=>{
  user.navigate('employees');
  user.click('open',{id:'MJ-001',detail:'approvals'});
  let h=user.html(),table=h.split('class="table-wrap review-record-table"')[1]?.split('</table>')[0];
  assert(table);
  assert(table.includes('Recorded date'));
  assert.equal((table.match(/<tr><td class="report-num">0[1-4]<\/td>/g)||[]).length,4);
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
check('Phase 5 landing skip link targets a true main landmark and retains one viewport',()=>{
  user.navigate('welcome');
  const markup=user.html();
  assert(markup.includes('<main id="main-content" class="landing-main" tabindex="-1">'));
  assert(!markup.includes('class="landing-shell" id="main-content"'));
  assert(src['mono.css'].includes('max-height:100dvh'));
  assert(src['mono.css'].includes('body:has(.landing-shell){overflow:hidden!important}'));
  user.navigate('overview');
  assert(user.html().includes('<main id="main-content" class="main" tabindex="-1">'));
});
check('Phase 5 mobile drawer exposes a close action and isolates workspace content',()=>{
  user.navigate('overview');
  user.click('mobile');
  const markup=user.html();
  assert(markup.includes('role="dialog" aria-modal="true" aria-label="Workspace navigation"'));
  assert(markup.includes('class="mobile-drawer-close" data-action="mobile"'));
  assert(markup.includes('<main id="main-content" class="main" tabindex="-1" inert>'));
  assert(markup.includes('class="workspace-scrim" aria-label="Close navigation" tabindex="-1" aria-hidden="true"'));
  user.click('mobile');
  assert(!user.html().includes('menu-open'));
  assert(!user.html().includes('aria-modal="true" aria-label="Workspace navigation"'));
});
check('Phase 5 drawer traps Tab and restores keyboard focus on Escape',()=>{
  const ctx=boot({},'#overview'),mount=ctx.doc.getElementById('app');
  let opened=0,closed=0,firstFocus=0,lastFocus=0;
  const first={focus(){firstFocus++;}},last={focus(){lastFocus++;}};
  const drawer={querySelectorAll(){return[first,last];}};
  mount.querySelector=function(q){
    if(q==='.workspace-sidebar .mobile-drawer-close')return{focus(){opened++;}};
    if(q==='.mobile-top [data-action="mobile"]')return{focus(){closed++;}};
    if(q==='.workspace-sidebar')return drawer;
    return null;
  };
  ctx.click('mobile');
  assert.equal(opened,1);
  ctx.doc.activeElement=first;
  const reverse=ctx.key('Tab',{shiftKey:true});
  assert(reverse.prevented);
  assert.equal(lastFocus,1);
  ctx.doc.activeElement=last;
  const forward=ctx.key('Tab');
  assert(forward.prevented);
  assert.equal(firstFocus,1);
  const esc=ctx.key('Escape');
  assert(esc.prevented);
  assert.equal(closed,1);
  assert(!ctx.html().includes('menu-open'));
});
check('Phase 5 overflow regions are keyboard accessible only when scrolling is needed',()=>{
  const ctx=boot({},'#employees'),mount=ctx.doc.getElementById('app');
  const attributes={},wrap={
    scrollWidth:900,clientWidth:320,dataset:{},
    closest(){return{querySelector(){return{textContent:'People directory'};}};},
    setAttribute(key,value){attributes[key]=value;},
    removeAttribute(key){delete attributes[key];}
  };
  mount.querySelectorAll=selector=>selector==='.table-wrap'?[wrap]:[];
  ctx.navigate('attendance');
  assert.equal(attributes.tabindex,'0');
  assert.equal(attributes.role,'region');
  assert(attributes['aria-label'].includes('People directory table'));
  assert.equal(wrap.dataset.overflow,'true');
  wrap.scrollWidth=250;ctx.win.handlers.resize();
  assert.equal(attributes.tabindex,undefined);
  assert.equal(attributes.role,undefined);
  assert.equal(wrap.dataset.overflow,undefined);
});
check('Phase 5 arrow keys change the existing division view without extra navigation',()=>{
  const ctx=boot({},'#division/rmd');
  const first={dataset:{action:'division-tab',tab:'summary'}};
  const second={dataset:{action:'division-tab',tab:'list'}};
  const strip={querySelectorAll(){return[first,second];}};
  first.closest=()=>strip;
  const ev=ctx.key('ArrowRight',{target:first});
  assert(ev.prevented);
  assert.equal(ctx.loc.hash,'#division/rmd/list');
  assert(ctx.html().includes('department-table'));
  assert(ctx.html().includes('aria-pressed="true"'));
});
check('Phase 5 mobile styles include 320px safeguards, touch size and focus contrast',()=>{
  const css=src['mono.css'];
  for(const term of [
    '@media(max-width:359px)','@media(max-width:420px)','@media(max-width:760px)',
    'min-height:44px','--mj-focus-accent:#a82759',
    '@media(forced-colors:active)','scrollbar-width:thin',
    'body .employee-modal .employee-modal-body','body .table-wrap[data-overflow="true"]'
  ])assert(css.includes(term),term);
  assert(css.includes('min-width:max(750px,100%)'));
  assert(css.includes('height:100dvh'));
  assert(css.includes('body .main{overflow:visible'));
});
check('Phase 6 page entrances have no list staggering and cap at two surfaces',()=>{
  const elements=Array.from({length:700},(_,i)=>({id:i})),seen=[];
  const doc={readyState:'complete',visibilityState:'visible',querySelector(){return null;},
    querySelectorAll(){return elements;}};
  const win={anime:{animate(el,p){seen.push({el,p});}},matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(win,doc);
  assert.equal(seen.length,2);
  assert(seen.every(({el,p})=>(el===elements[0]||el===elements[1])&&p.delay===0&&p.duration<=165));
  win.MJ_MOTION.refresh('overview');assert.equal(seen.length,2);
  win.MJ_MOTION.refresh('journey');assert.equal(seen.length,4);
});
check('Phase 6 mobile drawer is never animated twice as another modal',()=>{
  const el={id:'drawer'},seen=[];let opened=false;
  const doc={readyState:'complete',visibilityState:'visible',querySelector(q){
    if(q==='.layout.menu-open .workspace-sidebar')return opened?el:null;
    if(q==='[role="dialog"]')return opened?el:null;
    return null;
  },querySelectorAll(){return[];}};
  const win={anime:{animate(x,p){seen.push({x,p});}},matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(win,doc);
  opened=true;win.MJ_MOTION.refresh('overview');
  assert.equal(seen.length,1);assert.equal(seen[0].x,el);assert.equal(seen[0].p.duration,150);
  win.MJ_MOTION.refresh('overview');assert.equal(seen.length,1);
  opened=false;win.MJ_MOTION.refresh('overview');
  opened=true;win.MJ_MOTION.refresh('overview');assert.equal(seen.length,2);
});
check('Phase 6 employee modal transitions once per opening, not per detail',()=>{
  const el={id:'dialog'},seen=[];let opened=false;
  const doc={readyState:'complete',visibilityState:'visible',querySelector(q){
    return q.startsWith('.employee-modal[role="dialog"]')&&opened?el:null;
  },querySelectorAll(){return[];}};
  const win={anime:{animate(x,p){seen.push({x,p});}},matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(win,doc);
  opened=true;win.MJ_MOTION.refresh('employees');
  assert.equal(seen.length,1);assert.equal(seen[0].p.duration,155);
  win.MJ_MOTION.refresh('employees');assert.equal(seen.length,1);
  opened=false;win.MJ_MOTION.refresh('employees');
  opened=true;win.MJ_MOTION.refresh('employees');assert.equal(seen.length,2);
});
check('Phase 6 respects reduced-motion, hidden tabs and Save-Data',()=>{
  for(const kind of ['reduced','hidden','save-data']){
    const calls=[],doc={readyState:'complete',visibilityState:kind==='hidden'?'hidden':'visible',
      querySelector(){return null;},querySelectorAll(){return[{}];}};
    const win={anime:{animate(){calls.push(1);}},
      navigator:{connection:{saveData:kind==='save-data'}},
      matchMedia(){return{matches:kind==='reduced'}}};
    new Function('window','document',src['motion.js'])(win,doc);
    win.MJ_MOTION.refresh('journey');win.MJ_MOTION.feedback('attention');
    assert.equal(calls.length,0,kind);
  }
  const doc={readyState:'complete',visibilityState:'visible',querySelector(){return null;},
    querySelectorAll(){return[{}];}};
  const offline={matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(offline,doc);
  assert.doesNotThrow(()=>{offline.MJ_MOTION.refresh('journey');offline.MJ_MOTION.feedback('attention');});
  const throwing={anime:{animate(){throw Error('Animation failure');}},
    matchMedia(){return{matches:false}}};
  assert.doesNotThrow(()=>new Function('window','document',src['motion.js'])(throwing,doc));
  assert.doesNotThrow(()=>throwing.MJ_MOTION.refresh('journey'));
});
check('Phase 6 filter motion targets only a status label',()=>{
  const label={},seen=[];const doc={readyState:'complete',visibilityState:'visible',
    querySelector(q){return q==='.work-queue .queue-count'?label:null;},
    querySelectorAll(){return[];}};
  const win={anime:{animate(x,p){seen.push({x,p});}},matchMedia(){return{matches:false}}};
  new Function('window','document',src['motion.js'])(win,doc);
  win.MJ_MOTION.feedback('attention');win.MJ_MOTION.feedback('unknown');
  assert.equal(seen.length,1);assert.equal(seen[0].x,label);
  assert.equal(seen[0].p.duration,110);assert.equal(seen[0].p.delay,0);
  assert(!src['motion.js'].includes('.work-list-row'));
});
check('Phase 6 selecting active filters does not reconstruct the workspace',()=>{
  const ctx=boot({},'#overview'),root=ctx.doc.getElementById('app');
  let value=root.innerHTML,n=0;
  Object.defineProperty(root,'innerHTML',{configurable:true,get(){return value;},
    set(v){value=v;n++;}});
  ctx.click('work-view',{mode:'list'});ctx.click('attention-filter',{kind:'all'});
  assert.equal(n,0);
  ctx.click('work-view',{mode:'board'});assert.equal(n,1);
  ctx.click('work-view',{mode:'board'});assert.equal(n,1);
  ctx.click('attention-filter',{kind:'kpi'});assert.equal(n,2);
  ctx.click('attention-filter',{kind:'kpi'});assert.equal(n,2);
  ctx.click('attention-more');assert.equal(n,3);
  ctx.click('attention-filter',{kind:'kpi'});assert.equal(n,4);
  ctx.navigate('journey');const current=n;
  ctx.click('journey-view',{mode:'board'});assert.equal(n,current);
  ctx.click('journey-view',{mode:'table'});assert.equal(n,current+1);
  ctx.click('journey-view',{mode:'table'});assert.equal(n,current+1);
});
check('Phase 6 directory search updates its table in place',()=>{
  const ctx=boot({},'#employees'),root=ctx.doc.getElementById('app');
  const area={outerHTML:''},counter={textContent:''},clear={innerHTML:'',
    querySelector(){return null;}};
  const panel={querySelector(q){return q==='.table-wrap, .empty'?area:
    q==='.directory-results-count'?counter:q==='.directory-clear-slot'?clear:null;}};
  root.querySelector=q=>q==='.panel.no-pad'?panel:null;
  let scanned=0;root.querySelectorAll=()=>{scanned++;return[];};
  let html=root.innerHTML,rebuilds=0;
  Object.defineProperty(root,'innerHTML',{configurable:true,get(){return html;},
    set(v){html=v;rebuilds++;}});
  ctx.typeSearch('MJ-003');
  assert.equal(rebuilds,0);assert.equal(counter.textContent,'1 of 51 employees');
  assert(area.outerHTML.includes('MJ-003'));assert(clear.innerHTML.includes('Clear search'));
  assert(scanned>0);
});
check('Phase 6 loading and error states give accessible recovery',()=>{
  assert(src['index.html'].includes('class="boot" role="status" aria-live="polite"'));
  assert(src['index.html'].includes('Preparing the fictional monitoring snapshot'));
  const app={innerHTML:''},doc={getElementById:()=>app,title:''};
  new Function('window','document',src['app.js'])({},doc);
  assert(app.innerHTML.includes('Sample data unavailable'));
  assert(app.innerHTML.includes('role="alert"'));
  assert(app.innerHTML.includes('Reload dashboard'));
  const invalid=boot({},'#overview',fixture=>{fixture.employees[0].division='invalid';});
  assert(invalid.html().includes('class="data-error-card" role="alert"'));
  assert(!invalid.html().includes('workspace-sidebar'));
});
check('Phase 6 a broken optional animation layer does not stop the app',()=>{
  const ctx=boot({},'#overview',null,win=>{
    win.MJ_MOTION={refresh(){throw Error('CDN failure');},
      feedback(){throw Error('CDN failure');}};
  });
  assert(ctx.html().includes('Organization overview'));
  assert.doesNotThrow(()=>ctx.click('attention-filter',{kind:'kpi'}));
  assert(ctx.html().includes('aria-pressed="true">KPI'));
  assert.doesNotThrow(()=>ctx.navigate('employees'));
  assert(ctx.html().includes('All Maddies'));
});
check('201 Files catalog has nine requirements and consistent 51-person statuses',()=>{
  const snap=user.win.MJ_SOURCE_ADAPTER.getSnapshot(),quality=user.win.MJ_SOURCE_ADAPTER.getQualityReport();
  assert.equal(snap.employees.length,51);
  assert.equal(snap.documents201.length,9);
  assert.equal(quality.document201Count,9);
  assert(quality.structureValid);
  const all=new Set(['complete','missing','not-checked','not-applicable']);
  const ids=snap.documents201.map(x=>x.id);
  for(const e of snap.employees){
    assert.equal(Object.keys(e.files201).length,ids.length);
    for(const id of ids)assert(all.has(e.files201[id]),id);
  }
  const report=user.win.MJ_MONITORING.fileSummary(snap);
  assert.equal(report.total,51);
  assert.equal(report.groups.missing.length+report.groups['not-checked'].length+
    report.groups.complete.length,51);
  const missing=report.rows.reduce((n,r)=>n+r.missing.length,0);
  assert.equal(missing,snap.employees.flatMap(e=>ids.filter(id=>e.files201[id]==='missing')).length);
});
check('201 Files page lists real fictional names and specific missing documents',()=>{
  user.navigate('files201');
  const html=user.html(),snapshot=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const report=user.win.MJ_MONITORING.fileSummary(snapshot);
  assert(html.includes('<h1>201 Files Checklist</h1>'));
  assert(html.includes('By document'));
  assert(html.includes('Who is missing what'));
  assert.equal((html.match(/class="monitor-file-card"/g)||[]).length,9);
  assert(html.includes('Missing documents'));
  assert(html.includes('data-kind="missing" aria-pressed="true"'));
  assert.equal((html.match(/class="monitor-file-requirements"/g)||[]).length,
    Math.min(report.groups.missing.length,12));
  const first=report.groups.missing[0];
  assert(html.includes(first.employee.name));
  assert(first.missing.every(doc=>html.includes(doc.label)));
  assert(!html.includes('type="checkbox"'));
  assert(!html.includes('Upload document'));
  assert(html.includes('not connected'));
});
check('201 Files status categories and expansion preserve all 51 employees',()=>{
  user.navigate('files201');
  user.click('files-more');
  let h=user.html();
  assert.equal((h.match(/class="monitor-file-requirements"/g)||[]).length,21);
  user.click('files-filter',{kind:'not-checked'});
  h=user.html();assert(h.includes('data-kind="not-checked" aria-pressed="true"'));
  assert.equal((h.match(/class="monitor-file-requirements"/g)||[]).length,6);
  user.click('files-filter',{kind:'complete'});
  h=user.html();assert(h.includes('24 employees in this view'));
  user.click('files-filter',{kind:'all'});
  user.click('files-more');
  h=user.html();assert.equal((h.match(/class="monitor-file-requirements"/g)||[]).length,51);
});
check('201 Files employee reader shows nine noneditable statuses',()=>{
  const before=JSON.stringify(user.win.MJ_SEED.employees);
  user.navigate('files201');
  const sample=user.win.MJ_MONITORING.fileSummary(user.win.MJ_SOURCE_ADAPTER.getSnapshot()).groups.missing[0];
  user.click('open',{id:sample.employee.id,detail:'files201'});
  const h=user.html();
  assert(h.includes('data-tab="files201" aria-current="page"'));
  assert(h.includes('Fictional per-document statuses'));
  assert.equal((h.split('class="table monitor-file-detail-table"')[1]||'').split('</table>')[0]
    .match(/<tr><th scope="row">/g).length,9);
  assert(sample.missing.some(doc=>h.includes(doc.label)));
  for(const forbidden of ['type="file"','data-action="upload"','type="checkbox"']){
    assert(!h.includes(forbidden));
  }
  user.click('close');
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),before);
});
check('Three-month Calendar renders contiguous months and sample events',()=>{
  user.navigate('calendar');
  const h=user.html(),api=user.win.MJ_MONITORING;
  const start=api.todayManila().slice(0,7);
  const m1=api.monthShift(start,1),m2=api.monthShift(start,2);
  assert(h.includes('<h1>Calendar</h1>'));
  assert.equal((h.match(/class="panel monitor-calendar-month"/g)||[]).length,3);
  const snap=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const ev=api.events(snap,start);
  assert(h.includes(ev.length+' of '+ev.length+' fictional dates displayed'));
  for(const month of [start,m1,m2]){
    const d=new Date(month+'-01T00:00:00Z');
    const label=d.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'});
    assert(h.includes('<h2>'+label+'</h2>'));
  }
  assert(h.includes('not confirmed appointments'));
  assert(!h.includes('Add to calendar'));
});
check('Calendar filters and navigation never create or mutate events',()=>{
  const before=JSON.stringify(user.win.MJ_SEED.employees),api=user.win.MJ_MONITORING;
  const month=api.todayManila().slice(0,7);
  user.navigate('calendar');
  user.click('calendar-type',{kind:'checkin'});
  let h=user.html();
  assert(h.includes('data-kind="checkin" aria-pressed="true"'));
  user.click('calendar-type',{kind:'all'});
  user.click('calendar-shift',{shift:'3'});
  h=user.html();
  const next=api.monthShift(month,3),date=new Date(next+'-01T00:00:00Z');
  assert(h.includes(date.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'})));
  user.click('calendar-shift',{shift:'-3'});
  user.click('calendar-today');
  h=user.html();
  assert(h.includes('Three-month outlook'));
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),before);
});
check('Calendar day selection and employee preview remain read-only',()=>{
  user.navigate('calendar');
  const start=user.win.MJ_MONITORING.todayManila().slice(0,7);
  const event=user.win.MJ_MONITORING.events(user.win.MJ_SOURCE_ADAPTER.getSnapshot(),start)[0];
  assert(event);
  user.click('calendar-day',{date:event.date});
  assert(user.html().includes('Events · '));
  assert(user.html().includes('aria-pressed="true"'));
  const detail=event.type==='checkin'||event.type==='employment'?'journey':'milestones';
  user.click('open',{id:event.employee.id,detail});
  assert(user.html().includes('employee-modal'));
  user.click('close');
  assert(user.html().includes('calendar-three')||user.html().includes('monitor-calendar-three'));
});
check('Calendar and 201 deep links open on fresh page load',()=>{
  for(const tab of ['calendar','files201']){
    const instance=boot({},'#'+tab);
    assert(instance.html().includes('workspace-sidebar'));
    assert(instance.html().includes(tab==='calendar'?'monitor-calendar-three':'Who is missing what'));
    assert(!instance.html().includes('Who is using the dashboard?'));
  }
});
check('201 document percentages use applicable counts, not all employees when N/A',()=>{
  const source=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const module=user.win.MJ_MONITORING;
  const doc=source.documents201.find(d=>d.id==='regularization-contract');
  assert(doc);
  const status=source.employees.map(e=>e.files201[doc.id]);
  const na=status.filter(v=>v==='not-applicable').length;
  const complete=status.filter(v=>v==='complete').length;
  const missing=status.filter(v=>v==='missing').length;
  const unchecked=status.filter(v=>v==='not-checked').length;
  assert(na>0);
  assert.equal(na+complete+missing+unchecked,51);
  const html=module.fileView(source,{filesFilter:'missing',filesExpanded:false});
  assert(html.includes(doc.label+'</h3><strong>'+complete+' <small>/ '+(51-na)+' applicable complete</small>'));
  assert(!html.includes(doc.label+'</h3><strong>'+complete+' <small>/ 51 applicable complete</small>'));
});
check('201 adapter rejects missing and unknown status records',()=>{
  const adapter=user.win.MJ_SOURCE_ADAPTER;
  assert.equal(adapter.contractVersion,2);
  const missing=adapter.getSnapshot();
  delete missing.employees[0].files201.nda;
  assert(!adapter.validateSnapshot(missing));
  const unsupported=adapter.getSnapshot();
  unsupported.employees[0].files201.nda='verified-officially';
  assert(!adapter.validateSnapshot(unsupported));
  const safe=adapter.getSnapshot();
  assert(adapter.validateSnapshot(safe));
  assert.equal(user.win.MJ_SEED.employees.length,51);
});
check('Three-month calendar handles leap February and year boundary dates',()=>{
  const api=user.win.MJ_MONITORING;
  assert.equal(api.monthShift('2026-12',1),'2027-01');
  assert.equal(api.monthShift('2027-01',-2),'2026-11');
  const data=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  data.employees[0].startDate='2027-11-30';
  const events=api.events(data,'2028-02');
  const leap=events.find(e=>e.employee.id===data.employees[0].id&&
    e.type==='checkin'&&e.title==='Third-month check-in');
  assert(leap);
  assert.equal(leap.date,'2028-02-29');
  const html=api.calendarView(data,{calendarStart:'2028-02',calendarType:'all',
    calendarSelected:'',calendarExpanded:''});
  assert(html.includes('February 2028'));
  assert(html.includes('March 2028'));
  assert(html.includes('April 2028'));
  assert(html.includes('class="monitor-calendar-date-number">29</span>'));
});
check('New monitoring styles keep single font, three-to-one calendar layout and no editable records',()=>{
  const css=src['mono.css'];
  assert(css.includes('body .monitor-files-grid'));
  assert(css.includes('body .monitor-calendar-three'));
  assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
  assert(css.includes('@media(max-width:1180px)'));
  assert(css.includes('@media(max-width:760px)'));
  assert(css.includes('@media(max-width:350px)'));
  assert(css.includes('body button.monitor-calendar-date{min-height:44px}'));
  const html=src['index.html'];
  assert(html.indexOf('data-adapter.js')<html.indexOf('monitoring.js'));
  assert(html.indexOf('monitoring.js')<html.indexOf('app.js'));
  for(const tab of ['calendar','files201']){
    const fresh=boot({},'#'+tab);
    assert(!fresh.html().includes('type="file"'));
    assert(!fresh.html().includes('type="checkbox"'));
    assert(!fresh.html().includes('Save changes'));
  }
});
check('New small monitoring labels use accessible text contrast in both themes',()=>{
  const css=src['mono.css'];
  assert(css.includes('body .monitor-filter.active,'));
  assert(css.includes('color:var(--mj-focus-accent)'));
  const rgb=hex=>[0,1,2].map(n=>parseInt(hex.slice(1+2*n,3+2*n),16)/255);
  const luminance=hex=>{
    const c=rgb(hex).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
    return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  };
  const ratio=(x,y)=>{
    const l=[luminance(x),luminance(y)].sort((a,b)=>b-a);
    return (l[0]+.05)/(l[1]+.05);
  };
  assert(ratio('#a82759','#ffffff')>=4.5);
  assert(ratio('#f278aa','#111111')>=4.5);
});
check('Phase 7 operational focus reuses attendance, 201 documents and calendar fixture counts',()=>{
  user.navigate('overview');
  const html=user.html();
  const rail=html.split('class="monitor-pulse monitor-focus"')[1]?.split('</section>')[0];
  assert(rail);
  const snap=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const docs=user.win.MJ_MONITORING.fileSummary(snap);
  const today=user.win.MJ_MONITORING.todayManila();
  const scheduled=user.win.MJ_MONITORING.events(snap,today.slice(0,7))
    .filter(e=>e.date>=today);
  assert.equal((rail.match(/class="monitor-focus-item"/g)||[]).length,3);
  for(const tab of ['attendance','files201','calendar']){
    assert(rail.includes('data-action="nav" data-tab="'+tab+'"'),tab);
  }
  assert(rail.includes('class="monitor-focus-value">'+docs.groups.missing.length+'</span>'));
  assert(rail.includes('class="monitor-focus-value">'+scheduled.length+'</span>'));
  assert(rail.includes(docs.groups['not-checked'].length+' other people have documents not yet checked'));
  assert(rail.includes('fictional records only'));
  if(scheduled.length)assert(rail.includes('Next: '+scheduled[0].employee.name));
  assert(!rail.includes('Connected now'));
});
check('Phase 7 201 Files attention category lists exactly the people with sample gaps',()=>{
  user.navigate('overview');
  user.click('work-view',{mode:'list'});
  user.click('attention-filter',{kind:'documents'});
  let html=user.html();
  assert(html.includes('data-kind="documents" class="queue-filter active" aria-pressed="true"'));
  const snap=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const docs=user.win.MJ_MONITORING.fileSummary(snap);
  const people=docs.groups.missing.length+docs.groups['not-checked'].length;
  const summary=html.split('class="queue-count" aria-live="polite">')[1]?.split('</span>')[0];
  assert.equal(summary,people+' people · '+people+' signals');
  user.click('attention-more');
  html=user.html();
  const entries=html.split('class="work-list-row"').slice(1).map(row=>
    row.split('data-action="open" data-id="')[1]?.split('"')[0]).filter(Boolean);
  assert.equal(entries.length,people);
  assert.equal(new Set(entries).size,people);
  assert(entries.every(id=>{
    const e=snap.employees.find(x=>x.id===id);
    const states=Object.values(e.files201);
    return states.includes('missing')||states.includes('not-checked');
  }));
  assert(html.includes('data-detail="files201"'));
});
check('Phase 7 direct 201 file triage opens the existing read-only employee reader',()=>{
  user.navigate('overview');
  user.click('attention-filter',{kind:'documents'});
  const snap=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const matching=snap.employees.find(e=>Object.values(e.files201).includes('missing'));
  assert(matching);
  user.click('open',{id:matching.id,detail:'files201'});
  const modal=user.html();
  assert(modal.includes('class="panel monitor-person-documents"'));
  assert(modal.includes('201 Files Checklist'));
  assert(modal.includes('Fictional per-document statuses'));
  assert(!modal.includes('type="file"'));
  user.click('close');
  assert(user.html().includes('class="monitor-pulse monitor-focus"'));
});
check('Phase 7 compact monitoring focus adapts to tablet/mobile and reduced motion',()=>{
  const css=src['mono.css'];
  assert(css.includes('body .monitor-pulse.monitor-focus'));
  assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
  assert(css.includes('@media(min-width:761px) and (max-width:1050px)'));
  assert(css.includes('body .monitor-focus-grid{grid-template-columns:minmax(0,1fr)}'));
  assert(css.includes('body .monitor-focus-item{transition:none!important}'));
  assert(css.includes('body .monitor-focus-item:hover{outline:1px solid Highlight}'));
  assert(css.includes('outline-offset:-3px!important'));
});
check('Phase 7 monitoring links change view but never modify underlying sample documents',()=>{
  const original=JSON.stringify(user.win.MJ_SEED.employees);
  for(const tab of ['attendance','files201','calendar']){
    user.navigate('overview');
    assert(user.html().includes('data-action="nav" data-tab="'+tab+'"'));
    user.click('nav',{tab});
    const h=user.html();
    assert(h.includes('<h1>'),tab);
    assert(h.includes('workspace-sidebar'),tab);
  }
  assert.equal(JSON.stringify(user.win.MJ_SEED.employees),original);
});
check('Pastel tokens have readable text contrast in light and dark appearance',()=>{
  const css=src['mono.css'];
  const hexes=['#fff0f5','#edf6ff','#edf9f1','#f4efff','#fff6e9',
    '#2b1c25','#1b2937','#1c2c25','#272139','#30281e'];
  for(const h of hexes)assert(css.includes(h),h);
  const luminance=h=>{
    const rgb=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
    const linear=rgb.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
    return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
  };
  const contrast=(a,b)=>{
    const x=luminance(a),y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  };
  for(const h of hexes.slice(0,5))assert(contrast('#171717',h)>=4.5,h+' light');
  for(const h of hexes.slice(5))assert(contrast('#f7f7f7',h)>=4.5,h+' dark');
  assert(contrast('#a82759','#fff0f5')>=4.5);
  assert(contrast('#f278aa','#2b1c25')>=4.5);
});
check('Pastel document categories follow actual fictional requirement groups',()=>{
  user.navigate('files201');
  const snapshot=user.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const html=user.html();
  const cards=html.match(/<article class="monitor-file-card" data-group="[^"]+">/g)||[];
  assert.equal(cards.length,snapshot.documents201.length);
  for(const doc of snapshot.documents201){
    assert(['Employment','Contracts','Personal','Government'].includes(doc.group));
    assert(cards.some(c=>c.includes('data-group="'+doc.group+'"')));
  }
  const css=src['mono.css'];
  for(const group of ['Employment','Contracts','Personal','Government']){
    assert(css.includes('data-group="'+group+'"'));
  }
  assert(html.includes('No documents can be uploaded or edited here'));
});
check('Pastel color mapping is meaningful across overview, calendar and attention',()=>{
  user.navigate('overview');
  const overview=user.html();
  for(const tone of ['pink','blue','yellow','violet']){
    assert(overview.includes('tone-'+tone+' overview-signal'),tone);
    assert(src['mono.css'].includes('button.overview-signal.tone-'+tone));
  }
  for(const kind of ['attendance','documents','kpi','onboarding','reviews']){
    assert(src['mono.css'].includes('.work-lane-'+kind+' .work-lane-head'),kind);
  }
  user.navigate('calendar');
  const h=user.html();
  assert(h.includes('monitor-calendar-three'));
  assert(src['monitoring.js'].includes('monitor-calendar-count type-'));
  for(const kind of ['checkin','employment','change','milestone']){
    assert(src['mono.css'].includes('.monitor-calendar-month-summary .type-'+kind));
    assert(src['mono.css'].includes('.monitor-calendar-dot.type-'+kind));
  }
});
check('Hover transitions are pointer-aware and support keyboard, touch and reduced motion',()=>{
  const css=src['mono.css'];
  assert(css.includes('@media(hover:hover) and (pointer:fine)'));
  for(const target of [
    '.overview-summary-grid button.overview-signal:hover',
    '.monitor-focus-item:hover',
    '.monitor-calendar-date.has-events:hover',
    '.monitor-files-grid .monitor-file-card:hover',
    '.monitor-files-table tbody tr:hover',
    '.work-card:hover'
  ])assert(css.includes(target),target);
  assert(css.includes('transform:translateY(-2px)'));
  assert(css.includes('transition:background-color .15s ease'));
  assert(css.includes('body .monitor-focus-item:focus-visible'));
  assert(css.includes('body .monitor-calendar-date.today'));
  assert(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert(css.includes('transform:none!important'));
  assert(css.includes('@media(forced-colors:active)'));
  assert(css.includes('background:Canvas!important'));
  const entire=src['app.js']+src['monitoring.js'];
  assert(!entire.includes('data-action="save-file"'));
  assert(!entire.includes('type="file"'));
});
check('Shared icon module provides a consistent self-contained 24px SVG vocabulary',()=>{
  const api={};new Function('window',src['icons.js'])(api);
  const icons=api.MJ_ICONS;
  assert(icons&&Object.isFrozen(icons));
  assert(icons.names.length>=35);
  const names=['grid','users','calendar','list','database','chart','file','briefcase',
    'id-card','shield','check','minus','x','arrow-left','arrow-right','arrow-up-right',
    'chevron-down','chevron-right','search','panel','sun','moon'];
  for(const name of names){
    assert(icons.names.includes(name),name);
    const svg=icons.svg(name);
    assert(svg.includes('class="ui-icon ui-icon-'+name+'"'));
    assert(svg.includes('viewBox="0 0 24 24"'));
    assert(svg.includes('stroke-width="1.8"'));
    assert(svg.includes('aria-hidden="true" focusable="false"'));
    assert(svg.includes('<svg')&&svg.includes('</svg>'));
    assert(!svg.includes('<img')&&!svg.includes('http'));
  }
  assert(icons.svg('<script>').includes('ui-icon-circle-help'));
  assert(!icons.svg('<script>').includes('<script>'));
  assert(!src['icons.js'].includes('fetch('));
  assert(!src['icons.js'].includes('innerHTML='));
});
check('Decorative emoji and miscellaneous pictograms are absent from rendered interfaces',()=>{
  const unexpected=/[\u2300-\u23ff\u25a0-\u27bf\u{1f000}-\u{1faff}]/u;
  for(const file of ['app.js','monitoring.js','icons.js','mono.css']){
    assert(!unexpected.test(src[file]),file+' contains a decorative symbol');
  }
  assert(!src['mono.css'].includes('content:"↗"'));
  user.navigate('overview');
  let page=user.html();
  assert(page.includes('ui-icon-users'));
  assert(page.includes('ui-icon-checklist'));
  assert(page.includes('ui-icon-briefcase'));
  assert(page.includes('ui-icon-chart'));
  assert(page.includes('ui-icon-arrow-up-right'));
  assert(page.includes('ui-icon-chevron-right'));
  assert(!page.includes('aria-hidden="true">↗</span>'));
  user.navigate('welcome');
  page=user.html();
  assert(page.includes('ui-icon-arrow-right'));
  assert(!page.includes('aria-hidden="true">→</span>'));
});
check('Employee previews and checklists use uniform icon controls with accessible labels',()=>{
  user.navigate('employees');
  const person=user.win.MJ_SEED.employees[0];
  user.click('open',{id:person.id,detail:'journey'});
  let html=user.html();
  assert(html.includes('class="modal-close"'));
  assert(html.includes('aria-label="Close employee preview"'));
  assert(html.includes('ui-icon-x'));
  assert(html.includes('ui-icon-arrow-left'));
  assert(html.includes('ui-icon-arrow-right'));
  assert(html.includes('ui-icon-check')||html.includes('ui-icon-minus'));
  assert(!html.includes('aria-hidden="true">✓</span>'));
  user.click('detail',{tab:'kit'});
  html=user.html();
  assert(html.includes('reader-check-icon'));
  assert(html.includes('ui-icon-check')||html.includes('ui-icon-minus'));
  user.click('close');
});
check('Document and calendar icons preserve status text and independent read-only controls',()=>{
  user.navigate('files201');
  let html=user.html();
  for(const icon of ['briefcase','file','id-card','shield']){
    assert(html.includes('ui-icon-'+icon),icon);
  }
  assert(html.includes('monitor-file-symbol'));
  assert(html.includes('monitor-filter-symbol'));
  assert(html.includes('ui-icon-alert-circle'));
  assert(html.includes('Who is missing what'));
  user.navigate('calendar');
  html=user.html();
  assert(html.includes('ui-icon-calendar'));
  assert(html.includes('ui-icon-clock'));
  assert(html.includes('ui-icon-arrow-left'));
  assert(html.includes('ui-icon-arrow-right'));
  assert(html.includes('ui-icon-arrow-up-right'));
  assert(html.includes('Three-month outlook'));
  assert(!html.includes('data-action="calendar-add"'));
});
check('Icon dependency failure cannot block navigation or file and calendar monitoring',()=>{
  const instance=boot({},'#overview',null,win=>{delete win.MJ_ICONS;});
  assert(instance.html().includes('Organization overview'));
  assert(instance.html().includes('workspace-mainnav'));
  assert(!instance.html().includes('ui-icon-'));
  for(const route of ['files201','calendar','employees']){
    assert.doesNotThrow(()=>instance.navigate(route));
    assert(instance.html().includes('<h1>'),route);
  }
  instance.click('open',{id:'MJ-001',detail:'files201'});
  assert(instance.html().includes('201 Files Checklist'));
  instance.click('close');
});
check('Icons retain accessible sizes and keyboard, forced-color and motion styles',()=>{
  const css=src['mono.css'],html=src['index.html'];
  assert(html.indexOf('icons.js')>html.indexOf('data-adapter.js'));
  assert(html.indexOf('icons.js')<html.indexOf('monitoring.js'));
  assert(html.indexOf('monitoring.js')<html.indexOf('app.js'));
  for(const phrase of [
    'body .ui-icon','width:1.15rem;height:1.15rem',
    'body .overview-summary-grid button.overview-signal .overview-signal-icon',
    'body .reader-check-icon .ui-icon',
    'body .monitor-file-symbol .ui-icon',
    'body .monitor-calendar-controls .button',
    '@media(forced-colors:active)',
    '@media(prefers-reduced-motion:reduce)'
  ])assert(css.includes(phrase),phrase);
  assert(src['app.js'].includes("const routeTargets=['overview'"));
  assert(src['app.js'].includes('routeTargets.includes(hash)'));
});
check('Phase 8 density toggle uses a stable accessible pressed state and never edits employee records',()=>{
  const ctx=boot({},'#employees');
  const before=JSON.stringify(ctx.win.MJ_SEED.employees);
  let h=ctx.html();
  assert(h.includes('layout density-comfortable'));
  assert(h.includes('data-action="toggle-density" aria-pressed="false"'));
  assert(h.includes('aria-label="Compact monitoring rows"'));
  ctx.click('toggle-density');
  h=ctx.html();
  assert(h.includes('layout density-compact'));
  assert(h.includes('data-action="toggle-density" aria-pressed="true"'));
  assert(h.includes('Compact rows</span>'));
  assert.equal(ctx.mem['maddie-journey-density'],'compact');
  ctx.click('toggle-density');
  h=ctx.html();
  assert(h.includes('layout density-comfortable'));
  assert(h.includes('aria-pressed="false" aria-label="Compact monitoring rows"'));
  assert.equal(ctx.mem['maddie-journey-density'],'comfortable');
  assert.equal(JSON.stringify(ctx.win.MJ_SEED.employees),before);
});
check('Phase 8 preferred density survives reloads without introducing a data editor',()=>{
  const ctx=boot({'maddie-journey-density':'compact'},'#files201');
  let h=ctx.html();
  assert(h.includes('layout density-compact'));
  assert(h.includes('201 Files Checklist'));
  assert(h.includes('data-action="toggle-density" aria-pressed="true"'));
  const old=JSON.stringify(ctx.win.MJ_SEED);
  ctx.navigate('calendar');assert(ctx.html().includes('layout density-compact'));
  ctx.navigate('overview');assert(ctx.html().includes('layout density-compact'));
  assert.equal(JSON.stringify(ctx.win.MJ_SEED),old);
  const fallback=boot({'maddie-journey-density':'unsupported'},'#employees');
  assert(fallback.html().includes('layout density-comfortable'));
});
check('Phase 8 directory table exposes real denominators and accessible column labels',()=>{
  const ctx=boot({},'#employees');
  const markup=ctx.html();
  const part=markup.split('<table class="table">')[1]?.split('</table>')[0];
  assert(part);
  assert(part.includes('<caption class="sr-only">Employee directory: 51 of 51'));
  assert(part.includes('<th scope="col">Employee</th>'));
  assert(part.includes('<th scope="col">Journey</th>'));
  assert(part.includes('<th scope="col">Kit issued</th>'));
  assert(part.includes('<th scope="col">KPI score</th>'));
  assert.equal((part.match(/<tr><th scope="row">/g)||[]).length,51);
  const first=ctx.win.MJ_SEED.employees[0];
  const kitItems=first.kit.filter(Boolean).length;
  assert(part.includes(kitItems+' / '+first.kit.length+' requirements'));
  assert(part.includes(' / '+first.journey.flat().length+' tasks complete'));
  assert(part.includes('class="report-num"'));
  assert(part.includes('class="report-cell-sub"'));
});
check('Phase 8 empty employee search explains filters without inventing empty source data',()=>{
  const ctx=boot({},'#employees'),root=ctx.doc.getElementById('app');
  const result={outerHTML:''},count={textContent:''};
  const clear={innerHTML:'',querySelector(){return null;}};
  const panel={querySelector(q){return q==='.table-wrap, .empty'?result:
    q==='.directory-results-count'?count:q==='.directory-clear-slot'?clear:null;}};
  root.querySelector=q=>q==='.panel.no-pad'?panel:null;
  ctx.typeSearch('no-matching-employee-record-999');
  const h=result.outerHTML;
  assert(h.includes('class="empty report-empty" role="status"'));
  assert(h.includes('No employees match these filters.'));
  assert(h.includes('Try another name, division or search term.'));
  assert.equal(count.textContent,'0 of 51 employees');
  assert(!h.includes('No source records found'));
});
check('Phase 8 an empty attendance record means unrecorded, never perfect attendance',()=>{
  const ctx=boot({},'#employees',seed=>{seed.employees[0].attendance=[];});
  const e=ctx.win.MJ_SEED.employees[0];
  ctx.click('open',{id:e.id,detail:'attendance'});
  const h=ctx.html();
  assert(h.includes('No attendance entries are recorded for this fictional employee'));
  assert(h.includes('This is not evidence of perfect attendance.'));
  assert(h.includes('colspan="5"'));
  assert(h.includes('<th scope="col">Verification</th>'));
  assert(!h.includes('All shifts attended'));
});
check('Phase 8 KPI, attendance and review tables preserve their exact denominators',()=>{
  const ctx=boot({},'#employees');
  const employee=ctx.win.MJ_SEED.employees[2];
  ctx.click('open',{id:employee.id,detail:'kpi'});
  let h=ctx.html();
  assert(h.includes('class="table kpi-composition-table"'));
  assert(h.includes('<td class="report-num">100%</td>'));
  assert(h.includes('class="report-num"><strong>'));
  ctx.click('detail',{tab:'approvals'});
  h=ctx.html();
  assert(h.includes('<td class="report-num">01</td>'));
  assert(h.includes('No recorded comment')||h.includes('Recorded date'));
  ctx.click('close');
  ctx.navigate('attendance');
  h=ctx.html();
  assert(h.includes('class="table attendance-period-table"'));
  assert(h.includes('<td class="report-num">'));
  assert(h.includes('Pending records are excluded from this table.'));
});
check('Phase 8 201 Files exposes selected and visible people separately',()=>{
  const ctx=boot({},'#files201');
  let h=ctx.html();
  const summary=ctx.win.MJ_MONITORING.fileSummary(ctx.win.MJ_SOURCE_ADAPTER.getSnapshot());
  const expected=summary.groups.missing.length;
  assert(h.includes(expected+' employees in this view · '+Math.min(12,expected)+' shown'));
  assert(h.includes('201 Files checklist: '+Math.min(12,expected)+' shown of '+expected+' employees'));
  assert(h.includes('Not applicable is excluded from missing counts.'));
  ctx.click('files-more');
  h=ctx.html();assert(h.includes(expected+' employees in this view · '+expected+' shown'));
  ctx.click('files-filter',{kind:'not-checked'});
  h=ctx.html();
  assert(h.includes(summary.groups['not-checked'].length+' employees in this view'));
});
check('Phase 8 compact tables preserve mobile touch targets and keyboard overflow',()=>{
  const css=src['mono.css'];
  for(const required of [
    'body .layout.density-compact .table :is(th,td)',
    'body .layout.density-compact .table .button',
    'body .layout.density-comfortable .table .button',
    'body .table .report-cell-sub',
    'body .report-empty',
    'body .page-header .density-toggle:focus-visible',
    'body .table td.report-empty-cell',
    '@media(max-width:760px)',
    'min-height:44px',
    '@media(forced-colors:active)'
  ])assert(css.includes(required),required);
  const ctx=boot({},'#employees');
  assert(ctx.html().includes('data-action="toggle-density"'));
  ctx.click('toggle-density');
  assert(ctx.html().includes('layout density-compact'));
  assert(ctx.html().includes('class="table-wrap"'));
  assert(src['app.js'].includes('enhanceScrollableTables();'));
});
check('Phase 8 report captions give screen-reader users scoped denominators',()=>{
  const ctx=boot({},'#employees'),person=ctx.win.MJ_SEED.employees[0];
  let h=ctx.html();
  assert(h.includes('Employee directory: 51 of 51 selected fictional employees'));
  ctx.navigate('journey');h=ctx.html();
  assert(h.includes('Eight mutually exclusive Journey stage groups for 51 selected fictional people'));
  ctx.click('journey-view',{mode:'table'});h=ctx.html();
  assert(h.includes('Journey checklist: 51 fictional employees'));
  ctx.navigate('attendance');h=ctx.html();
  assert(h.includes('Monthly attendance summary: '));
  ctx.navigate('employees');ctx.click('open',{id:person.id,detail:'kpi'});
  h=ctx.html();assert(h.includes('Four weighted fictional KPI categories; total weight 100%'));
  ctx.click('detail',{tab:'approvals'});h=ctx.html();
  assert(h.includes('Four review steps and their fictional recorded statuses for '+person.name));
  ctx.click('close');
  ctx.navigate('approvals');h=ctx.html();
  assert(h.includes('Review queue for 51 selected fictional employees'));
  ctx.navigate('files201');h=ctx.html();
  assert(h.includes('201 Files checklist: '));
});
check('Phase 8 compact preference never modifies full-screen non-scrolling landing',()=>{
  const ctx=boot({'maddie-journey-density':'compact'},'#employees');
  const before=JSON.stringify(ctx.win.MJ_SEED.employees);
  assert(ctx.html().includes('layout density-compact'));
  ctx.navigate('welcome');
  const h=ctx.html();
  assert(h.includes('class="landing-shell"'));
  assert(!h.includes('density-compact'));
  assert(h.includes('landing-hero-inner'));
  assert(!h.includes('data-action="toggle-density"'));
  assert.equal(JSON.stringify(ctx.win.MJ_SEED.employees),before);
});

check('Phase 9 201 Files preview browses only visible people in the selected status',()=>{
  const ctx=boot({},'#files201'),snapshot=ctx.win.MJ_SOURCE_ADAPTER.getSnapshot();
  const report=ctx.win.MJ_MONITORING.fileSummary(snapshot);
  const missing=report.groups.missing.slice().sort((a,b)=>
    b.missing.length-a.missing.length||a.employee.name.localeCompare(b.employee.name));
  assert(missing.length>12);
  const first=missing[0];
  ctx.click('open',{id:first.employee.id,detail:'files201',
    originLabel:'Missing: '+first.missing.map(d=>d.label).join(' · ')});
  let h=ctx.html();
  assert(h.includes('EMPLOYEE · '+first.employee.id));
  assert(h.includes('1 of 12'));
  assert(h.includes('Opened from</span> Missing documents'));
  assert(h.includes('class="employee-context-match" aria-live="polite"'));
  assert(h.includes(first.missing[0].label));
  assert(h.includes('data-action="viewer-return"'));
  ctx.click('viewer-next');
  h=ctx.html();
  assert(h.includes('EMPLOYEE · '+missing[1].employee.id));
  assert(h.includes('2 of 12'));
  assert(h.includes(missing[1].missing[0].label));
  ctx.click('viewer-return');
  assert(ctx.html().includes('Who is missing what'));
  assert(!ctx.html().includes('role="dialog"'));
});
check('Phase 9 expanding 201 Files changes the preview roster only for visible filters',()=>{
  const ctx=boot({},'#files201'),r=ctx.win.MJ_MONITORING.fileSummary(ctx.win.MJ_SOURCE_ADAPTER.getSnapshot());
  ctx.click('files-more');
  const first=r.groups.missing.slice().sort((a,b)=>
    b.missing.length-a.missing.length||a.employee.name.localeCompare(b.employee.name))[0];
  ctx.click('open',{id:first.employee.id,detail:'files201'});
  assert(ctx.html().includes('1 of '+r.groups.missing.length));
  ctx.click('close');
  ctx.click('files-filter',{kind:'not-checked'});
  const people=r.groups['not-checked'].slice().sort((a,b)=>a.employee.name.localeCompare(b.employee.name));
  ctx.click('open',{id:people[0].employee.id,detail:'files201'});
  const h=ctx.html();
  assert(h.includes('1 of '+people.length));
  assert(h.includes('Not checked: '));
  assert(h.includes('Opened from</span> Not checked'));
  ctx.click('close');
  assert(ctx.html().includes('data-kind="not-checked" aria-pressed="true"'));
});
check('Phase 9 Calendar day preview preserves dated origin and date-scoped browsing',()=>{
  const ctx=boot({},'#calendar'),api=ctx.win.MJ_MONITORING;
  const start=api.todayManila().slice(0,7),events=api.events(ctx.win.MJ_SOURCE_ADAPTER.getSnapshot(),start);
  const first=events.find(e=>e.date.startsWith(start));
  assert(first);
  ctx.click('calendar-day',{date:first.date});
  const visible=events.filter(e=>e.date===first.date);
  const people=[...new Set(visible.map(e=>e.employee.id))];
  assert(ctx.html().includes('data-date="'+first.date+'" data-origin-label='));
  ctx.click('open',{id:first.employee.id,detail:first.type==='checkin'||first.type==='employment'?'journey':'milestones',
    date:first.date,originLabel:first.title});
  const h=ctx.html();
  assert(h.includes('Opened from</span> Calendar date · '));
  assert(h.includes('Example date: '));
  assert(h.includes(first.title));
  assert(h.includes(' of '+people.length));
  assert(h.includes('aria-label="Return to Three-month calendar"'));
  ctx.click('viewer-return');
  assert(ctx.html().includes('monitor-calendar-three'));
  assert(ctx.html().includes('aria-pressed="true"'));
});
check('Phase 9 attention queue previews remain scoped to the chosen follow-up category',()=>{
  const ctx=boot({},'#overview'),snap=ctx.win.MJ_SOURCE_ADAPTER.getSnapshot();
  ctx.click('attention-filter',{kind:'documents'});
  const docs=ctx.win.MJ_MONITORING.fileSummary(snap);
  const first=[...docs.groups.missing,...docs.groups['not-checked']][0].employee;
  ctx.click('open',{id:first.id,detail:'files201',originKind:'documents',
    originLabel:'Recorded 201 file follow-up'});
  const h=ctx.html();
  assert(h.includes('Opened from</span> 201 Files follow-ups'));
  assert(h.includes(' of 8'));
  assert(h.includes('201 document'));
  assert(h.includes('201 document states are synthetic'));
  ctx.click('viewer-return');
  assert(ctx.html().includes('data-kind="documents" class="queue-filter active"'));
});
check('Phase 9 employee detail tabs are semantic and support bounded keyboard focus',()=>{
  const ctx=boot({},'#employees');
  ctx.click('open',{id:'MJ-001',detail:'kpi'});
  let h=ctx.html();
  assert(h.includes('class="employee-modal-tabs" role="tablist"'));
  assert(h.includes('role="tab" id="employee-tab-kpi" aria-controls="employee-panel" aria-selected="true" tabindex="0"'));
  assert(h.includes('data-tab="kpi" aria-current="page"'));
  assert(h.includes('role="tabpanel" aria-labelledby="employee-tab-kpi" tabindex="0"'));
  assert(h.includes('Weighted scores are calculated from demo values'));
  assert(h.includes('data-action="viewer-return"'));
  ctx.click('detail',{tab:'approvals'});
  h=ctx.html();
  assert(h.includes('id="employee-tab-approvals" aria-controls="employee-panel" aria-selected="true"'));
  assert(h.includes('not a verified chronology or approval action'));
  ctx.click('detail',{tab:'not-a-section'});
  assert(ctx.html().includes('aria-labelledby="employee-tab-approvals"'));
  ctx.click('close');
});
check('Phase 9 return action restores original row focus and prior scroll position',()=>{
  const ctx=boot({},'#files201');
  const report=ctx.win.MJ_MONITORING.fileSummary(ctx.win.MJ_SOURCE_ADAPTER.getSnapshot());
  const chosen=report.groups.missing[0].employee,attrs={action:'open',id:chosen.id,detail:'files201',originLabel:'Missing documents'};
  let focused=0,scroll=null;
  const source={dataset:attrs,focus(){focused++;}};
  const wrap={scrollLeft:87,scrollTop:23};
  ctx.win.scrollY=411;
  ctx.win.scrollTo=position=>{scroll=position;};
  ctx.doc.querySelectorAll=selector=>selector==='[data-action]'?[source]:
    selector==='.table-wrap, .journey-kanban, .work-board, .work-list-table'?[wrap]:[];
  ctx.click('open',{id:attrs.id,detail:attrs.detail,originLabel:attrs.originLabel});
  assert(ctx.html().includes('201 Files Checklist'));
  wrap.scrollLeft=0;wrap.scrollTop=0;
  ctx.click('viewer-return');
  assert.equal(focused,1);
  assert.equal(wrap.scrollLeft,87);
  assert.equal(wrap.scrollTop,23);
  assert.equal(scroll.top,411);
  assert.equal(scroll.behavior,'instant');
  assert.equal(ctx.loc.hash,'#files201');
});
check('Phase 9 close, Escape and backdrop keep filters and source records intact',()=>{
  const ctx=boot({},'#employees'),before=JSON.stringify(ctx.win.MJ_SEED.employees);
  ctx.setFilter('query','MJ-003');
  ctx.click('open',{id:'MJ-003',detail:'journey'});
  ctx.key('Escape');
  assert(!ctx.html().includes('role="dialog"'));
  assert(ctx.html().includes('value="MJ-003"'));
  ctx.click('open',{id:'MJ-003',detail:'journey'});
  ctx.click('close');
  assert(!ctx.html().includes('role="dialog"'));
  assert.equal(ctx.loc.hash,'#employees');
  assert.equal(JSON.stringify(ctx.win.MJ_SEED.employees),before);
});
check('Phase 9 provenance notes remain contextual and never grant edit capabilities',()=>{
  const ctx=boot({},'#employees'),original=JSON.stringify(ctx.win.MJ_SEED.employees);
  const expected={
    preview:'fictional employee fixture',
    milestones:'calculated dates are not booked appointments',
    kpi:'not verified performance reports',
    journey:'fictional checklist steps',
    kit:'not confirmed delivery',
    files201:'No official employee file',
    attendance:'Pending entries remain separate',
    approvals:'not a verified chronology',
    info:'not synchronized with a personnel directory'
  };
  ctx.click('open',{id:'MJ-001',detail:'preview'});
  for(const [tab,fragment] of Object.entries(expected)){
    if(tab!=='preview')ctx.click('detail',{tab});
    const html=ctx.html();
    assert(html.includes('class="employee-evidence-note" role="note"'),tab);
    assert(html.includes(fragment),tab);
    assert(!html.includes('type="file"'));
    assert(!html.includes('data-action="save"'));
  }
  ctx.click('close');
  assert.equal(JSON.stringify(ctx.win.MJ_SEED.employees),original);
});
check('Phase 9 context actions retain consistent icons and 320px accessibility safeguards',()=>{
  const css=src['mono.css'],js=src['app.js'];
  for(const item of [
    'body .employee-context-return',
    'body .employee-context-filter',
    'body .employee-context-match',
    'body .employee-evidence-note',
    'body .employee-modal-tabs[role="tablist"]',
    '@media(max-width:380px)',
    'min-height:44px',
    '@media(prefers-reduced-motion:reduce)',
    '@media(forced-colors:active)'
  ])assert(css.includes(item),item);
  assert(js.includes('window.scrollTo({top:origin.y,behavior:'));
  assert(js.includes('data-action="viewer-return"'));
  assert(js.includes('function readerRecordCue(e)'));
  assert(js.includes("role=\"tabpanel\""));
});
console.log('\n'+results.length+' smoke tests passed. Physical-device visual QA is separate.');
