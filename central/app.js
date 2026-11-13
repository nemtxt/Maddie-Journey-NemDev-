/* MADDIE CENTRAL | 2027 — client-only trial UI, zero connectors and no live employee data. */
(function(){
 'use strict';
 const config=window.MC_CONFIG,model=window.MC_DATA,root=document.getElementById('app');
 if(!root)return;
 if(!config||!model){root.textContent='Fictional demo records unavailable. The app will not connect to a live source.';return;}
 const sv=(key)=>{try{return localStorage.getItem('mc-trial-'+key);}catch(_){return null;}};
 const save=(key,val)=>{try{localStorage.setItem('mc-trial-'+key,val);}catch(_){}};
 let role=config.roles.includes(sv('role'))?sv('role'):'CEO';
 let theme=sv('theme')==='dark'?'dark':'light';
 // The sidebar is a persistent desktop preference; mobile drawer state is transient.
 let sidebarCollapsed=sv('sidebar-collapsed')==='true';
 let mobileNavOpen=false;
 let categoryFocus='overview';
 let wfPeriod='month',wfAlertFilter='all',wfCalendarMonth=10;
 const isMobile=()=>typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 900px)').matches;
 let filter={query:'',status:'all',division:'all',sort:'name',descending:false};
 let routeKey='';
 let overrides={};
 try{overrides=JSON.parse(sv('demo-overrides')||'{}')||{};}catch(_){overrides={};}
 document.documentElement.dataset.theme=theme;
 const paths={
   users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
   wallet:'<rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 9h20"/><path d="M16 14h2"/>',
   activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
   route:'<circle cx="6" cy="19" r="2"/><path d="M9 19h8a4 4 0 0 0 0-8H7a4 4 0 0 1 0-8h8"/><circle cx="18" cy="3" r="2"/>',
   graduation:'<path d="m2 10 10-6 10 6-10 6-10-6ZM6 12v6c4 3 8 3 12 0v-6M22 10v7"/>',
   heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
   briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20"/>',
   shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
   chart:'<path d="M3 3v18h18M7 16l4-5 3 2 5-7"/>',
   chevron:'<path d="m9 18 6-6-6-6"/>',
   arrow:'<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
   home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10ZM9 21v-8h6v8"/>',
   search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
   lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
   export:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',
   moon:'<path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>',
   sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
   calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
   check:'<path d="m5 12 4 4L19 6"/>',
   menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
   close:'<path d="m6 6 12 12M18 6 6 18"/>',
   panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
   collapse:'<path d="m14 7-5 5 5 5M19 4v16"/>',
   expand:'<path d="m10 7 5 5-5 5M5 4v16"/>',
   info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>'
 };
 const icon=(name,cls='')=>'<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.info)+'</svg>';
 const esc=(value)=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const href=(cat,sub)=>'#/category/'+encodeURIComponent(cat)+(sub?'/'+encodeURIComponent(sub):'');
 const findCat=(id)=>config.categories.find(c=>c.id===id);
 const findSub=(cat,id)=>cat?.subcategories.find(s=>s.id===id);
 const rawRoute=()=>{
   const parts=decodeURIComponent(location.hash.replace(/^#\/?/,'')).split('/').filter(Boolean);
   if(parts[0]==='category'&&findCat(parts[1]))return {cat:findCat(parts[1]),sub:findSub(findCat(parts[1]),parts[2])||null};
   return {cat:null,sub:null};
 };
 const allowed=(cat,sub)=>{
   if(!sub)return true;
   if(sub.classification==='Highly Restricted'){
     if(cat.id==='pay-benefits')return ['Finance','P&C Lead'].includes(role);
     if(cat.id==='people-governance')return ['Governance & Compliance','P&C Lead'].includes(role);
     return ['P&C Lead','P&C Generalist'].includes(role);
   }
   if(sub.classification==='Confidential'){
     if(cat.id==='pay-benefits')return ['Finance','P&C Lead','COO'].includes(role);
     if(cat.id==='people-governance')return ['Governance & Compliance','P&C Lead'].includes(role);
     return role!=='Division Head'||cat.id==='people-directory';
   }
   return true;
 };
 const rowScope=(rows)=>role==='Division Head'?rows.filter(r=>!r.employeeId||model.byId.get(r.employeeId)?.divisionId==='design'):rows;
 const statusOptions=(kind)=>{
   const map={'employees':'employmentStatus','salary':'executiveStatus','documents':'documentStatus',
     'journey':'journeyStatus','performance':'executiveStatus','attendance':'attendanceStatus',
     'attendance-summary':'executiveStatus','training':'trainingStatus','training-attendance':'trainingAttendance',
     'recruitment':'recruitmentStatus','cases':'caseStatus','events':'eventStatus',
     'milestones':'eventStatus','actions':'executiveStatus','benefits':'executiveStatus','summary':'executiveStatus',
     'movements':'executiveStatus'};
   return config.options[map[kind]||'executiveStatus'];
 };
 const writable=(cat,sub)=>allowed(cat,sub)&&((['P&C Lead','P&C Generalist'].includes(role)&&
   !(sub.classification==='Highly Restricted'&&role!=='P&C Lead'))||
   (role==='Governance & Compliance'&&cat.id==='people-governance')||
   (role==='Finance'&&cat.id==='pay-benefits'));
 const recordStatus=(r)=>overrides[r.recordId]||r.status;
 const metric=(value,label,detail)=>'<div class="metric"><span class="metric-number">'+esc(value)+'</span><strong>'+esc(label)+'</strong><small>'+esc(detail||'Fictional snapshot')+'</small></div>';
 const sidebar=(current)=>'<aside class="sidebar" id="side-menu" aria-label="Workspace navigation"><div class="brand"><span class="brand-mark" aria-hidden="true">M</span><span class="brand-copy"><strong>MADDIE CENTRAL</strong><small>PEOPLE & CULTURE · 2027</small></span></div>'+
   '<a class="nav-home '+(!current?'selected':'')+'" href="#/home" aria-label="Dashboard" title="Dashboard">'+icon('home')+'<span class="nav-text">Dashboard</span></a>'+
   '<div class="nav-label">WORKSPACES</div><nav class="nav-list" aria-label="Nine workspace categories">'+config.categories.map((c,i)=>
   '<a class="nav-link '+(current?.id===c.id?'selected':'')+'" '+(current?.id===c.id?'aria-current="page"':'')+
   ' href="'+href(c.id)+'" title="'+esc(c.label)+'" aria-label="'+esc(c.label)+'"><span class="nav-num">'+String(i+1).padStart(2,'0')+'</span>'+icon(c.icon)+
   '<span class="nav-text">'+esc(c.label)+'</span>'+icon('chevron','nav-chevron')+'</a>').join('')+'</nav>'+
   (current?'<details class="nav-context" open><summary>IN THIS WORKSPACE '+icon('chevron')+'</summary><div class="nav-context-body">'+
     current.subcategories.slice(0,4).map(s=>'<a href="'+href(current.id,s.id)+'" title="'+esc(s.label)+'">'+
     '<span>'+esc(s.label)+'</span>'+icon('arrow')+'</a>').join('')+
     '<a href="'+href(current.id)+'" data-action="view-link" data-view="explore">All '+current.subcategories.length+' views '+icon('arrow')+'</a></div></details>':'')+
   '<div class="side-bottom"><span class="trial-dot"></span><span class="side-status-copy">TRIAL ENVIRONMENT<br><small>51 fictional employees · no live sync</small></span></div>'+
   '<button type="button" class="mobile-close-nav" data-action="menu" aria-label="Close navigation">'+icon('close')+' Close menu</button></aside>';
 const header=(cat,sub)=>'<header class="topbar"><button type="button" class="mobile-menu" data-action="menu" aria-label="Open navigation menu" aria-expanded="'+String(mobileNavOpen)+'" aria-controls="side-menu">'+icon('menu')+'</button>'+
   '<button type="button" class="desktop-collapse" data-action="collapse" aria-label="'+(sidebarCollapsed?'Expand sidebar':'Collapse sidebar')+'" aria-pressed="'+String(sidebarCollapsed)+'" aria-controls="side-menu" title="'+(sidebarCollapsed?'Expand sidebar':'Collapse sidebar')+'">'+icon(sidebarCollapsed?'expand':'collapse')+'</button>'+
   '<div class="breadcrumbs"><a href="#/home">Workspace</a>'+ (cat?' <span>/</span> <a href="'+href(cat.id)+'">'+esc(cat.label)+'</a>':'')+
   (sub?' <span>/</span> <b>'+esc(sub.label)+'</b>':'')+'</div>'+
   '<button type="button" class="wf-command-open" data-action="wf-command-open" aria-label="Search workspaces and views" title="Search workspaces and views">'+icon('search')+' <span>Search</span> <span class="wf-keycap">Ctrl K</span></button>'+ 
   '<div class="top-actions"><label class="role-label" for="role-select">Role preview</label><select id="role-select" aria-label="Simulated role (not authentication)">'+config.roles.map(r=>'<option '+(role===r?'selected':'')+'>'+esc(r)+'</option>').join('')+'</select>'+
   '<button class="icon-button" data-action="theme" aria-label="Toggle appearance" title="Toggle appearance">'+icon(theme==='dark'?'sun':'moon')+'</button></div></header>';
 const footer=()=>'<footer class="footnote">MADDIE CENTRAL | 2027 · Isolated navigation trial · Source: fictional v3.7 fixture · No connected systems or real-time updates. <a href="./legacy.html">Original v3.7 monitoring</a></footer>';
 const banner=()=>'<div class="notice" role="note">'+icon('info')+' <span><strong>Fictional-data trial.</strong> Role selection is a visual simulation, not real authentication. Edits stay in this browser; no external systems are connected.</span></div>';
 const home=()=>{
   const m=model.metrics;
   const spotlight=model.people.slice(0,3);
   const editorial=(p,i)=>{
     const initials=p.name.split(/\s+/).slice(0,2).map(n=>n.charAt(0)).join('');
     return '<a class="mc-profile-card mc-profile-'+i+'" href="'+href('people-directory','employee-masterlist')+
       '" aria-label="Open fictional employee directory; sample profile '+esc(p.name)+'"><div class="mc-profile-art" aria-hidden="true">'+
       '<span class="mc-profile-orbit"></span><span class="mc-profile-monogram">'+esc(initials)+'</span>'+
       '<span class="mc-profile-ribbon">FICTIONAL / 0'+(i+1)+'</span></div>'+
       '<div class="mc-profile-caption"><strong>'+esc(p.name)+'</strong><span>'+esc(p.position)+'</span></div></a>';
   };
   return '<section class="mc-editorial-hero" aria-labelledby="mc-home-title"><div class="mc-home-stage">'+
     '<div class="mc-home-copy"><span class="mc-home-eyebrow">PEOPLE & CULTURE / 2027</span>'+
     '<h1 id="mc-home-title">MADDIE <em>CENTRAL.</em></h1>'+
     '<p>One confident view of people, performance and progress. Nine linked workspaces, all running on fictional demonstration data.</p>'+
     '<div class="mc-hero-filter-chips" aria-label="Workspace shortcuts"><span class="mc-white-chip">All 09 workspaces</span>'+
     '<a class="mc-white-chip" href="'+href('people-directory')+'">People directory '+icon('arrow')+'</a>'+
     '<a class="mc-white-chip" href="'+href('executive-scoreboard')+'">Executive view '+icon('arrow')+'</a></div>'+
     '<div class="mc-hero-context">TRIAL BUILD · '+esc(model.updatedAt)+' · NO LIVE CONNECTIONS</div></div>'+
     '<div class="mc-home-card-stack" aria-label="Illustrative fictional workspace preview">'+
     '<a class="mc-stack-card mc-stack-coral" href="'+href('people-directory')+'"><span class="mc-stack-label">01 / PEOPLE</span><strong>'+esc(m.headcount)+'</strong><small>fictional employees</small>'+icon('users')+'</a>'+
     '<a class="mc-stack-card mc-stack-yellow" href="'+href('executive-scoreboard')+'"><span class="mc-stack-label">09 / EXECUTIVE</span><strong>'+esc(config.categories.length)+'</strong><small>connected workspaces</small>'+icon('chart')+'</a>'+
     '<a class="mc-stack-card mc-stack-blue" href="'+href('maddie-journey')+'"><span class="mc-stack-label">04 / JOURNEY</span><strong>'+esc(m.pendingJourney)+'</strong><small>sample journeys to review</small>'+icon('route')+'</a></div>'+
     '</div><span class="mc-home-decoration" aria-hidden="true"></span></section>'+ 
     (window.MC_WIREFRAME?.home?.(model,config,window.MC_SUMMARY,overrides,{period:wfPeriod,alertFilter:wfAlertFilter})||'')+
     '<div class="section-head mc-section-editorial"><div><span class="eyebrow">01—09 / WORKSPACE NAVIGATION</span><h2>Everything in its place.</h2></div>'+
     '<span class="mc-white-chip">Select a workspace '+icon('arrow')+'</span></div>'+
     '<div class="category-grid mc-editorial-categories">'+config.categories.map((c,i)=>
       '<a class="category-card mc-editorial-category mc-editorial-tone-'+(i%5)+'" href="'+href(c.id)+'" title="Open '+esc(c.label)+'"><div class="cat-top"><span class="category-icon tone-'+(i%4)+'">'+icon(c.icon)+'</span>'+
       '<span class="mc-white-chip">'+String(i+1).padStart(2,'0')+' / 09</span></div>'+
       '<h3>'+esc(c.label)+'</h3><p>'+esc(c.subtitle)+'</p>'+
       '<div class="cat-foot"><span>'+c.subcategories.length+' linked views</span><span class="mc-arrow-spot">'+icon('arrow')+'</span></div></a>').join('')+'</div>'+
     '<section class="mc-people-editorial" aria-labelledby="mc-team-title"><div class="mc-people-titlebar"><div><span class="eyebrow">FICTIONAL ROSTER / EDITORIAL PREVIEW</span>'+
     '<h2 id="mc-team-title">PEOPLE BEHIND <span>THE WORK.</span></h2></div>'+
     '<p>Three fictional identities from the 51-person demonstration masterlist. Monogram artwork is illustrative, not employee photography.</p></div>'+
     '<div class="mc-profile-grid">'+spotlight.map(editorial).join('')+'</div></section>'+
     '<details class="wf-extras"><summary>Executive saved-view shortcuts <span>'+config.savedViews.length+' linked views</span>'+icon('chevron')+'</summary>'+
     '<div class="quick-grid">'+config.savedViews.map(v=>'<a class="quick-link" href="'+href(v.category,v.sub)+'">'+icon('chart')+'<span>'+esc(v.label)+'</span>'+icon('chevron')+'</a>').join('')+'</div></details>';
 };
 function renderSummaryDashboard(cat){
   if(!window.MC_SUMMARY)return '<p role="alert">Category summary module unavailable. Subcategory navigation remains accessible.</p>';
   const summary=window.MC_SUMMARY.create(model,cat.id,overrides);
   const catNum=String(config.categories.indexOf(cat)+1).padStart(2,'0');
   const tabs=[
     {id:'overview',label:'Overview',icon:'chart',target:'mc-metrics'},
     {id:'priorities',label:'Priorities',icon:'info',target:'mc-insights'},
     {id:'updates',label:'Updates',icon:'activity',target:'mc-activity'},
     {id:'explore',label:'Explore all views',icon:'briefcase',target:'mc-links'}
   ];
   const tab=({id,label,icon:ic,target})=>
     '<button type="button" role="tab" id="mc-tab-'+id+'" data-action="view" data-view="'+id+'" aria-controls="'+target+
     '" aria-selected="'+String(categoryFocus===id)+'" tabindex="'+(categoryFocus===id?'0':'-1')+'">'+
     icon(ic)+'<span>'+label+'</span></button>';
   const metricCard=(m,i)=>
     '<article class="mc-metric-card mc-tone-'+esc(m.tone||'pink')+'"><div class="mc-metric-top">'+
     '<span class="mc-metric-icon">'+icon(m.icon||'chart')+'</span>'+
     '<span class="mc-white-chip">'+esc(i+1)+' / '+esc(summary.metrics.length)+'</span></div>'+
     '<div class="mc-metric-count">'+esc(m.value)+'</div><h3>'+esc(m.label)+'</h3><p>'+esc(m.detail)+'</p></article>';
   const entries=summary.distribution.filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
   const total=entries.reduce((n,x)=>n+x.value,0);
   const shown=entries.slice(0,5);
   if(entries.length>5)shown.push({label:'Other statuses',value:entries.slice(5).reduce((n,x)=>n+x.value,0)});
   const stateChips=shown.length?shown.map((item,i)=>'<span class="mc-white-chip mc-white-chip-wide"><i class="mc-chip-dot mc-dot-'+(i%4)+'"></i>'+esc(item.label)+
     '<strong>'+esc(item.value)+'</strong></span>').join(''):'<span class="mc-white-chip">No status records in demo fixture</span>';
   const dist=shown.length?shown.map((item,i)=>'<div class="mc-progress-row"><div class="mc-progress-line"><span>'+esc(item.label)+'</span><strong>'+esc(item.value)+'</strong></div>'+
     '<div class="mc-progress-track" role="progressbar" aria-label="'+esc(item.label)+' proportion" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+item.value+'"><span class="mc-progress-bar mc-bar-'+(i%4)+'" style="width:'+Math.max(0,Math.min(100,total?100*item.value/total:0))+'%"></span></div></div>').join(''):
     '<p class="mc-muted">No status distribution available in the demo fixture.</p>';
   const focusCard=(item,i)=>{
     const block='<span class="mc-focus-index">'+String(i+1).padStart(2,'0')+'</span><span class="mc-focus-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.detail)+'</small></span>'+
       '<span class="mc-white-chip">'+esc(item.tone==='attention'?'Review':item.tone==='positive'?'Ready':'Sample')+'</span>';
     return item.to?'<a class="mc-focus-row" href="'+href(item.to.category,item.to.subcategory)+'">'+block+icon('chevron')+'</a>':
       '<div class="mc-focus-row">'+block+'</div>';
   };
   const activity=(a,i)=>'<div class="mc-activity-row"><span class="mc-activity-marker mc-dot-'+(i%4)+'"></span><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.detail)+'</small></div>'+
     '<span class="mc-white-chip">'+esc(a.status||'Sample')+'</span></div>';
   const noteCard=(n,i)=>'<div class="mc-note-row"><span class="mc-note-symbol">'+icon(n.tone==='attention'?'info':'shield')+'</span><div><strong>'+esc(n.title)+'</strong><p>'+esc(n.detail)+'</p></div></div>';
   return '<a class="back-link" href="#/home">'+icon('chevron','back-icon')+' Back to main dashboard</a>'+
     '<section class="mc-summary-hero mc-editorial-summary mc-workspace-'+esc(cat.id)+'" aria-labelledby="mc-summary-title"><div class="mc-hero-grid"><div class="mc-hero-text">'+
     '<div class="mc-summary-label"><span>WORKSPACE '+catNum+' / 09</span><span class="mc-white-chip">'+icon('check')+' Fictional sample data only</span></div>'+
     '<h1 id="mc-summary-title">'+esc(summary.title)+'</h1><p class="mc-hero-subtitle">'+esc(summary.subtitle)+'</p>'+
     '<p class="mc-hero-description">'+esc(summary.description)+'</p>'+
     '<div class="mc-hero-chips"><span class="mc-white-chip">'+icon('calendar')+' Snapshot '+esc(summary.asOf)+'</span>'+
     '<span class="mc-white-chip">'+icon('users')+' '+esc(role)+' preview</span>'+
     '<span class="mc-white-chip">'+esc(cat.subcategories.length)+' linked views</span></div></div>'+
     '<div class="mc-hero-aside" aria-hidden="true"><span class="mc-hero-orbit"></span><div class="mc-preview-tile mc-preview-primary"><span>01 / SUMMARY</span><b>'+esc(summary.metrics[0]?.value)+'</b><small>'+esc(summary.metrics[0]?.label)+'</small></div>'+
     '<div class="mc-preview-tile mc-preview-secondary"><span>02 / TRACKED</span><b>'+esc(summary.metrics[1]?.value)+'</b><small>'+esc(summary.metrics[1]?.label)+'</small></div></div></div></section>'+
     '<div class="mc-section-tabs" role="tablist" aria-label="Dashboard sections">'+tabs.map(tab).join('')+'</div>'+
     '<section class="mc-dashboard-section" role="tabpanel" id="mc-metrics" aria-labelledby="mc-tab-overview"><div class="mc-section-heading"><div><span class="eyebrow">AT A GLANCE</span><h2 id="mc-metrics-title">'+esc(summary.focus)+'</h2></div><span class="mc-white-chip">Derived from fictional records</span></div>'+
     '<div class="mc-metric-grid">'+summary.metrics.map(metricCard).join('')+'</div>'+ 
     (window.MC_WIREFRAME?.category?.(model,cat,overrides,{calendarMonth:wfCalendarMonth})||'')+'</section>'+
     '<section class="mc-dashboard-section mc-insight-section" role="tabpanel" id="mc-insights" aria-labelledby="mc-tab-priorities"><div class="mc-section-heading"><div><span class="eyebrow">WORKSPACE HEALTH</span><h2 id="mc-insights-title">Status and priorities</h2></div></div>'+
     '<div class="mc-insight-grid"><div class="mc-panel"><div class="mc-panel-head"><div><span class="eyebrow">STATUS MIX</span><h3>Sample workflow statuses</h3></div><span class="mc-white-chip">Count · '+esc(total)+'</span></div>'+
     '<div class="mc-status-chips">'+stateChips+'</div><div class="mc-progress-list">'+dist+'</div></div>'+
     '<div class="mc-panel"><div class="mc-panel-head"><div><span class="eyebrow">HIGHLIGHTS</span><h3>What needs attention</h3></div><span class="mc-white-chip">Priority view</span></div>'+
     '<div class="mc-focus-list">'+summary.highlights.map(focusCard).join('')+'</div></div></div></section>'+
     '<section class="mc-dashboard-section" role="tabpanel" id="mc-activity" aria-labelledby="mc-tab-updates"><div class="mc-section-heading"><div><span class="eyebrow">SAMPLE ACTIVITY</span><h2 id="mc-activity-title">Recent fixture records and notes</h2></div><span class="mc-white-chip">No live activity feed</span></div>'+
     '<div class="mc-activity-grid"><div class="mc-panel"><div class="mc-panel-head"><h3>Example updates</h3><span class="mc-white-chip">Demo snapshot</span></div><div class="mc-activity-list">'+
     (summary.activity.length?summary.activity.map(activity).join(''):'<p class="mc-muted">No sample updates are recorded for this category.</p>')+'</div></div>'+
     '<div class="mc-panel"><div class="mc-panel-head"><h3>Risks and source limitations</h3><span class="mc-white-chip">Trial only</span></div><div class="mc-notes-list">'+
     summary.risks.map(noteCard).join('')+'</div><p class="mc-panel-note">No real reminders, alerts, emails, decisions or external records are generated.</p></div></div></section>'+
     '<section class="mc-dashboard-section" role="tabpanel" id="mc-links" aria-labelledby="mc-tab-explore"><div class="mc-section-heading"><div><span class="eyebrow">JUMP INTO DETAILS</span><h2 id="mc-category-links-title">All '+esc(cat.subcategories.length)+' subcategory views</h2></div>'+
     '<span class="mc-white-chip">Select a view</span></div><div class="mc-link-grid">'+cat.subcategories.map((sub,i)=>
       '<a class="mc-link-tile" href="'+href(cat.id,sub.id)+'"><span class="mc-link-number">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(sub.label)+'</span>'+
       icon(allowed(cat,sub)?'arrow':'lock')+'</a>').join('')+'</div></section>';
 }
 const categoryPage=(cat)=>{
   return renderSummaryDashboard(cat)+
     '<section class="mc-dashboard-section mc-directory" id="subcategory-directory" aria-labelledby="mc-directory-title">'+
     '<div class="mc-section-heading"><div><span class="eyebrow">EXPLORE FURTHER</span><h2 id="mc-directory-title">Expandable subcategory directory</h2>'+
     '<p class="mc-muted">Expand a section to review scope or open its fictional linked view.</p></div>'+
     '<span class="mc-white-chip">'+cat.subcategories.length+' views</span></div>'+
     '<div class="accordion-grid">'+cat.subcategories.map((s,i)=>{
       const permitted=allowed(cat,s);
       return '<details class="accordion"><summary><span class="sub-num">'+String(i+1).padStart(2,'0')+'</span>'+
         '<span class="sub-label">'+esc(s.label)+'</span>'+icon(permitted?'chevron':'lock','accord-icon')+'</summary>'+
         '<div class="accordion-body"><p>'+esc(kindDescription(s))+'</p><div class="accord-meta">'+esc(s.classification)+' · '+(permitted?'Fictional records':'Restricted role preview')+'</div>'+
         '<a class="open-view" href="'+href(cat.id,s.id)+'">Open '+esc(s.label)+icon('arrow')+'</a></div></details>';
     }).join('')+'</div></section>'+
     '<div class="page-owner">'+icon('info')+' Page owner: P&C (fictional trial) · Last fixture update: '+esc(model.updatedAt)+
     ' · Summary figures and workflow statuses are drawn from sample records; not verified operational reports.</div>';
 };
 function kindDescription(s){
   const lookup={
     'employees':'Employee-linked master records with IDs, roles, division and status.',
     'documents':'Structured 201 file checkpoint records with controlled document status.',
     'salary':'Restricted fictional compensation entries. No live payroll integration.',
     'attendance':'Verified fictional attendance entries, including lateness and absence.',
     'journey':'Employee journey status and milestone progress from fictional evaluations.',
     'training':'Fictional programs and scheduled training activities.',
     'training-attendance':'Employee-linked training participation using standard attendance values.',
     'cases':'Restricted, de-identified fictional case shells; no allegations or personnel files.',
     'summary':'Computed demo scorecard metrics from linked sample records.',
     'actions':'Fictional decision and action register with accountable owner and status.',
     'events':'Fictional events and cultural programs with schedule and ownership.',
     'recruitment':'Sample requisition stages and division-linked hiring records.'
   };
   return lookup[s.kind]||'Structured fictional records, ownership, status and available next actions.';
 }
 function rowValues(cat,sub){
   return rowScope(model.recordsFor(cat.id,sub.id)).map(r=>({...r,status:recordStatus(r)}));
 }
 function matches(r){
   const term=filter.query.toLowerCase().trim();
   return (filter.status==='all'||r.status===filter.status)&&
     (filter.division==='all'||r.division===filter.division)&&
     (!term||[r.recordId,r.employeeId,r.name,r.division,r.status,r.detail,r.owner].join(' ').toLowerCase().includes(term));
 }
 function filteredRows(cat,sub){
   const entries=rowValues(cat,sub).filter(matches);
   const key=filter.sort;
   entries.sort((a,b)=>{
     const x=String(a[key]||''),y=String(b[key]||'');
     return (filter.descending?-1:1)*x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'});
   });
   return entries;
 }
 const statusTag=(s)=>'<span class="status '+(s==='Completed'||s==='Approved/Verified'||s==='Approved'||s==='Regular'?'good':
   ['Requested','Pending Requirements','Not Started','Absent','Late','Blocked','Decision Required'].includes(s)?'attention':'neutral')+'">'+esc(s)+'</span>';
 function renderRows(cat,sub){
   const rows=filteredRows(cat,sub), canWrite=writable(cat,sub), options=statusOptions(sub.kind);
   const tbody=rows.map(r=>{
     const person=r.employeeId?model.byId.get(r.employeeId):null;
     const personal=person?'<div class="linked-name">'+esc(person.name)+'</div><small>'+esc(person.employeeId)+'</small>':'<span class="muted">—</span>';
     const control=canWrite&&options.includes(r.status)?'<label class="sr-only" for="status-'+esc(r.recordId)+'">Status for '+esc(r.recordId)+'</label>'+
       '<select class="inline-status" id="status-'+esc(r.recordId)+'" data-record="'+esc(r.recordId)+'" aria-label="Fictional status for '+esc(r.name)+'">'+
       options.map(o=>'<option '+(o===r.status?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select>':statusTag(r.status);
     return '<tr><td><code>'+esc(r.recordId)+'</code></td><td>'+personal+'</td><td><strong>'+esc(r.name)+'</strong><small>'+esc(r.detail)+'</small></td>'+
       '<td>'+esc(r.division)+'</td><td>'+control+'</td><td>'+esc(r.owner)+'</td><td>'+esc(r.dueDate||'—')+'</td></tr>';
   }).join('');
   const table=rows.length?'<div class="table-scroll" role="region" aria-label="'+esc(sub.label)+' records" tabindex="0"><table><thead><tr>'+
     '<th scope="col">Record ID</th><th scope="col">Employee link</th><th scope="col">Record / item</th>'+
     '<th scope="col">Division</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col">Due date</th></tr></thead><tbody>'+tbody+'</tbody></table></div>':
     '<div class="empty-state">'+icon('search')+'<strong>No matching fictional records</strong><p>Clear filters, or this subcategory has no synthetic entries yet. No live data was fetched.</p></div>';
   return '<div class="records-head"><strong>'+rows.length+' records</strong><span class="muted">Source: fictional linked dataset · Updated '+esc(model.updatedAt)+'</span></div>'+table;
 }
 function renderView(cat,sub){
   if(!allowed(cat,sub))return '<a class="back-link" href="'+href(cat.id)+'">'+icon('chevron','back-icon')+' Back to category</a>'+
     '<div class="page-heading"><div class="eyebrow">'+esc(cat.label)+'</div><h1>'+esc(sub.label)+'</h1></div>'+
     '<div class="locked">'+icon('lock')+'<h2>Restricted preview</h2><p>This section is designated '+esc(sub.classification)+
       '. Your simulated '+esc(role)+' view does not display it. No underlying real records are available in this trial.</p>'+
       '<p>Production access must be enforced by server-side authorization, not this role selector.</p></div>';
   const rows=rowScope(model.recordsFor(cat.id,sub.id));
   const statuses=[...new Set(rows.map(r=>recordStatus(r)))].sort();
   const divisions=[...new Set(rows.map(r=>r.division))].sort();
   return '<a class="back-link" href="'+href(cat.id)+'">'+icon('chevron','back-icon')+' Back to '+esc(cat.label)+'</a>'+
     '<div class="page-heading"><div class="eyebrow">'+esc(cat.label)+' / DATA VIEW</div><h1>'+esc(sub.label)+'</h1><p>'+esc(kindDescription(sub))+'</p></div>'+
     '<div class="view-meta"><span class="pill">'+esc(sub.classification)+'</span><span>Owner: P&C (demo)</span><span>Snapshot: '+esc(model.updatedAt)+'</span>'+
     '<span>Records linked by immutable Employee ID</span></div>'+
     '<div class="workspace-panel"><div class="filterbar"><label class="filter-search">'+icon('search')+'<span class="sr-only">Search records</span>'+
     '<input id="record-search" type="search" placeholder="Search records or employee ID" value="'+esc(filter.query)+'" autocomplete="off"></label>'+
     '<label class="filter-label">Status <select id="status-filter"><option value="all">All statuses</option>'+statuses.map(s=>
     '<option value="'+esc(s)+'" '+(filter.status===s?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'+
     '<label class="filter-label">Division <select id="division-filter"><option value="all">All divisions</option>'+divisions.map(s=>
     '<option value="'+esc(s)+'" '+(filter.division===s?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'+
     '<label class="filter-label">Sort <select id="sort-filter"><option value="name">Name</option><option value="recordId" '+(filter.sort==='recordId'?'selected':'')+'>Record ID</option>'+
     '<option value="status" '+(filter.sort==='status'?'selected':'')+'>Status</option><option value="division" '+(filter.sort==='division'?'selected':'')+'>Division</option></select></label>'+
     '<div class="filter-actions"><button class="small-btn" data-action="save-filter">'+icon('check')+' Save view</button>'+
     '<button class="small-btn" data-action="clear-filter">Clear</button>'+
     '<button class="small-btn" data-action="export" '+(sub.classification!=='Internal'?'disabled title="Export disabled for sensitive records"':'')+'>'+icon('export')+' Export CSV</button></div></div>'+
     '<div id="record-results">'+renderRows(cat,sub)+'</div></div>'+
     '<p class="page-owner">This is a local fictional prototype. Controlled fields are for testing only; no cloud edits, uploads, reminders, or real permission checks occur.</p>';
 }
 function setFilterFromStorage(key){
   filter={query:'',status:'all',division:'all',sort:'name',descending:false};
   try{const preset=JSON.parse(sv('filter-'+key)||'null');if(preset&&typeof preset==='object')filter={...filter,...preset};}catch(_){}
   filter.sort=['name','recordId','status','division'].includes(filter.sort)?filter.sort:'name';
 }
 function render(){
   const {cat,sub}=rawRoute();
   const next=cat?(cat.id+'/'+(sub?.id||'')):'home';
   if(next!==routeKey){routeKey=next;categoryFocus='overview';setFilterFromStorage(next);}
   document.title=(sub?sub.label+' · ':cat?cat.label+' · ':'')+'MADDIE CENTRAL | 2027 (FICTIONAL TRIAL)';
   root.innerHTML='<div class="shell">'+sidebar(cat)+'<div class="content-area">'+header(cat,sub)+
     '<main id="main-content" tabindex="-1">'+banner()+(cat?(sub?renderView(cat,sub):categoryPage(cat)):home())+'</main>'+
     footer()+'</div></div><div class="mobile-scrim" data-action="menu" aria-hidden="true"></div>'+ 
     (window.MC_WIREFRAME?.palette?.(config)||'');
   mobileNavOpen=false;
   syncNavigation();
   syncCategoryFocus();
   const heading=root.querySelector('main h1');
   if(heading&&location.hash)heading.setAttribute('tabindex','-1');
 }
 function refreshResults(){
   const {cat,sub}=rawRoute();if(!cat||!sub||!allowed(cat,sub))return;
   const area=root.querySelector('#record-results');
   if(area)area.innerHTML=renderRows(cat,sub);
 }
 function csvEscape(value){
   let s=String(value==null?'':value);
   if(/^[\s]*[=+\-@]/.test(s))s="'"+s;
   return '"'+s.replace(/"/g,'""')+'"';
 }
 function exportCsv(cat,sub){
   if(!allowed(cat,sub)||sub.classification!=='Internal')return;
   const cols=['recordId','employeeId','name','division','status','owner','dueDate','updatedAt','detail'];
   const lines=[cols.join(',')].concat(filteredRows(cat,sub).map(r=>cols.map(k=>csvEscape(r[k])).join(',')));
   const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='fictional-'+cat.id+'-'+sub.id+'.csv';document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 root.addEventListener('click',event=>{
   const button=event.target.closest('[data-action]');if(!button)return;
   const action=button.dataset.action;
   if(action==='wf-command-open'){
     const dialog=root.querySelector?.('#mc-command');
     if(dialog){
       if(typeof dialog.showModal==='function')dialog.showModal();
       else dialog.setAttribute('open','');
       root.querySelector?.('#mc-command-input')?.focus();
     }
     return;
   }
   if(action==='wf-command-close'){
     const dialog=root.querySelector?.('#mc-command');
     if(dialog?.close)dialog.close();else dialog?.removeAttribute?.('open');
     root.querySelector?.('.wf-command-open')?.focus();
     return;
   }
   if(action==='wf-period'){
     const p=button.dataset.period;
     if(['week','month','quarter'].includes(p)){wfPeriod=p;render();}
     return;
   }
   if(action==='wf-alert-filter'){
     const f=button.dataset.filter;
     if(['all','high'].includes(f)){wfAlertFilter=f;render();}
     return;
   }
   if(action==='wf-calendar'){
     const m=Number(button.dataset.month);
     if([10,11].includes(m)){wfCalendarMonth=m;render();}
     return;
   }
   if(action==='view'||action==='view-link'){
     const next=button.dataset.view;
     if(!['overview','priorities','updates','explore'].includes(next))return;
     if(action==='view-link'){
       // On a detail page, follow the ordinary category href; in the summary,
       // switch directly to Explore without losing the current route.
       if(!rawRoute().cat||rawRoute().sub)return;
       event.preventDefault();
     }
     categoryFocus=next;
     syncCategoryFocus();
     if(mobileNavOpen){mobileNavOpen=false;syncNavigation();}
     root.querySelector?.('.mc-section-tabs [data-view="'+next+'"]')?.focus();
     window.MC_MOTION?.panel();
     return;
   }
   if(action==='menu'){
     if(!isMobile())return;
     mobileNavOpen=!mobileNavOpen;
     syncNavigation();
     if(mobileNavOpen)root.querySelector('#side-menu a')?.focus();
     else root.querySelector('.mobile-menu')?.focus();
     return;
   }
   if(action==='collapse'){
     if(isMobile())return;
     sidebarCollapsed=!sidebarCollapsed;
     save('sidebar-collapsed',String(sidebarCollapsed));
     // Do not recreate the DOM: a persistent grid makes the rail slide smoothly.
     syncNavigation();
     const toggle=root.querySelector?.('.desktop-collapse');
     if(toggle){
       toggle.setAttribute('aria-pressed',String(sidebarCollapsed));
       toggle.setAttribute('aria-label',sidebarCollapsed?'Expand sidebar':'Collapse sidebar');
       toggle.setAttribute('title',sidebarCollapsed?'Expand sidebar':'Collapse sidebar');
       toggle.innerHTML=icon(sidebarCollapsed?'expand':'collapse');
       toggle.focus();
     }
     return;
   }
   if(action==='theme'){theme=theme==='light'?'dark':'light';save('theme',theme);document.documentElement.dataset.theme=theme;render();return;}
   if(action==='clear-filter'){filter={query:'',status:'all',division:'all',sort:'name',descending:false};render();return;}
   if(action==='save-filter'){save('filter-'+routeKey,JSON.stringify(filter));button.textContent='View saved locally';return;}
   if(action==='export'){const {cat,sub}=rawRoute();if(cat&&sub)exportCsv(cat,sub);return;}
 });
 root.addEventListener('input',event=>{
   if(event.target.id==='mc-command-input'){
     const list=root.querySelector?.('#mc-command-results');
     if(list&&window.MC_WIREFRAME)list.innerHTML=window.MC_WIREFRAME.results(config,event.target.value);
     return;
   }
   if(event.target.id!=='record-search')return;
   filter.query=event.target.value;refreshResults();
 });
 root.addEventListener('change',event=>{
   const el=event.target;
   if(el.id==='role-select'){role=config.roles.includes(el.value)?el.value:'CEO';save('role',role);render();return;}
   if(el.id==='status-filter'){filter.status=el.value;refreshResults();return;}
   if(el.id==='division-filter'){filter.division=el.value;refreshResults();return;}
   if(el.id==='sort-filter'){filter.sort=el.value;refreshResults();return;}
   if(el.matches('[data-record]')){
     const {cat,sub}=rawRoute();if(!cat||!sub||!writable(cat,sub))return;
     const base=rowScope(model.recordsFor(cat.id,sub.id)).find(r=>r.recordId===el.dataset.record);
     if(!base||!statusOptions(sub.kind).includes(el.value))return;
     overrides[base.recordId]=el.value;save('demo-overrides',JSON.stringify(overrides));refreshResults();
   }
 });
 window.addEventListener('hashchange',()=>{
   const paint=()=>{
     render();
     const h=root.querySelector?.('main h1');
     if(h)h.focus({preventScroll:true});
     if(typeof window.scrollTo==='function')window.scrollTo({top:0,left:0,behavior:'instant'});
   };
   // The CSS view-transition path slides between screens on supported browsers.
   // Otherwise, WAAPI reveals the new page; no animation is required for correctness.
   const canTransition=typeof document.startViewTransition==='function'&&
     !(window.MC_MOTION?.reduced?.()||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
   if(canTransition){
     try{document.startViewTransition(paint);}catch(_){paint();window.MC_MOTION?.enter();}
   }else{paint();window.MC_MOTION?.enter();}
 });
 root.addEventListener('click',event=>{
   if(event.target.closest('.sidebar a')&&mobileNavOpen){
     mobileNavOpen=false;syncNavigation();
   }
 });
 function syncCategoryFocus(){
   const enabled=Boolean(rawRoute().cat&&!rawRoute().sub);
   for(const name of ['overview','priorities','updates','explore']){
     root.classList.toggle('mc-focus-'+name,enabled&&categoryFocus===name);
   }
   root.classList.toggle('mc-category-view',enabled);
   // Real tab selection is reflected for assistive tech as well as for visuals.
   const buttons=root.querySelectorAll?.('.mc-section-tabs [data-action="view"]')||[];
   for(const b of buttons){
     const selected=b.dataset.view===categoryFocus;
     b.setAttribute('aria-selected',String(selected));
     b.tabIndex=selected?0:-1;
   }
 }
 // Keep navigation keyboard accessible: no off-screen mobile links in Tab order.
 function syncNavigation(){
   root.classList.toggle('sidebar-collapsed',sidebarCollapsed);
   root.classList.toggle('navigation-open',mobileNavOpen);
   const aside=root.querySelector('#side-menu');
   if(aside){
     aside.inert=isMobile()&&!mobileNavOpen;
     aside.setAttribute('aria-hidden',String(isMobile()&&!mobileNavOpen));
   }
   const menu=root.querySelector('.mobile-menu');
   if(menu){
     menu.setAttribute('aria-expanded',String(mobileNavOpen));
     menu.setAttribute('aria-label',mobileNavOpen?'Close navigation menu':'Open navigation menu');
   }
   const main=root.querySelector('#main-content');
   if(main)main.inert=isMobile()&&mobileNavOpen;
 }
 document.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){
     e.preventDefault();
     const dialog=root.querySelector?.('#mc-command');
     if(dialog){
       if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
       else if(!dialog.open)dialog.setAttribute('open','');
       root.querySelector?.('#mc-command-input')?.focus();
     }
     return;
   }
   if(e.key==='Enter'&&e.target?.id==='mc-command-input'){
     const link=root.querySelector?.('#mc-command-results a');
     if(link){e.preventDefault();link.click();}
     return;
   }
   const tab=e.target?.closest?.('.mc-section-tabs [role="tab"]');
   if(tab&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
     const sequence=['overview','priorities','updates','explore'];
     const now=sequence.indexOf(tab.dataset.view);
     const next=e.key==='Home'?0:e.key==='End'?sequence.length-1:
       (now+(e.key==='ArrowRight'?1:-1)+sequence.length)%sequence.length;
     if(now>=0){
       e.preventDefault();
       categoryFocus=sequence[next];syncCategoryFocus();
       const selected=root.querySelector?.('.mc-section-tabs [data-view="'+categoryFocus+'"]');
       selected?.focus();
       window.MC_MOTION?.panel();
     }
     return;
   }
   if(e.key==='Escape'&&mobileNavOpen){
     mobileNavOpen=false;syncNavigation();
     root.querySelector('.mobile-menu')?.focus();
     return;
   }
   if(e.key!=='Tab'||!mobileNavOpen||!isMobile())return;
   const items=Array.from(root.querySelectorAll?.('#side-menu a, #side-menu button')||[]).filter(n=>!n.disabled);
   if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first.focus();}
 });
 window.addEventListener('resize',()=>{if(!isMobile()&&mobileNavOpen){mobileNavOpen=false;syncNavigation();}});

 const skip=document.getElementById('skip-content');if(skip)skip.addEventListener('click',()=>root.querySelector('#main-content')?.focus());
 window.MC_APP={model,config,render,rawRoute,allowed,filteredRows,getRole:()=>role,getFilter:()=>({...filter}),isSidebarCollapsed:()=>sidebarCollapsed,isMobileNavOpen:()=>mobileNavOpen,getCategoryFocus:()=>categoryFocus,getWireframePeriod:()=>wfPeriod,getWireframeAlertFilter:()=>wfAlertFilter,getWireframeCalendarMonth:()=>wfCalendarMonth};
 render();
})();
