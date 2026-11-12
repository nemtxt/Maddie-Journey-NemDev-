/* Maddie Journey · local-first static prototype, no authentication or remote persistence. */
(function () {
  'use strict';
  function showBootError(heading,message){
    const app=document.getElementById('app');
    if(!app)return;
    // Only static application strings; no provider content is interpolated.
    app.innerHTML='<main id="main-content" class="data-error-screen" tabindex="-1">'+
      '<section class="data-error-card" role="alert" aria-labelledby="data-error-title">'+
      '<span class="boot-eyebrow">MADDIE JOURNEY / SAMPLE WORKSPACE</span>'+
      '<h1 id="data-error-title">'+heading+'</h1><p>'+message+'</p>'+
      '<a class="button primary" href="./">Reload dashboard</a>'+
      '<p class="data-error-footnote">No live employee data was accessed or modified.</p>'+
      '</section></main>';
    document.title='Sample unavailable · Maddie Journey';
  }
  const seed = window.MJ_SEED;
  if (!seed) {
    showBootError('Sample data unavailable','The fictional records did not load. Reload the sample workspace to try again.');
    return;
  }
  // Read-only UI: data comes exclusively from the immutable fictional fixture.
  // Previous local demo edits are intentionally ignored, never deleted or overwritten.
  const $=function(id){return document.getElementById(id);};
  const clone=function(x){return JSON.parse(JSON.stringify(x));};
  // All views use one read-only source adapter. Live integrations are not loaded on GitHub Pages.
  let data;
  try{
    data=window.MJ_SOURCE_ADAPTER.getSnapshot();
  }catch(err){
    showBootError('Sample data unavailable',
      'The fictional monitoring snapshot could not be verified. No provider connection is required.');
    return;
  }
  let ui={tab:'welcome',division:'all',activeDivision:'rmd',scope:'all',divisionPickerMode:'view',query:'',employeeSort:'name',employee:data.employees[0].id,detail:'preview',employeeModalOpen:false,divisionModal:false,employeePicker:false,pickerDivision:'rmd',frequency:'monthly',mobile:false,milestoneCategory:'birthday',milestoneDivision:'all',milestoneShowAll:false,milestonePicking:false,divisionTab:'summary',attentionFilter:'all',attentionShowAll:false,workView:'list',journeyView:'board',journeyShowAll:false,sidebarCollapsed:false,highlightMember:'',viewerIds:[],viewerOrigin:'',};
  // UI preferences do not alter or store employee records.
  try{
    const remembered=sessionStorage.getItem('maddie-journey-workview');
    if(remembered==='board'||remembered==='list')ui.workView=remembered;
    ui.sidebarCollapsed=localStorage.getItem('maddie-journey-sidebar-collapsed')==='true';
  }catch(err){}
  // Return focus to the action that opened a dialog after its view is dismissed.
  let modalOrigin=null;
  function rememberModalOrigin(element){
    if(!element||!element.dataset)return;
    modalOrigin={action:element.dataset.action,id:element.dataset.id||'',division:element.dataset.division||''};
  }
  function restoreModalOrigin(){
    const origin=modalOrigin;modalOrigin=null;
    if(!origin)return;
    const candidates=Array.from(document.querySelectorAll('[data-action]'));
    const original=candidates.find(function(node){return node.dataset.action===origin.action&&
      (!origin.id||node.dataset.id===origin.id)&&(!origin.division||node.dataset.division===origin.division);});
    const fallback=document.querySelector('[data-action="quick-search"]');
    const target=original||fallback;
    if(target&&typeof target.focus==='function')target.focus({preventScroll:true});
  }
  const now=function(){return new Date().toISOString().slice(0,10);};
  const safe=function(v){return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  const money=function(n){return '₱'+(Number(n)||0).toLocaleString('en-PH',{maximumFractionDigits:2,minimumFractionDigits:2});};
  const emp=function(id){return data.employees.find(function(e){return e.id===(id||ui.employee);});};
  const div=function(id){return data.divisions.find(function(d){return d.id===id;})||{name:id,short:id,evaluators:[]};};
  const scopedEmployees=function(){return ui.scope==='all'?data.employees:data.employees.filter(function(e){return e.division===ui.scope;});};
  const scopeLabel=function(){return ui.scope==='all'?'All 8 divisions':div(ui.scope).name;};
  function ensureEmployeeScope(){
    const es=scopedEmployees();
    if(es.length&&!es.some(function(e){return e.id===ui.employee;}))ui.employee=es[0].id;
    return es;
  }
  // No source editing, endorsements or employee data submission is permitted.
  const dateLabel=function(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d.getTime())?safe(v):d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});};
  const escVal=function(v){return safe(v);};
  // Filters and view preferences never change employee fixtures.
  function toast(msg){let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}t.textContent=msg;setTimeout(function(){if(t.textContent===msg)t.remove();},3800);}
  function journeyPct(e){const bits=e.journey.flat();return Math.round(bits.filter(Boolean).length/Math.max(1,bits.length)*100);}
  function kitPct(e){return Math.round(e.kit.filter(Boolean).length/Math.max(1,e.kit.length)*100);}
  const KPI_WEIGHTS=[
    {key:'division',name:'Division objectives',weight:15},
    {key:'individual',name:'Individual objectives',weight:45},
    {key:'values',name:'Values alignment',weight:15},
    {key:'behavior',name:'Job behavior',weight:25}
  ];
  function kpiComponents(e){
    return KPI_WEIGHTS.map(function(part){
      const raw=Number(e.scores[part.key])||0;
      return {key:part.key,name:part.name,weight:part.weight,raw:raw,points:raw*part.weight/100};
    });
  }
  function score(e){return Math.round(kpiComponents(e).reduce(function(n,p){return n+p.points;},0)*100)/100;}
  function rating(v){return v>=95?'Excellent':v>=90?'Above Average':v>=80?'Average':v>=70?'Below Average':'Poor';}
  function attend(e){const a=e.attendance.filter(function(r){return r.verified;});const l=a.filter(function(r){return r.type==='Late';});const ab=a.filter(function(r){return r.type==='Absent';});const concerns=a.filter(function(r){return (r.type==='Late'&&r.approval!=='Excused')||(r.type==='Absent'&&r.approval==='Unapproved');});return {lates:l.length,absences:ab.length,concerns:concerns.length,lastLate:l.map(function(x){return x.date;}).sort().reverse()[0]||'',lastAbs:ab.map(function(x){return x.date;}).sort().reverse()[0]||'',records:a,clean:l.length===0&&ab.length===0};}
  const totalAvg=function(fn){return Math.round(data.employees.reduce(function(a,e){return a+fn(e);},0)/data.employees.length);};
  function approvedCount(){return data.employees.filter(function(e){return e.review.coo.status==='Approved';}).length;}
  function pendingCount(){return data.employees.filter(function(e){return e.review.coo.status!=='Approved';}).length;}
  const initials=function(str){return String(str).split(/\s+/).filter(Boolean).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase();};
  const avatar=function(str){return '<span class="avatar" aria-hidden="true">'+safe(initials(str))+'</span>';};
  const pill=function(status){const t=String(status||'Pending');const cls=['Approved','Endorsed','Complete','Verified','Excellent'].includes(t)?'ok':['Returned','Rejected','Unapproved'].includes(t)?'bad':['Pending','Draft'].includes(t)?'warn':'info';return '<span class="tag '+cls+'">'+safe(t)+'</span>';};
  const button=function(label,action,attributes,cls){return '<button type="button" class="button '+(cls||'')+'" data-action="'+action+'" '+(attributes||'')+'>'+label+'</button>';};
  // Selects only change how snapshots are presented; no source records are written.
  function opts(options,value){return options.map(function(item){return '<option value="'+safe(item.value)+'" '+(item.value===value?'selected':'')+'>'+safe(item.label)+'</option>';}).join('');}
  function linkedEmployee(e){return '<button class="link-btn" data-action="open" data-id="'+safe(e.id)+'">'+safe(e.name)+'</button>';}
  function progress(val){return '<div class="progress"><span style="width:'+Math.max(0,Math.min(100,val))+'%"></span></div>';}
  function currentTheme(){return document.documentElement&&document.documentElement.dataset.theme==='light'?'light':'dark';}
  function themeControl(){
    const t=currentTheme();
    return '<div class="theme-control" role="group" aria-label="Appearance — choose light or dark mode">'+
      '<button type="button" class="theme-choice'+(t==='light'?' active':'')+'" data-action="set-theme" data-theme-value="light" aria-pressed="'+(t==='light')+'" aria-label="Use light appearance"><span class="theme-icon" aria-hidden="true">' + landingIcon('sun') + '</span><span>Light</span></button>'+
      '<button type="button" class="theme-choice'+(t==='dark'?' active':'')+'" data-action="set-theme" data-theme-value="dark" aria-pressed="'+(t==='dark')+'" aria-label="Use dark appearance"><span class="theme-icon" aria-hidden="true">' + landingIcon('moon') + '</span><span>Dark</span></button>'+
      '</div>';
  }
  function setTheme(next){
    if(!['light','dark'].includes(next))return;
    document.documentElement.dataset.theme=next;
    try{localStorage.setItem('maddie-journey-theme',next);}catch(err){}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',next==='dark'?'#090909':'#ffffff');
    document.querySelectorAll('[data-action="set-theme"]').forEach(function(el){
      const pressed=el.dataset.themeValue===next;
      el.setAttribute('aria-pressed',String(pressed));
      el.classList.toggle('active',pressed);
    });
  }
  const navGroups=[
    {id:'dashboard',label:'Dashboard',icon:'grid',defaultTab:'overview',tabs:[['overview','Overview'],['divisions','Divisions']]},
    {id:'people',label:'People',icon:'users',defaultTab:'employees',tabs:[['employees','Directory'],['milestones','Milestones']]},
    {id:'journeys',label:'Journey',icon:'list',defaultTab:'journey',tabs:[['journey','Journey board'],['kit','Welcome Kit'],['attendance','Attendance']]},
    {id:'performance',label:'Performance',icon:'chart',defaultTab:'kpi',tabs:[['kpi','KPI scorecards'],['approvals','Reviews']]},
    {id:'information',label:'Data & Sources',icon:'database',defaultTab:'sources',tabs:[['sources','Data sources'],['audit','About the prototype']]}
  ];
  function activeNavGroup(){
    return navGroups.find(function(g){return g.tabs.some(function(t){return t[0]===ui.tab||(ui.tab==='division'&&t[0]==='divisions');});})||navGroups[0];
  }
  function topnav(){
    const group=activeNavGroup(),current=ui.tab==='division'?'divisions':ui.tab;
    return '<div class="mobile-top"><a href="#welcome" data-nav="welcome" class="brand mobile-brand" aria-label="Maddie Journey landing">'+
      '<span class="mobile-wordmark"><span class="wordmark-monogram" aria-hidden="true">M</span><b>Maddie Journey</b></span></a>'+
      '<button type="button" class="button small" data-action="mobile" aria-controls="primary-navigation" aria-label="'+(ui.mobile?'Close':'Open')+' navigation" aria-expanded="'+ui.mobile+'">'+landingIcon('menu')+'<span>'+(ui.mobile?'Close':'Menu')+'</span></button></div>'+
      '<header class="topbar workspace-topbar">'+
      '<button type="button" class="sidebar-toggle" data-action="toggle-sidebar" aria-controls="primary-navigation" aria-label="'+(ui.sidebarCollapsed?'Expand':'Collapse')+' sidebar" title="'+(ui.sidebarCollapsed?'Expand':'Collapse')+' sidebar" aria-expanded="'+(!ui.sidebarCollapsed)+'">'+landingIcon('panel')+'</button>'+
      '<div class="workspace-location"><span class="workspace-location-prefix">'+safe(group.label)+'</span>'+
      '<span class="workspace-location-sep">/</span><strong>'+safe(title(ui.tab))+'</strong></div>'+
      '<div class="top-actions workspace-top-actions">'+
      '<button type="button" class="workspace-search" data-action="quick-search" aria-label="Find an employee" title="Search employees · Ctrl/Command + K">'+landingIcon('search')+'<span>Find employee</span></button>'+
      themeControl()+
      '<button type="button" class="reader-source-status" data-action="nav" data-tab="sources" title="Inspect disconnected source providers" aria-label="View source status: fictional sample, no providers connected">Sample · Not connected</button>'+
      '</div></header>'+
      '<nav class="workspace-subnav" aria-label="'+safe(group.label)+' sections"><div class="workspace-subnav-links">'+
      group.tabs.map(function(t){const selected=current===t[0];return '<a href="#'+t[0]+'" data-nav="'+t[0]+'"'+(selected?' aria-current="page"':'')+' class="'+(selected?'active':'')+'">'+safe(t[1])+'</a>';}).join('')+
      '</div></nav>';
  }
  const items=[['overview','◫','Overview'],['divisions','▦','Divisions'],['employees','◎','Employees'],['milestones','✦','Milestones'],['journey','◷','Journey board'],['kit','▣','Welcome Kit'],['attendance','◩','Attendance'],['kpi','◈','KPI scorecards'],['approvals','✓','Reviews'],['sources','↗','Data sources'],['audit','≡','About data']];
  function sidebar(){
    const active=activeNavGroup().id;
    return '<aside class="sidebar workspace-sidebar"'+(ui.mobile?' role="dialog" aria-modal="true" aria-label="Workspace navigation"':' aria-label="Main navigation"')+'><div class="workspace-sidepanel">'+
  '<button type="button" class="mobile-drawer-close" data-action="mobile" aria-label="Close navigation menu">Close menu <span aria-hidden="true">×</span></button>'+
      '<a href="#welcome" data-nav="welcome" class="brand brand-official-link" aria-label="Maddie Journey landing" title="Maddie Journey landing">'+
      '<span class="sidebar-brand-mini" aria-hidden="true">M</span>'+
      '<span class="brand-product-name">Maddie Journey<small class="brand-product-subtitle">MONITORING</small></span></a>'+

      '<nav id="primary-navigation" class="nav workspace-mainnav" aria-label="Workspace sections">'+navGroups.map(function(g){
        return '<a href="#'+g.defaultTab+'" data-nav="'+g.defaultTab+'" aria-label="'+safe(g.label)+'" title="'+safe(g.label)+'" class="workspace-mainnav-item '+(g.id===active?'active':'')+'"'+
        (g.id===active?' aria-current="location"':'')+'><span class="nav-icon" aria-hidden="true">'+landingIcon(g.icon)+'</span>'+
        '<span class="workspace-mainnav-label">'+safe(g.label)+'</span>'+
        '<span class="workspace-mainnav-chevron" aria-hidden="true">›</span></a>';
      }).join('')+'</nav>'+
      '<div class="sidebar-bottom"><div class="reader-sidebar-status"><span class="data-provenance-dot"></span>'+
      '<div><strong>Sample workspace</strong><small>51 people · 8 divisions</small></div></div>'+
      '</div></div></aside>';
  }
  function title(t){if(t==='division')return div(ui.activeDivision).name;return {divisions:'Divisions',overview:'Overview',milestones:'Employee milestones',employees:'People directory',journey:'Employee journey',kit:'Welcome Maddie Kit',attendance:'Attendance analytics',kpi:'2026 KPI evaluations',approvals:'Reviews',sources:'Data sources',audit:'About this prototype'}[t]||'Overview';}
  function header(eyebrow,heading,description,actions){return '<div class="page-header"><div><div class="eyebrow">'+safe(eyebrow)+'</div><h1>'+safe(heading)+'</h1><p>'+safe(description)+'</p></div><div class="actions">'+(actions||'')+'</div></div>'+(ui.tab==='overview'?'':screenSummary());}

  /* Summaries use the same calculated sample records displayed in each screen. */
  function meanOf(list,calculate){return list.length?Math.round(list.reduce(function(n,e){return n+calculate(e);},0)/list.length):0;}
  function metricCard(label,value,note){return '<div class="metric"><div class="metric-label">'+safe(label)+'<span class="metric-icon">◇</span></div><strong>'+safe(value)+'</strong><div class="metric-sub">'+safe(note)+'</div></div>';}
  function screenSummary(){
    const all=ui.tab==='milestones'?filteredMilestoneTeam():ui.tab==='divisions'?data.employees:scopedEmployees();
    const team=ui.tab==='division'?data.employees.filter(function(e){return e.division===ui.activeDivision;}):all;
    let cards=[];
    if(ui.tab==='division'){
      cards=[['Division members',team.length,'Fictional employee records'],['Average KPI score',meanOf(team,score).toString()+'%','Demonstration figures only'],['Journey completion',meanOf(team,journeyPct)+'%','All 7 onboarding stages'],['Recorded endorsements',team.filter(function(e){return reviewStatus(e,'division')==='Endorsed';}).length,'Sample division reviews']];
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
      cards=[['Connected sources',0,'No live integrations configured'],['Demo employees',data.employees.length,'Fictional sample fixture'],['External sync','Off','Not available on GitHub Pages alone'],['Verified source records',0,'Awaiting secure integration']];
    }else if(ui.tab==='audit'){
      cards=[['Sample employees',data.employees.length,'Fictional roster'],['Divisions',data.divisions.length,'Department summaries'],['Data submission','Disabled','Monitoring only'],['Live source sync','Not connected','Secure integration required']];
    }
    return cards.length?'<section class="screen-summary" aria-label="'+safe(title(ui.tab))+' summary"><div class="summary-heading"><span class="eyebrow">SCREEN SUMMARY</span><span class="muted micro">Calculated from sample data</span></div><div class="grid metrics">'+cards.map(function(c){return metricCard(c[0],c[1],c[2]);}).join('')+'</div></section>':'';
  }
  function divisionEvaluatorNames(d){return d.evaluators.map(function(id){const v=data.viewers.find(function(p){return p.id===id;});return v?v.name:id;}).join(' / ');}
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
    // Follow-ups share the overview's priority weighting and always select distinct people.
    const seen=new Set();
    const attention=attentionItems(team).filter(function(item){
      if(seen.has(item.e.id))return false;
      seen.add(item.e.id);return true;
    }).slice(0,4);
    const kitPending=team.filter(function(e){return kitPct(e)<100;}).length;
    const reviews=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
    return '<div class="division-overview-grid"><section class="panel division-next"><div class="panel-head"><div><h2>Follow-up snapshot</h2><p>Highest-priority recorded signal per person · direct employee detail</p></div></div>'+
      '<div class="quick-list">'+(attention.length?attention.map(function(item){
        const cue=attentionCue(item);
        return '<div class="quick-item">'+avatar(item.e.name)+
          '<div class="grow"><b>'+safe(item.e.name)+'</b><p><span class="monitor-priority-cue monitor-priority-'+cue.kind+'">'+cue.label+'</span> '+safe(item.label)+'</p></div>'+
          button('Inspect','open','data-id="'+safe(item.e.id)+'" data-detail="'+item.detail+'"','small')+'</div>';
      }).join(''):'<p class="muted micro">No recorded sample follow-ups for this division.</p>')+'</div></section>'+
      '<section class="panel division-quick"><h2>Department at a glance</h2>'+
      '<div class="division-stat-line"><span>Employees</span><b>'+team.length+'</b></div>'+
      '<div class="division-stat-line"><span>Open Welcome Kits</span><b>'+kitPending+'</b></div>'+
      '<div class="division-stat-line"><span>Awaiting evaluation</span><b>'+reviews+'</b></div>'+
      '<div class="division-stat-line"><span>Average onboarding</span><b>'+meanOf(team,journeyPct)+'%</b></div>'+
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
    const sorted=data.divisions.slice();
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
      '<tbody>'+order.map(function(e){const stage=divisionStage(e);return '<tr'+(ui.highlightMember===e.id?' class="department-focus-row" aria-label="Employee selected from preview"':'')+'><td><div class="name-cell">'+avatar(e.name)+'<div><strong>'+safe(e.name)+'</strong><small>'+safe(e.jobTitle)+'</small></div></div></td>'+
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
      chart:orgChart(d)
    };
    return header('DIVISION OVERVIEW',d.name,team.length+' sample employees · '+divisionEvaluatorNames(d),'')+
      '<nav class="division-tabs" aria-label="Division views">'+divisionTabButton('summary','Summary')+divisionTabButton('board','Board')+divisionTabButton('list','List')+divisionTabButton('chart','Org chart')+'</nav>'+
      (sub[ui.divisionTab]||sub.summary);
  }

  function metrics(){
    const staff=scopedEmployees(),n=staff.length,done=staff.filter(function(e){return reviewStatus(e,'coo')==='Approved';}).length;
    return '<div class="grid metrics">'+metricCard('Team members',n,scopeLabel()+' · demo')+
      metricCard('Journey completion',meanOf(staff,journeyPct)+'%','All 7 onboarding stages')+
      metricCard('Welcome Kit ready',meanOf(staff,kitPct)+'%','Equipment, tools and access')+
      metricCard('Final approvals',done+' / '+n,(n-done)+' pending or in progress')+'</div>';
  }

  function attentionItems(team){
    const items=[];
    const create=function(e,group,label,detail,weight){
      items.push({e:e,group:group,label:label,detail:detail,weight:weight});
    };
    team.forEach(function(e){
      const a=attend(e),pending=e.attendance.filter(function(r){return !r.verified;}).length;
      if(a.concerns>0)create(e,'attendance',a.concerns+' verified attendance concern'+(a.concerns===1?'':'s'),'attendance',100+a.concerns);
      if(pending>0)create(e,'attendance',pending+' attendance entr'+(pending===1?'y':'ies')+' awaiting verification','attendance',94+pending);
      if(!e.kpiValidated)create(e,'kpi','KPI source not validated','kpi',80);
      if(reviewStatus(e,'division')!=='Endorsed')create(e,'reviews','Division evaluation pending','approvals',72);
      if(kitPct(e)<100)create(e,'onboarding','Welcome Kit '+kitPct(e)+'% complete','kit',58+(100-kitPct(e))/100);
      if(journeyPct(e)<100)create(e,'onboarding','Journey '+journeyPct(e)+'% complete','journey',46+(100-journeyPct(e))/100);
    });
    return items.sort(function(a,b){return b.weight-a.weight||a.e.name.localeCompare(b.e.name);});
  }
  function attentionCue(item){
    if(item.weight>=94)return {label:'Check',kind:'check'};
    if(item.weight>=80)return {label:'Validate',kind:'validate'};
    if(item.weight>=72)return {label:'Review',kind:'review'};
    return {label:'In progress',kind:'progress'};
  }
  function attentionPanel(team){
    const all=attentionItems(team);
    // Distinct people are the unit of triage; raw signals remain available by category.
    const uniquePeople=function(items){
      const seen=new Set();
      return items.filter(function(item){
        if(seen.has(item.e.id))return false;
        seen.add(item.e.id);return true;
      });
    };
    const categories=[['all','All'],['attendance','Attendance'],['kpi','KPI'],['onboarding','Onboarding'],['reviews','Reviews']];
    const active=categories.some(function(x){return x[0]===ui.attentionFilter;})?ui.attentionFilter:'all';
    const relevant=active==='all'?all:all.filter(function(x){return x.group===active;});
    const rows=uniquePeople(relevant);
    const perPerson=new Map();
    relevant.forEach(function(item){perPerson.set(item.e.id,(perPerson.get(item.e.id)||0)+1);});
    const listLimit=ui.attentionShowAll?rows.length:8;
    const boardLimit=ui.attentionShowAll?all.length:4;
    const tabs='<div class="workspace-view-switch" role="group" aria-label="Choose tracker view">'+
      ['list','board'].map(function(mode){return '<button type="button" data-action="work-view" data-mode="'+mode+'" aria-pressed="'+(ui.workView===mode)+'" class="'+(ui.workView===mode?'active':'')+'">'+landingIcon(mode==='board'?'grid':'list')+(mode==='board'?'Board':'List')+'</button>';}).join('')+'</div>';
    const list='<div class="work-list-table"><div class="work-list-head"><span>Employee</span><span>Follow-up</span><span>Department</span><span></span></div>'+
      (rows.length?rows.slice(0,listLimit).map(function(item){
        const cue=attentionCue(item),extra=(perPerson.get(item.e.id)||1)-1;
        return '<div class="work-list-row">'+
          '<div class="work-list-person">'+avatar(item.e.name)+'<div><strong>'+safe(item.e.name)+'</strong><small>'+safe(item.e.jobTitle)+'</small></div></div>'+
          '<div class="work-list-subject"><span class="monitor-priority-cue monitor-priority-'+cue.kind+'">'+cue.label+'</span>'+
          '<span class="monitor-signal-text">'+safe(item.label)+
          (extra?'<small>+'+extra+' other '+(extra===1?'signal':'signals')+' for this person</small>':'')+'</span></div>'+
          '<span class="work-list-division">'+safe(div(item.e.division).short)+'</span>'+button('Open','open','data-id="'+safe(item.e.id)+'" data-detail="'+item.detail+'"','small')+'</div>';
      }).join(''):'<p class="empty">No sample follow-ups in this category.</p>')+'</div>';
    const groups=categories.slice(1).filter(function(c){return active==='all'||active===c[0];});
    const board='<div class="work-board" role="group" aria-label="Follow-up categories">'+groups.map(function(c){
      const subset=uniquePeople(relevant.filter(function(x){return x.group===c[0];})),shown=subset.slice(0,boardLimit);
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
    const boardTotal=groups.reduce(function(n,c){
      return n+uniquePeople(relevant.filter(function(x){return x.group===c[0];})).length;
    },0);
    const visibleTotal=ui.workView==='board'?boardTotal:rows.length;
    const collapsedLimit=ui.workView==='board'?groups.length*4:8;
    return '<section class="panel work-queue"><div class="panel-head"><div><h2>Needs attention</h2>'+
      '<p>Highest-priority recorded signal per person. Switch categories to inspect other sample follow-ups.</p></div>'+
      '<div class="work-queue-tools"><span class="queue-count" aria-live="polite">'+rows.length+' people · '+relevant.length+' signals</span>'+tabs+'</div></div>'+
      '<div class="queue-filters" role="group" aria-label="Filter follow-ups">'+categories.map(function(c){
        const count=c[0]==='all'?uniquePeople(all).length:uniquePeople(all.filter(function(x){return x.group===c[0];})).length;
        return '<button type="button" data-action="attention-filter" data-kind="'+c[0]+'" class="queue-filter'+(active===c[0]?' active':'')+'" aria-pressed="'+(active===c[0])+'">'+c[1]+' <span>'+count+'</span></button>';
      }).join('')+'</div>'+(ui.workView==='board'?board:list)+
      (visibleTotal>collapsedLimit?'<div class="queue-footer">'+button(ui.attentionShowAll?'Show fewer':'Show all '+visibleTotal,'attention-more','','small')+'</div>':'')+'</section>';
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
      '<div><strong>Sample data</strong><span>Fictional sample snapshot · No live Airtable or Google sync</span></div>'+
      button('Source details','nav','data-tab="sources"','small')+'</div>';
  }
  // One comparative row per division; avoid eight competing cards and duplicate CTAs.
  // All values are computed from the exact employees seen in the division workspace.
  function overviewDivisionRail(){
    const columns=['Division','People','Journey avg','Kit avg','KPI avg','Reviews open','People w/ concerns',''];
    const rows=data.divisions.map(function(d){
      const team=data.employees.filter(function(e){return e.division===d.id;});
      const journey=meanOf(team,journeyPct),kit=meanOf(team,kitPct),kpi=meanOf(team,score);
      const reviews=team.filter(function(e){return reviewStatus(e,'division')!=='Endorsed';}).length;
      const concerns=team.filter(function(e){return attend(e).concerns>0;}).length;
      const detail='Open '+d.name+': '+team.length+' people, Journey '+journey+
        '%, Welcome Kit '+kit+'%, weighted KPI mean '+kpi+'%, '+reviews+
        ' division reviews open of '+team.length+', '+concerns+' people with verified attendance concerns out of '+team.length;
      return '<button type="button" class="monitor-division-row" data-action="goto-division"'+
        ' data-division="'+safe(d.id)+'" aria-label="'+safe(detail)+'">'+
        '<span class="monitor-division-identity"><span class="monitor-division-code">'+safe(d.short)+'</span>'+
          '<strong>'+safe(d.name)+'</strong></span>'+
        '<span class="monitor-division-cell monitor-division-people" data-label="People"><b>'+team.length+'</b></span>'+
        '<span class="monitor-division-cell monitor-division-journey" data-label="Journey"><b>'+journey+'%</b>'+
          '<span class="monitor-mini-track" aria-hidden="true"><span style="width:'+journey+'%"></span></span></span>'+
        '<span class="monitor-division-cell monitor-division-kit" data-label="Kit avg"><b>'+kit+'%</b></span>'+
        '<span class="monitor-division-cell monitor-division-kpi" data-label="KPI avg"><b>'+kpi+'%</b></span>'+
        '<span class="monitor-division-cell monitor-division-reviews" data-label="Reviews open"><b>'+reviews+' / '+team.length+'</b></span>'+
        '<span class="monitor-division-cell monitor-division-concerns" data-label="People w/ concerns"><b>'+concerns+' / '+team.length+'</b></span>'+
        '<span class="monitor-division-arrow" aria-hidden="true">↗</span></button>';
    });
    return '<section class="overview-spotlight monitor-division-section"><div class="overview-section-heading">'+
      '<div><h2>Division comparison</h2><p>Eight divisions · arithmetic means and per-division people counts</p></div></div>'+
      '<div class="overview-division-rail monitor-division-matrix" aria-label="Division monitoring comparison">'+
      '<div class="monitor-division-head" aria-hidden="true">'+columns.map(function(x){return '<span>'+safe(x)+'</span>';}).join('')+'</div>'+
      '<div class="monitor-division-list">'+rows.join('')+'</div></div>'+
      '<p class="report-source-note">Journey, Kit and KPI values are averages of employee percentages, not combined task totals. Reviews open = Division Head status other than Endorsed. Attendance concerns count affected people, not incidents. Official KPI data is disconnected.</p></section>';
  }
  function overviewStagePanel(){
    const staff=data.employees,stages=data.stages.map(function(stage,i){
      return {name:stage.name,count:staff.filter(function(e){return journeyStage(e)===i;}).length,index:i};
    });
    stages.push({name:'Completed',count:staff.filter(function(e){return journeyStage(e)===7;}).length,index:7});
    const denominator=Math.max(1,staff.length);
    return '<section class="panel overview-insight-panel"><div class="panel-head"><div><h2>Journey by stage</h2>'+
      '<p>First incomplete stage · share of '+staff.length+' fictional employees</p></div>'+
      button('Open Kanban','nav','data-tab="journey"','small')+'</div>'+
      '<div class="overview-stage-rows">'+stages.map(function(stage){
        return '<div class="overview-stage-row"><span title="'+safe(stage.name)+'">'+safe(stage.name)+'</span>'+
          '<div class="overview-stage-track" role="img" aria-label="'+stage.count+' of '+staff.length+' people at '+safe(stage.name)+'"><span style="width:'+(stage.count/denominator*100)+'%"></span></div>'+
          '<b>'+stage.count+' / '+staff.length+'</b></div>';
      }).join('')+'</div></section>';
  }
  function overviewMilestonesPanel(){
    const events=[];
    data.employees.forEach(function(e){
      const days=daysToBirthday(e.birthday);
      if(days<91)events.push({e:e,kind:'Birthday',days:days});
      const anniversary=anniversaryInfo(e);
      if(anniversary.days<91)events.push({e:e,kind:'Service anniversary',days:anniversary.days});
    });
    events.sort(function(a,b){return a.days-b.days||a.e.name.localeCompare(b.e.name);});
    return '<section class="panel overview-insight-panel"><div class="panel-head"><div><h2>Upcoming milestones</h2>'+
      '<p>Next 90 days · sample birthdays and service anniversaries</p></div>'+
      button('All milestones','nav','data-tab="milestones"','small')+'</div>'+
      '<div class="overview-milestone-list">'+
      (events.length?events.slice(0,5).map(function(item){
        return '<button type="button" class="overview-milestone-row" data-action="open" data-id="'+safe(item.e.id)+'" data-detail="milestones">'+
          avatar(item.e.name)+'<span class="overview-milestone-person"><strong>'+safe(item.e.name)+'</strong>'+
          '<small>'+safe(div(item.e.division).short)+' · '+item.kind+'</small></span>'+
          '<span class="overview-milestone-when">'+(item.days===0?'Today':'In '+item.days+' days')+'</span></button>';
      }).join(''):'<p class="empty">No upcoming sample milestones in the next 90 days.</p>')+
      '</div></section>';
  }
  // Only a computed snapshot. This must never imply real-time or authenticated HR data.
  function monitorPulse(staff){
    const verified=staff.filter(function(e){return attend(e).concerns>0;}).length;
    const unverified=staff.reduce(function(n,e){return n+e.attendance.filter(function(r){return !r.verified;}).length;},0);
    return '<div class="monitor-pulse" role="note" aria-label="Sample attendance monitoring context">'+
      '<div class="monitor-pulse-copy"><span class="monitor-pulse-kicker">ATTENDANCE SNAPSHOT</span>'+
      '<strong><span class="monitor-pulse-primary-count">'+verified+'</span> of '+staff.length+
      ' people have verified attendance concerns</strong>'+
      '<small>'+unverified+' attendance entries await verification · fictional records only</small></div>'+
      '<button type="button" class="monitor-pulse-link" data-action="nav" data-tab="attendance">'+
      'Inspect attendance <span aria-hidden="true">↗</span></button></div>';
  }
  function roleHome(){
    const staff=data.employees;
    const concerns=staff.reduce(function(total,e){return total+attend(e).concerns;},0);
    const kitPending=staff.filter(function(e){return kitPct(e)<100;}).length;
    const unvalidated=staff.filter(function(e){return !e.kpiValidated;}).length;
    const journeyAverage=meanOf(staff,journeyPct);
    const cards=[
      ['Employees',staff.length,'Across all eight divisions','pink','employees'],
      ['Journey progress',journeyAverage+'%','Average onboarding completion','blue','journey'],
      ['Kits pending',kitPending,'Employees with open requirements','yellow','kit'],
      ['KPI to verify',unvalidated,'Sample records without validation','violet','kpi']
    ];
    return header('PEOPLE MONITORING / DEMO SNAPSHOT','Organization overview',
      '51 fictional people across eight divisions. Open signals to inspect the recorded details; this is not live data.',
      '')+
      '<section class="overview-summary-grid" aria-label="Monitoring signals">'+cards.map(function(card){
        return '<button type="button" class="overview-summary-tile tone-'+card[3]+' overview-signal"'+
          ' data-action="nav" data-tab="'+card[4]+'"'+
          ' aria-label="'+safe(card[0])+': '+safe(card[1])+'. Open '+safe(card[4])+' monitoring">'+
          '<span>'+safe(card[0])+'</span><strong>'+safe(card[1])+'</strong>'+
          '<small>'+safe(card[2])+'</small></button>';
      }).join('')+'</section>'+
      monitorPulse(staff)+
      '<div class="overview-monitor-grid" aria-label="Monitoring priorities">'+
        '<div class="overview-followups">'+attentionPanel(staff)+'</div>'+
        '<div class="overview-insight-grid">'+overviewStagePanel()+overviewMilestonesPanel()+'</div>'+
      '</div>'+
      overviewDivisionRail()+
      '<p class="overview-snapshot-note">Demo only · '+concerns+
      ' attendance concerns in verified sample entries. No integrations or editable records.</p>';
  }
  function overview(){return roleHome();}
  function employeesTable(list,mode){if(!list.length)return '<div class="empty"><span class="big">⌕</span>No employees match these filters.</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Division</th><th>Journey</th><th>Kit issued</th><th>KPI score</th><th>Actions</th></tr></thead><tbody>'+list.map(function(e){return '<tr><td><div class="name-cell">'+avatar(e.name)+'<div><strong>'+safe(e.name)+'</strong><small>'+safe(e.id)+' · '+safe(e.jobTitle)+'</small></div></div></td><td>'+safe(div(e.division).short)+'</td><td><div class="progress-wrapper">'+progress(journeyPct(e))+'<span>'+journeyPct(e)+'%</span></div></td><td>'+kitPct(e)+'%</td><td><strong>'+score(e).toFixed(1)+'%</strong><small>'+rating(score(e))+'</small></td><td>'+button('Preview','open','data-id="'+e.id+'" data-detail="'+(mode||'preview')+'"','small')+'</td></tr>';}).join('')+'</tbody></table></div>';}
  function filtered(){
    const term=ui.query.trim().toLocaleLowerCase();
    const matches=scopedEmployees().filter(function(e){
      const searchable=[e.name,e.id,e.jobTitle,e.email,div(e.division).name,div(e.division).short].join(' ').toLocaleLowerCase();
      return !term||searchable.includes(term);
    });
    const metric=ui.employeeSort==='journey'?journeyPct:ui.employeeSort==='kit'?kitPct:ui.employeeSort==='kpi'?score:null;
    matches.sort(function(a,b){
      if(metric){const delta=metric(a)-metric(b);if(delta)return delta;}
      if(ui.employeeSort==='division'){const delta=div(a.division).name.localeCompare(div(b.division).name);if(delta)return delta;}
      return a.name.localeCompare(b.name);
    });
    return matches;
  }
  function filters(){
    const sorts=[{value:'name',label:'Name A–Z'},{value:'division',label:'Division A–Z'},
      {value:'journey',label:'Journey: needs attention'},{value:'kit',label:'Welcome Kit: needs attention'},
      {value:'kpi',label:'KPI: lowest first'}];
    return '<div class="filters directory-filters"><label class="directory-search-label">'+
      '<span class="sr-only">Search employee name, ID, job title, email or division</span>'+
      '<input type="search" class="search" aria-label="Search employees" data-ui="query" placeholder="Search people or departments" value="'+safe(ui.query)+'"></label>'+
      button(ui.scope==='all'?'All divisions ▾':div(ui.scope).short+' ▾','choose-scope','','small')+
      '<label class="directory-sort-label"><span>Sort</span><select data-ui="employeeSort" aria-label="Sort employees" class="field directory-sort">'+opts(sorts,ui.employeeSort)+'</select></label>'+
      '<span class="directory-clear-slot">'+(ui.query?button('Clear search','clear-search','','small'):'')+'</span>'+
      '<span class="directory-results-count" aria-live="polite">'+filtered().length+' of '+scopedEmployees().length+' employees</span></div>';
  }
  function employees(){return header('PEOPLE DIRECTORY','All Maddies','Browse your selected division or all 51 fictional employees across 8 departments.',button('Export visible CSV','export-csv','','small'))+'<section class="panel no-pad"><div style="padding:20px 20px 0">'+filters()+'</div>'+employeesTable(filtered())+'</section>';}
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
          '<td><div class="progress-wrapper">'+progress(journeyPct(e))+'<span>'+e.journey.flat().filter(Boolean).length+
      ' / '+e.journey.flat().length+' tasks · '+journeyPct(e)+'%</span></div></td>'+
          '<td>'+e.journey.filter(function(a){return a.every(Boolean);}).length+' / 7</td>'+
          '<td>'+button('Preview','open','data-id="'+safe(e.id)+'" data-detail="journey"','small')+'</td></tr>';
      }).join('')+'</tbody></table></div></section>';
  }
  function journeyDistribution(team){
    const total=team.length;
    const stages=data.stages.map(function(stage,i){
      return {label:'Stage '+(i+1)+' · '+stage.name,count:team.filter(function(e){return journeyStage(e)===i;}).length};
    });
    stages.push({label:'Completed',count:team.filter(function(e){return journeyStage(e)===7;}).length});
    const tasks=team.reduce(function(n,e){return n+e.journey.flat().filter(Boolean).length;},0);
    const possible=team.reduce(function(n,e){return n+e.journey.flat().length;},0);
    return '<section class="panel journey-distribution" aria-label="Journey stage distribution">'+
      '<div class="panel-head"><div><h2>Stage distribution</h2>'+
      '<p>Each employee is counted once, at their first incomplete stage</p></div>'+
      '<div class="journey-distribution-total">'+tasks+' / '+possible+' checklist tasks completed</div></div>'+
      '<div class="table-wrap"><table class="table journey-distribution-table">'+
      '<thead><tr><th scope="col">Current stage</th><th scope="col">People</th>'+
      '<th scope="col">Share of selected employees</th></tr></thead><tbody>'+
      stages.map(function(stage){
        const share=total?Math.round(stage.count/total*100):0;
        return '<tr><th scope="row">'+safe(stage.label)+'</th>'+
          '<td><strong>'+stage.count+' / '+total+'</strong></td>'+
          '<td><div class="report-distribution-cell">'+
          '<span class="report-distribution-track" aria-hidden="true"><span style="width:'+share+'%"></span></span>'+
          '<span>'+share+'%</span></div></td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="report-source-note">Stage share uses '+total+' selected employees as the denominator. Checklist task completion uses all recorded tasks; later stages may contain completed tasks even if an earlier stage remains incomplete.</p></section>';
  }
  function journey(){
    const team=scopedEmployees(),stageCounts=Array.from({length:8},function(_,i){return team.filter(function(e){return journeyStage(e)===i;}).length;});
    const avg=meanOf(team,journeyPct);
    return header('ONBOARDING MONITORING','Journey board',
      'See all seven stages in one view. People are grouped by their first incomplete stage; nothing can be edited here.',
      button(scopeLabel()+' ▾','choose-scope','','small'))+
      '<div class="journey-board-toolbar"><div><h2>Journey stages</h2><p>'+team.length+' employees · '+avg+'% average journey completion · '+stageCounts[7]+' completed</p></div>'+
      '<div class="workspace-view-switch" role="group" aria-label="Journey presentation">'+
      ['board','table'].map(function(mode){return '<button type="button" data-action="journey-view" data-mode="'+mode+'" class="'+(ui.journeyView===mode?'active':'')+'" aria-pressed="'+(ui.journeyView===mode)+'">'+
      landingIcon(mode==='board'?'grid':'list')+(mode==='board'?'Board':'Table')+'</button>';}).join('')+'</div></div>'+
      journeyDistribution(team)+(ui.journeyView==='table'?journeyTable(team):journeyKanban(team))+
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
  function attendanceReport(staff){
    const totals={all:0,verified:0,pending:0,late:0,absent:0,excused:0,approvedLeave:0,concerns:0,affected:0};
    staff.forEach(function(e){
      let affected=false;
      e.attendance.forEach(function(r){
        totals.all++;
        if(!r.verified){totals.pending++;return;}
        totals.verified++;
        if(r.type==='Late'){
          totals.late++;
          if(r.approval==='Excused')totals.excused++;
          else {totals.concerns++;affected=true;}
        }
        if(r.type==='Absent'){
          totals.absent++;
          if(r.approval==='Unapproved'){totals.concerns++;affected=true;}
        }
        if(r.type==='Leave'&&r.approval==='Approved')totals.approvedLeave++;
      });
      if(affected)totals.affected++;
    });
    return totals;
  }
  function attendanceAuditPanel(staff){
    const a=attendanceReport(staff);
    const metrics=[
      ['Verified entries',a.verified+' / '+a.all,'All recorded attendance entries'],
      ['Verified late arrivals',a.late,'Includes '+a.excused+' excused'],
      ['Verified absences',a.absent,'Approval statuses shown separately'],
      ['Concern entries',a.concerns,a.affected+' / '+staff.length+' people affected'],
      ['Awaiting verification',a.pending,'Excluded from verified totals']
    ];
    return '<section class="panel attendance-audit-panel"><div class="panel-head"><div>'+
      '<h2>Recorded attendance breakdown</h2>'+
      '<p>Verified events and pending entries from '+staff.length+' selected fictional people</p></div></div>'+
      '<div class="attendance-audit-grid">'+metrics.map(function(m){
        return '<div class="attendance-audit-stat"><span>'+safe(m[0])+'</span>'+
          '<strong>'+safe(m[1])+'</strong><small>'+safe(m[2])+'</small></div>';
      }).join('')+'</div>'+
      '<p class="report-source-note">Counts are attendance entries, not days worked or shifts. Concerns are verified unexcused late or unapproved absent entries; pending entries are excluded. No records does not mean perfect attendance.</p></section>';
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
    return '<div class="mini-bars" role="img" aria-label="Last six calendar months of recorded verified lateness and absence, not a continuous attendance trend">'+periods.map(function(p){
      const n=p.late+p.abs,h=n?Math.max(5,Math.round(n/max*92)):0;
      return '<div title="'+safe(p.label)+': '+p.late+' late, '+p.abs+' absent"><span style="height:'+h+'px" class="'+(n?'':'no-incidents')+'"></span>'+safe(p.label)+'</div>';
    }).join('')+'</div><p class="muted micro" style="margin-top:12px">Last six calendar months · recorded verified events only; a month without an entry does not prove perfect attendance.</p>';
  }
  function rankRows(type){const ranked=scopedEmployees().map(function(e){return {e:e,n:attend(e)[type]};}).filter(function(v){return v.n>0;}).sort(function(a,b){return b.n-a.n;}).slice(0,5);return ranked.length?ranked.map(function(v,i){return '<div class="rank"><span class="rank-index">'+(i+1)+'</span><div><b>'+linkedEmployee(v.e)+'</b><p class="muted micro">'+safe(div(v.e.division).short)+'</p></div><span class="count">'+v.n+'</span></div>';}).join(''):'<p class="muted">No verified entries</p>';}
  function attendancePeriodTable(){
    const buckets={};
    scopedEmployees().forEach(function(e){
      e.attendance.forEach(function(r){
        if(!r.verified)return;
        let period=r.date.slice(0,7);
        if(ui.frequency==='weekly'){
          const d=new Date(r.date+'T00:00:00Z');
          d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
          period=d.toISOString().slice(0,10);
        }
        if(!buckets[period])buckets[period]={verified:0,late:0,absent:0,approved:0,excused:0,concerns:0};
        const b=buckets[period];
        b.verified++;
        if(r.type==='Late'){b.late++;if(r.approval==='Excused')b.excused++;else b.concerns++;}
        if(r.type==='Absent'){b.absent++;if(r.approval==='Unapproved')b.concerns++;}
        if(r.type==='Leave'&&r.approval==='Approved')b.approved++;
      });
    });
    const keys=Object.keys(buckets).sort().reverse().slice(0,12);
    return '<section class="panel attendance-period-panel"><div class="panel-head"><div>'+
      '<h2>Weekly and monthly summary</h2>'+
      '<p>Verified records only · latest 12 periods with entries; missing periods are not evidence of zero incidents</p></div>'+
      '<select class="field" aria-label="Attendance summary frequency" data-ui="frequency">'+
      opts([{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}],ui.frequency)+'</select></div>'+
      '<div class="table-wrap"><table class="table attendance-period-table"><thead><tr>'+
      '<th scope="col">Period</th><th scope="col">Verified entries</th>'+
      '<th scope="col">Late</th><th scope="col">Absent</th><th scope="col">Excused lates</th>'+
      '<th scope="col">Approved leaves</th><th scope="col">Concern entries</th></tr></thead><tbody>'+
      (keys.length?keys.map(function(k){
        const b=buckets[k];
        return '<tr><th scope="row">'+safe(k)+'</th>'+
          '<td>'+b.verified+'</td><td>'+b.late+'</td><td>'+b.absent+'</td>'+
          '<td>'+b.excused+'</td><td>'+b.approved+'</td><td>'+b.concerns+'</td></tr>';
      }).join(''):'<tr><td colspan="7">No verified records for this frequency.</td></tr>')+
      '</tbody></table></div>'+
      '<p class="report-source-note">Excused lateness is included in Late, but not in Concern entries. Approved leave is not an absence or concern. Pending records are excluded from this table.</p></section>';
  }
  function attendanceView(){
    return header('ATTENDANCE','Attendance monitoring','Verified incidents, monthly trends and individual recorded entries. All information is view-only.',button('Export attendance','attendance-csv','','small'))+
      attendanceAuditPanel(scopedEmployees())+
      '<section class="panel attendance-trend-panel"><div class="panel-head"><div><h2>Recent verified events</h2><p>Recorded late and absent entries · six calendar months · fictional fixture</p></div></div>'+chart()+'</section>'+
      '<details class="panel compact-details attendance-breakdown" open><summary>Weekly and monthly breakdown</summary>'+attendancePeriodTable()+'</details>'+
      trackerRoster('attendance')+
      '<details class="panel compact-details"><summary>See late and absence rankings</summary><div class="grid subgrid" style="margin-top:18px"><div><h3>Late arrivals</h3>'+rankRows('lates')+'</div><div><h3>Absences</h3>'+rankRows('absences')+'</div></div></details>';
  }
  function scoresPanel(e){
    const parts=kpiComponents(e);
    return '<section class="panel kpi-composition-panel" aria-label="KPI weighted score composition">'+
      '<div class="panel-head"><div><h2>Score composition</h2>'+
      '<p>Raw category score × weight = weighted contribution</p></div></div>'+
      '<div class="table-wrap"><table class="table kpi-composition-table"><thead><tr>'+
      '<th scope="col">Category</th><th scope="col">Raw score</th><th scope="col">Weight</th>'+
      '<th scope="col">Contribution</th></tr></thead><tbody>'+
      parts.map(function(part){
        return '<tr><th scope="row">'+safe(part.name)+'</th><td>'+part.raw.toFixed(1)+' / 100</td>'+
          '<td>'+part.weight+'%</td><td><strong>'+part.points.toFixed(2)+' pts</strong></td></tr>';
      }).join('')+
      '<tr class="kpi-composition-total"><th scope="row">Weighted total</th>'+
      '<td>—</td><td>100%</td><td><strong>'+score(e).toFixed(2)+' / 100</strong></td></tr>'+
      '</tbody></table></div>'+
      '<p class="report-source-note">All category scores are fictional. Contributions are weighted percentage points; they sum to the displayed weighted total. No official KPI source is connected.</p></section>';
  }
  function kpiDetail(e){
    const s=score(e);
    return '<div class="grid dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Weighted evaluation</h2>'+
      '<p>Four sample category scores, weighted to 100%</p></div>'+pill(rating(s))+'</div>'+
      '<div class="big-score">'+s.toFixed(2)+'%</div>'+
      '<div class="score-meter" aria-label="Weight proportions: 15, 45, 15, 25"><span></span><span></span><span></span><span></span></div>'+
      '<p class="report-source-note">Computed from fictional category scores, not an externally verified KPI report.</p></section>'+
      '<section class="panel"><h2>KPI source</h2><div class="hr"></div>'+
      pill(e.kpiValidated?'Demo validation flag set':'Demo validation flag unset')+
      '<p class="reader-source-value">'+safe(e.kpiSource||'No source reference provided in the sample dataset')+'</p>'+
      '<p class="report-source-note">This flag is part of the fictional fixture, not an external verification. Official Google Sheets and Airtable integrations are not connected.</p></section></div>'+
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
  function reviewStatus(e,k){return e.review[k]&&e.review[k].status||'Not recorded';}
  function compensation(e){const base=Number(e.currentBasic)||0,allow=Number(e.currentAllowances)||0,proposal=Number(e.proposedPct)||0,approved=Number(e.approvedPct)||0;return '<div class="money-grid"><div class="money-stat"><span>Current basic salary · demo</span><strong>'+money(base)+'</strong></div><div class="money-stat"><span>Current gross · demo</span><strong>'+money(base+allow)+'</strong></div><div class="money-stat"><span>Proposed increase</span><strong>'+money(base*proposal/100)+' ('+proposal+'%)</strong></div><div class="money-stat"><span>Proposed new gross</span><strong>'+money(base*(1+proposal/100)+allow)+'</strong></div><div class="money-stat"><span>Approved increase</span><strong>'+money(base*approved/100)+' ('+approved+'%)</strong></div><div class="money-stat"><span>Approved new basic</span><strong>'+money(base*(1+approved/100))+'</strong></div><div class="money-stat"><span>Approved new gross</span><strong>'+money(base*(1+approved/100)+allow)+'</strong></div><div class="money-stat"><span>Effectivity date</span><strong>'+dateLabel(e.effectiveDate)+'</strong></div></div>';}
  function reviewFlow(e){
    const steps=[
      ['division','01','Division Head','Initial evaluation'],
      ['corp','02','Corporate Operations','Organizational endorsement'],
      ['cso','03','CSO','Strategic review'],
      ['coo','04','COO','Final decision']
    ];
    const completed=steps.filter(function(step){
      return ['Endorsed','Approved'].includes(reviewStatus(e,step[0]));
    }).length;
    return '<section class="review-record-summary" aria-label="Review stage status summary">'+
      '<strong>'+completed+' / '+steps.length+' stages show an endorsed or approved status</strong>'+
      '<p>These are current fictional statuses, not evidence of a verified chronological audit trail.</p></section>'+
      '<div class="table-wrap review-record-table"><table class="table"><thead><tr>'+
      '<th scope="col">Step</th><th scope="col">Reviewer</th><th scope="col">Recorded status</th>'+
      '<th scope="col">Recorded date</th><th scope="col">Sample note</th></tr></thead><tbody>'+
      steps.map(function(step){
        const record=e.review[step[0]]||{},status=reviewStatus(e,step[0]);
        const date=record.at?dateLabel(record.at.slice(0,10)):'Not recorded';
        return '<tr><td>'+step[1]+'</td><th scope="row">'+safe(step[2])+
          '<small>'+safe(step[3])+'</small></th><td>'+pill(status)+'</td>'+
          '<td>'+safe(date)+'</td><td>'+safe(record.comment||'No recorded comment')+'</td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="report-source-note">Pending is not an endorsement. Dates appear only when provided by the sample record; omitted dates are shown as Not recorded. No live review system is connected.</p>';
  }
  function approvalsDetail(e){
    return '<section class="panel reader-review-panel"><div class="panel-head"><div><h2>Review and approval snapshot</h2>'+
      '<p>Recorded status at each step · no approval actions here</p></div>'+pill(reviewStatus(e,'coo'))+'</div>'+
      '<p class="muted micro">The original source is responsible for review decisions. The amounts below are fictional.</p>'+
      compensation(e)+'</section>'+
      '<section class="panel"><div class="panel-head"><div><h2>Review status by step</h2><p>Recorded statuses, dates and sample notes; not a verified event timeline</p></div></div>'+
      reviewFlow(e)+'<div class="reader-comments"><div><span class="field-label">Corporate Operations notes</span><p>'+safe(e.comments.corp||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">CSO notes</span><p>'+safe(e.comments.cso||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">COO remarks</span><p>'+safe(e.comments.coo||'No sample notes')+'</p></div>'+
      '<div><span class="field-label">Division Head recommendation</span><p>'+safe(e.comments.division||'No sample notes')+'</p></div></div></section>';
  }

  function approvalsTable(){return '<section class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Company-wide review queue</h2><p>Employees in '+safe(scopeLabel())+' and current approval milestones</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Division</th><th>Division Head</th><th>Corporate Ops</th><th>CSO</th><th>COO</th><th></th></tr></thead><tbody>'+scopedEmployees().map(function(e){return '<tr><td>'+linkedEmployee(e)+'</td><td>'+safe(div(e.division).short)+'</td><td>'+pill(reviewStatus(e,'division'))+'</td><td>'+pill(reviewStatus(e,'corp'))+'</td><td>'+pill(reviewStatus(e,'cso'))+'</td><td>'+pill(reviewStatus(e,'coo'))+'</td><td>'+button('Preview','open','data-id="'+safe(e.id)+'" data-detail="approvals"','small')+'</td></tr>';}).join('')+'</tbody></table></div></section>';}
  function approvalsView(){
    return header('PERFORMANCE','Reviews','Monitor endorsement stages by division. Open an employee for the detailed evaluation and approval history.',button('Browse divisions','nav','data-tab="divisions"','small'))+
      '<p class="muted micro tracker-footnote">Division Head → Corporate Operations → CSO → COO is the configured review order, not proof of chronological completion. All statuses are fictional and read-only.</p>'+trackerRoster('approvals')+
      '<details class="panel compact-details"><summary>See complete review queue</summary>'+approvalsTable()+'</details>';
  }
  function sourcesView(){
    const catalog=window.MJ_SOURCE_ADAPTER.getSources();
    const provenance=window.MJ_SOURCE_ADAPTER.getProvenance();
    const quality=window.MJ_SOURCE_ADAPTER.getQualityReport();
    return header('DATA CONNECTIONS','Data sources',
      'A transparent handoff plan for integrating the future Claude-connected source systems.')+
      '<div class="source-banner"><span class="source-banner-icon">i</span><div><strong>Sample mode · No connected accounts required</strong>'+
      '<p>'+safe(provenance.note)+' This GitHub Pages prototype does not connect to Claude, Airtable, Google Workspace or email directly.</p></div></div>'+
      '<section class="source-grid">'+catalog.map(function(source){
        return '<article class="panel source-card"><div class="source-card-top"><h2>'+safe(source.name)+'</h2>'+
        '<span class="source-unlinked">'+safe(source.label)+'</span></div>'+
        '<p>'+safe(source.kind)+'</p><div class="source-card-bottom"><span>'+safe(source.scope)+'</span>'+
        '<span>No last sync</span></div></article>';
      }).join('')+'</section>'+
      '<section class="panel source-quality"><div class="panel-head"><div><h2>Sample data integrity</h2>'+
      '<p>Structural checks on the fictional fixture only — not verification against any real source</p></div>'+
      '<span class="source-quality-state '+(quality.structureValid?'good':'warning')+'">'+
      (quality.structureValid?'Structure checks passed':'Fixture needs review')+'</span></div>'+
      '<div class="source-quality-stats"><div><strong>'+quality.uniqueEmployeeIds+'</strong><small>Unique employee IDs</small></div>'+
      '<div><strong>'+quality.divisionCount+'</strong><small>Division references</small></div>'+
      '<div><strong>'+quality.stageCount+'</strong><small>Journey stages</small></div>'+
      '<div><strong>'+quality.kitItemCount+'</strong><small>Welcome Kit items</small></div></div>'+
      (quality.issueCount?'<p class="source-quality-warning">'+quality.issueCount+' structural issue(s) found. Review the sample fixture before connecting data.</p>':
      '<p class="muted micro">No missing sample IDs, division links, supervisor links, Journey arrays or Kit arrays detected.</p>')+
      '</section>'+
      '<section class="panel source-policy"><h2>Planned integration architecture</h2>'+
      '<p><strong>Phase 1 — GitHub:</strong> Finish HTML, CSS, JavaScript, responsive pages and navigation with a read-only fictional dataset. The source adapter provides a stable data shape.</p>'+
      '<p><strong>Phase 2 — Claude workspace:</strong> Use authorized account-scoped connectors or a controlled service to retrieve provider records, normalize them by employee ID and return permission-filtered summaries. The original systems retain ownership.</p>'+
      '<div class="source-policy-steps"><span>1. Read authorized sources</span><span>2. Normalize employee IDs</span>'+
      '<span>3. Validate snapshot</span><span>4. Display source and sync time</span></div>'+
      '<p class="muted micro">Do not place real employee data, private account documents, email content, tokens or credentials in public GitHub Pages assets. No user account system is needed for this prototype.</p></section>';
  }
  function activity(){
    return header('DATA & GOVERNANCE','About this prototype',
      'Maddie Journey is a reader and monitoring interface. Source systems retain ownership of all records.',
      button('Data sources','nav','data-tab="sources"','small'))+
      '<div class="grid dashboard-grid"><section class="panel"><h2>What the dashboard does</h2>'+
      '<div class="reader-policy-list"><div><strong>Organizes and previews</strong><p>Employee rosters, onboarding stages, attendance summaries, milestones, scorecards and review statuses.</p></div>'+
      '<div><strong>Does not submit records</strong><p>No HR input, employee editing, approvals, attendance verification, or KPI changes are made here.</p></div>'+
      '<div><strong>Fictional demonstration</strong><p>The current release reads 51 sample employees across eight divisions. There are no live Google Workspace or Airtable connections.</p></div>'+
      '<div><strong>Open demo navigation</strong><p>Every sample page is accessible without selecting a user. Any later use of private employee information requires authenticated, permission-controlled access.</p></div></div>'+
      '</section><section class="panel"><h2>Assigned division contacts</h2>'+
      '<p class="muted micro">Illustrative assignment map from the project brief</p>'+
      data.divisions.map(function(d){return '<div class="quick-item"><div class="grow"><b>'+safe(d.name)+'</b><p>'+
        safe(divisionEvaluatorNames(d))+'</p></div></div>';}).join('')+
      '<div class="hr"></div><p class="muted micro">HR: GIEZELLE · KURT</p></section></div>';
  }

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
      if(kind==='discipline')(e.disciplinaryActions||[]).forEach(function(p){rows.push({e:e,record:p,when:p.date,sort:-Date.parse(p.date||'1970-01-01'),status:p.status,detail:p.category+' · '+p.severity});});
    });
    return rows.sort(function(a,b){return a.sort-b.sort;});
  }
  function filteredMilestoneTeam(){return ui.milestoneDivision==='all'?data.employees:data.employees.filter(function(e){return e.division===ui.milestoneDivision;});}
  function milestonesView(){
    const kind=milestoneKinds.find(function(k){return k.id===ui.milestoneCategory;})||milestoneKinds[0];
    const staff=filteredMilestoneTeam(),rows=milestoneEvents(kind.id,staff);
    const visible=ui.milestoneShowAll?rows:rows.slice(0,12);
    const roster=(visible.length?visible.map(function(row){
        return '<div class="milestone-person">'+avatar(row.e.name)+'<div class="milestone-person-name"><b>'+safe(row.e.name)+'</b><small>'+safe(div(row.e.division).short)+' · '+safe(row.detail)+'</small></div>'+
        '<span class="milestone-status">'+safe(row.status||'Recorded')+'</span>'+
        button('View','open','data-id="'+safe(row.e.id)+'" data-detail="milestones"','small')+'</div>';
      }).join(''):'<div class="empty">No sample records in this category for the selected department.</div>');
    return header('PEOPLE MOMENTS','Employee milestones','One category at a time. Browse birthdays, service history, recognitions and HR records.',button('Employee directory','nav','data-tab="employees"','small'))+
      '<div class="milestone-toolbar"><div><h2>Choose a category</h2><p class="muted micro">Select what you need to review today.</p></div><button class="button" type="button" data-action="milestone-division">'+safe(ui.milestoneDivision==='all'?'All 8 divisions':div(ui.milestoneDivision).short)+' <span aria-hidden="true">⌄</span></button></div>'+
      '<div class="milestone-tabs" role="group" aria-label="Milestone categories">'+milestoneKinds.map(function(k){
        return '<button type="button" class="milestone-tab '+(k.id===kind.id?'active':'')+'" data-action="milestone-category" data-kind="'+k.id+'" aria-pressed="'+(k.id===kind.id)+'">'+safe(k.name)+'</button>';
      }).join('')+'</div>'+
      '<section class="panel milestone-results"><div class="panel-head"><div><h2>'+safe(kind.name)+'</h2><p>'+safe(kind.description)+' · '+rows.length+' records'+'</p></div>'+
      ''+'</div>'+
      '<div class="milestone-people">'+roster+'</div>'+
      (rows.length>12?'<div class="milestone-list-footer">'+button(ui.milestoneShowAll?'Show fewer':'Show all '+rows.length,'milestone-more','','small')+'</div>':'')+
      '<div class="milestone-help">'+(kind.id==='perfect'?'Perfect attendance is recorded only when HR explicitly confirms the award; it is not inferred from incomplete time entries.':kind.id==='discipline'?'All cases are fictional. Real disciplinary records require secure, audited access.':'All names, dates and milestones are sample data, not real employee records.')+'</div></section>';
  }
  function recordListHTML(e,kind){
    const collection=kind==='promotion'?e.promotions:kind==='perfect'?e.attendanceAwards:e.disciplinaryActions;
    return collection.length?collection.map(function(r){
      const name=kind==='promotion'?(r.from+' → '+r.to):kind==='perfect'?('Attendance · '+r.period):(r.category+' · '+r.severity);
      const date=kind==='perfect'?(r.period||'—'):dateLabel(r.date);
      return '<div class="milestone-mini-row"><div><b>'+safe(name)+'</b><small>'+safe(date)+' · '+safe(r.status)+'</small></div></div>';
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
    const dimensions=kpiComponents(e).map(function(p){return [p.name,p.raw,p.weight,p.points];});
    const stageSummary=data.stages.map(function(stage,i){return {label:'Stage '+(i+1),percent:Math.round(e.journey[i].filter(Boolean).length/e.journey[i].length*100),title:stage.name};});
    return '<div class="profile-intro"><p>Performance, onboarding and attendance at a glance. Figures are fictional and not synced to external sources.</p></div>'+
    '<div class="employee-charts-grid">'+
      '<section class="chart-card performance-chart"><div class="chart-card-heading"><h3>2026 KPI performance</h3><span class="tag warn">Demo scores</span></div><div class="performance-chart-inner"><div class="score-donut" style="--score:'+overall+'%" role="img" aria-label="Overall KPI score '+overall+' percent"><div><strong>'+overall+'%</strong><small>'+safe(rating(v))+'</small></div></div><div class="score-breakdown">'+dimensions.map(function(x){return '<div class="score-breakdown-row"><div class="score-label"><span>'+safe(x[0])+' <small>· '+x[2]+'%</small></span><b>'+Number(x[1]).toFixed(1)+'%</b></div><div class="chart-track"><span style="width:'+Math.min(100,Math.max(0,x[1]))+'%"></span></div><small class="report-weighted-points">'+x[3].toFixed(2)+' weighted points</small></div>';}).join('')+'</div></div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>7-stage journey</h3><strong>'+journeyPct(e)+'%</strong></div><div class="stage-preview-bars">'+stageSummary.map(function(x){return '<div class="stage-preview-row" title="'+safe(x.title)+'"><span>'+x.label+'</span><div class="chart-track"><span style="width:'+x.percent+'%"></span></div><b>'+x.percent+'%</b></div>';}).join('')+'</div></section>'+
      '<section class="chart-card"><div class="chart-card-heading"><h3>Attendance · recent months</h3><span class="tag info">Verified only</span></div>'+attendanceMicrochart(e)+'<p class="chart-note">'+a.lates+' late arrivals · '+a.absences+' absences · '+a.concerns+' unexcused concerns</p></section>'+
      '<section class="chart-card preview-status"><div class="chart-card-heading"><h3>Onboarding & review</h3></div><div class="preview-check"><span>Welcome Maddie Kit</span><strong>'+kitPct(e)+'% complete</strong></div>'+progress(kitPct(e))+'<div class="preview-check"><span>Division evaluation</span>'+pill(reviewStatus(e,'division'))+'</div><div class="preview-check"><span>Executive review</span>'+pill(reviewStatus(e,'coo'))+'</div></section>'+
    '</div>';
  }
  function employeeMini(e){const a=attend(e);return '<div class="employee-mini-summary" aria-label="Employee summary"><span><small>Journey</small><strong>'+journeyPct(e)+'%</strong></span><span><small>Welcome kit</small><strong>'+kitPct(e)+'%</strong></span><span><small>Weighted KPI</small><strong>'+score(e).toFixed(1)+'%</strong></span><span><small>Verified lates / absences</small><strong>'+a.lates+' / '+a.absences+'</strong></span></div>';}
  function approvalPolicy(){return '<div class="callout" style="margin-bottom:16px"><strong>Read-only review timeline.</strong> These records are fictional previews. Evaluations and approvals must be handled in their authorized source systems, not in Maddie Journey.</div>';}
  // Keep browsing within the employee roster that opened this reader.
  function viewerRoster(){
    if(ui.tab==='division')return data.employees.filter(function(e){return e.division===ui.activeDivision;})
      .sort(function(a,b){return a.name.localeCompare(b.name);});
    if(ui.tab==='employees')return filtered();
    if(ui.tab==='milestones')return filteredMilestoneTeam().slice()
      .sort(function(a,b){return a.name.localeCompare(b.name);});
    return scopedEmployees().slice().sort(function(a,b){return a.name.localeCompare(b.name);});
  }
  function startViewer(id){
    ui.viewerIds=viewerRoster().map(function(e){return e.id;});
    if(!ui.viewerIds.includes(id))ui.viewerIds=[id];
    ui.viewerOrigin=ui.tab==='division'?div(ui.activeDivision).name:
      ui.tab==='employees'?'People directory':ui.tab==='milestones'?'Milestones':title(ui.tab);
  }
  function employeeModal(){
    const e=emp(),t=ui.detail;
    if(!e)return '';
    const roster=ui.viewerIds.filter(function(id){return !!emp(id);});
    const position=roster.indexOf(e.id),count=roster.length||1;
    const prev=position>0?emp(roster[position-1]):null;
    const next=position>=0&&position<roster.length-1?emp(roster[position+1]):null;
    const tabs=[['preview','Overview'],['milestones','Milestones'],['kpi','KPI'],['journey','Journey'],['kit','Welcome Kit'],['attendance','Attendance'],['approvals','Review'],['info','Profile']];
    return '<div class="overlay center-overlay employee-overlay" data-overlay="employee">'+
    '<section class="employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title" aria-describedby="employee-context-description" tabindex="-1">'+
    '<div class="employee-modal-top"><div class="profile">'+avatar(e.name)+'<div><span class="eyebrow">EMPLOYEE · '+safe(e.id)+'</span><h2 id="employee-modal-title">'+safe(e.name)+'</h2><p class="muted micro">'+safe(e.jobTitle)+' · '+safe(div(e.division).name)+'</p></div></div>'+
    '<button class="modal-close" data-action="close" aria-label="Close employee preview" type="button">×</button></div>'+
    '<div class="employee-context-bar"><p id="employee-context-description" class="employee-context-origin">'+safe(ui.viewerOrigin||'Monitoring')+
      '<span aria-hidden="true"> / </span>'+safe(div(e.division).short)+
      '<strong>'+(position>=0?position+1:1)+' of '+count+'</strong></p>'+
      '<div class="employee-context-actions">'+
        '<button type="button" class="employee-context-division" data-action="viewer-division" data-division="'+safe(e.division)+'" aria-label="Open '+safe(div(e.division).name)+' employee list">View division <span aria-hidden="true">↗</span></button>'+
        '<div class="employee-context-pager" role="group" aria-label="Browse employees in this view">'+
        '<button type="button" data-action="viewer-prev" aria-label="'+(prev?'Previous employee: '+safe(prev.name):'No previous employee')+'"'+(prev?'':' disabled')+'>← <span>Previous</span></button>'+
        '<button type="button" data-action="viewer-next" aria-label="'+(next?'Next employee: '+safe(next.name):'No next employee')+'"'+(next?'':' disabled')+'><span>Next</span> →</button>'+
        '</div></div></div>'+
    '<nav class="employee-modal-tabs" aria-label="Employee sections">'+tabs.map(function(a){return '<button type="button" class="employee-tab '+(t===a[0]?'active':'')+'" data-action="detail" data-tab="'+a[0]+'" aria-current="'+(t===a[0]?'page':'false')+'">'+a[1]+'</button>';}).join('')+'</nav>'+
    '<div class="employee-modal-body">'+(t==='preview'?'':employeeMini(e))+
    (t==='info'?'<div class="panel" style="margin-bottom:15px"><div class="form-grid"><div><span class="field-label">Start date</span><strong>'+dateLabel(e.startDate)+'</strong></div><div><span class="field-label">Employee ID</span><strong>'+safe(e.id)+'</strong></div><div><span class="field-label">Org level (sample)</span><strong>Level '+safe(e.orgLevel||'—')+'</strong></div><div><span class="field-label">Reports to (sample)</span><strong>'+safe((data.employees.find(function(p){return p.id===e.reportsTo;})||{}).name||'Department lead')+'</strong></div></div></div>':'')+
    detailContent(e,t)+'</div></section></div>';
  }
  function landingIcon(name){
    const drawings={
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>',
      panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
      menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
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
    return '<div class="landing-shell">'+
      '<main id="main-content" class="landing-main" tabindex="-1">'+
      '<header class="landing-header"><a class="landing-brand" href="#welcome" data-nav="welcome" aria-label="Maddie Journey home">'+
      '<strong class="landing-brand-title">Maddie Journey</strong></a>'+
      '<div class="landing-header-actions">'+themeControl()+'</div></header>'+
      '<section class="landing-hero" aria-labelledby="landing-title"><div class="landing-hero-inner">'+
      '<span class="landing-kicker"><span class="landing-kicker-line"></span>PEOPLE &amp; CULTURE / MONITORING</span>'+
      '<h1 id="landing-title">Clarity across<br>every journey.</h1>'+
      '<p class="landing-hero-lead">See what needs attention.</p>'+
      '<p class="landing-hero-copy">One read-only view of people, onboarding, performance and milestones.</p>'+
      '<div class="landing-hero-actions"><a href="#overview" data-nav="overview" class="landing-primary-cta">Enter workspace <span aria-hidden="true">→</span></a></div></div></section>'+
      '<footer class="landing-footer"><span>MADHOUSE DESIGN STUDIO</span>'+
      '<span>Fictional data · Demonstration only</span></footer></main></div>';
  }
  function enhanceScrollableTables(){
    const root=$('app');if(!root||typeof root.querySelectorAll!=='function')return;
    Array.from(root.querySelectorAll('.table-wrap')).forEach(function(wrap){
      if(wrap.scrollWidth>wrap.clientWidth+2){
        const section=typeof wrap.closest==='function'?wrap.closest('section'):null;
        const h=section&&typeof section.querySelector==='function'?section.querySelector('h2,h3'):null;
        wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');
        wrap.setAttribute('aria-label',((h&&h.textContent)||'Monitoring data')+' table, scroll horizontally for more columns');
        wrap.dataset.overflow='true';
      }else if(wrap.dataset&&wrap.dataset.overflow==='true'){
        wrap.removeAttribute('tabindex');wrap.removeAttribute('role');
        wrap.removeAttribute('aria-label');delete wrap.dataset.overflow;
      }
    });
  }
  function focusWorkspaceHeading(){
    const root=$('app');if(!root||typeof root.querySelector!=='function')return;
    const heading=root.querySelector('#main-content h1, #landing-title');
    const target=heading||root.querySelector('#main-content');
    if(target&&typeof target.focus==='function'){
      if(heading&&typeof heading.setAttribute==='function')heading.setAttribute('tabindex','-1');
      target.focus({preventScroll:true});
    }
  }
  function focusMobileMenu(opened){
    const root=$('app');if(!root||typeof root.querySelector!=='function')return;
    const target=root.querySelector(opened?'.workspace-sidebar .mobile-drawer-close':'.mobile-top [data-action="mobile"]');
    if(target&&typeof target.focus==='function')target.focus({preventScroll:true});
  }
  function optionalMotion(method,kind){
    try{const motion=window.MJ_MOTION;
      if(motion&&typeof motion[method]==='function')motion[method](kind);
    }catch(err){/* Decorative motion never blocks navigation. */}
  }
  function render(){if(ui.tab==='welcome'){$('app').innerHTML=landingView();document.title='Maddie Journey · Madhouse Design Studio';optionalMotion('refresh','welcome');return;}const views={overview:overview,divisions:divisionsView,division:divisionView,employees:employees,milestones:milestonesView,journey:journey,kit:kitView,attendance:attendanceView,kpi:kpiView,approvals:approvalsView,sources:sourcesView,audit:activity};$('app').innerHTML='<div class="layout '+(ui.mobile?'menu-open ':'')+(ui.sidebarCollapsed?'sidebar-collapsed':'')+'">'+sidebar()+'<button type="button" class="workspace-scrim" aria-label="Close navigation" tabindex="-1" aria-hidden="true" data-action="mobile"></button><main id="main-content" class="main" tabindex="-1"'+(ui.mobile?' inert':'')+'>'+topnav()+(views[ui.tab]||overview)()+'<footer class="footer"><span>Maddie Journey · Prototype v3.3</span><span>Fictional snapshot · No connected sources</span></footer></main></div>'+(ui.divisionModal?divisionPickerModal():ui.employeePicker?memberPickerModal():ui.employeeModalOpen?employeeModal():'');document.title=title(ui.tab)+' · Maddie Journey';enhanceScrollableTables();optionalMotion('refresh',ui.tab);if(ui.employeeModalOpen||ui.divisionModal||ui.employeePicker){const modal=$('app').querySelector('[role="dialog"]');if(modal&&typeof modal.focus==='function')modal.focus({preventScroll:true});}}
  function openDivision(id,view,focusId){
    if(!data.divisions.some(function(d){return d.id===id;}))return;
    ui.scope=id;ui.activeDivision=id;
    ui.divisionTab=['summary','board','list','chart'].includes(view)?view:'summary';
    ui.highlightMember=focusId&&data.employees.some(function(e){return e.id===focusId&&e.division===id;})?focusId:'';
    modalOrigin=null;ui.viewerIds=[];ui.viewerOrigin='';ensureEmployeeScope();
    ui.tab='division';ui.employeeModalOpen=false;ui.divisionModal=false;ui.employeePicker=false;
    ui.mobile=false;ui.query='';ui.division='all';
    const route='#division/'+id+(ui.divisionTab==='summary'?'':'/'+ui.divisionTab);
    if(location.hash!==route)location.hash=route;
    window.scrollTo({top:0,behavior:'instant'});render();focusWorkspaceHeading();
  }
  function navigate(tab){modalOrigin=null;if(tab==='division'){openDivision(ui.activeDivision,ui.divisionTab);return;}ui.highlightMember='';ui.viewerIds=[];ui.viewerOrigin='';ui.scope='all';ensureEmployeeScope();ui.tab=tab;ui.employeeModalOpen=false;ui.divisionModal=false;ui.employeePicker=false;ui.mobile=false;ui.query='';ui.division='all';if(location.hash!=='#'+tab)location.hash='#'+tab;window.scrollTo({top:0,behavior:'instant'});render();focusWorkspaceHeading();}
  // All data-editing functions were removed: this frontend never mutates employee records.
  function toCSV(rows){
    return rows.map(function(row){return row.map(function(value){
      let cell=String(value===null||value===undefined?'':value);
      // Protect spreadsheet recipients against accidental CSV formula execution from provider text.
      if(typeof value==='string'&&/^[\s\u0000-\u001f]*[=+@-]/.test(cell))cell="'"+cell;
      return '"'+cell.replace(/"/g,'""')+'"';
    }).join(',');}).join('\r\n');
  }
  function download(filename,mime,text){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},2500);}
  // Preserve keyboard context when in-place UI controls replace the DOM.
  function focusActionAfterRender(control){
    if(!control||!control.dataset||typeof document.querySelectorAll!=='function')return;
    const keys=['tab','kind','mode'];
    const next=Array.from(document.querySelectorAll('[data-action]')).find(function(el){
      return el.dataset&&el.dataset.action===control.dataset.action&&keys.every(function(key){
        return !control.dataset[key]||el.dataset[key]===control.dataset[key];
      });
    });
    if(next&&typeof next.focus==='function')next.focus({preventScroll:true});
  }
  function action(name,button){
    if(name==='mobile'){ui.mobile=!ui.mobile;const opened=ui.mobile;render();focusMobileMenu(opened);return;}
    if(name==='toggle-sidebar'){ui.sidebarCollapsed=!ui.sidebarCollapsed;try{localStorage.setItem('maddie-journey-sidebar-collapsed',String(ui.sidebarCollapsed));}catch(err){}render();focusActionAfterRender(button);return;}
    if(name==='nav'){navigate(button.dataset.tab);return;}
    if(name==='set-theme'){setTheme(button.dataset.themeValue);return;}
    if(name==='quick-search'){navigate('employees');const search=$('app')&&$('app').querySelector('[data-ui="query"]');if(search&&typeof search.focus==='function')search.focus();return;}
    if(name==='clear-search'){ui.query='';render();const search=$('app')&&$('app').querySelector('[data-ui="query"]');if(search&&typeof search.focus==='function')search.focus();return;}
    if(name==='work-view'){
      const next=button.dataset.mode==='board'?'board':'list';
      if(ui.workView===next)return;
      ui.workView=next;try{sessionStorage.setItem('maddie-journey-workview',next);}catch(err){}
      render();focusActionAfterRender(button);optionalMotion('feedback','attention');return;
    }
    if(name==='journey-view'){
      const next=button.dataset.mode==='table'?'table':'board';
      if(ui.journeyView===next)return;
      ui.journeyView=next;render();focusActionAfterRender(button);optionalMotion('feedback','journey');return;
    }
    if(name==='attention-filter'){
      const next=['all','attendance','kpi','onboarding','reviews'].includes(button.dataset.kind)?button.dataset.kind:'all';
      if(ui.attentionFilter===next&&!ui.attentionShowAll)return;
      ui.attentionFilter=next;ui.attentionShowAll=false;
      render();focusActionAfterRender(button);optionalMotion('feedback','attention');return;
    }
    if(name==='attention-more'){ui.attentionShowAll=!ui.attentionShowAll;render();focusActionAfterRender(button);optionalMotion('feedback','attention');return;}
    if(name==='division-tab'){
      const next=['summary','board','list','chart'].includes(button.dataset.tab)?button.dataset.tab:'summary';
      const route='#division/'+ui.activeDivision+(next==='summary'?'':'/'+next);
      if(ui.tab==='division'&&ui.divisionTab===next&&location.hash===route)return;
      ui.divisionTab=next;if(ui.tab==='division'&&location.hash!==route)location.hash=route;
      render();focusActionAfterRender(button);optionalMotion('feedback','division');return;
    }
    if(name==='open-org'){openDivision(button.dataset.division,'chart');return;}
    if(name==='milestone-category'){
      if(!milestoneKinds.some(function(k){return k.id===button.dataset.kind;}))return;
      if(ui.milestoneCategory===button.dataset.kind&&!ui.milestoneShowAll)return;
      ui.milestoneCategory=button.dataset.kind;ui.milestoneShowAll=false;
      render();focusActionAfterRender(button);optionalMotion('feedback','milestone');return;
    }
    if(name==='milestone-more'){ui.milestoneShowAll=!ui.milestoneShowAll;render();focusActionAfterRender(button);optionalMotion('feedback','milestone');return;}
    if(name==='milestone-division'){ui.divisionPickerMode='milestone';ui.divisionModal=true;ui.employeePicker=false;render();return;}
    if(name==='set-milestone-division'){const id=button.dataset.division;if(id!=='all'&&!data.divisions.some(function(d){return d.id===id;}))return;ui.milestoneDivision=id;ui.milestoneShowAll=false;ui.divisionModal=false;render();return;}
    if(name==='choose-division'){ui.divisionPickerMode='view';ui.divisionModal=true;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='choose-scope'){ui.divisionPickerMode='scope';ui.divisionModal=true;ui.employeePicker=false;ui.employeeModalOpen=false;render();return;}
    if(name==='set-scope'){const id=button.dataset.division;if(id!=='all'&&!data.divisions.some(function(d){return d.id===id;}))return;ui.scope=id;ui.divisionModal=false;ensureEmployeeScope();if(ui.tab==='division'){if(id==='all')navigate('divisions');else openDivision(id);}else render();return;}
    if(name==='choose-employee'){ui.employeePicker=true;ui.pickerDivision=ui.scope!=='all'?ui.scope:ui.tab==='division'?ui.activeDivision:emp().division;ui.employeeModalOpen=false;ui.divisionModal=false;render();return;}
    if(name==='picker-division'){if(!data.divisions.some(function(d){return d.id===button.dataset.division;}))return;ui.pickerDivision=button.dataset.division;render();return;}
    if(name==='pick-member'){const selected=emp(button.dataset.id);if(!selected)return;ui.employee=selected.id;ui.scope=selected.division;ui.employeePicker=false;if(ui.milestonePicking){ui.milestonePicking=false;ui.detail='milestones';ui.employeeModalOpen=true;}render();return;}
    if(name==='goto-division'){ui.divisionModal=false;openDivision(button.dataset.division);return;}
    if(name==='open'){
      const requested=button.dataset.id||ui.employee;
      if(!emp(requested)){modalOrigin=null;return;}
      startViewer(requested);ui.employee=requested;
      ui.detail=['preview','milestones','kpi','journey','kit','attendance','approvals','info'].includes(button.dataset.detail)?
        button.dataset.detail:'preview';
      ui.divisionModal=false;ui.employeePicker=false;ui.employeeModalOpen=true;render();return;
    }
    if(name==='viewer-prev'||name==='viewer-next'){
      if(!ui.employeeModalOpen)return;
      const index=ui.viewerIds.indexOf(ui.employee),offset=name==='viewer-next'?1:-1;
      const selected=ui.viewerIds[index+offset];
      if(index<0||!selected||!emp(selected))return;
      ui.employee=selected;render();
      const control=$('app').querySelector('[data-action="'+name+'"]');
      if(control&&!control.disabled&&typeof control.focus==='function')control.focus({preventScroll:true});
      else {const tab=$('app').querySelector('.employee-modal-tabs .employee-tab.active');
        if(tab&&typeof tab.focus==='function')tab.focus({preventScroll:true});}
      return;
    }
    if(name==='viewer-division'){
      const selected=emp(ui.employee);
      if(!ui.employeeModalOpen||!selected||selected.division!==button.dataset.division)return;
      openDivision(selected.division,'list',selected.id);return;
    }
    if(name==='close'){ui.employeeModalOpen=false;ui.divisionModal=false;ui.employeePicker=false;ui.milestonePicking=false;ui.viewerIds=[];ui.viewerOrigin='';render();restoreModalOrigin();return;}
    if(name==='detail'){ui.detail=button.dataset.tab;render();const selected=$('app').querySelector('.employee-modal-tabs .employee-tab.active');if(selected&&typeof selected.focus==='function')selected.focus({preventScroll:true});return;}
    if(name==='export-csv'){const rows=[['Employee ID','Name','Division','Role','Start date','Journey %','Welcome kit %','KPI score %','Performance rating','Final approval']].concat(filtered().map(function(x){return [x.id,x.name,div(x.division).name,x.jobTitle,x.startDate,journeyPct(x),kitPct(x),score(x),rating(score(x)),x.review.coo.status];}));download('maddie-journey-directory-visible.csv','text/csv;charset=utf-8',toCSV(rows));return;}
    if(name==='attendance-csv'){const rows=[['Employee ID','Employee','Division','Date','Type','Approval','Verified','Reason','Supervisor remarks']];scopedEmployees().forEach(function(x){x.attendance.forEach(function(r){rows.push([x.id,x.name,div(x.division).name,r.date,r.type,r.approval,r.verified?'Yes':'No',r.reason,r.remarks]);});});download('maddie-journey-attendance.csv','text/csv;charset=utf-8',toCSV(rows));return;}
  }
  document.addEventListener('click',function(ev){const dept=ev.target.closest('[data-nav-division]');if(dept){ev.preventDefault();openDivision(dept.dataset.navDivision);return;}const nav=ev.target.closest('[data-nav]');if(nav){ev.preventDefault();navigate(nav.dataset.nav);return;}const act=ev.target.closest('[data-action]');if(act){ev.preventDefault();if(['open','choose-division','choose-scope','choose-employee','milestone-division'].includes(act.dataset.action))rememberModalOrigin(act);action(act.dataset.action,act);return;}if(['employee','division','picker'].includes(ev.target.dataset.overlay)){ui.employeeModalOpen=false;ui.divisionModal=false;ui.employeePicker=false;ui.viewerIds=[];ui.viewerOrigin='';render();restoreModalOrigin();}});
  document.addEventListener('change',function(ev){
    const el=ev.target;
    if(!el.dataset.ui)return;
    // The only selectable fields are presentation filters (not employee data).
    if(el.dataset.ui==='employee'&&emp(el.value)){ui.employee=el.value;render();}
    else if(el.dataset.ui==='division'&&(el.value==='all'||data.divisions.some(function(d){return d.id===el.value;}))){ui.division=el.value;render();}
    else if(el.dataset.ui==='activeDivision'){openDivision(el.value);}
    else if(el.dataset.ui==='frequency'){
      if(ui.frequency===el.value)return;
      ui.frequency=el.value;render();
      const control=$('app').querySelector('[data-ui="frequency"]');
      if(control&&typeof control.focus==='function')control.focus({preventScroll:true});
      optionalMotion('feedback','attendance');
    }
    else if(el.dataset.ui==='employeeSort'&&['name','division','journey','kit','kpi'].includes(el.value)){
      if(ui.employeeSort===el.value)return;
      ui.employeeSort=el.value;render();
      const control=$('app').querySelector('[data-ui="employeeSort"]');
      if(control&&typeof control.focus==='function')control.focus({preventScroll:true});
      optionalMotion('feedback','directory');
    }
    else if(el.dataset.ui==='query'){ui.query=el.value;render();}
  });
  document.addEventListener('input',function(ev){const el=ev.target;if(el.dataset.ui==='query'){const p=el.selectionStart;ui.query=el.value;const focus=document.activeElement;const list=filtered();const table=$('app').querySelector('.panel.no-pad');if(table){const existing=table.querySelector('.table-wrap, .empty');if(existing)existing.outerHTML=employeesTable(list);const count=table.querySelector('.directory-results-count');if(count)count.textContent=list.length+' of '+scopedEmployees().length+' employees';const clearSlot=table.querySelector('.directory-clear-slot');if(clearSlot){const hasClear=!!clearSlot.querySelector('[data-action="clear-search"]');if(ui.query&&!hasClear)clearSlot.innerHTML=button('Clear search','clear-search','','small');else if(!ui.query&&hasClear)clearSlot.innerHTML='';}enhanceScrollableTables();}if(focus!==el){el.focus();try{el.setSelectionRange(p,p);}catch(err){}}}});
  window.addEventListener('resize',enhanceScrollableTables);
  document.addEventListener('toggle',enhanceScrollableTables,true);
  document.addEventListener('keydown',function(ev){
    const anyOpen=ui.employeeModalOpen||ui.divisionModal||ui.employeePicker;
    const typing=!!(ev.target&&((/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName||''))||ev.target.isContentEditable));
    if(!anyOpen&&!ui.mobile&&((ev.key==='/'&&!typing)||((ev.ctrlKey||ev.metaKey)&&String(ev.key).toLowerCase()==='k'))){
      ev.preventDefault();
      action('quick-search',{dataset:{}});
      return;
    }
    if(ev.key==='Escape'&&ui.mobile){
      ev.preventDefault();ui.mobile=false;render();focusMobileMenu(false);return;
    }
    if(ev.key==='Tab'&&ui.mobile){
      const drawer=$('app').querySelector('.workspace-sidebar');
      if(drawer&&typeof drawer.querySelectorAll==='function'){
        const elements=Array.from(drawer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'));
        if(elements.length){
          const first=elements[0],last=elements[elements.length-1];
          if(!elements.includes(document.activeElement)||
             (ev.shiftKey&&document.activeElement===first)||
             (!ev.shiftKey&&document.activeElement===last)){
            ev.preventDefault();(ev.shiftKey?last:first).focus();
          }
        }
      }return;
    }
    if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){
      const group=ev.target&&typeof ev.target.closest==='function'?
        ev.target.closest('.employee-modal-tabs, .division-tabs'):null;
      if(group&&typeof group.querySelectorAll==='function'){
        const buttons=Array.from(group.querySelectorAll('button:not([disabled])'));
        const index=buttons.indexOf(ev.target);
        if(index>=0&&buttons.length>1){
          ev.preventDefault();const step=ev.key==='ArrowRight'?1:-1;
          const target=buttons[(index+step+buttons.length)%buttons.length];
          if(target&&target.dataset)action(target.dataset.action,target);
          return;
        }
      }
    }
    if(!anyOpen)return;
    if(ev.key==='Escape'){
      ui.employeeModalOpen=false;ui.divisionModal=false;ui.employeePicker=false;ui.viewerIds=[];ui.viewerOrigin='';render();restoreModalOrigin();return;
    }
    if(ev.key!=='Tab')return;
    // Keep keyboard navigation within whichever centered dialog is on top.
    const modal=$('app').querySelector('[role="dialog"]');
    if(!modal||typeof modal.querySelectorAll!=='function')return;
    const focusables=Array.from(modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    if(!focusables.length){ev.preventDefault();modal.focus();return;}
    const first=focusables[0],last=focusables[focusables.length-1];
    if(typeof modal.contains==='function'&&!modal.contains(document.activeElement)){
      ev.preventDefault();first.focus();return;
    }
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
  });
  window.addEventListener('hashchange',function(){
    const target=location.hash.slice(1);
    if(target==='welcome'&&ui.tab!=='welcome')navigate('welcome');
    else if(target.startsWith('division/')){
      const parts=target.slice(9).split('/'),id=parts[0],view=parts[1]||'summary';
      if(parts.length<=2&&['summary','board','list','chart'].includes(view)&&
        data.divisions.some(function(d){return d.id===id;})&&
        (ui.tab!=='division'||ui.activeDivision!==id||ui.divisionTab!==view))openDivision(id,view);
    }else if(items.some(function(a){return a[0]===target;})&&target!==ui.tab)navigate(target);
  });
  const hash=location.hash.slice(1),parts=hash.startsWith('division/')?hash.slice(9).split('/'):[],
    validDivision=parts.length>0&&parts.length<=2&&
      data.divisions.some(function(d){return d.id===parts[0];})&&
      (!parts[1]||['summary','board','list','chart'].includes(parts[1]));
  if(validDivision){ui.tab='division';ui.activeDivision=parts[0];ui.scope=ui.activeDivision;
    ui.divisionTab=parts[1]||'summary';ensureEmployeeScope();
  }else if(items.some(function(a){return a[0]===hash;}))ui.tab=hash;else ui.tab='welcome';
  render();
})();