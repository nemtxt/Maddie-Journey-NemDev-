/* Maddie Journey · local-first static prototype, no authentication or remote persistence. */
(function () {
  'use strict';
  const seed = window.MJ_SEED;
  if (!seed) { document.getElementById('app').textContent='Sample data could not be loaded.'; return; }
  const KEY='maddie-journey-demo-v3';
  const $=function(id){return document.getElementById(id);};
  const clone=function(x){return JSON.parse(JSON.stringify(x));};
  function upgradeData(source){
    if(!source||![3,4,5].includes(source.version)||!Array.isArray(source.employees)||source.employees.length!==51)return clone(seed);
    if(source.version===3){
      const untouched=source.employees.filter(function(e){return e.division==='design'&&!e.modifiedAt&&!(e.audit||[]).length;});
      untouched.forEach(function(e,i){if(i%2===1)e.division='designops';});
    }
    const byId=new Map(seed.employees.map(function(e){return [e.id,e];}));
    source.employees.forEach(function(e){
      const template=byId.get(e.id);if(!template)return;
      if(typeof e.birthday!=='string')e.birthday=template.birthday;
      for(const k of ['promotions','disciplinaryActions','attendanceAwards'])if(!Array.isArray(e[k]))e[k]=clone(template[k]);
      if(!Array.isArray(e.audit))e.audit=[];
    });
    source.version=seed.version;return source;
  }
  let data;
  try{
    const raw=JSON.parse(localStorage.getItem(KEY));
    data=upgradeData(raw);
    if(raw&&data===raw)try{localStorage.setItem(KEY,JSON.stringify(data));}catch(err){}
  }catch(err){data=clone(seed);}
  data.viewers=clone(seed.viewers); data.divisions=clone(seed.divisions); data.stages=clone(seed.stages); data.kit=clone(seed.kit);
  let ui={tab:'overview',viewer:'giezelle',division:'all',activeDivision:'rmd',scope:'all',divisionPickerMode:'view',query:'',employee:data.employees[0].id,detail:'preview',employeeModalOpen:false,roleModal:false,divisionModal:false,employeePicker:false,pickerDivision:'rmd',frequency:'monthly',mobile:false,milestoneCategory:'birthday',milestoneDivision:'all',milestoneShowAll:false,milestonePicking:false};
  try {const saved=JSON.parse(sessionStorage.getItem('maddie-journey-ui')||'null');if(saved&&data.viewers.some(function(v){return v.id===saved.viewer;}))ui.viewer=saved.viewer;ui.scope='all';}catch(err){}
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
  const canTrack=function(e){return isHR()||roleCanHead(e);};
  const canScore=function(e,k){return (k==='values'||k==='behavior')?isHR():roleCanHead(e);};
  const canReview=function(k){const r=viewer().role;return k==='corp'&&r==='corp';};
  const dateLabel=function(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d.getTime())?safe(v):d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});};
  const escVal=function(v){return safe(v);};
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));sessionStorage.setItem('maddie-journey-ui',JSON.stringify({viewer:ui.viewer,scope:ui.scope}));}catch(err){toast('Browser storage unavailable. Export your work to avoid losing changes.');}}
  function audit(e,action){const entry={date:new Date().toISOString(),actor:viewer().name,action:action};e.modifiedAt=entry.date;e.audit.unshift(entry);e.audit=e.audit.slice(0,50);persist();}
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
    if(meta)meta.setAttribute('content',next==='dark'?'#090A0C':'#F6F7F8');
    document.querySelectorAll('[data-action="set-theme"]').forEach(function(el){
      const pressed=el.dataset.themeValue===next;
      el.setAttribute('aria-pressed',String(pressed));
      el.classList.toggle('active',pressed);
    });
  }
  function topnav(){
    return '<div class="mobile-top"><div class="brand"><span class="logo">m.</span><b>Maddie Journey</b></div>'+button('☰','mobile','','small')+'</div>'+
      '<div class="topbar"><div class="breadcrumb">PEOPLE & CULTURE <span class="breadcrumb-divider" aria-hidden="true">/</span><strong>'+safe(title(ui.tab))+'</strong></div>'+
      '<div class="top-actions">'+themeControl()+'</div></div>';
  }
  const items=[['overview','◫','Overview'],['divisions','▦','Divisions'],['employees','◎','Employees'],['milestones','✦','Milestones'],['journey','◷','Journey'],['kit','▣','Welcome Kit'],['attendance','◩','Attendance'],['kpi','◈','KPI scorecards'],['approvals','✓','Reviews'],['audit','≡','Data & settings']];
  function sidebar(){
    const v=viewer();
    const groups=[['PEOPLE',['overview','divisions','employees','milestones']],['OPERATIONS',['journey','kit','attendance']],['PERFORMANCE',['kpi','approvals']]];
    const navItems=function(ids){return ids.map(function(id){const item=items.find(function(x){return x[0]===id;});return item?'<a href="#'+id+'" data-nav="'+id+'" class="'+(ui.tab===id||(id==='divisions'&&ui.tab==='division')?'active':'')+'"><span class="nav-icon">'+item[1]+'</span>'+item[2]+'</a>':'';}).join('');};
    return '<aside class="sidebar"><div class="brand"><span class="logo">m.</span><span><b>Maddie Journey</b><small>People & Culture</small></span></div>'+
      groups.map(function(g){return '<div class="sidebar-label">'+g[0]+'</div><nav class="nav" aria-label="'+g[0]+'">'+navItems(g[1])+'</nav>';}).join('')+
      '<div class="sidebar-bottom"><nav class="nav" aria-label="Settings">'+navItems(['audit'])+'</nav>'+
      '<div class="sidebar-user">'+avatar(v.name)+'<span><b>'+safe(v.name)+'</b><small>'+safe(v.title)+'</small></span></div>'+
      '<button class="sidebar-switch" data-action="choose-workspace" type="button">Switch demo view</button></div></aside>';
  }
  function title(t){if(t==='division')return div(ui.activeDivision).name+' · Evaluation';return {divisions:'Divisions',overview:'Overview',milestones:'Employee milestones',employees:'People directory',journey:'Employee journey',kit:'Welcome Maddie Kit',attendance:'Attendance analytics',kpi:'2026 KPI evaluations',approvals:'Executive approvals',audit:'Activity & data'}[t]||'Overview';}
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
      cards=[['Division Head endorsed',all.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length,'Initial evaluation'],['Corporate Ops endorsed',all.filter(function(e){return reviewStatus(e,'corp')==='Endorsed';}).length,'Review & endorsement'],['CSO reviewed',all.filter(function(e){return reviewStatus(e,'cso')==='Endorsed';}).length,'Strategic review'],['COO approved',approvedCount(),'Final approval tracked']];
    }else if(ui.tab==='audit'){
      const changed=all.filter(function(e){return e.audit.length>0;});
      cards=[['Employee records',all.length,'All fictional'],['Edited employees',changed.length,'On this browser'],['Logged changes',all.reduce(function(n,e){return n+e.audit.length;},0),'Local activity history'],['Shared sync','Off','JSON backup available']];
    }
    return cards.length?'<section class="screen-summary" aria-label="'+safe(title(ui.tab))+' summary"><div class="summary-heading"><span class="eyebrow">SCREEN SUMMARY</span><span class="muted micro">Calculated from sample data</span></div><div class="grid metrics">'+cards.map(function(c){return metricCard(c[0],c[1],c[2]);}).join('')+'</div></section>':'';
  }
  function divisionEvaluatorNames(d){return d.evaluators.map(function(id){const v=data.viewers.find(function(p){return p.id===id;});return v?v.name:id;}).join(' / ');}
  function assignedDivisionIds(){const v=viewer();return data.divisions.filter(function(d){return d.evaluators.includes(v.id);}).map(function(d){return d.id;});}
  function divisionCard(d){
    const team=data.employees.filter(function(e){return e.division===d.id;});
    const editable=team.some(roleCanHead);
    const hr=isHR();
    const access=editable?'Department KPI editor':hr?'HR scoring available':'Observer / read-only';
    return '<article class="division-card" data-department="'+safe(d.id)+'"><div class="division-card-top"><span class="tag info">'+safe(d.short)+'</span>'+pill(editable?'Editable':hr?'HR inputs':'View only')+'</div><h2>'+safe(d.name)+'</h2><p class="division-owner">'+safe(divisionEvaluatorNames(d))+'</p><div class="division-card-stats"><span><strong>'+team.length+'</strong><small>Members</small></span><span><strong>'+meanOf(team,score)+'%</strong><small>Avg. KPI</small></span><span><strong>'+meanOf(team,journeyPct)+'%</strong><small>Journey</small></span></div><div class="division-card-footer"><span class="muted micro">'+safe(access)+'</span>'+button('Open division','goto-division','data-division="'+safe(d.id)+'"','small primary')+'</div></article>';
  }
  function divisionsView(){
    const my=assignedDivisionIds();
    const sorted=data.divisions.slice().sort(function(a,b){return Number(my.includes(b.id))-Number(my.includes(a.id));});
    return header('EIGHT DEPARTMENTS','Division workspaces','Each division has its own member list, KPI evaluation desk, assigned evaluators and live demonstration summary.',button('Employee directory','nav','data-tab="employees"','small'))+
      (my.length?'<div class="callout" style="margin-bottom:17px"><strong>Your evaluation desks:</strong> '+my.map(function(id){const d=div(id);return '<button class="link-btn" data-action="goto-division" data-division="'+safe(id)+'">'+safe(d.name)+'</button>';}).join(' &nbsp; / &nbsp; ')+'</div>':
      '<div class="callout" style="margin-bottom:17px"><strong>'+((viewer().role==='ceo'||viewer().role==='cso'||viewer().role==='coo')?'Executive observer view':'People & Culture workspace')+':</strong> Open any division to see its employee roster and report cards. Editing follows the active demonstration evaluator role.</div>')+
      '<section class="division-grid">'+sorted.map(divisionCard).join('')+'</section>';
  }
  function employeeCard(e){
    const edit=roleCanHead(e)||isHR(),pct=score(e);
    return '<article class="member-card"><div class="member-card-head">'+avatar(e.name)+'<div class="member-identity"><h3>'+safe(e.name)+'</h3><p>'+safe(e.jobTitle)+'</p></div>'+pill(reviewStatus(e,'division'))+'</div>'+
      '<div class="member-score-row"><span><small>Overall KPI</small><strong>'+pct.toFixed(1)+'%</strong></span><span><small>Onboarding</small><strong>'+journeyPct(e)+'%</strong></span><span><small>Welcome Kit</small><strong>'+kitPct(e)+'%</strong></span></div>'+
      '<div class="member-card-progress">'+progress(journeyPct(e))+'</div>'+
      '<div class="member-card-buttons">'+button('Preview charts','open','data-id="'+safe(e.id)+'" data-detail="preview"','small')+
      button(edit?'Open evaluation':'View KPI','open','data-id="'+safe(e.id)+'" data-detail="kpi"','small primary')+'</div></article>';
  }
  function divisionView(){
    const d=div(ui.activeDivision),team=data.employees.filter(function(e){return e.division===d.id;});
    if(!team.length)return header('DIVISION','No team members','Choose another department.',button('All divisions','nav','data-tab="divisions"','small'));
    const editable=team.some(roleCanHead),permission=editable?'You can edit the assigned members’ division and individual KPI scores.':isHR()?'HR can update Values Alignment, Job Behavior and employee onboarding.':'Observer access — all employee details are read-only.';
    return header('DEPARTMENT EVALUATION',d.name,'Choose a team member below to preview their charts or open the evaluation form.',button('All divisions','nav','data-tab="divisions"','small'))+
      '<section class="panel department-toolbar" data-department="'+safe(d.id)+'"><div><span class="eyebrow">DEPARTMENT EVALUATOR'+(d.evaluators.length>1?'S':'')+'</span><h2>'+safe(divisionEvaluatorNames(d))+'</h2><p class="muted micro">'+safe(permission)+'</p></div>'+button('Change division','choose-division','','small')+'</section>'+
      '<div class="department-team-heading"><div><h2>Team members</h2><p class="muted micro">'+team.length+' fictional employees · Select someone to review</p></div><span class="tag info">'+team.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length+' reviews submitted</span></div>'+
      '<section class="member-grid">'+team.map(employeeCard).join('')+'</section>';
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
  function roleHome(){
    const v=viewer();
    if(isHR()){
      const attention=scopedEmployees().filter(function(e){return kitPct(e)<100;}).sort(function(a,b){return kitPct(a)-kitPct(b);}).slice(0,4);
      return header('PEOPLE & CULTURE','HR workspace','Employee support, onboarding and HR evaluation tools — choose what you want to work on.',button('Browse employees','nav','data-tab="employees"','primary'))+
      metrics()+
      '<div class="home-action-grid">'+
        '<section class="home-action"><div class="home-action-icon">◎</div><h2>Employees & milestones</h2><p>Find a person, then view birthdays, tenure or employee records.</p><div class="actions">'+button('Employees','nav','data-tab="employees"','small primary')+button('Milestones','nav','data-tab="milestones"','small')+'</div></section>'+
        '<section class="home-action"><div class="home-action-icon">◷</div><h2>Onboarding & Welcome Kit</h2><p>Track joining requirements, equipment and account setup.</p><div class="actions">'+button('Journey','nav','data-tab="journey"','small')+button('Welcome Kit','nav','data-tab="kit"','small')+'</div></section>'+
        '<section class="home-action"><div class="home-action-icon">◩</div><h2>Attendance monitoring</h2><p>Verify entries and review monthly attendance patterns.</p>'+button('Open attendance','nav','data-tab="attendance"','primary')+'</section>'+
        '<section class="home-action"><div class="home-action-icon">◈</div><h2>HR performance scoring</h2><p>Evaluate Values Alignment and Job Behavior, with fixed weights.</p>'+button('Open scorecards','nav','data-tab="kpi"','primary')+'</section>'+
      '</div><section class="panel"><div class="panel-head"><div><h2>Welcome kits needing attention</h2><p>Preview an employee to continue their onboarding.</p></div>'+button('All departments','nav','data-tab="divisions"','small')+'</div><div class="quick-list">'+attention.map(function(e){return '<div class="quick-item">'+avatar(e.name)+'<div class="grow"><b>'+safe(e.name)+'</b><p>'+safe(div(e.division).short)+' · Kit '+kitPct(e)+'% complete</p></div>'+button('Preview','open','data-id="'+safe(e.id)+'" data-detail="preview"','small')+'</div>';}).join('')+'</div></section>';
    }
    if(['head','corp'].includes(v.role)){
      const own=assignedDivisionIds().filter(function(id){return ui.scope==='all'||id===ui.scope;}),members=data.employees.filter(function(e){return own.includes(e.division);});
      const pending=members.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).slice(0,6);
      return header('DEPARTMENT EVALUATION','My evaluation workspace','Quick access to your assigned divisions and employees. Charts open in a popup.',button('Open divisions','nav','data-tab="divisions"','primary'))+
      '<div class="grid metrics">'+
        metricCard('Assigned members',members.length,'Across '+own.length+' departments')+
        metricCard('KPI average',meanOf(members,score)+'%','Sample weighted scores')+
        metricCard('Evaluations pending',members.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length,'Division Head review not endorsed')+
        metricCard('Journey completion',meanOf(members,journeyPct)+'%','Department onboarding progress')+'</div>'+
      '<div class="home-division-grid">'+own.map(function(id){return divisionCard(div(id));}).join('')+'</div>'+
      '<section class="panel"><div class="panel-head"><div><h2>Employees to review</h2><p>Open a preview or jump straight into their KPI evaluation.</p></div>'+button('All team members','nav','data-tab="divisions"','small')+'</div>'+
      '<div class="member-grid compact-member-grid">'+pending.map(employeeCard).join('')+'</div>'+(pending.length?'':'<p class="muted">All assigned division evaluations are endorsed in the demo.</p>')+'</section>';
    }
    return null;
  }
  function overview(){
    const persona=roleHome();if(persona)return persona;
    const leaders=data.divisions.filter(function(d){return ui.scope==='all'||d.id===ui.scope;}).map(function(d){const es=scopedEmployees().filter(function(e){return e.division===d.id;});return '<div class="bar-line"><span>'+safe(d.short)+'</span>'+progress(Math.round(es.reduce(function(a,e){return a+journeyPct(e);},0)/es.length))+'<strong>'+Math.round(es.reduce(function(a,e){return a+journeyPct(e);},0)/es.length)+'%</strong></div>';}).join('');
    const concern=scopedEmployees().slice().sort(function(a,b){return attend(b).concerns-attend(a).concerns;}).filter(function(e){return attend(e).concerns>0;}).slice(0,4);
    const soon=scopedEmployees().filter(function(e){return journeyPct(e)<45;}).slice(0,4);
    return header('A CLEARER WAY TO WORK','Good to see you.','Onboarding, attendance, KPI reviews and approvals across eight divisions, with fictional employees.',button('View directory','nav','data-tab="employees"','primary'))
    +metrics()+quickDivisionAccess()+'<div class="grid dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Onboarding across divisions</h2><p>Average completion of all journey-stage requirements</p></div>'+pill('Demo')+'</div>'+leaders+'</section><section class="panel"><div class="panel-head"><div><h2>Management snapshot</h2><p>Verified attendance records only</p></div></div><div class="grid" style="grid-template-columns:1fr 1fr;gap:12px"><div class="soft"><span class="muted micro">Employees with late records</span><h2>'+scopedEmployees().filter(function(e){return attend(e).lates>0;}).length+'</h2></div><div class="soft"><span class="muted micro">Employees with absences</span><h2>'+scopedEmployees().filter(function(e){return attend(e).absences>0;}).length+'</h2></div><div class="soft"><span class="muted micro">No lates or absences</span><h2>'+scopedEmployees().filter(function(e){return attend(e).clean;}).length+'</h2></div><div class="soft"><span class="muted micro">Pending final approval</span><h2>'+scopedEmployees().filter(function(e){return reviewStatus(e,'coo')!=='Approved';}).length+'</h2></div></div><div class="hr"></div><div class="callout"><strong>Role preview:</strong> Switch evaluators in the upper-right corner to test each part of the approval process. Role restrictions here are UI simulations, not real authorization.</div></section></div>'
    +'<div class="grid subgrid"><section class="panel"><div class="panel-head"><div><h2>Onboarding needs attention</h2><p>Employees with lower sample journey completion</p></div>'+button('Open journey','nav','data-tab="journey"','small')+'</div><div class="quick-list">'+soon.map(function(e){return '<div class="quick-item">'+avatar(e.name)+'<div class="grow"><b>'+safe(e.name)+'</b><p>'+safe(div(e.division).short)+' · '+journeyPct(e)+'% completed</p></div>'+button('Open','open','data-id="'+e.id+'"','small')+'</div>';}).join('')+'</div></section><section class="panel"><div class="panel-head"><div><h2>Attendance signals</h2><p>Unexcused or unapproved verified incidents</p></div>'+button('See analytics','nav','data-tab="attendance"','small')+'</div><div class="quick-list">'+concern.map(function(e){return '<div class="quick-item">'+avatar(e.name)+'<div class="grow"><b>'+safe(e.name)+'</b><p>'+safe(div(e.division).short)+' · '+attend(e).concerns+' concern(s)</p></div>'+button('Review','open','data-id="'+e.id+'" data-detail="attendance"','small')+'</div>';}).join('')+'</div></section></div>';
  }
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
  function stageCards(e){return '<div class="grid step-grid">'+data.stages.map(function(s,si){let done=e.journey[si].filter(Boolean).length;return '<div class="step-card"><div class="step-title"><div><div class="step-number">STAGE '+(si+1)+' · '+safe(s.timing)+'</div><h3>'+safe(s.name)+'</h3></div><span class="tag '+(done===s.items.length?'ok':'warn')+'">'+done+'/'+s.items.length+'</span></div>'+progress(Math.round(done/s.items.length*100))+'<div style="margin-top:10px">'+s.items.map(function(item,ii){return '<label class="check-row '+(canTrack(e)?'':'disabled')+'"><input type="checkbox" data-stage="'+si+'" data-item="'+ii+'" '+(e.journey[si][ii]?'checked ':'')+(canTrack(e)?'':'disabled ')+'><span>'+safe(item)+'</span></label>';}).join('')+'</div></div>';}).join('')+'</div>';}
  function employeeSelector(){ensureEmployeeScope();const e=emp();return '<label class="field-label">Selected employee</label><button type="button" class="employee-picker-trigger" data-action="choose-employee" aria-haspopup="dialog" aria-label="Choose an employee">'+avatar(e.name)+'<span><b>'+safe(e.name)+'</b><small>'+safe(div(e.division).short)+' · '+safe(e.id)+'</small></span><strong>Change member ↗</strong></button>';}
  function journey(){
    return header('ONBOARDING','Journey tracker','Select a department, then open an employee to update their seven-stage checklist.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      trackerRoster('journey');
  }
  function kitSection(e){return '<div class="kit-grid">'+data.kit.map(function(k,i){return '<div class="kit-item"><label class="check-row '+(canTrack(e)?'':'disabled')+'"><input type="checkbox" data-kit="'+i+'" '+(e.kit[i]?'checked ':'')+(canTrack(e)?'':'disabled ')+'><strong>'+safe(k.label)+'</strong></label><label class="field-label">'+(k.type==='equipment'?'Item / issuance details':'Setup / access notes')+'</label>'+input('kitnote.'+k.id,e.kitNotes[k.id]||'',{disabled:!canTrack(e),placeholder:'Reference or status only — never passwords'})+'</div>';}).join('')+'</div>';}
  function kitView(){
    return header('EMPLOYEE SETUP','Welcome Maddie Kit','Select a department, then open an employee to review equipment, tools and access.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      trackerRoster('kit')+'<p class="muted micro tracker-footnote">Do not put passwords or private credentials in sample access notes.</p>';
  }
  function attendanceSummary(e){const a=attend(e);return '<div class="grid metrics"><div class="metric"><div class="metric-label">Verified late arrivals</div><strong>'+a.lates+'</strong><div class="metric-sub">Last: '+dateLabel(a.lastLate)+'</div></div><div class="metric"><div class="metric-label">Verified absences</div><strong>'+a.absences+'</strong><div class="metric-sub">Last: '+dateLabel(a.lastAbs)+'</div></div><div class="metric"><div class="metric-label">Attendance concerns</div><strong>'+a.concerns+'</strong><div class="metric-sub">Excused late entries excluded</div></div><div class="metric"><div class="metric-label">Attendance status</div><strong style="font-size:21px">'+(a.records.length?'With records':'No record')+'</strong><div class="metric-sub">Only verified entries are counted</div></div></div>';}
  function attendanceRows(e){const rs=e.attendance.slice().sort(function(a,b){return b.date.localeCompare(a.date);});return '<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Approval</th><th>Verification</th><th>Reason / remarks</th><th></th></tr></thead><tbody>'+rs.map(function(r){return '<tr><td>'+dateLabel(r.date)+'</td><td><strong>'+safe(r.type)+'</strong></td><td>'+pill(r.approval)+'</td><td>'+pill(r.verified?'Verified':'Pending')+'</td><td><strong>'+safe(r.reason)+'</strong><small>'+safe(r.remarks)+'</small></td><td>'+(isHR()?button('Edit','edit-record','data-id="'+safe(r.id)+'"','small'):'')+'</td></tr>';}).join('')+'</tbody></table></div>';}
  function series(){const months=[];const dt=new Date();dt.setDate(1);for(let i=5;i>=0;i--){const d=new Date(dt.getFullYear(),dt.getMonth()-i,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');let late=0,abs=0;scopedEmployees().forEach(function(e){e.attendance.forEach(function(r){if(r.verified&&r.date.slice(0,7)===key){if(r.type==='Late')late++;if(r.type==='Absent')abs++;}});});months.push({label:d.toLocaleDateString('en-PH',{month:'short'}),late:late,abs:abs});}return months;}
  function chart(){const s=series(),max=Math.max(1,...s.map(function(x){return x.late+x.abs;}));return '<div class="mini-bars">'+s.map(function(m){return '<div title="'+m.label+': '+m.late+' late, '+m.abs+' absent"><span style="height:'+Math.max(3,Math.round((m.late+m.abs)/max*92))+'px"></span>'+m.label+'</div>';}).join('')+'</div><p class="muted micro" style="margin-top:12px">Last 6 months · late and absence records · verified only</p>';}
  function rankRows(type){const ranked=scopedEmployees().map(function(e){return {e:e,n:attend(e)[type]};}).filter(function(v){return v.n>0;}).sort(function(a,b){return b.n-a.n;}).slice(0,5);return ranked.length?ranked.map(function(v,i){return '<div class="rank"><span class="rank-index">'+(i+1)+'</span><div><b>'+linkedEmployee(v.e)+'</b><p class="muted micro">'+safe(div(v.e.division).short)+'</p></div><span class="count">'+v.n+'</span></div>';}).join(''):'<p class="muted">No verified entries</p>';}
  function attendancePeriodTable(){const buckets={};scopedEmployees().forEach(function(e){e.attendance.forEach(function(r){if(!r.verified)return;let period=r.date.slice(0,7);if(ui.frequency==='weekly'){const d=new Date(r.date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));period=d.toISOString().slice(0,10);}if(!buckets[period])buckets[period]={late:0,absent:0,approved:0,excused:0};if(r.type==='Late'){buckets[period].late++;if(r.approval==='Excused')buckets[period].excused++;}if(r.type==='Absent')buckets[period].absent++;if(r.type==='Leave'&&r.approval==='Approved')buckets[period].approved++;});});const keys=Object.keys(buckets).sort().reverse().slice(0,12);return '<section class="panel" style="margin-top:17px"><div class="panel-head"><div><h2>Weekly & monthly summary</h2><p>Verified records only; approved leave and excused lateness are displayed separately</p></div><select class="field" style="max-width:150px" aria-label="Attendance summary frequency" data-ui="frequency">'+opts([{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}],ui.frequency)+'</select></div><div class="table-wrap"><table class="table"><thead><tr><th>Period</th><th>Late arrivals</th><th>Absences</th><th>Excused lates</th><th>Approved leaves</th></tr></thead><tbody>'+(keys.length?keys.map(function(k){const b=buckets[k];return '<tr><td><strong>'+safe(k)+'</strong></td><td>'+b.late+'</td><td>'+b.absent+'</td><td>'+b.excused+'</td><td>'+b.approved+'</td></tr>';}).join(''):'<tr><td colspan="5">No verified records for this frequency.</td></tr>')+'</tbody></table></div></section>';}
  function attendanceView(){
    return header('ATTENDANCE','Attendance monitoring','Verified incidents, monthly trends and individual records. Open an employee to enter or verify attendance.',button('Export attendance','attendance-csv','','small'))+
      '<section class="panel attendance-trend-panel"><div class="panel-head"><div><h2>Recent attendance</h2><p>Verified late arrivals and absences · last six months</p></div></div>'+chart()+'</section>'+
      trackerRoster('attendance')+
      '<details class="panel compact-details"><summary>See late and absence rankings</summary><div class="grid subgrid" style="margin-top:18px"><div><h3>Late arrivals</h3>'+rankRows('lates')+'</div><div><h3>Absences</h3>'+rankRows('absences')+'</div></div></details>';
  }
  function scoresPanel(e){const categories=[['division','I. Division objectives',15,'Division Head'],['individual','II. Individual objectives',45,'Division Head'],['values','III. Values alignment',15,'HR / P&C'],['behavior','IV. Job behavior',25,'HR / P&C']];return '<div class="score-weights">'+categories.map(function(cat){const can=canScore(e,cat[0]);return '<div class="score-block '+(can?'':'locked')+'"><div class="heading-line"><span class="muted micro">'+cat[2]+'% weight</span>'+pill(can?'Editable':'View only')+'</div><h3>'+cat[1]+'</h3><p class="muted micro" style="margin:5px 0 12px">'+cat[3]+'</p><label class="field-label">Score (0–100)</label>'+input('score.'+cat[0],e.scores[cat[0]],{type:'number',min:0,max:100,step:0.1,disabled:!can})+'<p class="muted micro" style="margin-top:9px">Weighted: '+(e.scores[cat[0]]*cat[2]/100).toFixed(2)+' points</p></div>';}).join('')+'</div>';}
  function kpiDetail(e){const s=score(e),can=roleCanHead(e);return '<div class="grid dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Weighted evaluation</h2><p>15% + 45% + 15% + 25% = 100%</p></div>'+pill(rating(s))+'</div><div class="big-score">'+s.toFixed(2)+'%</div><div class="score-meter" aria-label="Category weights 15 45 15 25"><span></span><span></span><span></span><span></span></div><p class="muted micro" style="margin-top:11px">Demonstration scoring; no official 2026 KPI sheets are imported.</p></section><section class="panel"><h2>Official KPI source</h2><div class="hr"></div>'+pill(e.kpiValidated?'Validated':'Needs validation')+'<p class="muted micro" style="margin-top:12px">'+input('kpiSource',e.kpiSource,{disabled:!isHR()})+'</p><div class="callout orange" style="margin-top:14px">Placeholder targets and accomplishments are sample data, not verified employee goals. Validate against each official KPI sheet before real use.</div></section></div>'+scoresPanel(e)+'<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Employee objectives & accomplishments</h2><p>Editable placeholders for demonstration; official source remains unverified</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Objective</th><th>Target</th><th>Actual</th><th>Validation</th></tr></thead><tbody>'+e.kpiItems.map(function(k,i){return '<tr><td>'+safe(k.title)+'</td><td>'+input('kpi.'+i+'.target',k.target,{disabled:!can})+'</td><td>'+input('kpi.'+i+'.actual',k.actual,{disabled:!can})+'</td><td>'+pill(k.verified?'Verified':'Sample')+'</td></tr>';}).join('')+'</tbody></table></div><div class="hr"></div><div class="form-grid"><div><label class="field-label">Division Head comments</label>'+textArea('comment.division',e.comments.division,!can)+'</div><div><label class="field-label">HR assessment</label>'+textArea('comment.hr',e.comments.hr,!isHR())+'</div></div></section>';}
  function kpiView(){
    return header('PERFORMANCE','KPI scorecards','Choose a department, then open an employee for the weighted evaluation form.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<p class="muted micro tracker-footnote">Weights: Division 15% · Individual 45% · Values 15% · Behavior 25%. Demo scores only.</p>'+trackerRoster('kpi');
  }
  function reviewStatus(e,k){return e.review[k]&&e.review[k].status||'Pending';}
  function reviewCanAct(e,k){if(k==='division')return roleCanHead(e);if(k==='corp')return canReview('corp')&&reviewStatus(e,'division')==='Endorsed';if(k==='cso')return canReview('cso')&&reviewStatus(e,'corp')==='Endorsed';if(k==='coo')return canReview('coo')&&reviewStatus(e,'cso')==='Endorsed';return false;}
  function compensation(e){const base=Number(e.currentBasic)||0,allow=Number(e.currentAllowances)||0,proposal=Number(e.proposedPct)||0,approved=Number(e.approvedPct)||0;return '<div class="money-grid"><div class="money-stat"><span>Current basic salary · demo</span><strong>'+money(base)+'</strong></div><div class="money-stat"><span>Current gross · demo</span><strong>'+money(base+allow)+'</strong></div><div class="money-stat"><span>Proposed increase</span><strong>'+money(base*proposal/100)+' ('+proposal+'%)</strong></div><div class="money-stat"><span>Proposed new gross</span><strong>'+money(base*(1+proposal/100)+allow)+'</strong></div><div class="money-stat"><span>Approved increase</span><strong>'+money(base*approved/100)+' ('+approved+'%)</strong></div><div class="money-stat"><span>Approved new basic</span><strong>'+money(base*(1+approved/100))+'</strong></div><div class="money-stat"><span>Approved new gross</span><strong>'+money(base*(1+approved/100)+allow)+'</strong></div><div class="money-stat"><span>Effectivity date</span><strong>'+dateLabel(e.effectiveDate)+'</strong></div></div>';}
  function reviewFlow(e){const steps=[['division','01','Division Head · Initial evaluation','Division objectives, KPI scoring and salary proposal'],['corp','02','Corporate Operations · Endorsement','Validate the recommendation and organizational contribution'],['cso','03','CSO · Strategic review','Alignment with strategy and contribution'],['coo','04','COO · Final approval','Confirm increase, final amount and effectivity']];return '<div class="review-steps">'+steps.map(function(s){const key=s[0],status=reviewStatus(e,key),can=reviewCanAct(e,key);return '<div class="review-step '+(status==='Approved'||status==='Endorsed'?'complete':'')+'"><div class="step-bubble">'+s[1]+'</div><div><h3>'+safe(s[2])+'</h3><p class="note">'+safe(s[3])+'</p>'+pill(status)+'<p class="muted micro" style="margin-top:7px">'+safe(e.review[key].comment||'No review note yet.')+'</p>'+(e.review[key].at?'<p class="muted micro">Updated '+safe(dateLabel(e.review[key].at.slice(0,10)))+'</p>':'')+'</div><div class="actions">'+(can?button(key==='coo'?'Approve':'Endorse','review','data-step="'+key+'" data-decision="'+(key==='coo'?'Approved':'Endorsed')+'"','small primary')+(key==='division'?'':button('Return','review','data-step="'+key+'" data-decision="Returned"','small')):'')+'</div></div>';}).join('')+'</div>';}
  function approvalsDetail(e){const canHead=roleCanHead(e),canCoo=false;return '<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h2>Compensation proposal and approval</h2><p>All currency figures below are fictional demonstration values.</p></div>'+pill(reviewStatus(e,'coo'))+'</div>'+compensation(e)+'<div class="hr"></div><div class="form-grid"><div><label class="field-label">Current basic salary (₱)</label>'+input('currentBasic',e.currentBasic,{type:'number',min:0,step:1,disabled:!canHead})+'</div><div><label class="field-label">Allowances (₱)</label>'+input('currentAllowances',e.currentAllowances,{type:'number',min:0,step:1,disabled:!canHead})+'</div><div><label class="field-label">Division Head proposed increase (%)</label>'+input('proposedPct',e.proposedPct,{type:'number',min:0,max:100,step:0.01,disabled:!canHead})+'</div><div><label class="field-label">COO approved increase (%)</label>'+input('approvedPct',e.approvedPct,{type:'number',min:0,max:100,step:0.01,disabled:!canCoo})+'</div><div><label class="field-label">Effectivity date</label>'+input('effectiveDate',e.effectiveDate,{type:'date',disabled:!canCoo})+'</div><div><label class="field-label">Employee acknowledgment</label>'+input('comment.employee',e.comments.employee,{disabled:!isHR(),placeholder:'Recorded by HR after acknowledgment'})+'</div></div></section><section class="panel"><div class="panel-head"><div><h2>Executive approval workflow</h2><p>Each step requires the preceding endorsement</p></div></div>'+reviewFlow(e)+'<div class="hr"></div><div class="form-grid"><div><label class="field-label">Corporate Operations comments</label>'+textArea('comment.corp',e.comments.corp,viewer().role!=='corp')+'</div><div><label class="field-label">CSO comments</label>'+textArea('comment.cso',e.comments.cso,true)+'</div><div><label class="field-label">COO final remarks</label>'+textArea('comment.coo',e.comments.coo,!canCoo)+'</div><div><label class="field-label">Division Head recommendation</label>'+textArea('comment.division',e.comments.division,!canHead)+'</div></div></section>';}
  function approvalsTable(){return '<section class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Company-wide review queue</h2><p>Employees in '+safe(scopeLabel())+' and current approval milestones</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Division</th><th>Division Head</th><th>Corporate Ops</th><th>CSO</th><th>COO</th><th></th></tr></thead><tbody>'+scopedEmployees().map(function(e){return '<tr><td>'+linkedEmployee(e)+'</td><td>'+safe(div(e.division).short)+'</td><td>'+pill(reviewStatus(e,'division'))+'</td><td>'+pill(reviewStatus(e,'corp'))+'</td><td>'+pill(reviewStatus(e,'cso'))+'</td><td>'+pill(reviewStatus(e,'coo'))+'</td><td>'+button('Review','open','data-id="'+e.id+'" data-detail="approvals"','small')+'</td></tr>';}).join('')+'</tbody></table></div></section>';}
  function approvalsView(){
    return header('PERFORMANCE','Reviews','Monitor endorsement stages by division. Open an employee for the detailed evaluation and approval history.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<p class="muted micro tracker-footnote">Division Head → Corporate Operations → CSO → COO. Executive observer previews cannot approve records.</p>'+trackerRoster('approvals')+
      '<details class="panel compact-details"><summary>See complete review queue</summary>'+approvalsTable()+'</details>';
  }
  function activity(){const logs=[];scopedEmployees().forEach(function(e){(e.audit||[]).forEach(function(a){logs.push({date:a.date,employee:e.name,actor:a.actor,action:a.action});});});logs.sort(function(a,b){return b.date.localeCompare(a.date);});return header('WORKSPACE SETTINGS','Activity & data','Review local changes and manage your demonstration dataset.',button('Download JSON backup','export','','primary'))+'<div class="grid dashboard-grid"><section class="panel"><h2>Data controls</h2><p class="muted micro" style="margin:8px 0 17px">Edits are saved to this browser only. They do not automatically sync across devices or evaluators.</p><div class="actions">'+button('Export all data (JSON)','export','','small')+button('Import backup','import','','small')+button('Download employee CSV','export-csv','','small')+button('Reset 51 sample employees','reset','','small danger')+'</div><input type="file" id="import-file" accept=".json,application/json" hidden><div class="hr"></div><div class="callout orange"><strong>Privacy & security:</strong> This is a public-repository prototype with simulated role permissions. It is not suitable for live employee, confidential compensation, or authentication data. Use a secure backend and verified access controls before any production rollout.</div></section><section class="panel"><h2>Assigned evaluators</h2><p class="muted micro" style="margin:7px 0 16px">Current roster per project instruction</p>'+data.divisions.map(function(d){return '<div class="quick-item"><div class="grow"><b>'+safe(d.name)+'</b><p>'+safe(d.evaluators.map(function(id){const v=data.viewers.find(function(p){return p.id===id;});return v?v.name:id;}).join(' / '))+'</p></div></div>';}).join('')+'<div class="hr"></div><p class="muted micro">HR: GIEZELLE · KURT</p></section></div><section class="panel"><div class="panel-head"><div><h2>Local activity log</h2><p>Actions recorded in this browser by the selected demo viewer</p></div><span class="tag info">'+logs.length+' events</span></div><div class="audit-list">'+(logs.length?logs.slice(0,60).map(function(a){return '<div class="audit-row"><span class="avatar">↗</span><div><p><strong>'+safe(a.actor)+'</strong> · '+safe(a.action)+'</p><small>'+safe(a.employee)+' · '+safe(new Date(a.date).toLocaleString('en-PH'))+'</small></div></div>';}).join(''):'<div class="empty">No edits recorded yet. Edit any sample entry to see its audit trail.</div>')+'</div></section>';}
  function detailContent(e,t){if(t==='journey')return '<div class="panel"><div class="panel-head"><h2>Seven-stage checklist</h2><span class="tag info">'+journeyPct(e)+'% done</span></div>'+stageCards(e)+'</div>';if(t==='kit')return '<div class="panel"><div class="panel-head"><h2>Welcome Maddie Kit</h2><span class="tag info">'+kitPct(e)+'% ready</span></div>'+kitSection(e)+'</div>';if(t==='attendance')return '<section class="panel"><div class="heading-line"><h2>Attendance records</h2>'+(isHR()?button('Add record','new-record','','small primary'):'')+'</div>'+attendanceSummary(e)+'<div class="hr"></div>'+attendanceRows(e)+'</section>';if(t==='kpi')return kpiDetail(e);if(t==='approvals')return approvalsDetail(e);if(t==='milestones')return milestoneDetail(e);if(t==='preview')return previewCharts(e);if(t==='info')return '<section class="panel"><h2>Employee information</h2><p class="muted micro" style="margin:6px 0 15px">Profile details and department assignment</p>'+profileForm(e)+'</section>';return '';}
  function profileForm(e){const edit=isHR();return '<details class="panel" style="margin-bottom:14px"><summary style="font-size:12px;font-weight:800;cursor:pointer">Employee information '+(edit?'· HR editable':'· view only')+'</summary><div class="form-grid" style="margin-top:18px"><div><label class="field-label">Full name</label>'+input('profile.name',e.name,{disabled:!edit})+'</div><div><label class="field-label">Job title</label>'+input('profile.jobTitle',e.jobTitle,{disabled:!edit})+'</div><div><label class="field-label">Demo email</label>'+input('profile.email',e.email,{disabled:!edit,type:'email'})+'</div><div><label class="field-label">Start date</label>'+input('profile.startDate',e.startDate,{disabled:!edit,type:'date'})+'</div><div><label class="field-label">Birthday</label>'+input('profile.birthday',e.birthday||'',{disabled:!edit,type:'date'})+'</div><div class="span2"><label class="field-label">Assigned division</label>'+select('profile.division',e.division,data.divisions.map(function(d){return {label:d.name,value:d.id};}),!edit)+'</div></div></details>';}


  /* Milestones: distinct positive events and confidential HR records. All demo data. */
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
      ((kind.id==='promotion'&&(isHR()||viewer().role==='head'||viewer().role==='corp'))||(isHR()&&(kind.id==='perfect'||kind.id==='discipline'))?
         button('Record event','choose-milestone-employee','','small primary'):'')+'</div>'+
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
      const canEdit=isHR()||(kind==='promotion'&&roleCanHead(e)&&r.status!=='Approved');
      return '<div class="milestone-mini-row"><div><b>'+safe(name)+'</b><small>'+safe(date)+' · '+safe(r.status)+'</small></div>'+
        (canEdit?button('Edit','milestone-edit','data-kind="'+kind+'" data-employee="'+safe(e.id)+'" data-id="'+safe(r.id)+'"','small'):'')+'</div>';
    }).join(''):'<p class="muted micro">No recorded examples yet.</p>';
  }
  function milestoneDetail(e){
    const ten=anniversaryInfo(e),canCareer=isHR()||roleCanHead(e),a=attend(e);
    return '<div class="milestone-profile">'+
      '<div class="milestone-profile-highlights"><div><span class="muted micro">Birthday</span><strong>'+dateLabel(e.birthday)+'</strong><small>'+ (daysToBirthday(e.birthday)===9999?'Not provided':daysToBirthday(e.birthday)+' days until next')+'</small></div>'+
      '<div><span class="muted micro">Hiring date</span><strong>'+dateLabel(e.startDate)+'</strong><small>'+ten.years+' completed service years</small></div>'+
      '<div><span class="muted micro">Next anniversary</span><strong>'+dateLabel(ten.next)+'</strong><small>In '+ten.days+' days</small></div></div>'+
      '<section class="panel"><div class="heading-line"><h3>Promotions & career growth</h3>'+(canCareer?button('Add promotion','milestone-edit','data-kind="promotion" data-employee="'+safe(e.id)+'"','small'):'')+'</div>'+
      recordListHTML(e,'promotion')+'</section>'+
      '<section class="panel"><div class="heading-line"><h3>Perfect attendance recognition</h3>'+(isHR()?button('Add award','milestone-edit','data-kind="perfect" data-employee="'+safe(e.id)+'"','small'):'')+'</div>'+
      '<p class="muted micro" style="margin-bottom:10px">Awards require explicit HR confirmation; sparse attendance entries cannot establish perfect attendance.</p>'+recordListHTML(e,'perfect')+'</section>'+
      '<section class="panel"><div class="heading-line"><h3>Disciplinary actions</h3>'+(isHR()?button('Add case','milestone-edit','data-kind="discipline" data-employee="'+safe(e.id)+'"','small'):'')+'</div>'+
      recordListHTML(e,'discipline')+'</section></div>';
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
    const heads=data.viewers.filter(function(v){return v.role==='head'||v.role==='corp';});
    const hr=data.viewers.filter(function(v){return v.role==='hr';});
    const exec=data.viewers.filter(function(v){return ['ceo','cso','coo'].includes(v.role);});
    return '<div class="overlay center-overlay" data-overlay="role"><section class="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title" tabindex="-1">'+
      '<div class="modal-fixed-head"><div><span class="eyebrow">DEMONSTRATION WORKSPACES</span><h2 id="workspace-modal-title">Choose a workspace</h2><p>Who will be using the prototype?</p></div><button class="modal-close" type="button" data-action="close" aria-label="Close workspace chooser">×</button></div>'+
      '<div class="workspace-modal-scroll">'+roleChoiceGroup('People & Culture','Employee records, onboarding, attendance and HR scoring',hr)+
      roleChoiceGroup('Division evaluators','Evaluate the employees assigned to each department',heads)+
      roleChoiceGroup('Executive observers','Company-wide monitoring · view only',exec)+
      '<p class="modal-footnote">This is a clickable demo, not an actual login system. Employee records and permissions are simulated.</p></div></section></div>';
  }

  function memberPickerModal(){
    const target=div(ui.pickerDivision);
    const employees=data.employees.filter(function(e){return e.division===target.id;});
    return '<div class="overlay center-overlay" data-overlay="picker">'+
    '<section class="workspace-modal member-picker-modal" role="dialog" aria-modal="true" aria-labelledby="member-picker-title" tabindex="-1">'+
    '<div class="modal-fixed-head"><div><span class="eyebrow">EMPLOYEE DIRECTORY</span><h2 id="member-picker-title">Choose a team member</h2><p>Select a department first, then an employee.</p></div><button type="button" class="modal-close" data-action="close" aria-label="Close employee selector">×</button></div>'+
    '<div class="workspace-modal-scroll"><div class="picker-department-buttons" aria-label="Filter employees by department">'+data.divisions.map(function(d){return '<button type="button" class="picker-department '+(d.id===target.id?'active':'')+'" data-action="picker-division" data-division="'+safe(d.id)+'" aria-pressed="'+(d.id===target.id)+'">'+safe(d.short)+'</button>';}).join('')+'</div>'+
    '<div class="picker-list-title"><h3>'+safe(target.name)+'</h3><span class="muted micro">'+employees.length+' employees · demo</span></div>'+
    '<div class="picker-employee-list">'+employees.map(function(e){return '<div class="picker-person">'+avatar(e.name)+'<div class="picker-person-info"><b>'+safe(e.name)+'</b><small>'+safe(e.jobTitle)+' · '+safe(e.id)+'</small></div><span class="picker-person-score">'+score(e).toFixed(1)+'% KPI</span>'+button('Select','pick-member','data-id="'+safe(e.id)+'"','small primary')+'</div>';}).join('')+'</div>'+
    '<p class="modal-footnote">All profiles are fictional. Open an employee preview to inspect their charts or evaluation.</p></div></section></div>';
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
    const editable=roleCanHead(e),hr=isHR(),observer=['ceo','cso','coo'].includes(viewer().role);
    return '<div class="profile-intro"><span class="tag '+(observer?'info':'ok')+'">'+(observer?'View only':hr?'HR assessment tools':editable?'Department evaluator':'View only')+'</span><p>Employee performance, journey and attendance at a glance. Select an action to open the corresponding form.</p></div>'+
    '<div class="employee-charts-grid">'+
      '<section class="chart-card performance-chart"><div class="chart-card-heading"><h3>2026 KPI performance</h3><span class="tag warn">Demo scores</span></div><div class="performance-chart-inner"><div class="score-donut" style="--score:'+overall+'%" role="img" aria-label="Overall KPI score '+overall+' percent"><div><strong>'+overall+'%</strong><small>'+safe(rating(v))+'</small></div></div><div class="score-breakdown">'+dimensions.map(function(x){return '<div class="score-breakdown-row"><div class="score-label"><span>'+safe(x[0])+' <small>· '+x[2]+'%</small></span><b>'+Number(x[1]).toFixed(1)+'%</b></div><div class="chart-track"><span class="'+x[3]+'" style="width:'+Math.min(100,Math.max(0,x[1]))+'%"></span></div></div>';}).join('')+'</div></div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>7-stage journey</h3><strong>'+journeyPct(e)+'%</strong></div><div class="stage-preview-bars">'+stageSummary.map(function(x){return '<div class="stage-preview-row" title="'+safe(x.title)+'"><span>'+x.label+'</span><div class="chart-track"><span style="width:'+x.percent+'%"></span></div><b>'+x.percent+'%</b></div>';}).join('')+'</div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>Attendance · recent months</h3><span class="tag info">Verified only</span></div>'+attendanceMicrochart(e)+'<p class="chart-note">'+a.lates+' late arrivals · '+a.absences+' absences · '+a.concerns+' unexcused concerns</p></section>'+
      '<section class="chart-card preview-status"><div class="chart-card-heading"><h3>Onboarding & review</h3></div><div class="preview-check"><span>Welcome Maddie Kit</span><strong>'+kitPct(e)+'% complete</strong></div>'+progress(kitPct(e))+'<div class="preview-check"><span>Division evaluation</span>'+pill(reviewStatus(e,'division'))+'</div><div class="preview-check"><span>Executive review</span>'+pill(reviewStatus(e,'coo'))+'</div></section>'+
    '</div><div class="profile-actions"><span class="eyebrow">OPEN EMPLOYEE SCREEN</span><div class="profile-action-buttons">'+
    button(hr?'HR / KPI scoring':editable?'Evaluate KPI':'View KPI','detail','data-tab="kpi"','primary')+
    button('Journey checklist','detail','data-tab="journey"','')+
    button('Welcome Kit','detail','data-tab="kit"','')+
    button('Attendance','detail','data-tab="attendance"','')+
    button('Review status','detail','data-tab="approvals"','')+
    button(hr?'Edit profile':'Profile details','detail','data-tab="info"','')+
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
    (t==='info'?'<div class="panel" style="margin-bottom:15px"><div class="form-grid"><div><span class="field-label">Start date</span><strong>'+dateLabel(e.startDate)+'</strong></div><div><span class="field-label">Employee ID</span><strong>'+safe(e.id)+'</strong></div></div></div>':'')+
    detailContent(e,t)+'</div></section></div>';
  }
  function render(){const views={overview:overview,divisions:divisionsView,division:divisionView,employees:employees,milestones:milestonesView,journey:journey,kit:kitView,attendance:attendanceView,kpi:kpiView,approvals:approvalsView,audit:activity};$('app').innerHTML='<div class="layout '+(ui.mobile?'menu-open':'')+'">'+sidebar()+'<main class="main">'+topnav()+(views[ui.tab]||overview)()+'<footer class="footer"><span>Maddie Journey · Prototype v1.5</span><span>51 fictional employees · Local browser storage · No live integrations</span></footer></main></div>'+(ui.roleModal?workspaceModal():ui.divisionModal?divisionPickerModal():ui.employeePicker?memberPickerModal():ui.employeeModalOpen?employeeModal():'');document.title=title(ui.tab)+' · Maddie Journey';if(ui.employeeModalOpen||ui.roleModal||ui.divisionModal||ui.employeePicker){const modal=$('app').querySelector('[role="dialog"]');if(modal&&typeof modal.focus==='function')modal.focus({preventScroll:true});}}
  function openDivision(id){if(!data.divisions.some(function(d){return d.id===id;}))return;ui.scope=id;ui.activeDivision=id;ensureEmployeeScope();persist();ui.tab='division';ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.mobile=false;ui.query='';ui.division='all';if(location.hash!=='#division/'+id)location.hash='#division/'+id;window.scrollTo({top:0,behavior:'instant'});render();}
  function navigate(tab){if(tab==='division'){openDivision(ui.activeDivision);return;}ui.scope='all';ensureEmployeeScope();ui.tab=tab;ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.mobile=false;ui.query='';ui.division='all';if(location.hash!=='#'+tab)location.hash='#'+tab;window.scrollTo({top:0,behavior:'instant'});render();}
  function invalidateEvaluation(e){
    const changed=['division','corp','cso','coo'].some(function(k){return e.review[k].status!=='Pending';})||e.approvedPct>0||!!e.effectiveDate;
    if(!changed)return;
    ['division','corp','cso','coo'].forEach(function(k){e.review[k]={status:'Pending',comment:'',at:''};});
    e.approvedPct=0;e.effectiveDate='';
    toast('Evaluation changed: previous review endorsements were reset.');
  }
  function changeField(el){const e=emp(),field=el.dataset.field;if(!e||!field)return;const val=el.value;
    if(field.indexOf('profile.')===0){if(!isHR())return;const k=field.slice(8);if(!['name','jobTitle','email','startDate','birthday','division'].includes(k))return;if((k==='name'||k==='jobTitle')&&!val.trim()){toast('This field cannot be empty.');render();return;}if(k==='division'&&!data.divisions.some(function(d){return d.id===val;}))return;e[k]=val.slice(0,150);if(k==='division')invalidateEvaluation(e);audit(e,'Updated employee '+k);}
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
  function action(name,button){const e=emp();if(name==='mobile'){ui.mobile=!ui.mobile;render();return;}
    if(name==='set-theme'){setTheme(button.dataset.themeValue);return;}
    if(name==='choose-workspace'){ui.roleModal=true;ui.divisionModal=false;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='select-viewer'){if(!data.viewers.some(function(v){return v.id===button.dataset.id;}))return;ui.viewer=button.dataset.id;ui.milestoneDivision='all';ui.scope='all';ensureEmployeeScope();ui.roleModal=false;ui.divisionModal=false;ui.employeeModalOpen=false;persist();navigate('overview');toast('Workspace: '+viewer().name);return;}
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
    if(name==='close'){ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;ui.milestonePicking=false;render();return;}
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
  document.addEventListener('click',function(ev){const dept=ev.target.closest('[data-nav-division]');if(dept){ev.preventDefault();openDivision(dept.dataset.navDivision);return;}const nav=ev.target.closest('[data-nav]');if(nav){ev.preventDefault();navigate(nav.dataset.nav);return;}const act=ev.target.closest('[data-action]');if(act){ev.preventDefault();action(act.dataset.action,act);return;}if(['employee','role','division','picker'].includes(ev.target.dataset.overlay)){ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;render();}});
  document.addEventListener('change',function(ev){const el=ev.target;if(el.dataset.ui){if(el.dataset.ui==='viewer'){ui.viewer=el.value;persist();render();toast('Preview role: '+viewer().name);}else if(el.dataset.ui==='employee'){ui.employee=el.value;render();}else if(el.dataset.ui==='division'){ui.division=el.value;render();}else if(el.dataset.ui==='activeDivision'){openDivision(el.value);}else if(el.dataset.ui==='frequency'){ui.frequency=el.value;render();}else if(el.dataset.ui==='query'){ui.query=el.value;render();}return;}
    if(el.dataset.stage!==undefined){const e=emp();if(!canTrack(e))return;const s=Number(el.dataset.stage),i=Number(el.dataset.item);if(!e.journey[s]||i>=e.journey[s].length)return;e.journey[s][i]=el.checked;audit(e,(el.checked?'Completed':'Reopened')+' Stage '+(s+1)+': '+data.stages[s].items[i]);render();return;}
    if(el.dataset.kit!==undefined){const e=emp(),i=Number(el.dataset.kit);if(!canTrack(e)||i>=e.kit.length)return;e.kit[i]=el.checked;audit(e,(el.checked?'Completed':'Reopened')+' kit: '+data.kit[i].label);render();return;}
    if(el.dataset.field){changeField(el);return;}
    if(el.id==='import-file'&&el.files&&el.files[0]){const r=new FileReader();r.onload=function(){try{const value=JSON.parse(r.result);if(![3,4,5].includes(value.version)||!Array.isArray(value.employees)||value.employees.length!==51||!Array.isArray(value.divisions)){throw Error('This is not a compatible 51-employee backup.');}if(!confirm('Replace current browser data with this imported backup?'))return;data=upgradeData(value);data.viewers=clone(seed.viewers);data.divisions=clone(seed.divisions);data.stages=clone(seed.stages);data.kit=clone(seed.kit);ui.employee=data.employees[0].id;persist();render();toast('Backup imported successfully.');}catch(err){toast('Import failed: '+err.message);}};r.readAsText(el.files[0]);}
  });
  document.addEventListener('input',function(ev){const el=ev.target;if(el.dataset.ui==='query'){const p=el.selectionStart;ui.query=el.value;const focus=document.activeElement;const list=filtered();const table=$('app').querySelector('.panel.no-pad');if(table){const existing=table.querySelector('.table-wrap, .empty');if(existing)existing.outerHTML=employeesTable(list);const count=table.querySelector('.filters .muted.micro');if(count)count.textContent=list.length+' employees';}if(focus!==el){el.focus();try{el.setSelectionRange(p,p);}catch(err){}}}});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&(ui.employeeModalOpen||ui.roleModal||ui.divisionModal||ui.employeePicker)){ui.employeeModalOpen=false;ui.roleModal=false;ui.divisionModal=false;ui.employeePicker=false;render();}});
  window.addEventListener('hashchange',function(){const target=location.hash.slice(1);if(target.startsWith('division/')){const id=target.slice(9);if(data.divisions.some(function(d){return d.id===id;})&&(ui.tab!=='division'||ui.activeDivision!==id))openDivision(id);}else if(items.some(function(a){return a[0]===target;})&&target!==ui.tab)navigate(target);});
  const hash=location.hash.slice(1);if(hash.startsWith('division/')&&data.divisions.some(function(d){return d.id===hash.slice(9);})) {ui.tab='division';ui.activeDivision=hash.slice(9);ui.scope=ui.activeDivision;ensureEmployeeScope();}else if(items.some(function(a){return a[0]===hash;}))ui.tab=hash;
  render();
})();