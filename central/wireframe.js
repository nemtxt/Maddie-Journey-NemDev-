/* MADDIE CENTRAL — wireframe-informed executive components.
   Only fictional MC_DATA and MC_CONFIG are used. Source wireframe's 54-person/
   live/payroll/candidate assumptions are deliberately NOT imported. */
(function(root){
 'use strict';
 const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[a]));
 const escapeUrl=x=>encodeURIComponent(x);
 const href=(cat,sub)=>'#/category/'+escapeUrl(cat)+(sub?'/'+escapeUrl(sub):'');
 const fmt=n=>Number(n).toLocaleString('en-PH');
 const percent=(n,d)=>d?Math.round(n*100/d):0;
 const at=(items,status)=>items.filter(r=>r.status===status).length;
 const link=(text,cat,sub)=>'<a href="'+href(cat,sub)+'">'+esc(text)+'<span aria-hidden="true">↗</span></a>';
 const date=new Date('2026-11-13T12:00:00');
 const dateLabel=iso=>{const dt=new Date(iso+'T12:00:00');return Number.isNaN(dt.getTime())?'Unscheduled':dt.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});};
 const chip=(value,extra='')=>'<span class="wf-chip '+extra+'">'+esc(value)+'</span>';
 const cleanOverrides=(model,overrides={})=>{
   const map={};
   for(const [name,rows] of Object.entries(model.collections)){
     map[name]=rows.map(r=>({...r,status:overrides[r.recordId]||r.status}));
   }
   return map;
 };
 const isKnown=(d)=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(new Date(d+'T12:00:00').getTime());
 const deadlineRows=(data)=>{
   const rows=[];
   for(const [key,category,sub] of [
    ['decisions','executive-scoreboard','executive-decisions'],
    ['events','culture-community','corporate-calendar'],
    ['training','maddie-learning-hub','annual-training-calendar'],
    ['hiring','talent-acquisition','manpower-requisition'],
    ['journey','maddie-journey','employee-journey-profile']
   ]){
     for(const r of data[key]){
       if(isKnown(r.dueDate))rows.push({...r,source:key,category,sub});
     }
   }
   return rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.recordId.localeCompare(b.recordId));
 };
 const horizon=(days)=>{const start=new Date('2026-11-13T00:00:00Z');const end=new Date(start);end.setUTCDate(end.getUTCDate()+days);return [start.toISOString().slice(0,10),end.toISOString().slice(0,10)];};
 const within=(items,days)=>{const [start,end]=horizon(days);return items.filter(x=>x.dueDate>=start&&x.dueDate<end)};
 const tone=(i)=>['orange','blue','violet','mint','pink','yellow','slate','coral','cobalt'][i%9];
 const littleCard=(title,value,note,i,cat,sub)=>'<a class="wf-kpi wf-tone-'+tone(i)+'" href="'+href(cat,sub)+'"><span class="wf-kpi-top">'+esc(title)+
    '<span class="wf-kpi-arrow" aria-hidden="true">↗</span></span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></a>';
 const panel=(label,sub,body,cls='')=>'<section class="wf-panel '+cls+'"><div class="wf-panel-head"><div><span class="wf-eyebrow">'+esc(label)+'</span><h3>'+esc(sub)+'</h3></div></div>'+body+'</section>';
 const allAlerts=(data)=>{
   const docs=data.docs.filter(x=>x.status==='Requested').length;
   const unreviewed=data.docs.filter(x=>x.status==='Not Started').length;
   const exceptions=data.attendance.filter(x=>['Late','Absent'].includes(x.status)).length;
   const assessments=data.journey.filter(x=>x.status==='For Assessment').length;
   const decisions=data.decisions.filter(x=>x.status==='Decision Required').length;
   return [
     {id:'documents',label:'201 file requests',detail:'Fictional document checkpoints requiring submission',count:docs,level:'high',cat:'people-directory',sub:'employment-documents'},
     {id:'unchecked',label:'Documents not reviewed',detail:'Sample checkpoints awaiting an initial review',count:unreviewed,level:'medium',cat:'people-directory',sub:'employment-documents'},
     {id:'attendance',label:'Attendance exceptions',detail:'Late or absent entries verified within the demo fixture',count:exceptions,level:'medium',cat:'workforce-pulse',sub:'lates-and-absence-monitoring'},
     {id:'journey',label:'Journey assessments',detail:'Synthetic employee journeys marked for assessment',count:assessments,level:'medium',cat:'maddie-journey',sub:'career-direction-level-gates'},
     {id:'decisions',label:'Executive decisions',detail:'Fictional action records requiring a decision',count:decisions,level:'high',cat:'executive-scoreboard',sub:'executive-decisions'}
   ];
 };
 function departments(model){
   const entries=Object.entries(model.people.reduce((acc,p)=>(acc[p.division]=(acc[p.division]||0)+1,acc),{}))
    .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
   const total=model.people.length;
   const segments=entries.map(([name,value],i)=>'<span class="wf-stack-segment wf-stack-'+(i%7)+
      '" style="width:'+percent(value,total)+'%" title="'+esc(name)+': '+value+' fictional employees"></span>').join('');
   const legend=entries.map(([name,value],i)=>'<div class="wf-dept-row"><i class="wf-swatch wf-stack-'+(i%7)+'"></i><span>'+esc(name)+
     '</span><b>'+value+'</b></div>').join('');
   return panel('WORKFORCE COMPOSITION','Headcount by division',
     '<p class="wf-panel-copy">'+total+' fictional employees across '+entries.length+' divisions. Derived from the shared Employee Masterlist.</p>'+
     '<div class="wf-stack" role="img" aria-label="'+entries.map(e=>e[0]+' '+e[1]).join(', ')+'">'+segments+'</div>'+
     '<div class="wf-dept-grid">'+legend+'</div>'+
     '<div class="wf-panel-foot">'+link('Open Employee Masterlist','people-directory','employee-masterlist')+'</div>','wf-department-panel');
 }
 function upcoming(model,data,days){
   const entries=within(deadlineRows(data),days).slice(0,6);
   const body=entries.length?'<ol class="wf-timeline">'+entries.map(r=>'<li><div class="wf-date">'+dateLabel(r.dueDate)+'</div><div><strong>'+esc(r.name)+
     '</strong><small>'+esc(r.source==='decisions'?'Executive action':r.source==='events'?'Culture activity':r.source==='training'?'Learning program':r.source==='hiring'?'Sample requisition':'Journey review')+
     ' · '+esc(r.status)+'</small></div><a href="'+href(r.category,r.sub)+'" aria-label="View '+esc(r.name)+'">↗</a></li>').join('')+'</ol>':
     '<div class="wf-empty">No fictional due dates in this selected period. No events were invented.</div>';
   return panel('UPCOMING / DEMO SCHEDULE','Dates to look ahead to',
     '<p class="wf-panel-copy">Only documented due dates from the fictional records, starting November 13, 2026.</p>'+body);
 }
 function workspaceTable(model,config,data,summary){
   const rows=config.categories.map((c,i)=>{
     const s=summary&&typeof summary.create==='function'?summary.create(model,c.id):null;
     const m=s?.metrics?.[0];
     const attention=({ 'people-directory':at(data.docs,'Requested'),
       'pay-benefits':at(data.benefits,'For Review'),
       'workforce-pulse':data.attendance.filter(r=>['Late','Absent'].includes(r.status)).length,
       'maddie-journey':at(data.journey,'For Assessment'),
       'maddie-learning-hub':at(data.trainingAttendance,'Make-up Required'),
       'culture-community':at(data.events,'For Approval'),
       'talent-acquisition':at(data.hiring,'For Approval'),
       'people-governance':data.governance.filter(r=>r.status!=='Closed').length,
       'executive-scoreboard':at(data.decisions,'Decision Required') })[c.id];
     return '<tr><td><a href="'+href(c.id)+'"><span class="wf-table-num">'+String(i+1).padStart(2,'0')+'</span>'+esc(c.label)+'</a></td>'+
       '<td>'+esc(m?.label||'Summary unavailable')+'</td><td><b>'+esc(m?.value??'Not tracked')+'</b></td>'+
       '<td>'+chip(attention+' sample follow-ups',attention?'wf-attention':'')+'</td><td><a href="'+href(c.id)+'" aria-label="Open '+esc(c.label)+'">↗</a></td></tr>';
   }).join('');
   return '<section class="wf-panel wf-workspace-table"><div class="wf-panel-head"><div><span class="wf-eyebrow">ALL NINE WORKSPACES</span>'+
     '<h3>Executive monitoring matrix</h3></div>'+chip('Fictional / aggregate only')+'</div>'+
     '<div class="wf-table-scroll" role="region" tabindex="0" aria-label="Workspace monitoring overview">'+
     '<table><thead><tr><th scope="col">Workspace</th><th scope="col">Tracked metric</th><th scope="col">Value</th>'+
     '<th scope="col">Review queue</th><th scope="col">Open</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
 }
 function home(model,config,summary,overrides,state={}){
   const data=cleanOverrides(model,overrides);
   const alerts=allAlerts(data);
   const days=({week:7,month:30,quarter:90})[state.period]||30;
   const high=state.alertFilter==='high';
   const focus=alerts.filter(a=>a.count>0&&(!high||a.level==='high'));
   const deadlines=within(deadlineRows(data),days);
   const periodControls=['week','month','quarter'].map(p=>
      '<button type="button" data-action="wf-period" data-period="'+p+'" aria-pressed="'+String((state.period||'month')===p)+'">'+
      p.charAt(0).toUpperCase()+p.slice(1)+'</button>').join('');
   const focusAlerts=focus.map(a=>
      '<a class="wf-attention-row" href="'+href(a.cat,a.sub)+'"><span class="wf-attention-symbol wf-'+a.level+'">'+(a.level==='high'?'!':'•')+'</span>'+
      '<span><strong>'+esc(a.label)+'</strong><small>'+esc(a.detail)+'</small></span>'+
      '<b>'+fmt(a.count)+'</b><span aria-hidden="true">↗</span></a>').join('');
   return '<section class="wf-executive" aria-label="Fictional executive wireframe overview">'+
     '<div class="wf-exec-head"><div><span class="wf-eyebrow">EXECUTIVE OPERATING PICTURE / 2027 TRIAL</span><h2>Start with what matters.</h2>'+
     '<p>Monitor the sample workforce, priorities and upcoming actions without opening every workspace.</p></div>'+
     '<div class="wf-period" role="group" aria-label="Upcoming demonstration date range">'+periodControls+'</div></div>'+
     '<div class="wf-top-grid"><section class="wf-brief-card"><div><span class="wf-eyebrow">WORKFORCE SNAPSHOT</span>'+
     '<h3>'+model.people.length+' fictional people.<br><em>'+fmt(alerts.reduce((a,b)=>a+b.count,0))+' sample checkpoints.</em></h3>'+
     '<p>Counts are aggregate examples across multiple record types, not unique people or verified operational alerts.</p></div>'+
     '<div class="wf-brief-pills">'+chip(config.categories.length+' workspaces')+chip(model.metrics.divisions+' divisions')+chip('No live sync')+'</div>'+
     '<a href="'+href('executive-scoreboard')+'" class="wf-brief-link">Explore executive scoreboard <span>↗</span></a>'+
     '<div class="wf-brief-deco" aria-hidden="true"></div></section>'+
     '<section class="wf-panel wf-attention-panel"><div class="wf-panel-head"><div><span class="wf-eyebrow">ACTION CENTER</span><h3>Needs attention</h3></div>'+
     '<div class="wf-mini-segment" role="group" aria-label="Attention category">'+
     '<button type="button" data-action="wf-alert-filter" data-filter="all" aria-pressed="'+String(!high)+'">All</button>'+
     '<button type="button" data-action="wf-alert-filter" data-filter="high" aria-pressed="'+String(high)+'">High</button></div></div>'+
     '<div class="wf-attention-list">'+(focusAlerts||'<div class="wf-empty">No matching fictional review queues.</div>')+'</div>'+
     '<div class="wf-panel-foot">'+chip('No real notifications or approvals')+'</div></section></div>'+
     '<div class="wf-kpi-grid">'+
       littleCard('Headcount',model.people.length,model.metrics.divisions+' fictional divisions',0,'people-directory','employee-masterlist')+
       littleCard('Sample requisitions',data.hiring.filter(x=>!['Hired','Cancelled','Rejected'].includes(x.status)).length,'Open demo staffing stages',1,'talent-acquisition','recruitment-pipeline')+
       littleCard('Attendance exceptions',data.attendance.filter(x=>['Late','Absent'].includes(x.status)).length,'Verified within the fixture',2,'workforce-pulse','lates-and-absence-monitoring')+
       littleCard('201 file requests',at(data.docs,'Requested'),'Fictional document checkpoints',3,'people-directory','employment-documents')+
       littleCard('Upcoming due dates',deadlines.length,'Next '+days+' days from demo snapshot',4,'executive-scoreboard','executive-decisions')+
     '</div>'+
     '<div class="wf-dual-panels">'+departments(model)+upcoming(model,data,days)+'</div>'+
     workspaceTable(model,config,data,summary)+
     '</section>';
 }
 const board=(label,groups,cat,sub)=>{
   const html=groups.map(([title,rows],i)=>'<div class="wf-board-column"><header><span>'+esc(title)+'</span>'+chip(rows.length)+'</header>'+
      '<div class="wf-board-items">'+(rows.length?rows.slice(0,6).map(r=>'<a href="'+href(cat,sub)+'" class="wf-board-item">'+
      '<strong>'+esc(r.boardName||r.name)+'</strong><small>'+esc(r.boardDetail||r.division||r.status)+'</small></a>').join(''):
      '<div class="wf-board-empty">No demo records</div>')+'</div></div>').join('');
   return panel('STATUS BOARD / READ ONLY',label,'<div class="wf-board-grid">'+html+'</div><p class="wf-panel-copy">Demo review cards cannot be dragged into approved states. Open the linked record view to inspect fictional details.</p>','wf-board-panel');
 };
 function learning(model,data){
   const rows=data.training.slice(0,5).map(t=>{
     const assigned=data.trainingAttendance.filter(x=>x.trainingId===t.recordId);
     const attended=assigned.filter(x=>x.status==='Attended').length,pct=percent(attended,assigned.length);
     return '<div class="wf-course-row"><div class="wf-course-ring" style="--completion:'+pct+'%" role="img" aria-label="'+pct+' percent of assigned sample attendance records marked attended"><span>'+pct+'%</span></div>'+
       '<div><strong>'+esc(t.name)+'</strong><small>'+esc(t.status)+' · '+assigned.length+' linked participants</small></div>'+
       '<a href="'+href('maddie-learning-hub','training-attendance')+'" aria-label="Open training attendance for '+esc(t.name)+'">↗</a></div>';
   }).join('');
   return panel('TRAINING / PARTICIPATION','Course participation example',rows+
       '<p class="wf-panel-copy">Percentages represent fictional attendance entries only, not assessment scores or verified course completion.</p>','wf-courses');
 }
 function attendance(data){
   const rows=data.attendance;
   const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
   const byDay=Object.fromEntries(days.map(d=>[d,0]));
   for(const r of rows){
     if(!isKnown(r.date)||!['Late','Absent'].includes(r.status))continue;
     const d=new Date(r.date+'T12:00:00Z').getUTCDay();
     byDay[days[(d+6)%7]]++;
   }
   const largest=Math.max(1,...Object.values(byDay));
   const html=days.map((name,i)=>{
     const count=byDay[name],level=Math.round(count*4/largest);
     return '<div class="wf-heat-cell"><strong>'+name+'</strong><span class="wf-heat-bar wf-heat-'+level+'" style="height:'+(20+Math.round(count*60/largest))+'px" title="'+count+' fictional exceptions"></span><small>'+count+'</small></div>';
   }).join('');
   return panel('ATTENDANCE / EXCEPTION PATTERN','Late and absent demo records by weekday',
     '<div class="wf-heat-grid">'+html+'</div><p class="wf-panel-copy">Only verified fictional late/absent event entries are counted. This is not a present-today or attendance-rate estimate.</p>','wf-heat-panel');
 }
 function calendar(data,month){
   const year=2026,m=month===11?11:10;
   const first=new Date(Date.UTC(year,m,1)),n=new Date(Date.UTC(year,m+1,0)).getUTCDate();
   const dow=first.getUTCDay();
   const weekdays=['Su','Mo','Tu','We','Th','Fr','Sa'];
   const map={};for(const ev of data.events)if(isKnown(ev.dueDate))map[ev.dueDate]=(map[ev.dueDate]||[]).concat(ev);
   let squares=weekdays.map(d=>'<span class="wf-calendar-dayhead">'+d+'</span>').join('');
   squares+='<span class="wf-calendar-empty"></span>'.repeat(dow);
   for(let d=1;d<=n;d++){
     const date=year+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
     const events=map[date]||[];
     squares+='<span class="wf-calendar-day'+(events.length?' wf-calendar-event':'')+'" title="'+(events.length?esc(events.map(x=>x.name).join(', ')):'No sample event')+'">'+d+
       (events.length?'<i aria-hidden="true"></i><span class="sr-only">'+esc(events.length+' fictional events')+'</span>':'')+'</span>';
   }
   return panel('CULTURE CALENDAR / FICTIONAL','Scheduled sample activities',
     '<div class="wf-calendar-top"><strong>'+(['November','December'][m-10])+' 2026</strong>'+
     '<div class="wf-mini-segment" role="group" aria-label="Fictional calendar month">'+
     [10,11].map(x=>'<button data-action="wf-calendar" type="button" data-month="'+x+'" aria-pressed="'+String(m===x)+'">'+(x===10?'Nov':'Dec')+'</button>').join('')+
     '</div></div><div class="wf-calendar">'+squares+'</div>'+
     '<p class="wf-panel-copy">Marked dates are taken from fictional event due dates; no employee invitations or real calendars are connected.</p>','wf-calendar-panel');
 }
 function category(model,cat,overrides,state={}){
   const data=cleanOverrides(model,overrides);
   let body='';
   switch(cat.id){
     case 'people-directory':body=departments(model);break;
     case 'pay-benefits':{
       const groups=['For Review','In Progress','Completed'].map(s=>[s,data.benefits.filter(r=>r.status===s)]);
       const segments=groups.map(([status,rows],i)=>'<div class="wf-benefit-step wf-step-'+i+'"><span>'+esc(status)+'</span><b>'+rows.length+'</b><small>fictional benefit checkpoints</small></div>').join('');
       body=panel('BENEFITS / SAMPLE PROCESS','Benefit readiness tracker',
         '<div class="wf-benefit-steps">'+segments+'</div><p class="wf-panel-copy">Unlike the uploaded wireframe, this trial has no verified payroll release date, salary totals or deductions. These are benefit status aggregates only.</p>');
       break;
     }
     case 'workforce-pulse':body=attendance(data);break;
     case 'maddie-journey':{
       const statuses=['Pending Requirements','In Progress','For Assessment','Completed'];
       body=board('Employee journey stages',statuses.map(s=>[s,data.journey.filter(r=>r.status===s).map(r=>({...r,boardName:r.name,boardDetail:r.percent+'% milestone checks'}))]),cat.id,'employee-journey-profile');break;
     }
     case 'maddie-learning-hub':body=learning(model,data);break;
     case 'culture-community':body=calendar(data,state.calendarMonth);break;
     case 'talent-acquisition':{
       const phase=[
         ['Requested / Approved',['For Approval','Approved']],
         ['Sourcing / Screening',['Sourcing','Screening']],
         ['Interview / Assessment',['Initial Interview','Assessment','Final Interview','Reference Check']],
         ['Offer / Hired',['For Offer','Offer Accepted','Hired']]
       ];
       body=board('Requisition pipeline — not candidate records',phase.map(([title,statuses])=>[title,data.hiring.filter(r=>statuses.includes(r.status)).map(r=>({...r,boardDetail:r.division+' · '+r.status}))]),cat.id,'recruitment-pipeline');break;
     }
     case 'people-governance':{
       const statuses=['Open','Initial Review','Under Investigation','Awaiting Response','Governance Review','For Authorized Decision','Action in Progress','Closed'];
       body=panel('AGGREGATE ONLY / RESTRICTED','Governance case stages',
          '<div class="wf-governance-grid">'+statuses.map((s,i)=>'<div class="wf-governance-stage"><span class="wf-swatch wf-stack-'+(i%7)+'"></span>'+
          '<span>'+esc(s)+'</span><strong>'+at(data.governance,s)+'</strong></div>').join('')+'</div>'+
          '<p class="wf-panel-copy">Fictional case shells only: no employee names, allegations, evidence, policy documents or approval workflows.</p>');break;
     }
     case 'executive-scoreboard':{
       const pairs=[
         ['201 checkpoints verified',at(data.docs,'Approved/Verified'),data.docs.length],
         ['Journey profiles completed',at(data.journey,'Completed'),data.journey.length],
         ['Training participation marked attended',at(data.trainingAttendance,'Attended'),data.trainingAttendance.length],
         ['Regular employment examples',model.people.filter(p=>p.employmentStatus==='Regular').length,model.people.length]
       ];
       body=panel('EXECUTIVE MONITORING / RATIOS','Source-based demo coverage',
         '<div class="wf-executive-ratios">'+pairs.map(([label,n,d],i)=>'<div class="wf-ratio"><div><span>'+esc(label)+'</span>'+
           '<strong>'+percent(n,d)+'%</strong></div><div class="wf-ratio-track"><span class="wf-ratio-bar wf-stack-'+(i%7)+'" style="width:'+percent(n,d)+'%"></span></div>'+
           '<small>'+n+' of '+d+' fictional record checkpoints</small></div>').join('')+'</div>'+
         '<p class="wf-panel-copy">These percentages are descriptive sample ratios, not approved WIG #4 targets or verified employee KPIs.</p>');break;
     }
   }
   return '<div class="wf-category-feature" id="mc-wireframe-feature"><div class="wf-feature-head"><div><span class="wf-eyebrow">WIREFRAME-INSPIRED / FOCUSED ANALYSIS</span>'+
     '<h2>Closer look: '+esc(cat.label)+'</h2></div>'+chip('Fictional sample data')+'</div>'+body+'</div>';
 }
 function palette(config){
   return '<dialog class="wf-command" id="mc-command" aria-label="Search Maddie Central workspaces"><div class="wf-command-head">'+
     '<div><span class="wf-eyebrow">QUICK NAVIGATION</span><h2>Find a workspace or view</h2></div>'+
     '<button type="button" class="wf-command-close" data-action="wf-command-close" aria-label="Close search">×</button></div>'+
     '<label class="wf-command-field" for="mc-command-input"><span aria-hidden="true">⌕</span><input id="mc-command-input" type="search" autocomplete="off" placeholder="Search nine workspaces and 86 views" aria-label="Search workspaces and subcategories"></label>'+
     '<div id="mc-command-results" aria-live="polite">'+results(config,'')+'</div>'+
     '<div class="wf-command-foot">Use Enter to open a result · Esc to close · Ctrl / Cmd + K to search</div></dialog>';
 }
 function results(config,query){
   const q=String(query||'').trim().toLowerCase();
   const candidates=[];
   for(const c of config.categories){
     if(!q||c.label.toLowerCase().includes(q)||c.subtitle.toLowerCase().includes(q)){
       candidates.push({title:c.label,group:'Workspace',cat:c.id,sub:null});
     }
     for(const s of c.subcategories){
       if(q&&(s.label.toLowerCase().includes(q)||c.label.toLowerCase().includes(q)))candidates.push({title:s.label,group:c.label,cat:c.id,sub:s.id});
     }
   }
   const limited=candidates.slice(0,14);
   return limited.length?limited.map(r=>'<a class="wf-command-result" href="'+href(r.cat,r.sub)+'"><span><b>'+esc(r.title)+'</b>'+
     '<small>'+esc(r.group)+'</small></span><span aria-hidden="true">↗</span></a>').join(''):
     '<div class="wf-empty">No matching demo navigation. Try a workspace or subcategory name.</div>';
 }
 const api={home,category,palette,results,allAlerts,deadlineRows,departments,cleanOverrides};
 root.MC_WIREFRAME=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
