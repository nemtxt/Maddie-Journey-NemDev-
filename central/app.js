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
 const sidebar=(current)=>'<aside class="sidebar" id="side-menu" aria-label="Workspace navigation"><div class="brand"><span class="brand-mark">M</span><span><strong>MADDIE CENTRAL</strong><small>PEOPLE & CULTURE · 2027</small></span></div>'+
   '<a class="nav-home '+(!current?'selected':'')+'" href="#/home">'+icon('home')+' Dashboard</a>'+
   '<div class="nav-label">WORKSPACES</div><nav class="nav-list" aria-label="Nine workspace categories">'+config.categories.map((c,i)=>
   '<a class="nav-link '+(current?.id===c.id?'selected':'')+'" '+(current?.id===c.id?'aria-current="page"':'')+
   ' href="'+href(c.id)+'"><span class="nav-num">'+String(i+1).padStart(2,'0')+'</span>'+icon(c.icon)+
   '<span>'+esc(c.label)+'</span>'+icon('chevron','nav-chevron')+'</a>').join('')+'</nav>'+
   '<div class="side-bottom"><span class="trial-dot"></span><span>TRIAL ENVIRONMENT<br><small>51 fictional employees · no live sync</small></span></div></aside>';
 const header=(cat,sub)=>'<header class="topbar"><button type="button" class="mobile-menu" data-action="menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="side-menu">'+icon('menu')+'</button>'+
   '<div class="breadcrumbs"><a href="#/home">Workspace</a>'+ (cat?' <span>/</span> <a href="'+href(cat.id)+'">'+esc(cat.label)+'</a>':'')+
   (sub?' <span>/</span> <b>'+esc(sub.label)+'</b>':'')+'</div>'+
   '<div class="top-actions"><label class="role-label" for="role-select">Role preview</label><select id="role-select" aria-label="Simulated role (not authentication)">'+config.roles.map(r=>'<option '+(role===r?'selected':'')+'>'+esc(r)+'</option>').join('')+'</select>'+
   '<button class="icon-button" data-action="theme" aria-label="Toggle appearance" title="Toggle appearance">'+icon(theme==='dark'?'sun':'moon')+'</button></div></header>';
 const footer=()=>'<footer class="footnote">MADDIE CENTRAL | 2027 · Isolated navigation trial · Source: fictional v3.7 fixture · No connected systems or real-time updates. <a href="./legacy.html">Original v3.7 monitoring</a></footer>';
 const banner=()=>'<div class="notice" role="note">'+icon('info')+' <span><strong>Fictional-data trial.</strong> Role selection is a visual simulation, not real authentication. Edits stay in this browser; no external systems are connected.</span></div>';
 const home=()=>{
   const m=model.metrics;
   return '<div class="hero"><div><div class="eyebrow">PEOPLE & CULTURE · EXECUTIVE WORKSPACE</div><h1>MADDIE CENTRAL <span>| 2027</span></h1>'+
     '<p>Nine connected workspaces to review workforce operations, ownership, decisions and progress. Explore an isolated fictional dataset.</p>'+
     '<span class="eyebrow meta">'+icon('calendar')+' Demo snapshot: '+esc(model.updatedAt)+' · '+esc(model.period)+'</span></div>'+
     '<div class="hero-side"><div class="hero-metric">'+m.headcount+'<small>Fictional employees</small></div><div class="hero-metric">'+config.categories.length+'<small>Core workspaces</small></div></div></div>'+
     '<div class="section-head"><div><span class="eyebrow">WORKSPACE MAP</span><h2>Explore the nine categories</h2></div><span class="muted">Select a category to view its subcategories</span></div>'+
     '<div class="category-grid">'+config.categories.map((c,i)=>'<a class="category-card" href="'+href(c.id)+'"><div class="cat-top"><span class="category-icon tone-'+(i%4)+'">'+icon(c.icon)+'</span><span class="cat-index">'+String(i+1).padStart(2,'0')+' / 09</span></div>'+
       '<h3>'+esc(c.label)+'</h3><p>'+esc(c.subtitle)+'</p><div class="cat-foot">'+c.subcategories.length+' linked views '+icon('arrow')+'</div></a>').join('')+'</div>'+
     '<div class="section-head lower"><div><span class="eyebrow">EXECUTIVE MONITORING</span><h2>Fictional operational snapshot</h2></div></div>'+
     '<div class="metric-grid">'+metric(m.missing201,'201 file requests','Derived from sample checklist')+
       metric(m.attendanceExceptions,'Attendance exceptions','Verified fictional records only')+
       metric(m.openRequisitions,'Sample requisitions','Not real open positions')+
       metric(m.pendingJourney,'Pending journey records','Calculated from sample milestones')+'</div>'+
     '<div class="section-head lower"><div><span class="eyebrow">QUICK NAVIGATION</span><h2>Executive and operational views</h2></div></div>'+
     '<div class="quick-grid">'+config.savedViews.map(v=>'<a class="quick-link" href="'+href(v.category,v.sub)+'">'+icon('chart')+'<span>'+esc(v.label)+'</span>'+icon('chevron')+'</a>').join('')+'</div>';
 };
 const categoryPage=(cat)=>{
   const idx=config.categories.indexOf(cat);
   return '<a class="back-link" href="#/home">'+icon('chevron','back-icon')+' Back to dashboard</a>'+
     '<div class="page-heading"><div class="eyebrow">WORKSPACE '+String(idx+1).padStart(2,'0')+' / 09</div><h1>'+esc(cat.label)+'</h1><p>'+esc(cat.subtitle)+'</p></div>'+
     '<div class="section-head"><div><h2>Subcategory navigation</h2><p>Expand a section to read its scope and open the linked view.</p></div><span class="pill">'+cat.subcategories.length+' views</span></div>'+
     '<div class="accordion-grid">'+cat.subcategories.map((s,i)=>{
       const permitted=allowed(cat,s);
       return '<details class="accordion"><summary><span class="sub-num">'+String(i+1).padStart(2,'0')+'</span>'+
         '<span class="sub-label">'+esc(s.label)+'</span>'+icon(permitted?'chevron':'lock','accord-icon')+'</summary>'+
         '<div class="accordion-body"><p>'+esc(kindDescription(s))+'</p><div class="accord-meta">'+esc(s.classification)+' · '+(permitted?'Demo records':'Restricted role preview')+'</div>'+
         '<a class="open-view" href="'+href(cat.id,s.id)+'">Open '+esc(s.label)+icon('arrow')+'</a></div></details>';
     }).join('')+'</div>'+
     '<div class="page-owner">'+icon('info')+' Page owner: P&C (demo) · Last fixture update: '+esc(model.updatedAt)+
     ' · Open any subcategory for its linked records, filters, and available actions.</div>';
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
     '<button class="small-btn" data-action="export" '+(sub.classification==='Highly Restricted'?'disabled title="Export disabled for highly restricted records"':'')+'>'+icon('export')+' Export CSV</button></div></div>'+
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
   const next=cat?.id+'/'+(sub?.id||'')||'home';
   if(next!==routeKey){routeKey=next;setFilterFromStorage(next);}
   document.title=(sub?sub.label+' · ':cat?cat.label+' · ':'')+'MADDIE CENTRAL | 2027 (FICTIONAL TRIAL)';
   root.innerHTML='<div class="shell">'+sidebar(cat)+'<div class="content-area">'+header(cat,sub)+
     '<main id="main-content" tabindex="-1">'+banner()+(cat?(sub?renderView(cat,sub):categoryPage(cat)):home())+'</main>'+
     footer()+'</div></div><div class="mobile-scrim" data-action="menu" aria-hidden="true"></div>';
   root.classList.remove('navigation-open');
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
   if(!allowed(cat,sub)||sub.classification==='Highly Restricted')return;
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
   if(action==='menu'){root.classList.toggle('navigation-open');return;}
   if(action==='theme'){theme=theme==='light'?'dark':'light';save('theme',theme);document.documentElement.dataset.theme=theme;render();return;}
   if(action==='clear-filter'){filter={query:'',status:'all',division:'all',sort:'name',descending:false};render();return;}
   if(action==='save-filter'){save('filter-'+routeKey,JSON.stringify(filter));button.textContent='View saved locally';return;}
   if(action==='export'){const {cat,sub}=rawRoute();if(cat&&sub)exportCsv(cat,sub);return;}
 });
 root.addEventListener('input',event=>{
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
 window.addEventListener('hashchange',()=>{render();const h=root.querySelector('main h1');if(h)h.focus({preventScroll:true});});
 root.addEventListener('click',event=>{
   if(event.target.closest('.sidebar a'))root.classList.remove('navigation-open');
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')root.classList.remove('navigation-open');});
 window.MC_APP={model,config,render,rawRoute,allowed,filteredRows,getRole:()=>role,getFilter:()=>({...filter})};
 render();
})();
