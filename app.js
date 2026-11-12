/* Maddie Journey · local-first static prototype, no authentication or remote persistence. */
(function () {
  'use strict';
  const seed = window.MJ_SEED;
  if (!seed) { document.getElementById('app').textContent='Sample data could not be loaded.'; return; }
  // Read-only UI: data comes exclusively from the immutable fictional fixture.
  // Previous local demo edits are intentionally ignored, never deleted or overwritten.
  const $=function(id){return document.getElementById(id);};
  const clone=function(x){return JSON.parse(JSON.stringify(x));};
  const data=clone(seed);
  const VIEWER_KEY='maddie-journey-viewer-v2';
  let ui={tab:'welcome',viewer:'ceo',division:'all',activeDivision:'rmd',scope:'all',divisionPickerMode:'view',query:'',employee:data.employees[0].id,detail:'preview',employeeModalOpen:false,roleModal:false,divisionModal:false,employeePicker:false,pickerDivision:'rmd',frequency:'monthly',mobile:false,milestoneCategory:'birthday',milestoneDivision:'all',milestoneShowAll:false,milestonePicking:false,divisionTab:'summary',attentionFilter:'all',attentionShowAll:false,workView:'list',journeyView:'board',journeyShowAll:false,workspaceChosen:false,chooserCategory:'all'};
  try{
    const savedId=localStorage.getItem(VIEWER_KEY);
    if(data.viewers.some(function(v){return v.id===savedId;})){ui.viewer=savedId;ui.workspaceChosen=true;}
  }catch(err){}
  // Layout preferences are not employee records and may be stored locally.
  try{const remembered=sessionStorage.getItem('maddie-journey-workview');if(remembered==='board'||remembered==='list')ui.workView=remembered;}catch(err){}
  const now=function(){return new Date().toISOString().slice(0,10);};
  const safe=function(v){return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  const money=function(n){return '₱'+(Number(n)||0).toLocaleString('en-PH',{maximumFractionDigits:2,minimumFractionDigits:2});};
  const viewer=function(){return data.viewers.find(function(v){return v.id===ui.viewer;})||data.viewers[0];};
  const emp=function(id){return data.employees.find(function(e){return e.id===(id||ui.employee);});};
  const div=function(id){return data.divisions.find(function(d){return d.id===id;})||{name:id,short:id,evaluators:[]};};
  const scopedEmployees=function(){return ui.scope==='all'?data.employees:data.employees.filter(function(e){return e.division===ui.scope;});};
  const scopeLabel=function(){return ui.scope==='all'?'All 8 divisions':div(ui.scope).name;};
  function ensureEmployeeScope(){
    const es=scopedEmployees();
    if(es.length&&!es.some(function(e){return e.id===ui.employee;}))ui.employee=es[0].id;
    return es;
  }
  const roleCanHead=function(e){const v=viewer();return !!(e&&(v.role==='head'||v.role==='corp')&&(v.divisions||[]).includes(e.division));};
  const isHR=function(){return viewer().role==='hr';};
  // No source editing, endorsements or employee data submission is permitted.
  const canTrack=function(){return false;};
  const canScore=function(){return false;};
  const canReview=function(){return false;};
  const dateLabel=function(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d.getTime())?safe(v):d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});};
  const escVal=function(v){return safe(v);};
  function persist(){
    try{if(ui.workspaceChosen)localStorage.setItem(VIEWER_KEY,ui.viewer);}
    catch(err){/* Browsing remains available without local storage. */}
  }
  // No audit writes: this static reader has no record mutations.
  function toast(msg){let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}t.textContent=msg;setTimeout(function(){if(t.textContent===msg)t.remove();},3800);}
  function journeyPct(e){const bits=e.journey.flat();return Math.round(bits.filter(Boolean).length/Math.max(1,bits.length)*100);}
  function kitPct(e){return Math.round(e.kit.filter(Boolean).length/Math.max(1,e.kit.length)*100);}
  function score(e){return Math.round((e.scores.division*.15+e.scores.individual*.45+e.scores.values*.15+e.scores.behavior*.25)*100)/100;}
  function rating(v){return v>=95?'Excellent':v>=90?'Above Average':v>=80?'Average':v>=70?'Below Average':'Poor';}
  function attend(e){const a=e.attendance.filter(function(r){return r.verified;});const l=a.filter(function(r){return r.type==='Late';});const ab=a.filter(function(r){return r.type==='Absent';});const concerns=a.filter(function(r){return (r.type==='Late'&&r.approval!=='Excused')||(r.type==='Absent'&&r.approval==='Unapproved');});return {lates:l.length,absences:ab.length,concerns:concerns.length,lastLate:l.map(function(x){return x.date;}).sort().reverse()[0]||'',lastAbs:ab.map(function(x){return x.date;}).sort().reverse()[0]||'',records:a,clean:l.length===0&&ab.length===0};}
  const totalAvg=function(fn){return Math.round(data.employees.reduce(function(a,e){return a+fn(e);},0)/data.employees.length);};
  function approvedCount(){return data.employees.filter(function(e){return e.review.coo.status==='Approved';}).length;}
  function pendingCount(){return data.employees.filter(function(e){return e.review.coo.status!=='Approved';}).length;}
  const initials=function(str){return String(str).split(/\s+/).filter(Boolean).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase();};
  const avatar=function(str){return '<span class="avatar" aria-hidden="true">'+safe(initials(str))+'</span>';};
  const pill=function(status){const t=String(status||'Pending');const cls=['Approved','Endorsed','Complete','Verified','Excellent'].includes(t)?'ok':['Returned','Rejected','Unapproved'].includes(t)?'bad':['Pending','Draft'].includes(t)?'warn':'info';return '<span class="tag '+cls+'">'+safe(t)+'</span>';};
  const button=function(label,action,attributes,cls){return '<button type="button" class="button '+(cls||'')+'" data-action="'+action+'" '+(attributes||'')+'>'+label+'</button>';};
  const input=function(key,value,opts){opts=opts||{};return '<input class="field" type="'+(opts.type||'text')+'" data-field="'+key+'" value="'+escVal(value)+'" '+(opts.min!==undefined?'min="'+opts.min+'" ':'')+(opts.max!==undefined?'max="'+opts.max+'" ':'')+(opts.step!==undefined?'step="'+opts.step+'" ':'')+(opts.disabled?'disabled ':'')+(opts.placeholder?'placeholder="'+safe(opts.placeholder)+'"':'')+'>';};
  const textArea=function(key,value,disabled,placeholder){return '<textarea class="field textarea" data-field="'+key+'" '+(disabled?'disabled ':'')+'placeholder="'+safe(placeholder||'Add a note…')+'">'+safe(value||'')+'</textarea>';};
  function opts(list,value){return list.map(function(x){return '<option value="'+safe(x.value)+'" '+(x.value===value?'selected':'')+'>'+safe(x.label)+'</option>';}).join('');}
  function select(key,value,items,disabled){return '<select class="field" data-field="'+key+'" '+(disabled?'disabled':'')+'>'+opts(items,value)+'</select>';}
  function linkedEmployee(e){return '<button class="link-btn" data-action="open" data-id="'+safe(e.id)+'">'+safe(e.name)+'</button>';}
  function progress(val){return '<div class="progress"><span style="width:'+Math.max(0,Math.min(100,val))+'%"></span></div>';}
  function currentTheme(){return document.documentElement&&document.documentElement.dataset.theme==='light'?'light':'dark';}
  function themeControl(){
    const t=currentTheme();
    return '<div class="theme-control" role="group" aria-label="Appearance — choose light or dark mode">'+
      '<button type="button" class="theme-choice'+(t==='light'?' active':'')+'" data-action="set-theme" data-theme-value="light" aria-pressed="'+(t==='light')+'" aria-label="Use light appearance"><span class="theme-icon" aria-hidden="true">☀</span><span>Light</span></button>'+
      '<button type="button" class="theme-choice'+(t==='dark'?' active':'')+'" data-action="set-theme" data-theme-value="dark" aria-pressed="'+(t==='dark')+'" aria-label="Use dark appearance"><span class="theme-icon" aria-hidden="true">☾</span><span>Dark</span></button>'+
      '</div>';
  }
  function setTheme(next){
    if(!['light','dark'].includes(next))return;
    document.documentElement.dataset.theme=next;
    try{localStorage.setItem('maddie-journey-theme',next);}catch(err){}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',next==='dark'?'#1c1c26':'#f8f9fb');
    document.querySelectorAll('[data-action="set-theme"]').forEach(function(el){
      const pressed=el.dataset.themeValue===next;
      el.setAttribute('aria-pressed',String(pressed));
      el.classList.toggle('active',pressed);
    });
  }
  function topnav(){
    const links=[['overview','Overview'],['divisions','Divisions'],['employees','People'],['milestones','Milestones']];
    const here=ui.tab==='division'?'divisions':ui.tab;
    return '<div class="mobile-top"><a href="#welcome" data-nav="welcome" class="brand mobile-brand" aria-label="Maddie Journey welcome"><img src="./assets/madhouse-logo.png" alt="Madhouse Design Studio" class="mobile-official-logo"><b>Maddie Journey</b></a>'+button('☰','mobile','','small')+'</div>'+
      '<div class="topbar workspace-topbar"><div class="workspace-location"><span class="workspace-location-prefix">Maddie Journey</span><span class="workspace-location-sep">/</span><strong>'+safe(title(ui.tab))+'</strong></div>'+
      '<nav class="workspace-toplinks" aria-label="Quick navigation">'+links.map(function(item){return '<a href="#'+item[0]+'" data-nav="'+item[0]+'" class="'+(here===item[0]?'active':'')+'">'+item[1]+'</a>';}).join('')+'</nav>'+
      '<div class="top-actions workspace-top-actions"><button type="button" class="workspace-search" data-action="quick-search" aria-label="Search employee directory">'+landingIcon('search')+'<span>Search people</span></button>'+
      themeControl()+'</div></div>';
  }
  const items=[['overview','◫','Overview'],['divisions','▦','Divisions'],['employees','◎','Employees'],['milestones','✦','Milestones'],['journey','◷','Journey'],['kit','▣','Welcome Kit'],['attendance','◩','Attendance'],['kpi','◈','KPI scorecards'],['approvals','✓','Reviews'],['sources','↗','Data sources'],['audit','≡','Data & settings']];
  function sidebar(){
    const v=viewer();
    const groups=[['WORKSPACE',['overview','divisions','employees','milestones']],['TRACKERS',['journey','kit','attendance','kpi','approvals']],['SYSTEM',['sources','audit']]];
    const navItems=function(ids){return ids.map(function(id){const item=items.find(function(x){return x[0]===id;});return item?'<a href="#'+id+'" data-nav="'+id+'" class="'+(ui.tab===id||(id==='divisions'&&ui.tab==='division')?'active':'')+'"><span class="nav-icon">'+item[1]+'</span><span>'+item[2]+'</span></a>':'';}).join('');};
    const rail=[['overview','grid'],['divisions','hierarchy'],['employees','users'],['kpi','chart'],['sources','database']];
    return '<aside class="sidebar workspace-sidebar" aria-label="Primary navigation">'+
      '<nav class="workspace-rail" aria-label="Quick sections"><a href="#welcome" data-nav="welcome" class="rail-home" title="Maddie Journey landing" aria-label="Landing page">'+landingIcon('home')+'</a>'+
      rail.map(function(item){const label=({overview:'Overview',divisions:'Divisions',employees:'People',kpi:'KPI scorecards',sources:'Data sources'})[item[0]];return '<a href="#'+item[0]+'" data-nav="'+item[0]+'" title="'+label+'" aria-label="'+label+'" class="'+((ui.tab===item[0]||(item[0]==='divisions'&&ui.tab==='division'))?'active':'')+'">'+landingIcon(item[1])+'</a>';}).join('')+'</nav>'+
      '<div class="workspace-sidepanel"><a href="#welcome" data-nav="welcome" class="brand brand-official-link" aria-label="Return to Maddie Journey landing page"><img class="sidebar-official-logo" src="./assets/madhouse-logo.png" alt="Madhouse Design Studio"><span class="brand-product-name">Maddie Journey</span></a>'+
      '<div class="workspace-sidebar-caption">PEOPLE & CULTURE</div>'+
      groups.map(function(g){return '<div class="sidebar-label">'+g[0]+'</div><nav class="nav" aria-label="'+g[0]+'">'+navItems(g[1])+'</nav>';}).join('')+
      '<div class="sidebar-bottom"><div class="sidebar-user">'+avatar(v.name)+'<span><b>'+safe(v.name)+'</b><small>'+safe(v.title)+'</small></span></div>'+
      '<button class="sidebar-switch" data-action="choose-workspace" type="button">Switch demo workspace</button></div></div></aside>';
  }

  function title(t){if(t==='division')return div(ui.activeDivision).name+' · Evaluation';return {divisions:'Divisions',overview:'Overview',milestones:'Employee milestones',employees:'People directory',journey:'Employee journey',kit:'Welcome Maddie Kit',attendance:'Attendance analytics',kpi:'2026 KPI evaluations',approvals:'Executive approvals',sources:'Data sources',audit:'Activity & data'}[t]||'Overview';}
  function header(eyebrow,heading,description,actions){return '<div class="page-header"><div><div class="eyebrow">'+safe(eyebrow)+'</div><h1>'+safe(heading)+'</h1><p>'+safe(description)+'</p></div><div class="actions">'+(actions||'')+'</div></div>'+(ui.tab==='overview'?'':screenSummary());}

  /* Summaries use the same calculated sample records displayed in each screen. */
  function meanOf(list,calculate){return list.length?Math.round(list.reduce(function(n,e){return n+calculate(e);},0)/list.length):0;}
  function metricCard(label,value,note){return '<div class="metric"><div class="metric-label">'+safe(label)+'<span class="metric-icon">◇</span></div><strong>'+safe(value)+'</strong><div class="metric-sub">'+safe(note)+'</div></div>';}
  function screenSummary(){
    const all=ui.tab==='milestones'?filteredMilestoneTeam():ui.tab==='divisions'?data.employees:scopedEmployees();
    const team=ui.tab==='division'?data.employees.filter(function(e){return e.division===ui.activeDivision;}):all;
    let cards=[];
    if(ui.tab==='division'){
      cards=[['Division members',team.length,'Fictional employee records'],['Average KPI score',meanOf(team,score).toString()+'%','Demonstration figures only'],['Journey completion',meanOf(team,journeyPct)+'%','All 7 onboarding stages'],['Submitted evaluations',team.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length,'Division Head endorsements']];
    }else if(ui.tab==='divisions'){
      cards=[['Active divisions',data.divisions.length,'Dedicated evaluator workspaces'],['Sample employees',all.length,'Company-wide directory'],['Average KPI score',meanOf(all,score)+'%','Demonstration scores'],['Average onboarding',meanOf(all,journeyPct)+'%','Completion across 7 stages']];
    }else if(ui.tab==='milestones'){
      const birthdays=all.filter(function(e){return daysToBirthday(e.birthday)<=30;}).length;
      const confirmed=all.reduce(function(n,e){return n+(e.attendanceAwards||[]).filter(function(a){return a.status==='HR confirmed';}).length;},0);
      cards=[['People tracked',all.length,'Across eight departments'],['Birthdays in 30 days',birthdays,'Fictional birthdays'],['Promotion records',all.reduce(function(n,e){return n+(e.promotions||[]).length;},0),'Recorded demo events'],['Perfect attendance awards',confirmed,'Explicit HR recognition only']];
    }else if(ui.tab==='employees'){
      cards=[['Employee directory',all.length,'Fictional team members'],['Divisions',data.divisions.length,'Assigned evaluator groups'],['Average journey',meanOf(all,journeyPct)+'%','All stages'],['KPI sources to validate',all.filter(function(e){return !e.kpiValidated;}).length,'Official KPI data not connected']];
    }else if(ui.tab==='journey'){
      cards=[['Average completion',meanOf(all,journeyPct)+'%','All stages'],['Stage 1 completed',all.filter(function(e){return e.journey[0].every(Boolean);}).length,'Onboarding & setup'],['Stage 2 completed',all.filter(function(e){return e.journey[1].every(Boolean);}).length,'Onboarding & immersion'],['All 7 stages done',all.filter(function(e){return journeyPct(e)===100;}).length,'Journey complete']];
    }else if(ui.tab==='kit'){
      cards=[['Overall kit completion',meanOf(all,kitPct)+'%','All 11 checklist items'],['Fully provisioned',all.filter(function(e){return kitPct(e)===100;}).length,'Every kit item marked done'],['Pending kits',all.filter(function(e){return kitPct(e)<100;}).length,'Employee kits with open items'],['Requirements completed',all.reduce(function(n,e){return n+e.kit.filter(Boolean).length;},0),'Out of '+all.length*data.kit.length+' total']];
    }else if(ui.tab==='attendance'){
      const a=all.map(attend);
      cards=[['Verified late arrivals',a.reduce(function(n,x){return n+x.lates;},0),'Includes excused entries'],['Verified absences',a.reduce(function(n,x){return n+x.absences;},0),'Review approval reasons'],['No late / absent records',a.filter(function(x){return x.clean;}).length,'Based on verified entries'],['Employees with concerns',a.filter(function(x){return x.concerns>0;}).length,'Unexcused/unapproved verified records']];
    }else if(ui.tab==='kpi'){
      cards=[['Average weighted score',meanOf(all,score)+'%','15 / 45 / 15 / 25 grading'],['Excellent (demo)',all.filter(function(e){return score(e)>=95;}).length,'Sample score 95–100'],['Pending KPI validation',all.filter(function(e){return !e.kpiValidated;}).length,'No official KPI sync'],['Division endorsements',all.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length,'Completed demo head reviews']];
    }else if(ui.tab==='approvals'){
      cards=[['Division Head endorsed',all.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length,'Initial evaluation'],['Corporate Ops endorsed',all.filter(function(e){return reviewStatus(e,'corp')==='Endorsed';}).length,'Review & endorsement'],['CSO reviewed',all.filter(function(e){return reviewStatus(e,'cso')==='Endorsed';}).length,'Strategic review'],['COO approved',all.filter(function(e){return reviewStatus(e,'coo')==='Approved';}).length,'Final approval tracked']];
    }else if(ui.tab==='sources'){
      cards=[['Connected sources',0,'No live integrations configured'],['Demo employees',data.employees.length,'Stored in this browser'],['External sync','Off','Not available on GitHub Pages alone'],['Verified source records',0,'Awaiting secure integration']];
    }else if(ui.tab==='audit'){
      const changed=all.filter(function(e){return e.audit.length>0;});
      cards=[['Employee records',all.length,'All fictional'],['Edited employees',changed.length,'On this browser'],['Logged changes',all.reduce(function(n,e){return n+e.audit.length;},0),'Local activity history'],['Shared sync','Off','JSON backup available']];
    }
    return cards.length?'<section class="screen-summary" aria-label="'+safe(title(ui.tab))+' summary"><div class="summary-heading"><span class="eyebrow">SCREEN SUMMARY</span><span class="muted micro">Calculated from sample data</span></div><div class="grid metrics">'+cards.map(function(c){return metricCard(c[0],c[1],c[2]);}).join('')+'</div></section>':'';
  }
  function divisionEvaluatorNames(d){return d.evaluators.map(function(id){const v=data.viewers.find(function(p){return p.id===id;});return v?v.name:id;}).join(' / ');}
  function assignedDivisionIds(){const v=viewer();return data.divisions.filter(function(d){return d.evaluators.includes(v.id);}).map(function(d){return d.id;});}
  // Department hierarchy is fictional: the reporting lines demonstrate chart behavior.
  function orgChart(d){
    const team=data.employees.filter(function(e){return e.division===d.id;});
    const levelOrder=[6,5,4,3,2,1];
    return '<section class="org-panel" aria-label="'+safe(d.name)+' organization chart" data-department="'+safe(d.id)+'">'+
      '<div class="org-chart-head"><div><h2>Organization chart</h2><p>Levels 6–1 · Click any employee to open a profile preview</p></div>'+
      '<span class="org-demo-hint">Fictional reporting structure</span></div>'+
      '<div class="org-canvas" role="group" aria-label="Department reporting hierarchy">'+
      levelOrder.map(function(level){
        const members=team.filter(function(e){return e.orgLevel===level;});
        return '<div class="org-tier'+(members.length?'':' org-tier-empty')+'"><div class="org-level"><span>Level '+level+'</span></div>'+
          '<div class="org-members">'+(members.length?members.map(function(e){
             const boss=team.find(function(p){return p.id===e.reportsTo;});
             return '<button type="button" class="org-person" data-action="open" data-id="'+safe(e.id)+'" data-detail="preview" aria-label="Open '+safe(e.name)+', '+safe(e.jobTitle)+', level '+level+'">'+
               '<span class="org-person-avatar">'+safe(initials(e.name))+'</span>'+
               '<span class="org-person-content"><strong>'+safe(e.name)+'</strong><small>'+safe(e.jobTitle)+'</small>'+
               '<span class="org-reporting">'+(boss?'Reports to '+safe(boss.name):'Department lead')+'</span></span></button>';
           }).join(''):'<span class="org-level-vacant">No sample members at this level</span>')+'</div></div>';
      }).join('')+'</div>'+
      '<p class="org-chart-note">This hierarchy is an illustrative sample, not an official organizational assignment. Use the employee list to inspect all records.</p></section>';
  }
  function divisionTabButton(id,name){
    return '<button type="button" data-action="division-tab" data-tab="'+id+'" aria-pressed="'+(ui.divisionTab===id)+'" class="division-tab'+(ui.divisionTab===id?' active':'')+'">'+safe(name)+'</button>';
  }
  function divisionPulse(d,team){
    const attention=team.map(function(e){
      const issues=attend(e).concerns,notValidated=!e.kpiValidated,unfinished=kitPct(e)<100;
      return {e:e,priority:issues*8+(notValidated?2:0)+(unfinished?2:0),reason:issues?issues+' verified attendance concern'+(issues===1?'':'s'):notValidated?'KPI source not verified':unfinished?'Welcome Kit incomplete':'Review pending'};
    }).sort(function(a,b){return b.priority-a.priority;}).slice(0,4);
    const kitPending=team.filter(function(e){return kitPct(e)<100;}).length;
    const reviews=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
    return '<div class="division-overview-grid"><section class="panel division-next"><div class="panel-head"><div><h2>Follow-up snapshot</h2><p>Review the sample items most likely to need attention</p></div></div>'+
      '<div class="quick-list">'+attention.map(function(x){return '<div class="quick-item">'+avatar(x.e.name)+'<div class="grow"><b>'+safe(x.e.name)+'</b><p>'+safe(x.reason)+'</p></div>'+
        button('Preview','open','data-id="'+safe(x.e.id)+'" data-detail="preview"','small')+'</div>';}).join('')+'</div></section>'+
      '<section class="panel division-quick"><h2>Department at a glance</h2>'+
      '<div class="division-stat-line"><span>Employees</span><b>'+team.length+'</b></div>'+
      '<div class="division-stat-line"><span>Open Welcome Kits</span><b>'+kitPending+'</b></div>'+
      '<div class="division-stat-line"><span>Awaiting evaluation</span><b>'+reviews+'</b></div>'+
      '<div class="division-stat-line"><span>Average onboarding</span><b>'+meanOf(team,journeyPct)+'%</b></div>'+
      '<div class="division-next-actions">'+button('Organization chart','division-tab','data-tab="chart"','small')+button('Employee list','division-tab','data-tab="team"','small primary')+'</div>'+
      '</section></div>';
  }
  function divisionCard(d){
    const team=data.employees.filter(function(e){return e.division===d.id;});
    const pending=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
    return '<article class="division-card division-summary-card" data-department="'+safe(d.id)+'">'+
      '<div class="division-card-top"><span class="division-short">'+safe(d.short)+'</span><span class="division-count">'+team.length+' members</span></div>'+
      '<h2>'+safe(d.name)+'</h2><p class="division-owner">'+safe(divisionEvaluatorNames(d))+'</p>'+
      '<div class="division-card-stats"><span><strong>'+meanOf(team,journeyPct)+'%</strong><small>Onboarding</small></span>'+
      '<span><strong>'+meanOf(team,kitPct)+'%</strong><small>Welcome Kit</small></span>'+
      '<span><strong>'+pending+'</strong><small>Reviews pending</small></span></div>'+
      '<div class="division-card-footer">'+button('View dashboard','goto-division','data-division="'+safe(d.id)+'"','small primary')+
      '<button type="button" class="division-secondary" data-action="open-org" data-division="'+safe(d.id)+'">Org chart</button></div></article>';
  }
  function divisionsView(){
    const mine=assignedDivisionIds();
    const sorted=data.divisions.slice().sort(function(a,b){return Number(mine.includes(b.id))-Number(mine.includes(a.id));});
    return header('DEPARTMENTS','Divisions','Eight department dashboards with clear ownership, employee summaries and sample reporting charts.',button('Find an employee','nav','data-tab="employees"','small'))+
      '<section class="division-grid">'+sorted.map(divisionCard).join('')+'</section>';
  }
  function employeeCard(e){
    const pct=score(e);
    return '<article class="member-card"><div class="member-card-head">'+avatar(e.name)+'<div class="member-identity"><h3>'+safe(e.name)+'</h3><p>'+safe(e.jobTitle)+'</p></div>'+pill(reviewStatus(e,'division'))+'</div>'+
      '<div class="member-score-row"><span><small>Overall KPI</small><strong>'+pct.toFixed(1)+'%</strong></span><span><small>Onboarding</small><strong>'+journeyPct(e)+'%</strong></span><span><small>Welcome Kit</small><strong>'+kitPct(e)+'%</strong></span></div>'+
      '<div class="member-card-progress">'+progress(journeyPct(e))+'</div>'+
      '<div class="member-card-buttons">'+button('Preview charts','open','data-id="'+safe(e.id)+'" data-detail="preview"','small')+
      button('View KPI','open','data-id="'+safe(e.id)+'" data-detail="kpi"','small primary')+'</div></article>';
  }
  function divisionStage(e){
    const journey=journeyPct(e),kit=kitPct(e),review=reviewStatus(e,'division');
    if(journey===100&&kit===100&&review==='Endorsed')return 'complete';
    if(journey>=85&&review!=='Endorsed')return 'review';
    if(journey>0||kit>0)return 'progress';
    return 'todo';
  }
  function divisionBoard(team){
    const groups=[['todo','To do'],['progress','In progress'],['review','Ready for review'],['complete','Completed']];
    return '<section class="department-board" aria-label="Team onboarding status board">'+groups.map(function(g){
      const members=team.filter(function(e){return divisionStage(e)===g[0];});
      return '<div class="department-board-lane lane-'+g[0]+'"><div class="department-lane-head"><strong>'+g[1]+'</strong><span>'+members.length+'</span></div>'+
        '<div class="department-lane-cards">'+(members.length?members.map(function(e){
          return '<button class="department-person-card" data-action="open" data-id="'+safe(e.id)+'" data-detail="preview" type="button" aria-label="Open '+safe(e.name)+'">'+
            '<strong>'+safe(e.name)+'</strong><small>'+safe(e.jobTitle)+'</small>'+
            '<span class="department-person-progress"><span>Journey</span><b>'+journeyPct(e)+'%</b></span>'+
            '<span class="work-card-progress"><span style="width:'+Math.min(100,Math.max(0,journeyPct(e)))+'%"></span></span>'+
            '<span class="department-person-footer">'+avatar(e.name)+'<span>Welcome Kit '+kitPct(e)+'%</span></span></button>';
        }).join(''):'<p class="work-lane-empty">No sample members</p>')+'</div></div>';
    }).join('')+'</section><p class="muted micro department-stage-note">Board grouping uses sample Journey, Welcome Kit and division review states. Open a person to review the actual details.</p>';
  }
  function divisionList(team){
    const order=team.slice().sort(function(a,b){return a.name.localeCompare(b.name);});
    const names={todo:'To do',progress:'In progress',review:'For review',complete:'Completed'};
    return '<section class="panel department-table-panel"><div class="panel-head"><div><h2>Team directory</h2><p>Progress and review status for all '+team.length+' sample members</p></div></div>'+
      '<div class="table-wrap"><table class="table department-table"><thead><tr><th scope="col">Employee</th><th scope="col">Status</th><th scope="col">Journey</th><th scope="col">Welcome Kit</th><th scope="col">KPI</th><th scope="col"></th></tr></thead>'+
      '<tbody>'+order.map(function(e){const stage=divisionStage(e);return '<tr><td><div class="name-cell">'+avatar(e.name)+'<div><strong>'+safe(e.name)+'</strong><small>'+safe(e.jobTitle)+'</small></div></div></td>'+
      '<td><span class="work-type work-stage-'+stage+'">'+names[stage]+'</span></td>'+
      '<td>'+journeyPct(e)+'%</td><td>'+kitPct(e)+'%</td><td>'+score(e).toFixed(1)+'%</td>'+
      '<td>'+button('Preview','open','data-id="'+safe(e.id)+'" data-detail="preview"','small')+'</td></tr>';}).join('')+'</tbody></table></div></section>';
  }
  function divisionView(){
    const d=div(ui.activeDivision),team=data.employees.filter(function(e){return e.division===d.id;});
    if(!team.length)return header('DIVISION','No team members','Choose another division.',button('All divisions','nav','data-tab="divisions"','small'));
    const sub={
      summary:divisionPulse(d,team),
      board:divisionBoard(team),
      list:divisionList(team),
      chart:orgChart(d),
      team:'<section class="member-grid">'+team.slice().sort(function(a,b){return a.orgLevel===b.orgLevel?a.name.localeCompare(b.name):b.orgLevel-a.orgLevel;}).map(employeeCard).join('')+'</section>'
    };
    return header('DIVISION OVERVIEW',d.name,team.length+' sample employees · '+divisionEvaluatorNames(d),button('All divisions','nav','data-tab="divisions"','small'))+
      '<nav class="division-tabs" aria-label="Division views">'+divisionTabButton('summary','Summary')+divisionTabButton('board','Board')+divisionTabButton('list','List')+divisionTabButton('chart','Org chart')+'</nav>'+
      (sub[ui.divisionTab]||sub.summary);
  }
  function quickDivisionAccess(){
    const ids=assignedDivisionIds();
    if(!ids.length)return '';
    return '<section class="panel assigned-panel"><div class="heading-line"><div><h2>My division evaluation desk'+(ids.length>1?'s':'')+'</h2><p class="muted micro">Open your assigned members and their KPI scorecards</p></div>'+button('All divisions','nav','data-tab="divisions"','small')+'</div><div class="assigned-links">'+ids.map(function(id){const d=div(id);const team=data.employees.filter(function(e){return e.division===id;});return button(safe(d.name)+' · '+team.length+' members','goto-division','data-division="'+safe(id)+'"','primary');}).join('')+'</div></section>';
  }
  function metrics(){
    const staff=scopedEmployees(),n=staff.length,done=staff.filter(function(e){return reviewStatus(e,'coo')==='Approved';}).length;
    return '<div class="grid metrics">'+metricCard('Team members',n,scopeLabel()+' · demo')+
      metricCard('Journey completion',meanOf(staff,journeyPct)+'%','All 7 onboarding stages')+
      metricCard('Welcome Kit ready',meanOf(staff,kitPct)+'%','Equipment, tools and access')+
      metricCard('Final approvals',done+' / '+n,(n-done)+' pending or in progress')+'</div>';
  }

  function attentionItems(team,role){
    const items=[];
    const create=function(e,group,label,detail,weight){
      items.push({e:e,group:group,label:label,detail:detail,weight:weight});
    };
    team.forEach(function(e){
      const a=attend(e),pending=e.attendance.filter(function(r){return !r.verified;}).length;
      if(a.concerns>0)create(e,'attendance',a.concerns+' verified attendance concern'+(a.concerns===1?'':'s'),'attendance',100+a.concerns);
      if(pending>0&&role==='hr')create(e,'attendance',pending+' attendance entr'+(pending===1?'y':'ies')+' awaiting verification','attendance',94+pending);
      if(!e.kpiValidated)create(e,'kpi','KPI source not validated','kpi',80);
      if(reviewStatus(e,'division')!=='Endorsed'&&role!=='hr')create(e,'reviews','Division evaluation pending','approvals',72);
      if(kitPct(e)<100)create(e,'onboarding','Welcome Kit '+kitPct(e)+'% complete','kit',58+(100-kitPct(e))/100);
      if(journeyPct(e)<100)create(e,'onboarding','Journey '+journeyPct(e)+'% complete','journey',46+(100-journeyPct(e))/100);
    });
    return items.sort(function(a,b){return b.weight-a.weight||a.e.name.localeCompare(b.e.name);});
  }
  function attentionPanel(team,role){
    const all=attentionItems(team,role);
    const categories=[['all','All'],['attendance','Attendance'],['kpi','KPI'],['onboarding','Onboarding'],['reviews','Reviews']];
    const active=categories.some(function(x){return x[0]===ui.attentionFilter;})?ui.attentionFilter:'all';
    const rows=active==='all'?all:all.filter(function(x){return x.group===active;});
    const listLimit=ui.attentionShowAll?Math.min(30,rows.length):8;
    const boardLimit=ui.attentionShowAll?9:4;
    const tabs='<div class="workspace-view-switch" role="group" aria-label="Choose tracker view">'+
      ['list','board'].map(function(mode){return '<button type="button" data-action="work-view" data-mode="'+mode+'" aria-pressed="'+(ui.workView===mode)+'" class="'+(ui.workView===mode?'active':'')+'">'+landingIcon(mode==='board'?'grid':'list')+(mode==='board'?'Board':'List')+'</button>';}).join('')+'</div>';
    const list='<div class="work-list-table"><div class="work-list-head"><span>Employee</span><span>Follow-up</span><span>Department</span><span></span></div>'+
      (rows.length?rows.slice(0,listLimit).map(function(item){
        return '<div class="work-list-row">'+
          '<div class="work-list-person">'+avatar(item.e.name)+'<div><strong>'+safe(item.e.name)+'</strong><small>'+safe(item.e.jobTitle)+'</small></div></div>'+
          '<div class="work-list-subject"><span class="work-type work-type-'+item.group+'">'+safe(item.group==='kpi'?'KPI':item.group==='reviews'?'Review':item.group==='onboarding'?'Onboarding':'Attendance')+'</span><span>'+safe(item.label)+'</span></div>'+
          '<span class="work-list-division">'+safe(div(item.e.division).short)+'</span>'+button('Open','open','data-id="'+safe(item.e.id)+'" data-detail="'+item.detail+'"','small')+'</div>';
      }).join(''):'<p class="empty">No sample follow-ups in this category.</p>')+'</div>';
    const groups=categories.slice(1).filter(function(c){return active==='all'||active===c[0];});
    const board='<div class="work-board" role="group" aria-label="Follow-up categories">'+groups.map(function(c){
      const subset=all.filter(function(x){return x.group===c[0];}),shown=subset.slice(0,boardLimit);
      return '<section class="work-lane work-lane-'+c[0]+'"><header class="work-lane-head"><strong>'+c[1]+'</strong><span>'+subset.length+'</span></header>'+
        '<div class="work-lane-cards">'+(shown.length?shown.map(function(item){
          const percent=item.group==='onboarding'?journeyPct(item.e):item.group==='kpi'?score(item.e):null;
          return '<button type="button" class="work-card" data-action="open" data-id="'+safe(item.e.id)+'" data-detail="'+item.detail+'" aria-label="Open '+safe(item.e.name)+': '+safe(item.label)+'">'+
            '<strong>'+safe(item.label)+'</strong><span class="work-card-employee">'+avatar(item.e.name)+'<span>'+safe(item.e.name)+'</span></span>'+
            '<span class="work-card-meta">'+safe(div(item.e.division).short)+(percent!==null?' · '+Math.round(percent)+'%':'')+'</span>'+
            (percent!==null?'<span class="work-card-progress"><span style="width:'+Math.min(100,Math.max(0,percent))+'%"></span></span>':'')+'</button>';
        }).join(''):'<p class="work-lane-empty">No sample follow-ups</p>')+'</div>'+
        (subset.length>boardLimit?'<p class="work-lane-count">Showing '+shown.length+' of '+subset.length+'</p>':'')+'</section>';
    }).join('')+'</div>';
    return '<section class="panel work-queue"><div class="panel-head"><div><h2>Needs attention</h2><p>Sample follow-ups based on recorded progress · select a row or card to preview</p></div>'+
      '<div class="work-queue-tools"><span class="queue-count">'+rows.length+' items</span>'+tabs+'</div></div>'+
      '<div class="queue-filters" role="group" aria-label="Filter follow-ups">'+categories.map(function(c){
        const count=c[0]==='all'?all.length:all.filter(function(x){return x.group===c[0];}).length;
        return '<button type="button" data-action="attention-filter" data-kind="'+c[0]+'" class="queue-filter'+(active===c[0]?' active':'')+'" aria-pressed="'+(active===c[0])+'">'+c[1]+' <span>'+count+'</span></button>';
      }).join('')+'</div>'+(ui.workView==='board'?board:list)+
      (rows.length>(ui.workView==='board'?boardLimit*groups.length:listLimit)?'<div class="queue-footer">'+button(ui.attentionShowAll?'Show fewer':'Show more','attention-more','','small')+'</div>':'')+'</section>';
  }
  function divisionPulseTable(divisions){
    return '<section class="panel pulse-panel"><div class="panel-head"><div><h2>Division snapshot</h2><p>Eight departments with consistent sample progress measures</p></div>'+
      button('All divisions','nav','data-tab="divisions"','small')+'</div><div class="table-wrap"><table class="table pulse-table"><thead><tr>'+
      '<th scope="col">Division</th><th scope="col">People</th><th scope="col">Onboarding</th><th scope="col">Welcome Kit</th><th scope="col">Reviews pending</th><th scope="col"></th></tr></thead><tbody>'+
      divisions.map(function(d){
        const team=data.employees.filter(function(e){return e.division===d.id;});
        const pending=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
        return '<tr><td><strong>'+safe(d.name)+'</strong></td><td>'+team.length+'</td><td>'+meanOf(team,journeyPct)+'%</td><td>'+meanOf(team,kitPct)+'%</td><td>'+pending+'</td>'+
          '<td>'+button('View','goto-division','data-division="'+safe(d.id)+'"','small')+'</td></tr>';
      }).join('')+'</tbody></table></div></section>';
  }
  function dataProvenanceStrip(){
    return '<div class="data-provenance"><span class="data-provenance-dot" aria-hidden="true"></span>'+
      '<div><strong>Sample data</strong><span>Stored in this browser · No live Airtable or Google sync</span></div>'+
      button('Source details','nav','data-tab="sources"','small')+'</div>';
  }
  function roleHome(){
    const v=viewer(),role=v.role;
    const isManager=role==='head'||role==='corp';
    const team=isManager?data.employees.filter(function(e){return (v.divisions||[]).includes(e.division);}):data.employees;
    const divs=isManager?data.divisions.filter(function(d){return (v.divisions||[]).includes(d.id);}):data.divisions;
    const pending=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
    const a=team.reduce(function(n,e){return n+attend(e).concerns;},0);
    const openKit=team.filter(function(e){return kitPct(e)<100;}).length;
    const unvalidated=team.filter(function(e){return !e.kpiValidated;}).length;
    const heading=isManager?'My departments':role==='hr'?'People & Culture overview':'Organization overview';
    const desc=isManager?'Track the departments you evaluate, and open only the records you need.':
      'Eight divisions, one clear overview. Every value shown is fictional sample data.';
    const cards=isManager?[
      ['Team members',team.length,'Across '+divs.length+' assigned divisions'],
      ['Evaluations pending',pending,'Division review not endorsed'],
      ['KPI sources to verify',unvalidated,'Official sources not linked'],
      ['Average onboarding',meanOf(team,journeyPct)+'%','Across seven stages']
    ]:[
      ['Employees',team.length,'Eight fictional divisions'],
      ['Kits incomplete',openKit,'Open onboarding requirements'],
      ['Attendance concerns',a,'Verified, unexcused incidents'],
      ['KPI sources to verify',unvalidated,'Live sources not connected']
    ];
    return header('DASHBOARD',heading,desc,button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<section class="grid metrics summary-metrics">'+cards.map(function(c){return metricCard(c[0],c[1],c[2]);}).join('')+'</section>'+
      dataProvenanceStrip()+
      '<div class="workspace-action-center">'+attentionPanel(team,role)+'</div><div class="dashboard-main dashboard-secondary"><div class="dashboard-side">'+
      '<section class="panel next-step-panel"><h2>Quick access</h2><p>Choose a destination. You can return here at any time.</p>'+
      '<div class="next-step-actions">'+button('Employee directory','nav','data-tab="employees"','small')+
      button('Milestones','nav','data-tab="milestones"','small')+
      button('KPI scorecards','nav','data-tab="kpi"','small')+
      button('Attendance','nav','data-tab="attendance"','small')+'</div></section>'+
      '<section class="panel overview-brief"><h2>Evaluation progress</h2><div class="division-stat-line"><span>Pending division reviews</span><b>'+pending+'</b></div>'+
      '<div class="division-stat-line"><span>Average Welcome Kit completion</span><b>'+meanOf(team,kitPct)+'%</b></div>'+
      '<div class="division-stat-line"><span>Average journey completion</span><b>'+meanOf(team,journeyPct)+'%</b></div></section></div></div>'+
      divisionPulseTable(divs);
  }
  function overview(){return roleHome();}
  function employeesTable(list,mode){if(!list.length)return '<div class="empty"><span class="big">⌕</span>No employees match these filters.</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Division</th><th>Journey</th><th>Kit issued</th><th>KPI score</th><th>Actions</th></tr></thead><tbody>'+list.map(function(e){return '<tr><td><div class="name-cell">'+avatar(e.name)+'<div><strong>'+safe(e.name)+'</strong><small>'+safe(e.id)+' · '+safe(e.jobTitle)+'</small></div></div></td><td>'+safe(div(e.division).short)+'</td><td><div class="progress-wrapper">'+progress(journeyPct(e))+'<span>'+journeyPct(e)+'%</span></div></td><td>'+kitPct(e)+'%</td><td><strong>'+score(e).toFixed(1)+'%</strong><small>'+rating(score(e))+'</small></td><td>'+button('Preview','open','data-id="'+e.id+'" data-detail="'+(mode||'preview')+'"','small')+'</td></tr>';}).join('')+'</tbody></table></div>';}
  function filtered(){return scopedEmployees().filter(function(e){return !ui.query||(e.name+' '+e.id+' '+e.jobTitle+' '+div(e.division).name).toLowerCase().includes(ui.query.toLowerCase());});}
  function filters(){return '<div class="filters"><input type="search" class="search" aria-label="Search employees" data-ui="query" placeholder="Search '+safe(scopeLabel())+'..." value="'+safe(ui.query)+'">'+button('Change division','choose-scope','','small')+'<span class="muted micro">'+filtered().length+' employees in view</span></div>';}
  function employees(){return header('PEOPLE DIRECTORY','All Maddies','Browse your selected division or all 51 fictional employees across 8 departments.',button('Export CSV','export-csv','','small')+' '+button('Download backup','export','','small'))+'<section class="panel no-pad"><div style="padding:20px 20px 0">'+filters()+'</div>'+employeesTable(filtered())+'</section>';}
  /* Compact per-division summary and actionable roster reused by each operational tracker. */
  function trackerRoster(kind){
    const titles={journey:'Journey',kit:'Welcome Kit',attendance:'Attendance',kpi:'KPI evaluation',approvals:'Review status'};
    const steps=function(e){return ['division','corp','cso','coo'].filter(function(k){return e.review[k].status===(k==='coo'?'Approved':'Endorsed');}).length;};
    const progressFor=function(e){return kind==='journey'?journeyPct(e):kind==='kit'?kitPct(e):kind==='kpi'?score(e):steps(e)*25;};
    if(ui.scope==='all'){
      return '<section class="panel scope-tracker"><div class="panel-head"><div><h2>'+safe(titles[kind])+' · Divisions</h2><p>Choose one department, then open the relevant employee.</p></div></div>'+
        '<div class="scope-division-rows">'+data.divisions.map(function(d){const staff=data.employees.filter(function(e){return e.division===d.id;}),attIssues=staff.reduce(function(n,e){return n+attend(e).concerns;},0),val=meanOf(staff,progressFor);
          return '<div class="scope-division-row"><div><b>'+safe(d.name)+'</b><small>'+staff.length+' employees</small></div>'+
            (kind==='attendance'?'<div class="muted micro">Verified records only</div>':'<div class="scope-progress">'+progress(val)+'</div>')+
            '<strong>'+(kind==='attendance'?attIssues+' issues':val+'%')+'</strong>'+button('View team','set-scope','data-division="'+safe(d.id)+'"','small')+'</div>';
        }).join('')+'</div></section>';
    }
    const staff=scopedEmployees().slice().sort(function(a,b){return kind==='attendance'?attend(b).concerns-attend(a).concerns:progressFor(a)-progressFor(b);});
    return '<section class="panel scope-tracker"><div class="panel-head"><div><h2>'+safe(div(ui.scope).name)+' · Team</h2><p>'+staff.length+' sample employees. Open a member to continue.</p></div>'+button('All divisions','set-scope','data-division="all"','small')+'</div>'+
      '<div class="scope-member-rows">'+staff.map(function(e){
        const val=progressFor(e),a=attend(e),label=kind==='attendance'?a.concerns+' concerns':kind==='approvals'?steps(e)+'/4 steps':kind==='kpi'?val.toFixed(1)+'%':Math.round(val)+'%';
        return '<div class="scope-member-row">'+avatar(e.name)+'<div class="scope-member-name"><b>'+safe(e.name)+'</b><small>'+safe(e.jobTitle)+'</small></div>'+
          (kind==='attendance'?'<div class="scope-member-progress muted micro">'+a.lates+' late · '+a.absences+' absent</div>':'<div class="scope-member-progress">'+progress(val)+'</div>')+
          '<strong>'+label+'</strong>'+button('Open','open','data-id="'+safe(e.id)+'" data-detail="'+kind+'"','small')+'</div>';
      }).join('')+'</div></section>';
  }
  function stageCards(e){
    return '<div class="grid step-grid">'+data.stages.map(function(stage,si){
      const total=stage.items.length,done=e.journey[si].filter(Boolean).length;
      return '<section class="step-card"><div class="step-title"><div><span class="step-number">STAGE '+(si+1)+' · '+safe(stage.timing)+'</span><h3>'+safe(stage.name)+'</h3></div>'+
        '<span class="tag '+(done===total?'ok':'warn')+'">'+done+'/'+total+'</span></div>'+
        progress(Math.round(done/total*100))+'<div class="reader-checklist">'+stage.items.map(function(item,ii){
          const completed=!!e.journey[si][ii];
          return '<div class="reader-check'+(completed?' is-complete':'')+'"><span class="reader-check-icon" aria-hidden="true">'+(completed?'✓':'–')+'</span>'+
          '<span>'+safe(item)+'</span><small>'+(completed?'Complete':'Pending')+'</small></div>';
        }).join('')+'</div></section>';
    }).join('')+'</div>';
  }

  function employeeSelector(){ensureEmployeeScope();const e=emp();return '<label class="field-label">Selected employee</label><button type="button" class="employee-picker-trigger" data-action="choose-employee" aria-haspopup="dialog" aria-label="Choose an employee">'+avatar(e.name)+'<span><b>'+safe(e.name)+'</b><small>'+safe(div(e.division).short)+' · '+safe(e.id)+'</small></span><strong>Change member ↗</strong></button>';}
  function journeyStage(e){
    const stage=e.journey.findIndex(function(items){return !items.every(Boolean);});
    return stage<0?7:stage;
  }
  function journeyKanban(staff){
    const stages=data.stages.map(function(stage,i){return {index:i,label:stage.name,timing:stage.timing};}).concat([{index:7,label:'Journey completed',timing:'All seven stages'}]);
    const limit=ui.journeyShowAll?1000:8;
    return '<section class="journey-kanban" aria-label="Seven-stage Journey Kanban board">'+stages.map(function(stage){
      const members=staff.filter(function(e){return journeyStage(e)===stage.index;}).sort(function(a,b){return a.name.localeCompare(b.name);});
      return '<div class="journey-lane" data-stage-index="'+stage.index+'">'+
        '<div class="journey-lane-head"><div class="journey-lane-title"><span class="journey-stage-dot"></span><strong>'+
        (stage.index<7?'Stage '+(stage.index+1):'Completed')+'</strong><span class="journey-stage-count">'+members.length+'</span></div>'+
        '<h3>'+safe(stage.label)+'</h3><p>'+safe(stage.timing)+'</p></div>'+
        '<div class="journey-lane-scroll">'+(members.length?members.slice(0,limit).map(function(e){
          const stageItems=e.journey[stage.index]||[],count=stageItems.filter(Boolean).length;
          const progressOfStage=stage.index===7?100:Math.round(count/Math.max(1,stageItems.length)*100);
          return '<button type="button" class="journey-person" data-action="open" data-id="'+safe(e.id)+'" data-detail="journey"'+
            ' aria-label="Preview '+safe(e.name)+' Journey progress"><span class="journey-person-head">'+avatar(e.name)+
            '<span><strong>'+safe(e.name)+'</strong><small>'+safe(div(e.division).short)+' · '+safe(e.jobTitle)+'</small></span></span>'+
            '<span class="journey-person-progress"><span>'+ (stage.index===7?'Journey complete':'Current stage · '+count+'/'+stageItems.length)+'</span><b>'+journeyPct(e)+'% total</b></span>'+
            '<span class="work-card-progress"><span style="width:'+progressOfStage+'%"></span></span></button>';
        }).join(''):'<p class="journey-lane-empty">No sample employees</p>')+'</div>'+
        (!ui.journeyShowAll&&members.length>limit?'<p class="journey-lane-more">+'+(members.length-limit)+' more · Switch to Table for all</p>':'')+
        '</div>';
    }).join('')+'</section>';
  }
  function journeyTable(staff){
    const sorted=staff.slice().sort(function(a,b){return journeyStage(a)-journeyStage(b)||a.name.localeCompare(b.name);});
    return '<section class="panel journey-table-panel"><div class="panel-head"><div><h2>Employee journey summary</h2>'+
      '<p>All '+staff.length+' sample employees sorted by current incomplete stage</p></div></div>'+
      '<div class="table-wrap"><table class="table journey-table"><thead><tr><th scope="col">Employee</th><th scope="col">Division</th>'+
      '<th scope="col">Current stage</th><th scope="col">Overall</th><th scope="col">Completed stages</th><th scope="col"></th></tr></thead><tbody>'+
      sorted.map(function(e){
        const i=journeyStage(e),label=i===7?'Completed':'Stage '+(i+1)+' · '+data.stages[i].name;
        return '<tr><td><div class="name-cell">'+avatar(e.name)+'<div><strong>'+safe(e.name)+'</strong><small>'+safe(e.jobTitle)+'</small></div></div></td>'+
          '<td>'+safe(div(e.division).short)+'</td><td><span class="journey-stage-pill">'+safe(label)+'</span></td>'+
          '<td><div class="progress-wrapper">'+progress(journeyPct(e))+'<span>'+journeyPct(e)+'%</span></div></td>'+
          '<td>'+e.journey.filter(function(a){return a.every(Boolean);}).length+' / 7</td>'+
          '<td>'+button('Preview','open','data-id="'+safe(e.id)+'" data-detail="journey"','small')+'</td></tr>';
      }).join('')+'</tbody></table></div></section>';
  }
  function journey(){
    const team=scopedEmployees(),stageCounts=Array.from({length:8},function(_,i){return team.filter(function(e){return journeyStage(e)===i;}).length;});
    const avg=meanOf(team,journeyPct);
    return header('ONBOARDING MONITORING','Journey board',
      'See all seven stages in one view. People are grouped by their first incomplete stage; nothing can be edited here.',
      button(scopeLabel()+' ▾','choose-scope','','small'))+
      '<div class="journey-board-toolbar"><div><h2>'+safe(scopeLabel())+'</h2><p>'+team.length+' employees · '+avg+'% average journey completion · '+stageCounts[7]+' completed</p></div>'+
      '<div class="workspace-view-switch" role="group" aria-label="Journey presentation">'+
      ['board','table'].map(function(mode){return '<button type="button" data-action="journey-view" data-mode="'+mode+'" class="'+(ui.journeyView===mode?'active':'')+'" aria-pressed="'+(ui.journeyView===mode)+'">'+
      landingIcon(mode==='board'?'grid':'list')+(mode==='board'?'Board':'Table')+'</button>';}).join('')+'</div></div>'+
      (ui.journeyView==='table'?journeyTable(team):journeyKanban(team))+
      '<p class="journey-explainer">This is a read-only sample snapshot. If a later stage contains completed tasks, the board still groups the employee under the earliest incomplete stage. View any employee for the full seven-stage checklist.</p>';
  }

  function kitSection(e){
    return '<div class="kit-grid">'+data.kit.map(function(k,i){
      const note=e.kitNotes[k.id]||'',ready=!!e.kit[i];
      return '<article class="kit-item reader-kit-item"><div class="reader-kit-title"><span class="reader-check-icon'+(ready?' is-complete':'')+'" aria-hidden="true">'+(ready?'✓':'–')+'</span><strong>'+safe(k.label)+'</strong>'+
        pill(ready?'Complete':'Pending')+'</div><p class="reader-kit-type">'+(k.type==='equipment'?'Issuance details':'Access reference')+'</p>'+
        '<p class="reader-kit-note">'+safe(note||'No additional source details in sample')+'</p></article>';
    }).join('')+'</div>';
  }

  function kitView(){
    return header('EMPLOYEE SETUP','Welcome Maddie Kit','Select a department, then open an employee to review equipment, tools and access.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      trackerRoster('kit')+'<p class="muted micro tracker-footnote">Do not put passwords or private credentials in sample access notes.</p>';
  }
  function attendanceSummary(e){const a=attend(e);return '<div class="grid metrics"><div class="metric"><div class="metric-label">Verified late arrivals</div><strong>'+a.lates+'</strong><div class="metric-sub">Last: '+dateLabel(a.lastLate)+'</div></div><div class="metric"><div class="metric-label">Verified absences</div><strong>'+a.absences+'</strong><div class="metric-sub">Last: '+dateLabel(a.lastAbs)+'</div></div><div class="metric"><div class="metric-label">Attendance concerns</div><strong>'+a.concerns+'</strong><div class="metric-sub">Excused late entries excluded</div></div><div class="metric"><div class="metric-label">Attendance status</div><strong style="font-size:21px">'+(a.records.length?'With records':'No record')+'</strong><div class="metric-sub">Only verified entries are counted</div></div></div>';}
  function attendanceRows(e){
    const rows=e.attendance.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Approval</th><th>Verification</th><th>Reason / remarks</th></tr></thead><tbody>'+
      rows.map(function(r){return '<tr><td>'+dateLabel(r.date)+'</td><td><strong>'+safe(r.type)+'</strong></td><td>'+pill(r.approval)+'</td>'+
        '<td>'+pill(r.verified?'Verified':'Pending')+'</td><td><strong>'+safe(r.reason)+'</strong><small>'+safe(r.remarks)+'</small></td></tr>';}).join('')+
      '</tbody></table></div>';
  }

  function series(){const months=[];const dt=new Date();dt.setDate(1);for(let i=5;i>=0;i--){const d=new Date(dt.getFullYear(),dt.getMonth()-i,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');let late=0,abs=0;scopedEmployees().forEach(function(e){e.attendance.forEach(function(r){if(r.verified&&r.date.slice(0,7)===key){if(r.type==='Late')late++;if(r.type==='Absent')abs++;}});});months.push({label:d.toLocaleDateString('en-PH',{month:'short'}),late:late,abs:abs});}return months;}
  function chart(){
    const periods=series(),max=Math.max(1,...periods.map(function(p){return p.late+p.abs;}));
    return '<div class="mini-bars" role="img" aria-label="Six-month verified attendance trend">'+periods.map(function(p){
      const n=p.late+p.abs,h=n?Math.max(5,Math.round(n/max*92)):0;
      return '<div title="'+safe(p.label)+': '+p.late+' late, '+p.abs+' absent"><span style="height:'+h+'px" class="'+(n?'':'no-incidents')+'"></span>'+safe(p.label)+'</div>';
    }).join('')+'</div><p class="muted micro" style="margin-top:12px">Last 6 months · only verified late and absence entries; no entries does not prove perfect attendance.</p>';
  }
  function rankRows(type){const ranked=scopedEmployees().map(function(e){return {e:e,n:attend(e)[type]};}).filter(function(v){return v.n>0;}).sort(function(a,b){return b.n-a.n;}).slice(0,5);return ranked.length?ranked.map(function(v,i){return '<div class="rank"><span class="rank-index">'+(i+1)+'</span><div><b>'+linkedEmployee(v.e)+'</b><p class="muted micro">'+safe(div(v.e.division).short)+'</p></div><span class="count">'+v.n+'</span></div>';}).join(''):'<p class="muted">No verified entries</p>';}
  function attendancePeriodTable(){const buckets={};scopedEmployees().forEach(function(e){e.attendance.forEach(function(r){if(!r.verified)return;let period=r.date.slice(0,7);if(ui.frequency==='weekly'){const d=new Date(r.date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));period=d.toISOString().slice(0,10);}if(!buckets[period])buckets[period]={late:0,absent:0,approved:0,excused:0};if(r.type==='Late'){buckets[period].late++;if(r.approval==='Excused')buckets[period].excused++;}if(r.type==='Absent')buckets[period].absent++;if(r.type==='Leave'&&r.approval==='Approved')buckets[period].approved++;});});const keys=Object.keys(buckets).sort().reverse().slice(0,12);return '<section class="panel" style="margin-top:17px"><div class="panel-head"><div><h2>Weekly & monthly summary</h2><p>Verified records only; approved leave and excused lateness are displayed separately</p></div><select class="field" style="max-width:150px" aria-label="Attendance summary frequency" data-ui="frequency">'+opts([{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}],ui.frequency)+'</select></div><div class="table-wrap"><table class="table"><thead><tr><th>Period</th><th>Late arrivals</th><th>Absences</th><th>Excused lates</th><th>Approved leaves</th></tr></thead><tbody>'+(keys.length?keys.map(function(k){const b=buckets[k];return '<tr><td><strong>'+safe(k)+'</strong></td><td>'+b.late+'</td><td>'+b.absent+'</td><td>'+b.excused+'</td><td>'+b.approved+'</td></tr>';}).join(''):'<tr><td colspan="5">No verified records for this frequency.</td></tr>')+'</tbody></table></div></section>';}
  function attendanceView(){
    return header('ATTENDANCE','Attendance monitoring','Verified incidents, monthly trends and individual recorded entries. All information is view-only.',button('Export attendance','attendance-csv','','small'))+
      '<section class="panel attendance-trend-panel"><div class="panel-head"><div><h2>Recent attendance</h2><p>Verified late arrivals and absences · last six months</p></div></div>'+chart()+'</section>'+
      trackerRoster('attendance')+
      '<details class="panel compact-details"><summary>See late and absence rankings</summary><div class="grid subgrid" style="margin-top:18px"><div><h3>Late arrivals</h3>'+rankRows('lates')+'</div><div><h3>Absences</h3>'+rankRows('absences')+'</div></div></details>';
  }
  function scoresPanel(e){
    const categories=[['division','Division objectives',15],['individual','Individual objectives',45],['values','Values alignment',15],['behavior','Job behavior',25]];
    return '<section class="reader-score-panel" aria-label="Category score preview">'+categories.map(function(cat){
      const val=e.scores[cat[0]],weight=cat[2];
      return '<div class="reader-score-card"><span class="muted micro">'+weight+'% weight</span><h3>'+cat[1]+'</h3>'+
        '<strong>'+Number(val).toFixed(1)+'%</strong>'+progress(val)+
        '<small>Weighted contribution '+(val*weight/100).toFixed(2)+' points</small></div>';
    }).join('')+'</section>';
  }

  function kpiDetail(e){
    const s=score(e);
    return '<div class="grid dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Weighted evaluation</h2>'+
      '<p>Division 15% · Individual 45% · Values 15% · Behavior 25%</p></div>'+pill(rating(s))+'</div>'+
      '<div class="big-score">'+s.toFixed(2)+'%</div>'+
      '<div class="score-meter" aria-label="Weight proportions: 15, 45, 15, 25"><span></span><span></span><span></span><span></span></div>'+
      '<p class="muted micro">Fictional sample scores, not verified KPI reports.</p></section>'+
      '<section class="panel"><h2>KPI source</h2><div class="hr"></div>'+
      pill(e.kpiValidated?'Sample validation recorded':'Not verified')+
      '<p class="reader-source-value">'+safe(e.kpiSource||'No source reference provided in the sample dataset')+'</p>'+
      '<p class="muted micro">Official Google Sheets and Airtable integrations are not connected.</p></section></div>'+
      scoresPanel(e)+
      '<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Objectives and accomplishments</h2>'+
      '<p>Read-only sample placeholders, not imported official targets</p></div></div>'+
      '<div class="table-wrap"><table class="table"><thead><tr><th>Objective</th><th>Target</th><th>Actual</th><th>Verification</th></tr></thead><tbody>'+
      e.kpiItems.map(function(k){return '<tr><td>'+safe(k.title)+'</td><td>'+safe(k.target)+'</td><td>'+safe(k.actual)+'</td><td>'+
        pill(k.verified?'Sample verified':'Sample')+'</td></tr>';}).join('')+'</tbody></table></div>'+
      '<div class="reader-comments"><div><span class="field-label">Division Head notes</span><p>'+safe(e.comments.division||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">HR assessment notes</span><p>'+safe(e.comments.hr||'No sample notes')+'</p></div></div></section>';
  }

  function kpiView(){
    return header('PERFORMANCE','KPI scorecards','Compare weighted sample scores and open employee scorecard previews.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<p class="muted micro tracker-footnote">Weights: Division 15% · Individual 45% · Values 15% · Behavior 25%. Demo scores only.</p>'+trackerRoster('kpi');
  }
  function reviewStatus(e,k){return e.review[k]&&e.review[k].status||'Pending';}
  function reviewCanAct(e,k){if(k==='division')return roleCanHead(e);if(k==='corp')return canReview('corp')&&reviewStatus(e,'division')==='Endorsed';if(k==='cso')return canReview('cso')&&reviewStatus(e,'corp')==='Endorsed';if(k==='coo')return canReview('coo')&&reviewStatus(e,'cso')==='Endorsed';return false;}
  function compensation(e){const base=Number(e.currentBasic)||0,allow=Number(e.currentAllowances)||0,proposal=Number(e.proposedPct)||0,approved=Number(e.approvedPct)||0;return '<div class="money-grid"><div class="money-stat"><span>Current basic salary · demo</span><strong>'+money(base)+'</strong></div><div class="money-stat"><span>Current gross · demo</span><strong>'+money(base+allow)+'</strong></div><div class="money-stat"><span>Proposed increase</span><strong>'+money(base*proposal/100)+' ('+proposal+'%)</strong></div><div class="money-stat"><span>Proposed new gross</span><strong>'+money(base*(1+proposal/100)+allow)+'</strong></div><div class="money-stat"><span>Approved increase</span><strong>'+money(base*approved/100)+' ('+approved+'%)</strong></div><div class="money-stat"><span>Approved new basic</span><strong>'+money(base*(1+approved/100))+'</strong></div><div class="money-stat"><span>Approved new gross</span><strong>'+money(base*(1+approved/100)+allow)+'</strong></div><div class="money-stat"><span>Effectivity date</span><strong>'+dateLabel(e.effectiveDate)+'</strong></div></div>';}
  function reviewFlow(e){
    const steps=[['division','01','Division Head','KPI and initial review'],['corp','02','Corporate Operations','Organizational endorsement'],['cso','03','CSO','Strategic review'],['coo','04','COO','Final approval']];
    return '<div class="review-steps">'+steps.map(function(s){
      const key=s[0],status=reviewStatus(e,key);
      return '<div class="review-step '+(['Approved','Endorsed'].includes(status)?'complete':'')+'">'+
        '<div class="step-bubble">'+s[1]+'</div><div><h3>'+safe(s[2])+'</h3><p class="note">'+safe(s[3])+'</p>'+pill(status)+
        '<p class="muted micro">'+safe(e.review[key].comment||'No sample review note')+'</p>'+
        (e.review[key].at?'<p class="muted micro">Updated '+safe(dateLabel(e.review[key].at.slice(0,10)))+'</p>':'')+
        '</div></div>';
    }).join('')+'</div>';
  }

  function approvalsDetail(e){
    return '<section class="panel reader-review-panel"><div class="panel-head"><div><h2>Review and approval snapshot</h2>'+
      '<p>Sample review history · No approval actions are available here</p></div>'+pill(reviewStatus(e,'coo'))+'</div>'+
      '<p class="muted micro">The original source is responsible for review decisions. The amounts below are fictional.</p>'+
      compensation(e)+'</section>'+
      '<section class="panel"><div class="panel-head"><div><h2>Review timeline</h2><p>Division Head → Corporate Operations → CSO → COO</p></div></div>'+
      reviewFlow(e)+'<div class="reader-comments"><div><span class="field-label">Corporate Operations notes</span><p>'+safe(e.comments.corp||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">CSO notes</span><p>'+safe(e.comments.cso||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">COO remarks</span><p>'+safe(e.comments.coo||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">Division Head recommendation</span><p>'+safe(e.comments.division||'No sample notes')+'</p></div></div></section>';
  }

  function approvalsTable(){return '<section class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Company-wide review queue</h2><p>Employees in '+safe(scopeLabel())+' and current approval milestones</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Division</th><th>Division Head</th><th>Corporate Ops</th><th>CSO</th><th>COO</th><th></th></tr></thead><tbody>'+scopedEmployees().map(function(e){return '<tr><td>'+linkedEmployee(e)+'</td><td>'+safe(div(e.division).short)+'</td><td>'+pill(reviewStatus(e,'division'))+'</td><td>'+pill(reviewStatus(e,'corp'))+'</td><td>'+pill(reviewStatus(e,'cso'))+'</td><td>'+pill(reviewStatus(e,'coo'))+'</td><td>'+button('Review','open','data-id="'+e.id+'" data-detail="approvals"','small')+'</td></tr>';}).join('')+'</tbody></table></div></section>';}
  function approvalsView(){
    return header('PERFORMANCE','Reviews','Monitor endorsement stages by division. Open an employee for the detailed evaluation and approval history.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<p class="muted micro tracker-footnote">Division Head → Corporate Operations → CSO → COO. Executive observer previews cannot approve records.</p>'+trackerRoster('approvals')+
      '<details class="panel compact-details"><summary>See complete review queue</summary>'+approvalsTable()+'</details>';
  }
  function sourcesView(){
    const sources=[
      {name:'Airtable',purpose:'Employee roster, assignment and structured tracker records',data:'People and operations'},
      {name:'Google Sheets',purpose:'KPI workbooks, calculated targets and division reporting',data:'KPI and evaluation'},
      {name:'Google Drive',purpose:'Document files, supporting evidence and shared folders',data:'Documents and attachments'},
      {name:'Google Docs',purpose:'Evaluation forms, onboarding documents and written reviews',data:'Documents and forms'},
      {name:'Email',purpose:'Approval correspondence, notifications and follow-ups',data:'Communication'}
    ];
    return header('INTEGRATION READINESS','Data sources','A transparent view of where official data will come from. No live connections are configured in this browser.')+
      '<div class="source-banner"><span class="source-banner-icon">i</span><div><strong>Preview mode — no external synchronization</strong>'+
      '<p>The 51 employee records and all dashboard metrics are fictional. GitHub Pages cannot use Claude account connectors directly as a browser API.</p></div></div>'+
      '<section class="source-grid">'+sources.map(function(s){
        return '<article class="panel source-card"><div class="source-card-top"><h2>'+safe(s.name)+'</h2><span class="source-unlinked">Not connected</span></div>'+
          '<p>'+safe(s.purpose)+'</p><div class="source-card-bottom"><span>'+safe(s.data)+'</span><span>No last sync</span></div></article>';
      }).join('')+'</section>'+
      '<section class="panel source-policy"><h2>How this dashboard should use connected records</h2>'+
      '<p>Official records remain in Airtable and Google Workspace. A secure integration can supply validated, permission-filtered summaries to this interface. Until that exists, exports and in-browser edits are only prototype examples.</p>'+
      '<div class="source-policy-steps"><span>1. Read authorized sources</span><span>2. Match employee IDs</span><span>3. Validate records</span><span>4. Show source and sync time</span></div>'+
      '<p class="muted micro">Do not put passwords, API tokens or confidential HR records in this public repository or GitHub Pages.</p></section>';
  }
  function activity(){const logs=[];scopedEmployees().forEach(function(e){(e.audit||[]).forEach(function(a){logs.push({date:a.date,employee:e.name,actor:a.actor,action:a.action});});});logs.sort(function(a,b){return b.date.localeCompare(a.date);});return header('WORKSPACE SETTINGS','Activity & data','Review local changes and manage your demonstration dataset.',button('Download JSON backup','export','','primary'))+'<div class="grid dashboard-grid"><section class="panel"><h2>Data controls</h2><p class="muted micro" style="margin:8px 0 17px">Edits are saved to this browser only. They do not automatically sync across devices or evaluators.</p><div class="actions">'+button('Export all data (JSON)','export','','small')+button('Import backup','import','','small')+button('Download employee CSV','export-csv','','small')+button('Reset 51 sample employees','reset','','small danger')+'</div><input type="file" id="import-file" accept=".json,application/json" hidden><div class="hr"></div><div class="callout orange"><strong>Privacy & security:</strong> This is a public-repository prototype with simulated role permissions. It is not suitable for live employee, confidential compensation, or authentication data. Use a secure backend and verified access controls before any production rollout.</div></section><section class="panel"><h2>Assigned evaluators</h2><p class="muted micro" style="margin:7px 0 16px">Current roster per project instruction</p>'+data.divisions.map(function(d){return '<div class="quick-item"><div class="grow"><b>'+safe(d.name)+'</b><p>'+safe(d.evaluators.map(function(id){const v=data.viewers.find(function(p){return p.id===id;});return v?v.name:id;}).join(' / '))+'</p></div></div>';}).join('')+'<div class="hr"></div><p class="muted micro">HR: GIEZELLE · KURT</p></section></div><section class="panel"><div class="panel-head"><div><h2>Local activity log</h2><p>Actions recorded in this browser by the selected demo viewer</p></div><span class="tag info">'+logs.length+' events</span></div><div class="audit-list">'+(logs.length?logs.slice(0,60).map(function(a){return '<div class="audit-row"><span class="avatar">↗</span><div><p><strong>'+safe(a.actor)+'</strong> · '+safe(a.action)+'</p><small>'+safe(a.employee)+' · '+safe(new Date(a.date).toLocaleString('en-PH'))+'</small></div></div>';}).join(''):'<div class="empty">No edits recorded yet. Edit any sample entry to see its audit trail.</div>')+'</div></section>';}
  function detailContent(e,t){if(t==='journey')return '<div class="panel"><div class="panel-head"><h2>Seven-stage checklist</h2><span class="tag info">'+journeyPct(e)+'% done</span></div>'+stageCards(e)+'</div>';if(t==='kit')return '<div class="panel"><div class="panel-head"><h2>Welcome Maddie Kit</h2><span class="tag info">'+kitPct(e)+'% ready</span></div>'+kitSection(e)+'</div>';if(t==='attendance')return '<section class="panel"><div class="heading-line"><h2>Attendance records</h2></div>'+attendanceSummary(e)+'<div class="hr"></div>'+attendanceRows(e)+'</section>';if(t==='kpi')return kpiDetail(e);if(t==='approvals')return approvalsDetail(e);if(t==='milestones')return milestoneDetail(e);if(t==='preview')return previewCharts(e);if(t==='info')return '<section class="panel"><h2>Employee information</h2><p class="muted micro" style="margin:6px 0 15px">Profile details and department assignment</p>'+profileForm(e)+'</section>';return '';}
  function profileForm(e){
    const fields=[['Full name',e.name],['Job title',e.jobTitle],['Sample email',e.email],['Hiring date',dateLabel(e.startDate)],
      ['Birthday',dateLabel(e.birthday)],['Division',div(e.division).name]];
    return '<dl class="reader-profile-grid">'+fields.map(function(field){
      return '<div><dt>'+field[0]+'</dt><dd>'+safe(field[1]||'—')+'</dd></div>';
    }).join('')+'</dl>';
  }

  function todayStamp(){const d=new Date();return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());}
  function daysToBirthday(ymd){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ymd||''))return 9999;
    const parts=ymd.split('-').map(Number),today=new Date(todayStamp()),year=today.getUTCFullYear();
    let next=Date.UTC(year,parts[1]-1,parts[2]);if(next<todayStamp())next=Date.UTC(year+1,parts[1]-1,parts[2]);
    return Math.round((next-todayStamp())/86400000);
  }
  function anniversaryInfo(e){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(e.startDate||''))return {years:0,days:9999,next:''};
    const d=new Date(e.startDate+'T00:00:00Z'),today=new Date(todayStamp());
    let completed=today.getUTCFullYear()-d.getUTCFullYear();
    const thisYear=Date.UTC(today.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
    if(todayStamp()<thisYear)completed--;
    completed=Math.max(0,completed);
    let next=Date.UTC(today.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
    if(next<todayStamp())next=Date.UTC(today.getUTCFullYear()+1,d.getUTCMonth(),d.getUTCDate());
    return {years:completed,days:Math.round((next-todayStamp())/86400000),next:new Date(next).toISOString().slice(0,10)};
  }
  const milestoneKinds=[
    {id:'birthday',name:'Birthdays',description:'Upcoming celebrations'},
    {id:'tenure',name:'Tenure',description:'Service anniversaries'},
    {id:'hiring',name:'Hiring',description:'Start dates and new joiners'},
    {id:'promotion',name:'Promotions',description:'Career movement'},
    {id:'perfect',name:'Perfect attendance',description:'HR-confirmed recognition only'},
    {id:'discipline',name:'Disciplinary actions',description:'Confidential HR case log'}
  ];
  function milestoneEvents(kind,team){
    const rows=[];
    team.forEach(function(e){
      if(kind==='birthday'&&e.birthday)rows.push({e: e,when:e.birthday,sort:daysToBirthday(e.birthday),status:daysToBirthday(e.birthday)===0?'Today':daysToBirthday(e.birthday)+' days away',detail:'Birthday · '+safe(dateLabel(e.birthday))});
      if(kind==='tenure'&&e.startDate){const a=anniversaryInfo(e);rows.push({e:e,when:a.next,sort:a.days,status:a.years+' years of service',detail:'Next anniversary · '+dateLabel(a.next)});}
      if(kind==='hiring'&&e.startDate){const gap=Math.floor((todayStamp()-Date.parse(e.startDate+'T00:00:00Z'))/86400000);rows.push({e:e,when:e.startDate,sort:-Date.parse(e.startDate),status:gap<0?'Upcoming hire':gap<=90?'Recent hire':'Onboarded',detail:'Hired · '+dateLabel(e.startDate)});}
      if(kind==='promotion')(e.promotions||[]).forEach(function(p){rows.push({e:e,record:p,when:p.date,sort:-Date.parse(p.date||'1970-01-01'),status:p.status,detail:(p.from||'Previous role')+' → '+(p.to||'New role')});});
      if(kind==='perfect')(e.attendanceAwards||[]).forEach(function(p){rows.push({e:e,record:p,when:p.period||'',sort:-(Number((p.period||'1970-01').replace('-',''))||0),status:p.status,detail:'Recognized attendance · '+(p.period||'Period pending')});});
      if(kind==='discipline'&&isHR())(e.disciplinaryActions||[]).forEach(function(p){rows.push({e:e,record:p,when:p.date,sort:-Date.parse(p.date||'1970-01-01'),status:p.status,detail:p.category+' · '+p.severity});});
    });
    return rows.sort(function(a,b){return a.sort-b.sort;});
  }
  function filteredMilestoneTeam(){return ui.milestoneDivision==='all'?data.employees:data.employees.filter(function(e){return e.division===ui.milestoneDivision;});}
  function milestonesView(){
    const kind=milestoneKinds.find(function(k){return k.id===ui.milestoneCategory;})||milestoneKinds[0];
    const staff=filteredMilestoneTeam(),rows=milestoneEvents(kind.id,staff),restricted=kind.id==='discipline'&&!isHR();
    const visible=ui.milestoneShowAll?rows:rows.slice(0,12);
    const roster=restricted?'<div class="milestone-private"><b>HR-managed information</b><p>Disciplinary case details are shown only in the HR demo workspace. All divisions and other milestones remain available.</p></div>':
      (visible.length?visible.map(function(row){
        return '<div class="milestone-person">'+avatar(row.e.name)+'<div class="milestone-person-name"><b>'+safe(row.e.name)+'</b><small>'+safe(div(row.e.division).short)+' · '+safe(row.detail)+'</small></div>'+
        '<span class="milestone-status">'+safe(row.status||'Recorded')+'</span>'+
        button('View','open','data-id="'+safe(row.e.id)+'" data-detail="milestones"','small')+'</div>';
      }).join(''):'<div class="empty">No sample records in this category for the selected department.</div>');
    return header('PEOPLE MOMENTS','Employee milestones','One category at a time. Browse birthdays, service history, recognitions and HR records.',button('Employee directory','nav','data-tab="employees"','small'))+
      '<div class="milestone-toolbar"><div><h2>Choose a category</h2><p class="muted micro">Select what you need to review today.</p></div><button class="button" type="button" data-action="milestone-division">'+safe(ui.milestoneDivision==='all'?'All 8 divisions':div(ui.milestoneDivision).short)+' <span aria-hidden="true">⌄</span></button></div>'+
      '<div class="milestone-tabs" role="group" aria-label="Milestone categories">'+milestoneKinds.map(function(k){
        return '<button type="button" class="milestone-tab '+(k.id===kind.id?'active':'')+'" data-action="milestone-category" data-kind="'+k.id+'" aria-pressed="'+(k.id===kind.id)+'">'+safe(k.name)+'</button>';
      }).join('')+'</div>'+
      '<section class="panel milestone-results"><div class="panel-head"><div><h2>'+safe(kind.name)+'</h2><p>'+safe(kind.description)+' · '+(restricted?'HR-only details':rows.length+' records')+'</p></div>'+
      ''+'</div>'+
      '<div class="milestone-people">'+roster+'</div>'+
      (!restricted&&rows.length>12?'<div class="milestone-list-footer">'+button(ui.milestoneShowAll?'Show fewer':'Show all '+rows.length,'milestone-more','','small')+'</div>':'')+
      '<div class="milestone-help">'+(kind.id==='perfect'?'Perfect attendance is recorded only when HR explicitly confirms the award; it is not inferred from incomplete time entries.':kind.id==='discipline'?'All cases are fictional. Real disciplinary records require secure, audited access.':'All names, dates and milestones are sample data, not real employee records.')+'</div></section>';
  }
  function recordListHTML(e,kind){
    const collection=kind==='promotion'?e.promotions:kind==='perfect'?e.attendanceAwards:e.disciplinaryActions;
    if(kind==='discipline'&&!isHR())return '<p class="muted micro">Confidential HR records are not available in this preview.</p>';
    return collection.length?collection.map(function(r){
      const name=kind==='promotion'?(r.from+' → '+r.to):kind==='perfect'?('Attendance · '+r.period):(r.category+' · '+r.severity);
      const date=kind==='perfect'?(r.period||'—'):dateLabel(r.date);
      const canEdit=false;
      return '<div class="milestone-mini-row"><div><b>'+safe(name)+'</b><small>'+safe(date)+' · '+safe(r.status)+'</small></div>'+
        (canEdit?button('Edit','milestone-edit','data-kind="'+kind+'" data-employee="'+safe(e.id)+'" data-id="'+safe(r.id)+'"','small'):'')+'</div>';
    }).join(''):'<p class="muted micro">No recorded examples yet.</p>';
  }
  function milestoneDetail(e){
    const ten=anniversaryInfo(e);
    return '<div class="milestone-profile"><div class="milestone-profile-highlights">'+
      '<div><span class="muted micro">Birthday</span><strong>'+dateLabel(e.birthday)+'</strong><small>Next in '+daysToBirthday(e.birthday)+' days</small></div>'+
      '<div><span class="muted micro">Hiring date</span><strong>'+dateLabel(e.startDate)+'</strong><small>'+ten.years+' service years completed</small></div>'+
      '<div><span class="muted micro">Next anniversary</span><strong>'+dateLabel(ten.next)+'</strong><small>In '+ten.days+' days</small></div></div>'+
      '<section class="panel"><h3>Promotions & career growth</h3>'+recordListHTML(e,'promotion')+'</section>'+
      '<section class="panel"><h3>Perfect attendance recognition</h3>'+
      '<p class="muted micro">Only explicitly confirmed sample awards are shown.</p>'+recordListHTML(e,'perfect')+'</section>'+
      '<section class="panel"><h3>Disciplinary actions</h3>'+recordListHTML(e,'discipline')+'</section></div>';
  }

  function roleChoiceGroup(title,description,roles){
    return '<section class="role-choice-section"><div class="role-choice-heading"><h3>'+safe(title)+'</h3><p>'+safe(description)+'</p></div><div class="role-choice-grid">'+roles.map(function(v){
      const departments=(v.divisions||[]).map(function(id){return div(id).short;}).join(' + ');
      const sub=departments?departments+' · '+v.title.split(' · ')[0]:v.title;
      const active=v.id===ui.viewer;
      return '<button type="button" class="role-choice '+(active?'selected':'')+'" data-action="select-viewer" data-id="'+safe(v.id)+'" aria-pressed="'+active+'">'+avatar(v.name)+'<span class="role-choice-text"><b>'+safe(v.name)+'</b><small>'+safe(sub)+'</small></span><span class="choice-indicator">'+(active?'✓':'→')+'</span></button>';
    }).join('')+'</div></section>';
  }
  function workspaceModal(){
    const choices=[
      {id:'hr',label:'HR',sub:'People and Culture · Organization-wide monitoring',icon:'people',color:'pink'},
      {id:'head',label:'Division Heads',sub:'Assigned-team insights and journey overview',icon:'hierarchy',color:'yellow'},
      {id:'executive',label:'Executive',sub:'CEO / COO / CSO · Company-wide summaries',icon:'crown',color:'blue'}
    ];
    const selected=choices.find(function(c){return c.id===ui.chooserCategory;});
    const hr=data.viewers.filter(function(v){return v.role==='hr';});
    const heads=data.viewers.filter(function(v){return v.role==='head'||v.role==='corp';});
    const exec=data.viewers.filter(function(v){return ['ceo','cso','coo'].includes(v.role);});
    const assigned=selected?(selected.id==='hr'?hr:selected.id==='head'?heads:exec):[];
    return '<div class="overlay center-overlay workspace-choice-overlay" data-overlay="role"><section class="workspace-modal workspace-reader-chooser" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title" tabindex="-1">'+
      '<div class="modal-fixed-head workspace-choice-heading"><div><span class="eyebrow">MADHOUSE · DEMONSTRATION</span><h2 id="workspace-modal-title">'+(selected?'Choose your preview identity':'Who is using the dashboard?')+'</h2>'+
      '<p>'+(selected?'Select your sample viewer to open the matching monitoring overview.':'Select a workspace to personalize the dashboard from the beginning.')+'</p></div>'+
      (ui.workspaceChosen?'<button class="modal-close" type="button" data-action="close" aria-label="Close workspace selector">×</button>':'')+'</div>'+
      '<div class="workspace-modal-scroll"><div class="workspace-readonly-note"><span aria-hidden="true">●</span> Read-only prototype · No employee edits, approvals or source submissions</div>'+
      (!selected?'<div class="workspace-category-grid">'+choices.map(function(c){return '<button type="button" class="workspace-category" data-action="workspace-category" data-category="'+c.id+'"><span class="landing-audience-icon tone-'+c.color+'">'+landingIcon(c.icon)+'</span>'+
      '<strong>'+safe(c.label)+'</strong><small>'+safe(c.sub)+'</small><span class="workspace-choice-arrow">Continue →</span></button>';}).join('')+'</div>':
      '<div class="workspace-selected-category">'+button('← Change workspace type','workspace-category','data-category="all"','small')+'<strong>'+safe(selected.label)+'</strong></div>'+
      roleChoiceGroup('Select a person','Only the dashboard perspective changes. All data remains fictional and read-only.',assigned))+
      '<p class="modal-footnote">This selection is stored on your device for convenience. It is not authentication or permission enforcement.</p></div></section></div>';
  }
  function divisionPickerModal(){
    const scoped=ui.divisionPickerMode==='scope',milestone=ui.divisionPickerMode==='milestone';
    const local=scoped||milestone,selected=milestone?ui.milestoneDivision:ui.scope;
    const title=milestone?'Milestone department':scoped?'Filter this tracker':'Choose a division';
    const desc=milestone?'See all eight divisions, or narrow down this milestones list.':scoped?'Choose a department to review its team.':'Open a department workspace and its employee summaries.';
    return '<div class="overlay center-overlay" data-overlay="division"><section class="workspace-modal compact-modal" role="dialog" aria-modal="true" aria-labelledby="division-modal-title" tabindex="-1">'+
      '<div class="modal-fixed-head"><div><span class="eyebrow">8 DEPARTMENTS</span><h2 id="division-modal-title">'+title+'</h2><p>'+desc+'</p></div><button class="modal-close" type="button" data-action="close" aria-label="Close department chooser">×</button></div>'+
      '<div class="workspace-modal-scroll"><div class="division-picker-grid">'+
      (local?'<button type="button" class="division-picker-item '+(selected==='all'?'selected':'')+'" data-action="'+(milestone?'set-milestone-division':'set-scope')+'" data-division="all"><span><b>All eight divisions</b><small>Company-wide view · 51 sample employees</small></span><span class="tag info">51</span></button>':'')+
      data.divisions.map(function(d){const team=data.employees.filter(function(e){return e.division===d.id;});const active=local?selected===d.id:ui.activeDivision===d.id;
        return '<button type="button" class="division-picker-item '+(active?'selected':'')+'" data-action="'+(milestone?'set-milestone-division':scoped?'set-scope':'goto-division')+'" data-division="'+safe(d.id)+'"><span><b>'+safe(d.name)+'</b><small>'+safe(divisionEvaluatorNames(d))+'</small></span><span class="tag info">'+team.length+' people</span></button>';
      }).join('')+'</div></div></section></div>';
  }
  function attendanceMicrochart(e){
    const d=new Date(),months=[];
    for(let i=5;i>=0;i--){
      const first=new Date(d.getFullYear(),d.getMonth()-i,1),period=first.getFullYear()+'-'+String(first.getMonth()+1).padStart(2,'0');
      const r=e.attendance.filter(function(v){return v.verified&&v.date.slice(0,7)===period;});
      months.push({name:first.toLocaleString('en-PH',{month:'short'}),late:r.filter(function(v){return v.type==='Late';}).length,absence:r.filter(function(v){return v.type==='Absent';}).length});
    }
    const max=Math.max(1,...months.map(function(m){return m.late+m.absence;}));
    return '<div class="attendance-chart" role="img" aria-label="Last six months of verified lateness and absence data">'+months.map(function(m){
      const count=m.late+m.absence,h=count?Math.max(3,Math.round(count*100/max)):0;
      return '<div class="attendance-chart-month" title="'+safe(m.name)+': '+m.late+' late, '+m.absence+' absences"><span class="attendance-chart-track">'+(count?'<span class="attendance-chart-fill" style="height:'+h+'%;"></span>':'')+'</span><small>'+safe(m.name)+'</small></div>';
    }).join('')+'</div>';
  }
  function previewCharts(e){
    const v=score(e),overall=Number(v.toFixed(1)),a=attend(e);
    const dimensions=[['Division objectives',e.scores.division,15,'coral'],['Individual objectives',e.scores.individual,45,'lilac'],['Values alignment',e.scores.values,15,'mint'],['Job behavior',e.scores.behavior,25,'gold']];
    const stageSummary=data.stages.map(function(stage,i){return {label:'Stage '+(i+1),percent:Math.round(e.journey[i].filter(Boolean).length/e.journey[i].length*100),title:stage.name};});
    const editable=roleCanHead(e),hr=isHR();
    return '<div class="profile-intro"><p>Performance, onboarding and attendance at a glance. Figures are fictional and not synced to external sources.</p></div>'+
    '<div class="employee-charts-grid">'+
      '<section class="chart-card performance-chart"><div class="chart-card-heading"><h3>2026 KPI performance</h3><span class="tag warn">Demo scores</span></div><div class="performance-chart-inner"><div class="score-donut" style="--score:'+overall+'%" role="img" aria-label="Overall KPI score '+overall+' percent"><div><strong>'+overall+'%</strong><small>'+safe(rating(v))+'</small></div></div><div class="score-breakdown">'+dimensions.map(function(x){return '<div class="score-breakdown-row"><div class="score-label"><span>'+safe(x[0])+' <small>· '+x[2]+'%</small></span><b>'+Number(x[1]).toFixed(1)+'%</b></div><div class="chart-track"><span class="'+x[3]+'" style="width:'+Math.min(100,Math.max(0,x[1]))+'%"></span></div></div>';}).join('')+'</div></div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>7-stage journey</h3><strong>'+journeyPct(e)+'%</strong></div><div class="stage-preview-bars">'+stageSummary.map(function(x){return '<div class="stage-preview-row" title="'+safe(x.title)+'"><span>'+x.label+'</span><div class="chart-track"><span style="width:'+x.percent+'%"></span></div><b>'+x.percent+'%</b></div>';}).join('')+'</div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>Attendance · recent months</h3><span class="tag info">Verified only</span></div>'+attendanceMicrochart(e)+'<p class="chart-note">'+a.lates+' late arrivals · '+a.absences+' absences · '+a.concerns+' unexcused concerns</p></section>'+
      '<section class="chart-card preview-status"><div class="chart-card-heading"><h3>Onboarding & review</h3></div><div class="preview-check"><span>Welcome Maddie Kit</span><strong>'+kitPct(e)+'% complete</strong></div>'+progress(kitPct(e))+'<div class="preview-check"><span>Division evaluation</span>'+pill(reviewStatus(e,'division'))+'</div><div class="preview-check"><span>Executive review</span>'+pill(reviewStatus(e,'coo'))+'</div></section>'+
    '</div><div class="profile-actions"><span class="eyebrow">OPEN EMPLOYEE SCREEN</span><div class="profile-action-buttons">'+
    button('View KPI','detail','data-tab="kpi"','primary')+
    button('Journey checklist','detail','data-tab="journey"','')+
    button('Welcome Kit','detail','data-tab="kit"','')+
    button('Attendance','detail','data-tab="attendance"','')+
    button('Review status','detail','data-tab="approvals"','')+
    button('Profile details','detail','data-tab="info"','')+
    '</div></div>';
  }
  function employeeMini(e){const a=attend(e);return '<div class="employee-mini-summary" aria-label="Employee summary"><span><small>Journey</small><strong>'+journeyPct(e)+'%</strong></span><span><small>Welcome kit</small><strong>'+kitPct(e)+'%</strong></span><span><small>Weighted KPI</small><strong>'+score(e).toFixed(1)+'%</strong></span><span><small>Verified lates / absences</small><strong>'+a.lates+' / '+a.absences+'</strong></span></div>';}
  function approvalPolicy(){const v=viewer();const exec=['ceo','cso','coo'].includes(v.role);return '<div class="callout '+(exec?'':'orange')+'" style="margin-bottom:16px"><strong>'+(exec?'Executive observer mode.':'Workflow demonstration.')+'</strong> Division Heads can submit evaluations for their departments; Corporate Operations can enter review endorsements. CEO, CSO and COO views are read-only in this update. Executive final approvals shown here are fictional sample records, not editable decisions.</div>';}
  function employeeModal(){
    const e=emp(),t=ui.detail;
    const tabs=[['preview','Overview'],['milestones','Milestones'],['kpi','KPI'],['journey','Journey'],['kit','Welcome Kit'],['attendance','Attendance'],['approvals','Review'],['info','Profile']];
    return '<div class="overlay center-overlay employee-overlay" data-overlay="employee">'+
    '<section class="employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title" tabindex="-1">'+
    '<div class="employee-modal-top"><div class="profile">'+avatar(e.name)+'<div><span class="eyebrow">EMPLOYEE · '+safe(e.id)+'</span><h2 id="employee-modal-title">'+safe(e.name)+'</h2><p class="muted micro">'+safe(e.jobTitle)+' · '+safe(div(e.division).name)+'</p></div></div>'+
    '<button class="modal-close" data-action="close" aria-label="Close employee preview" type="button">×</button></div>'+
    '<nav class="employee-modal-tabs" aria-label="Employee sections">'+tabs.map(function(a){return '<button type="button" class="employee-tab '+(t===a[0]?'active':'')+'" data-action="detail" data-tab="'+a[0]+'" aria-current="'+(t===a[0]?'page':'false')+'">'+a[1]+'</button>';}).join('')+'</nav>'+
    '<div class="employee-modal-body">'+(t==='preview'?'':employeeMini(e))+
    (t==='info'?'<div class="panel" style="margin-bottom:15px"><div class="form-grid"><div><span class="field-label">Start date</span><strong>'+dateLabel(e.startDate)+'</strong></div><div><span class="field-label">Employee ID</span><strong>'+safe(e.id)+'</strong></div><div><span class="field-label">Org level (sample)</span><strong>Level '+safe(e.orgLevel||'—')+'</strong></div><div><span class="field-label">Reports to (sample)</span><strong>'+safe((data.employees.find(function(p){return p.id===e.reportsTo;})||{}).name||'Department lead')+'</strong></div></div></div>':'')+
    detailContent(e,t)+'</div></section></div>';
  }
  function landingIcon(name){
    const drawings={
      people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      hierarchy:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
      crown:'<path d="M2 8 7 12 12 3 17 12 22 8 20 20H4L2 8Z"/><path d="M4 16h16"/>',
      chart:'<path d="M4 20v-6M10 20V9M16 20V4M22 20v-10"/>',
      users:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 6a3 3 0 1 1 0 6M22 20v-2a6 6 0 0 0-4-5.66"/>',
      database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
      home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      grid:'<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
      search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
      list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="3"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(drawings[name]||drawings.chart)+'</svg>';
  }
  function landingView(){
    const audience=[
      {label:'HR',detail:'People, records and workforce tracking',role:'hr',theme:'pink',icon:'people'},
      {label:'Division Heads',detail:'Department performance and team overview',role:'head',theme:'yellow',icon:'hierarchy'},
      {label:'Executive overview',detail:'CEO, COO and CSO · organizational insights',role:'executive',theme:'blue',icon:'crown'}
    ];
    const feature=[
      {name:'Summaries',detail:'Key insights at a glance',target:'overview',theme:'pink',icon:'chart'},
      {name:'Org charts',detail:'Explore all eight divisions',target:'divisions',theme:'yellow',icon:'hierarchy'},
      {name:'Employees',detail:'Profiles and milestones',target:'employees',theme:'blue',icon:'users'},
      {name:'Data sources',detail:'Connection status and provenance',target:'sources',theme:'violet',icon:'database'}
    ];
    return '<div class="landing-shell" id="main-content" tabindex="-1">'+
      '<main class="landing-main">'+
      '<header class="landing-header"><a class="landing-brand" href="#welcome" data-nav="welcome" aria-label="Maddie Journey home">'+
      '<img src="./assets/madhouse-logo.png" alt="Madhouse Design Studio" class="landing-official-logo" width="720" height="117">'+
      '<span class="landing-brand-separator" aria-hidden="true"></span><strong class="landing-brand-title">Maddie Journey</strong></a>'+
      '<div class="landing-header-actions">'+themeControl()+'<span class="landing-demo-label">Sample data</span>'+
      '<a class="landing-header-cta" href="#overview" data-nav="overview">Enter dashboard <span aria-hidden="true">↗</span></a></div></header>'+
      '<section class="landing-hero" aria-labelledby="landing-title"><div class="landing-hero-inner">'+
      '<span class="landing-kicker"><span class="landing-kicker-line"></span>People & Culture · Madhouse Design Studio</span>'+
      '<h1 id="landing-title">Maddie Journey</h1>'+
      '<p class="landing-hero-lead">People, division and executive tracking in one clear workspace.</p>'+
      '<p class="landing-hero-copy">See what matters, explore your teams, and preview the information behind every summary.</p>'+
      '<div class="landing-hero-actions"><a href="#overview" data-nav="overview" class="landing-primary-cta">Open dashboard <span aria-hidden="true">↗</span></a>'+
      '<a href="#divisions" data-nav="divisions" class="landing-secondary-cta">View divisions <span aria-hidden="true">→</span></a></div></div></section>'+
      '<section class="landing-audiences" aria-labelledby="landing-audiences-title"><div class="landing-section-heading"><h2 id="landing-audiences-title">Choose your workspace preview</h2>'+
      '<p>Three ways to explore the same organized sample information.</p></div>'+
      '<div class="landing-audience-grid">'+audience.map(function(a){
        return '<button type="button" class="landing-audience-card" data-action="landing-role" data-role="'+a.role+'">'+
        '<span class="landing-audience-icon tone-'+a.theme+'" aria-hidden="true">'+landingIcon(a.icon)+'</span>'+
        '<span class="landing-audience-copy"><strong>'+safe(a.label)+'</strong><small>'+safe(a.detail)+'</small></span>'+
        '<span class="landing-card-chevron" aria-hidden="true">›</span></button>';
      }).join('')+'</div></section>'+
      '<section class="landing-shortcuts" aria-label="Explore features">'+feature.map(function(f){
        return '<a href="#'+f.target+'" data-nav="'+f.target+'" class="landing-shortcut">'+
          '<span class="landing-shortcut-icon tone-'+f.theme+'" aria-hidden="true">'+landingIcon(f.icon)+'</span>'+
          '<span><strong>'+safe(f.name)+'</strong><small>'+safe(f.detail)+'</small></span></a>';
      }).join('')+'</section>'+
      '<footer class="landing-footer"><span>Madhouse Design Studio · Maddie Journey</span><span>Prototype · 51 fictional employees · 8 divisions · Not live-connected</span></footer>'+
      '</main></div>';
  }
  function render(){if(ui.tab==='welcome'){$('app').innerHTML=landingView();document.title='Maddie Journey · Madhouse Design Studio';return;}if(!ui.workspaceChosen){$('app').innerHTML='<div class="workspace-gate"><img src="./assets/madhouse-logo.png" alt="Madhouse Design Studio" class="workspace-gate-logo"><h1>Maddie Journey</h1><p>A simple place to monitor people, journeys and division progress.</p></div>'+workspaceModal();document.title='Choose your workspace · Maddie Journey';return;}const views={overview:overview,divisions:divisionsView,division:divisionView,employees:employees,milestones:milestonesView,journey:journey,kit:kitView,attendance:attendanceView,kpi:kpiView,approvals:approvalsView,sources:sourcesView,audit:activity};$('app').innerHTML='<div class="layout '+(ui.mobile?'menu-open':'')+'">'+sidebar()+'<button type="button" class="workspace-scrim" aria-label="Close navigation" data-action="mobile"></button><main id="main-content" class="main" tabindex="-1">'+topnav()+(views[ui.tab]||overview)()+'<footer class="footer"><span>Maddie Journey · Prototype v1.9</span><span>51 fictional employees · Local browser storage · No live integrations</span></footer></main></div>'+(ui.roleModal?workspaceModal():ui.divisionModal?divisionPickerModal():ui.employeePicker?memberPickerModal():ui.employeeModalOpen?employeeModal():'');document.title=title(ui.tab)+' · Maddie Journey';if(ui.employeeModalOpen||ui.roleModal||ui.divisionModal||ui.employeePicker){const modal=$('app').querySelector('[role="dialog"]');if(modal&&typeof modal.focus==='function')modal.focus({preventScroll:true});}}
  function openDivision(id){if(!data.divisions.some(function(d){return d.id===id;}))return;ui.scope=id;ui.activeDivision=id;ui.divisionTab='summary';ensureEmployeeScope();persist();ui.tab='division';ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.mobile=false;ui.query='';ui.division='all';if(location.hash!=='#division/'+id)location.hash='#division/'+id;window.scrollTo({top:0,behavior:'instant'});render();}
  function navigate(tab){if(tab==='division'){openDivision(ui.activeDivision);return;}ui.scope='all';ensureEmployeeScope();ui.tab=tab;ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.mobile=false;ui.query='';ui.division='all';if(location.hash!=='#'+tab)location.hash='#'+tab;window.scrollTo({top:0,behavior:'instant'});render();}
  function invalidateEvaluation(e){
    const changed=['division','corp','cso','coo'].some(function(k){return e.review[k].status!=='Pending';})||e.approvedPct>0||!!e.effectiveDate;
    if(!changed)return;
    ['division','corp','cso','coo'].forEach(function(k){e.review[k]={status:'Pending',comment:'',at:''};});
    e.approvedPct=0;e.effectiveDate='';
    toast('Evaluation changed: previous review endorsements were reset.');
  }
  function changeField(el){const e=emp(),field=el.dataset.field;if(!e||!field)return;const val=el.value;
    if(field.indexOf('profile.')===0){if(!isHR())return;const k=field.slice(8);if(!['name','jobTitle','email','startDate','birthday','division'].includes(k))return;if((k==='name'||k==='jobTitle')&&!val.trim()){toast('This field cannot be empty.');render();return;}if(k==='division'&&!data.divisions.some(function(d){return d.id===val;}))return;e[k]=val.slice(0,150);
      if(k==='division'){
        // A transferred demo employee must not retain a reporting line to another department.
        e.orgLevel=3;
        const localLead=data.employees.find(function(p){return p.id!==e.id&&p.division===val&&p.orgLevel>3;});
        e.reportsTo=localLead?localLead.id:null;
        invalidateEvaluation(e);
      }
      audit(e,'Updated employee '+k);}
    else if(field.indexOf('kpi.')===0){if(!roleCanHead(e))return;const parts=field.split('.'),i=Number(parts[1]),k=parts[2];if(!e.kpiItems[i]||!['target','actual'].includes(k))return;e.kpiItems[i][k]=val.slice(0,200);e.kpiItems[i].verified=false;e.kpiValidated=false;invalidateEvaluation(e);audit(e,'Updated demonstration KPI '+(i+1)+' '+k);}
    else if(field==='kpiSource'){if(!isHR())return;e.kpiSource=val.slice(0,400);e.kpiValidated=false;invalidateEvaluation(e);audit(e,'Updated KPI source note');}
    else if(field.indexOf('score.')===0){const k=field.split('.')[1];if(!canScore(e,k))return;const n=Number(val);if(val===''||!Number.isFinite(n)||n<0||n>100){toast('Scores must be between 0 and 100.');render();return;}e.scores[k]=Math.round(n*100)/100;invalidateEvaluation(e);audit(e,'Updated '+k+' evaluation score');}
    else if(field.indexOf('kitnote.')===0){if(!canTrack(e))return;e.kitNotes[field.slice(8)]=val.slice(0,200);audit(e,'Updated kit issuance or access note');}
    else if(field.indexOf('comment.')===0){const k=field.slice(8);const allowed=k==='hr'?isHR():k==='division'?roleCanHead(e):k==='employee'?isHR():canReview(k);if(!allowed)return;e.comments[k]=val.slice(0,1000);audit(e,'Updated '+k+' comment');}
    else if(['currentBasic','currentAllowances','proposedPct','approvedPct','effectiveDate'].includes(field)){if(field==='approvedPct'||field==='effectiveDate'){return;}else if(!roleCanHead(e))return;
      if(field==='effectiveDate'){if(val&&!/^\d{4}-\d{2}-\d{2}$/.test(val)){toast('Invalid date');return;}e[field]=val;}
      else {const n=Number(val);if(val===''||!Number.isFinite(n)||n<0||(field.endsWith('Pct')&&n>100)){toast('Enter a valid, nonnegative amount (percentages up to 100).');render();return;}e[field]=Math.round(n*100)/100;}
      invalidateEvaluation(e);
      audit(e,'Updated sample compensation: '+field);
    }else return;render();
  }
  function openMilestoneEditor(kind,employeeId,recordId){
    const e=emp(employeeId),allowed=['promotion','perfect','discipline'].includes(kind);
    const listName={promotion:'promotions',perfect:'attendanceAwards',discipline:'disciplinaryActions'}[kind];
    if(!e||!allowed)return;
    if(kind==='promotion'&&!(isHR()||roleCanHead(e))){toast('Only HR or the assigned evaluator can record promotions.');return;}
    if(kind!=='promotion'&&!isHR()){toast('Only HR can maintain this type of milestone.');return;}
    const list=e[listName],old=recordId?list.find(function(x){return x.id===recordId;}):null;
    if(recordId&&!old){toast('Record not found.');return;}
    if(kind==='promotion'&&old&&old.status==='Approved'&&!isHR()){toast('Only HR can edit approved promotion records.');return;}
    const statusOptions=function(arr,selected){return opts(arr.map(function(x){return {label:x,value:x};}),selected);};
    const modal=document.createElement('div');modal.id='milestone-edit-modal';modal.className='overlay center-overlay milestone-edit-overlay';modal.setAttribute('data-overlay','milestone-editor');
    const field=function(name,label,value,type,required){return '<label><span class="field-label">'+label+'</span><input class="field" name="'+name+'" type="'+(type||'text')+'" value="'+safe(value||'')+'" '+(required?'required':'')+'></label>';};
    let formFields='';
    if(kind==='promotion'){
      formFields=field('date','Effective date',old?old.date:now(),'date',true)+field('from','Previous position',old?old.from:e.jobTitle,'text',true)+field('to','New position',old?old.to:'','text',true)+
        '<label><span class="field-label">Promotion status</span><select class="field" name="status">'+statusOptions(isHR()?['Proposed','Recommended','Approved']:['Proposed','Recommended'],old&&old.status)+'</select></label>';
    }else if(kind==='perfect'){
      formFields=field('period','Attendance period (month)',old?old.period:now().slice(0,7),'month',true)+
        '<label><span class="field-label">Verification</span><select class="field" name="status">'+statusOptions(['Pending verification','HR confirmed'],old&&old.status)+'</select></label>'+
        '<p class="muted micro">Do not award perfect attendance automatically from incomplete attendance entries.</p>';
    }else{
      formFields=field('date','Date recorded',old?old.date:now(),'date',true)+field('category','Policy category',old?old.category:'','text',true)+
        '<label><span class="field-label">Action level</span><select class="field" name="severity">'+statusOptions(['Advisory','Written warning','Final warning','Suspension','Other'],old&&old.severity)+'</select></label>'+
        '<label><span class="field-label">Case status</span><select class="field" name="status">'+statusOptions(['Under review','Active','Resolved'],old&&old.status)+'</select></label>';
    }
    const heading={promotion:'Promotion record',perfect:'Perfect-attendance recognition',discipline:'Disciplinary case'}[kind];
    modal.innerHTML='<section class="workspace-modal milestone-editor-panel" role="dialog" aria-modal="true" aria-labelledby="milestone-editor-title" tabindex="-1">'+
      '<div class="modal-fixed-head"><div><span class="eyebrow">SAMPLE RECORD · '+safe(e.id)+'</span><h2 id="milestone-editor-title">'+(old?'Edit ':'New ')+heading+'</h2><p>'+safe(e.name)+' · '+safe(div(e.division).name)+'</p></div><button type="button" class="modal-close" data-milestone-close="1" aria-label="Close form">×</button></div>'+
      '<div class="workspace-modal-scroll"><form id="milestone-form" class="stack milestone-form">'+
      (kind==='discipline'?'<div class="callout orange"><strong>Confidential demonstration:</strong> Do not enter real disciplinary or personal records on this public prototype.</div>':'')+
      '<div class="form-grid">'+formFields+'</div>'+
      '<label><span class="field-label">Record note (optional)</span><textarea class="field textarea" name="note" maxlength="500" placeholder="Sample note only — no real confidential information">'+safe(old?old.note:'')+'</textarea></label>'+
      '<div class="milestone-form-actions">'+(old?'<button type="button" class="button danger" data-milestone-delete="1">Remove</button>':'')+
      '<button type="button" class="button" data-milestone-close="1">Cancel</button><button type="submit" class="button primary">Save record</button></div>'+
      '</form></div></section>';
    document.body.appendChild(modal);
    const close=function(){modal.remove();};
    modal.querySelectorAll('[data-milestone-close]').forEach(function(el){el.addEventListener('click',close);});
    modal.addEventListener('click',function(ev){if(ev.target===modal)close();});
    modal.addEventListener('keydown',function(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close();}});
    const deletion=modal.querySelector('[data-milestone-delete]');
    if(deletion)deletion.addEventListener('click',function(){
      if(!confirm('Remove this fictional milestone record?'))return;
      const idx=list.findIndex(function(x){return x.id===recordId;});
      if(idx!==-1)list.splice(idx,1);
      audit(e,'Removed demo '+kind+' milestone');close();render();toast('Record removed from this browser.');
    });
    modal.querySelector('#milestone-form').addEventListener('submit',function(ev){
      ev.preventDefault();if(!isHR()&&kind!=='promotion' || !isHR()&&kind==='promotion'&&!roleCanHead(e))return;
      const f=new FormData(ev.currentTarget),val=function(key){return String(f.get(key)||'').trim().slice(0,500);};
      const next={id:old?old.id:'mj-'+kind+'-'+e.id+'-'+Date.now(),note:val('note'),status:val('status')};
      if(kind==='promotion'){
        next.date=val('date');next.from=val('from');next.to=val('to');
        if(!next.from||!next.to||!isValidDate(next.date)){toast('Enter a valid date and both job positions.');return;}
        if(!isHR()&&!['Proposed','Recommended'].includes(next.status)){toast('Only HR can approve promotions.');return;}
        if(!['Proposed','Recommended','Approved'].includes(next.status))return;
      }else if(kind==='perfect'){
        next.period=val('period');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(next.period)||!['Pending verification','HR confirmed'].includes(next.status)){toast('Select a valid month and verification status.');return;}
      }else{
        next.date=val('date');next.category=val('category');next.severity=val('severity');
        if(!isValidDate(next.date)||!next.category||!['Advisory','Written warning','Final warning','Suspension','Other'].includes(next.severity)||!['Under review','Active','Resolved'].includes(next.status)){toast('Complete all case details correctly.');return;}
      }
      if(old)Object.assign(old,next);else list.push(next);
      audit(e,(old?'Updated':'Recorded')+' demo '+kind+' milestone');
      close();render();toast('Milestone saved locally.');
    });
    const first=modal.querySelector('input');if(first&&typeof first.focus==='function')first.focus({preventScroll:true});
  }
  function isValidDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
    const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
  }
  function openRecordEditor(id){
    if(!isHR()){toast('Select an HR demo workspace to edit attendance.');return;}
    const e=emp(),old=id?e.attendance.find(function(x){return x.id===id;}):null;
    const entry={id:old?old.id:'a-'+Date.now(),date:old?old.date:now(),type:old?old.type:'Late',approval:old?old.approval:'Pending',reason:old?old.reason:'',remarks:old?old.remarks:'',verified:old?old.verified:false};
    const existing=$('record-modal');if(existing)existing.remove();
    const modal=document.createElement('div');
    modal.className='overlay center-overlay record-overlay';modal.id='record-modal';
    modal.setAttribute('data-overlay','record');
    modal.innerHTML='<section class="workspace-modal attendance-edit-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title" tabindex="-1">'+
      '<div class="modal-fixed-head"><div><span class="eyebrow">ATTENDANCE · '+safe(e.id)+'</span><h2 id="record-modal-title">'+(old?'Edit attendance':'New attendance')+'</h2><p>'+safe(e.name)+' · Confirm verification before counting in analytics</p></div><button class="modal-close" type="button" data-record-close="1" aria-label="Close attendance form">×</button></div>'+
      '<div class="workspace-modal-scroll"><form id="record-form" class="stack attendance-record-form">'+
      '<div class="form-grid"><label><span class="field-label">Date</span><input class="field" name="date" type="date" required value="'+safe(entry.date)+'"></label>'+
      '<label><span class="field-label">Record type</span><select class="field" name="type">'+opts(['Late','Absent','Leave'].map(function(x){return {label:x,value:x};}),entry.type)+'</select></label>'+
      '<label class="span2"><span class="field-label">Approval / excuse status</span><select class="field" name="approval">'+opts(['Pending','Approved','Excused','Unapproved'].map(function(x){return {label:x,value:x};}),entry.approval)+'</select></label></div>'+
      '<label><span class="field-label">Reason for leave, absence or lateness</span><textarea class="field textarea" required name="reason">'+safe(entry.reason)+'</textarea></label>'+
      '<label><span class="field-label">Supervisor remarks</span><textarea class="field textarea" name="remarks">'+safe(entry.remarks)+'</textarea></label>'+
      '<label class="check-row"><input type="checkbox" name="verified" '+(entry.verified?'checked':'')+'><span>HR verified — include in analytics</span></label>'+
      '<div class="attendance-record-actions"><button type="button" class="button" data-record-close="1">Cancel</button><button class="button primary" type="submit">Save record</button></div>'+
      '</form></div></section>';
    document.body.appendChild(modal);
    const close=function(){modal.remove();};
    modal.querySelectorAll('[data-record-close]').forEach(function(el){el.addEventListener('click',close);});
    modal.addEventListener('click',function(ev){if(ev.target===modal)close();});
    modal.addEventListener('keydown',function(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close();}});
    modal.querySelector('#record-form').addEventListener('submit',function(ev){
      ev.preventDefault();const f=new FormData(ev.currentTarget);
      const next={id:entry.id,date:String(f.get('date')||''),type:String(f.get('type')||''),approval:String(f.get('approval')||''),reason:String(f.get('reason')||'').trim().slice(0,500),remarks:String(f.get('remarks')||'').trim().slice(0,500),verified:f.has('verified')};
      if(!next.date||!next.reason){toast('Date and reason are required.');return;}
      if(old)Object.assign(old,next);else e.attendance.push(next);
      audit(e,(old?'Edited':'Added')+' verified status and attendance record '+next.date);
      close();render();toast('Attendance record saved locally.');
    });
    const focus=modal.querySelector('input[name="date"]');if(focus)focus.focus({preventScroll:true});
  }
  function reviewAction(step,decision){const e=emp();if(!reviewCanAct(e,step)){toast('This review step is not available to the selected evaluator.');return;}
    if(step==='coo'&&decision==='Approved'&&(!e.effectiveDate||!e.comments.coo.trim())){toast('COO: enter the effectivity date and final remarks before approval.');return;}
    if(step==='division'&&decision==='Endorsed'&&!e.comments.division.trim()){toast('Division Head: add a recommendation comment before endorsement.');return;}
    if(step==='division'){e.review.corp={status:'Pending',comment:'',at:''};e.review.cso={status:'Pending',comment:'',at:''};e.review.coo={status:'Pending',comment:'',at:''};}
    if(decision==='Returned'){const prior=step==='corp'?'division':step==='cso'?'corp':'cso';e.review[prior].status='Pending';}
    e.review[step]={status:decision,comment:e.comments[step]||'',at:new Date().toISOString()};
    if(step==='coo'&&decision==='Approved'&&e.approvedPct===0)toast('Approved with a 0% salary adjustment.');
    audit(e,step+' review: '+decision);render();toast('Review status updated: '+decision+'.');
  }
  function toCSV(rows){return rows.map(function(row){return row.map(function(x){return '"'+String(x===null||x===undefined?'':x).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');}
  function download(filename,mime,text){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},2500);}
  function action(name,button){const e=emp();if(name==='landing-role'){ui.chooserCategory=['hr','head','executive'].includes(button.dataset.role)?button.dataset.role:'all';navigate('overview');ui.roleModal=true;render();return;}if(name==='workspace-category'){ui.chooserCategory=['hr','head','executive'].includes(button.dataset.category)?button.dataset.category:'all';ui.roleModal=true;render();return;}if(name==='mobile'){ui.mobile=!ui.mobile;render();return;}
    if(name==='set-theme'){setTheme(button.dataset.themeValue);return;}if(!ui.workspaceChosen)return;
    if(name==='quick-search'){navigate('employees');const search=$('app')&&$('app').querySelector('[data-ui="query"]');if(search&&typeof search.focus==='function')search.focus();return;}
    if(name==='work-view'){ui.workView=button.dataset.mode==='board'?'board':'list';try{sessionStorage.setItem('maddie-journey-workview',ui.workView);}catch(err){}render();return;}
    if(name==='journey-view'){ui.journeyView=button.dataset.mode==='table'?'table':'board';render();return;}
    if(name==='attention-filter'){ui.attentionFilter=['all','attendance','kpi','onboarding','reviews'].includes(button.dataset.kind)?button.dataset.kind:'all';ui.attentionShowAll=false;render();return;}
    if(name==='attention-more'){ui.attentionShowAll=!ui.attentionShowAll;render();return;}
    if(name==='division-tab'){ui.divisionTab=['summary','board','list','chart','team'].includes(button.dataset.tab)?button.dataset.tab:'summary';render();return;}
    if(name==='open-org'){openDivision(button.dataset.division);ui.divisionTab='chart';render();return;}
    if(name==='choose-workspace'){ui.chooserCategory='all';ui.roleModal=true;ui.divisionModal=false;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='select-viewer'){if(!data.viewers.some(function(v){return v.id===button.dataset.id;}))return;ui.viewer=button.dataset.id;ui.workspaceChosen=true;ui.milestoneDivision='all';ui.scope='all';ensureEmployeeScope();ui.roleModal=false;ui.chooserCategory='all';ui.divisionModal=false;ui.employeeModalOpen=false;persist();navigate('overview');return;}
    if(name==='milestone-category'){if(!milestoneKinds.some(function(k){return k.id===button.dataset.kind;}))return;ui.milestoneCategory=button.dataset.kind;ui.milestoneShowAll=false;render();return;}
    if(name==='milestone-more'){ui.milestoneShowAll=!ui.milestoneShowAll;render();return;}
    if(name==='milestone-division'){ui.divisionPickerMode='milestone';ui.divisionModal=true;ui.employeePicker=false;render();return;}
    if(name==='set-milestone-division'){const id=button.dataset.division;if(id!=='all'&&!data.divisions.some(function(d){return d.id===id;}))return;ui.milestoneDivision=id;ui.milestoneShowAll=false;ui.divisionModal=false;render();return;}
    if(name==='choose-milestone-employee'){ui.milestonePicking=true;ui.employeePicker=true;ui.pickerDivision=ui.milestoneDivision==='all'?'rmd':ui.milestoneDivision;ui.employeeModalOpen=false;render();return;}
    if(name==='milestone-edit'){openMilestoneEditor(button.dataset.kind,button.dataset.employee||ui.employee,button.dataset.id||'');return;}
    if(name==='choose-division'){ui.divisionPickerMode='view';ui.divisionModal=true;ui.roleModal=false;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='choose-scope'){ui.divisionPickerMode='scope';ui.divisionModal=true;ui.roleModal=false;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='set-scope'){const id=button.dataset.division;if(id!=='all'&&!data.divisions.some(function(d){return d.id===id;}))return;ui.scope=id;ui.divisionModal=false;ensureEmployeeScope();persist();if(ui.tab==='division'){if(id==='all')navigate('divisions');else openDivision(id);}else render();return;}
    if(name==='choose-employee'){ui.employeePicker=true;ui.pickerDivision=ui.scope!=='all'?ui.scope:ui.tab==='division'?ui.activeDivision:emp().division;ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;render();return;}
    if(name==='picker-division'){if(!data.divisions.some(function(d){return d.id===button.dataset.division;}))return;ui.pickerDivision=button.dataset.division;render();return;}
    if(name==='pick-member'){const selected=emp(button.dataset.id);if(!selected)return;ui.employee=selected.id;ui.scope=selected.division;ui.employeePicker=false;if(ui.milestonePicking){ui.milestonePicking=false;ui.detail='milestones';ui.employeeModalOpen=true;}render();return;}
    if(name==='nav'){navigate(button.dataset.tab);return;}
    if(name==='goto-division'){ui.divisionModal=false;openDivision(button.dataset.division);return;}
    if(name==='open'){ui.employee=button.dataset.id||ui.employee;ui.detail=button.dataset.detail||'preview';ui.roleModal=false;ui.divisionModal=false;ui.employeeModalOpen=true;render();return;}
    if(name==='close'){if(!ui.workspaceChosen)return;ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.milestonePicking=false;render();return;}
    if(name==='detail'){ui.detail=button.dataset.tab;render();return;}
    if(name==='new-record'){openRecordEditor();return;}
    if(name==='edit-record'){openRecordEditor(button.dataset.id);return;}
    if(name==='review'){reviewAction(button.dataset.step,button.dataset.decision);return;}
    if(name==='export'){download('maddie-journey-demo-backup.json','application/json;charset=utf-8',JSON.stringify(data,null,2));toast('Backup downloaded.');return;}
    if(name==='export-csv'){const rows=[['Employee ID','Name','Division','Role','Start date','Journey %','Welcome kit %','KPI score %','Performance rating','Final approval']].concat(scopedEmployees().map(function(x){return [x.id,x.name,div(x.division).name,x.jobTitle,x.startDate,journeyPct(x),kitPct(x),score(x),rating(score(x)),x.review.coo.status];}));download('maddie-journey-51-employees.csv','text/csv;charset=utf-8',toCSV(rows));return;}
    if(name==='attendance-csv'){const rows=[['Employee ID','Employee','Division','Date','Type','Approval','Verified','Reason','Supervisor remarks']];scopedEmployees().forEach(function(x){x.attendance.forEach(function(r){rows.push([x.id,x.name,div(x.division).name,r.date,r.type,r.approval,r.verified?'Yes':'No',r.reason,r.remarks]);});});download('maddie-journey-attendance.csv','text/csv;charset=utf-8',toCSV(rows));return;}
    if(name==='import'){$('import-file').click();return;}
    if(name==='reset'){if(confirm('Restore all 51 fictional employees and erase locally saved changes on this browser?')){data=clone(seed);ui.employee=data.employees[0].id;persist();render();toast('Sample data restored.');}return;}
  }
  document.addEventListener('click',function(ev){const dept=ev.target.closest('[data-nav-division]');if(dept){ev.preventDefault();openDivision(dept.dataset.navDivision);return;}const nav=ev.target.closest('[data-nav]');if(nav){ev.preventDefault();navigate(nav.dataset.nav);return;}const act=ev.target.closest('[data-action]');if(act){ev.preventDefault();action(act.dataset.action,act);return;}if(['employee','role','division','picker'].includes(ev.target.dataset.overlay)){if(!ui.workspaceChosen)return;ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;render();}});
  document.addEventListener('change',function(ev){const el=ev.target;if(el.dataset.ui){if(el.dataset.ui==='viewer'){ui.viewer=el.value;persist();render();toast('Preview role: '+viewer().name);}else if(el.dataset.ui==='employee'){ui.employee=el.value;render();}else if(el.dataset.ui==='division'){ui.division=el.value;render();}else if(el.dataset.ui==='activeDivision'){openDivision(el.value);}else if(el.dataset.ui==='frequency'){ui.frequency=el.value;render();}else if(el.dataset.ui==='query'){ui.query=el.value;render();}return;}
    if(el.dataset.stage!==undefined){const e=emp();if(!canTrack(e))return;const s=Number(el.dataset.stage),i=Number(el.dataset.item);if(!e.journey[s]||i>=e.journey[s].length)return;e.journey[s][i]=el.checked;audit(e,(el.checked?'Completed':'Reopened')+' Stage '+(s+1)+': '+data.stages[s].items[i]);render();return;}
    if(el.dataset.kit!==undefined){const e=emp(),i=Number(el.dataset.kit);if(!canTrack(e)||i>=e.kit.length)return;e.kit[i]=el.checked;audit(e,(el.checked?'Completed':'Reopened')+' kit: '+data.kit[i].label);render();return;}
    if(el.dataset.field){changeField(el);return;}
    if(el.id==='import-file'&&el.files&&el.files[0]){const r=new FileReader();r.onload=function(){try{const value=JSON.parse(r.result);if(![3,4,5,6].includes(value.version)||!Array.isArray(value.employees)||value.employees.length!==51||!Array.isArray(value.divisions)){throw Error('This is not a compatible 51-employee backup.');}if(!confirm('Replace current browser data with this imported backup?'))return;data=upgradeData(value);data.viewers=clone(seed.viewers);data.divisions=clone(seed.divisions);data.stages=clone(seed.stages);data.kit=clone(seed.kit);ui.employee=data.employees[0].id;persist();render();toast('Backup imported successfully.');}catch(err){toast('Import failed: '+err.message);}};r.readAsText(el.files[0]);}
  });
  document.addEventListener('input',function(ev){const el=ev.target;if(el.dataset.ui==='query'){const p=el.selectionStart;ui.query=el.value;const focus=document.activeElement;const list=filtered();const table=$('app').querySelector('.panel.no-pad');if(table){const existing=table.querySelector('.table-wrap, .empty');if(existing)existing.outerHTML=employeesTable(list);const count=table.querySelector('.filters .muted.micro');if(count)count.textContent=list.length+' employees';}if(focus!==el){el.focus();try{el.setSelectionRange(p,p);}catch(err){}}}});
  document.addEventListener('keydown',function(ev){
    const anyOpen=ui.employeeModalOpen||ui.roleModal||ui.divisionModal||ui.employeePicker||!!$('record-modal')||!!$('milestone-edit-modal');
    if(!anyOpen)return;
    if(ev.key==='Escape'){
      // Nested attendance/milestone editors handle their own Escape event first.
      if($('record-modal')||$('milestone-edit-modal'))return;
      ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;render();return;
    }
    if(ev.key!=='Tab')return;
    // Keep keyboard navigation within whichever centered dialog is on top.
    const extra=$('milestone-edit-modal')||$('record-modal');
    const modal=extra?extra.querySelector('[role="dialog"]'):$('app').querySelector('[role="dialog"]');
    if(!modal||typeof modal.querySelectorAll!=='function')return;
    const focusables=Array.from(modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    if(!focusables.length){ev.preventDefault();modal.focus();return;}
    const first=focusables[0],last=focusables[focusables.length-1];
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
  });
  window.addEventListener('hashchange',function(){const target=location.hash.slice(1);if(target==='welcome'&&ui.tab!=='welcome'){navigate('welcome');}else if(target.startsWith('division/')){const id=target.slice(9);if(data.divisions.some(function(d){return d.id===id;})&&(ui.tab!=='division'||ui.activeDivision!==id))openDivision(id);}else if(items.some(function(a){return a[0]===target;})&&target!==ui.tab)navigate(target);});
  const hash=location.hash.slice(1);if(hash.startsWith('division/')&&data.divisions.some(function(d){return d.id===hash.slice(9);})) {ui.tab='division';ui.activeDivision=hash.slice(9);ui.scope=ui.activeDivision;ensureEmployeeScope();}else if(items.some(function(a){return a[0]===hash;}))ui.tab=hash;else ui.tab='welcome';
  render();
})();