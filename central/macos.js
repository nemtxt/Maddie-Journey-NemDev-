/* MADDIE CENTRAL | 2027 — final executive experience layer.
   Pure fictional data, read-only. Never imports external providers or real records.
   Intentionally does not add, remove or rename any navigation item or route.
*/
(function(root){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
   '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 }[char]));
 const fmt=value=>Number(value||0).toLocaleString('en-PH');
 const path=(cat,sub)=>'#/category/'+encodeURIComponent(cat)+(sub?'/'+encodeURIComponent(sub):'');
 const validId=value=>typeof value==='string'&&/^MJ-\d{3}$/.test(value);
 const reduced=()=>typeof root.matchMedia==='function'&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const chartLimit=8;
 let lastOpener=null,previousNumbers=new Map();
 const totals=(model,division,overrides={})=>{
   const people=model.people.filter(p=>p.division===division);
   const ids=new Set(people.map(p=>p.employeeId));
   const docs=model.collections.docs.filter(r=>ids.has(r.employeeId));
   const attendance=model.collections.attendance.filter(r=>ids.has(r.employeeId));
   const status=r=>overrides[r.recordId]||r.status;
   return {
     name:division,
     headcount:people.length,
     docRequested:docs.filter(r=>status(r)==='Requested').length,
     docVerified:docs.filter(r=>status(r)==='Approved/Verified').length,
     attendanceExceptions:attendance.filter(r=>['Late','Absent'].includes(status(r))).length,
     documents:docs.length,
     attendance:attendance.length
   };
 };
 function profile(person,model){
   if(!person||!validId(person.employeeId))return '';
   const journey=model.collections.journey.find(j=>j.employeeId===person.employeeId);
   const props=[
     ['Employee ID',person.employeeId],
     ['Division',person.division],
     ['Position',person.position],
     ['Employment example',person.employmentStatus],
     ['Sample start date',person.hireDate||'Not tracked'],
     ['Maddie Journey',journey?.status||'Not tracked']
   ];
   return '<div class="mac-detail-head"><span class="mac-detail-monogram" aria-hidden="true">'+
     esc(person.name.split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join(''))+'</span>'+
     '<div><span class="mac-eyebrow">FICTIONAL EMPLOYEE SNAPSHOT</span>'+
     '<h2 id="mac-profile-title">'+esc(person.name)+'</h2>'+
     '<p>'+esc(person.position)+' · '+esc(person.division)+'</p></div></div>'+
     '<dl class="mac-profile-data">'+props.map(([label,val])=>
       '<div><dt>'+esc(label)+'</dt><dd>'+esc(val)+'</dd></div>').join('')+'</dl>'+
     '<p class="mac-privacy-note">This preview is built exclusively from the 51-person fictional fixture. It contains no salary, email, medical, disciplinary or production personnel data.</p>'+
     '<div class="mac-modal-actions"><button type="button" data-mac-close="profile">Close preview</button>'+
     '<a href="'+path('people-directory','employee-masterlist')+'">Open Employee Masterlist</a></div>';
 }
 function alerts(model,overrides={}){
   const data=Object.fromEntries(Object.entries(model.collections).map(([kind,rows])=>[
     kind,rows.map(r=>({...r,status:overrides[r.recordId]||r.status}))
   ]));
   const items=root.MC_WIREFRAME?.allAlerts?.(data)||[];
   return '<div class="mac-modal-heading"><span class="mac-eyebrow">EXECUTIVE ATTENTION / DEMO</span>'+
     '<h2 id="mac-alerts-title">Items needing review</h2>'+
     '<p>Computed from fictional sample statuses. These are not live notifications or assigned tasks.</p></div>'+
     '<div class="mac-alert-list">'+items.map((item,i)=>
       '<a href="'+path(item.cat,item.sub)+'"><span class="mac-alert-order">'+String(i+1).padStart(2,'0')+'</span>'+
       '<span class="mac-alert-text"><strong>'+esc(item.label)+'</strong><small>'+esc(item.detail)+'</small></span>'+
       '<span class="mac-white-chip">'+fmt(item.count)+' checkpoints</span><span aria-hidden="true">↗</span></a>'
     ).join('')+'</div>'+
     '<div class="mac-modal-actions"><button type="button" data-mac-close="alerts">Close attention view</button></div>';
 }
 const compareSection=(model,catId,overrides={})=>{
   if(!['people-directory','executive-scoreboard'].includes(catId))return '';
   const divisions=Array.from(new Set(model.people.map(p=>p.division))).sort();
   const option=(value)=>divisions.map(d=>'<option value="'+esc(d)+'"'+(d===value?' selected':'')+'>'+esc(d)+'</option>').join('');
   const first=divisions[0]||'',second=divisions[1]||divisions[0]||'';
   return '<section class="mac-comparison" aria-labelledby="mac-comparison-title">'+
     '<div class="mac-section-caption"><div><span class="mac-eyebrow">EXECUTIVE COMPARISON</span>'+
     '<h3 id="mac-comparison-title">Compare fictional divisions</h3>'+
     '<p>Side-by-side headcount and sample review checkpoints; this is not a performance ranking.</p></div>'+
     '<span class="mac-white-chip">Derived from one masterlist</span></div>'+
     '<div class="mac-comparison-controls"><label for="mac-division-a">Division A<select id="mac-division-a" data-mac-compare="a">'+option(first)+'</select></label>'+
     '<span aria-hidden="true" class="mac-comparison-vs">VS</span>'+
     '<label for="mac-division-b">Division B<select id="mac-division-b" data-mac-compare="b">'+option(second)+'</select></label></div>'+
     '<div class="mac-comparison-results" id="mac-comparison-results" aria-live="polite">'+
       compareResults(model,first,second,overrides)+'</div>'+
     '<a class="mac-secondary-link" href="'+path('people-directory','employee-masterlist')+'">Explore the fictional Employee Masterlist <span aria-hidden="true">↗</span></a></section>';
 };
 function compareResults(model,a,b,overrides={}){
   const profiles=[totals(model,a,overrides),totals(model,b,overrides)];
   const datasets=[
     {key:'headcount',name:'Employees',unit:'fictional people'},
     {key:'docRequested',name:'201 file requests',unit:'sample checkpoints'},
     {key:'docVerified',name:'Verified 201 checkpoints',unit:'sample checkpoints'},
     {key:'attendanceExceptions',name:'Attendance exceptions',unit:'verified fictional entries'}
   ];
   const rows=datasets.map(({key,name,unit},i)=>{
     const max=Math.max(profiles[0][key],profiles[1][key],1);
     const one=profiles[0][key],two=profiles[1][key];
     return '<div class="mac-compare-row"><div class="mac-compare-label">'+esc(name)+
       '<small>'+esc(unit)+'</small></div>'+
       '<div class="mac-compare-value"><strong>'+fmt(one)+'</strong><span class="mac-compare-track" role="img" aria-label="'+
       esc(a)+': '+fmt(one)+' '+esc(unit)+'"><i style="width:'+100*one/max+'%" class="mac-compare-a"></i></span></div>'+
       '<div class="mac-compare-value"><strong>'+fmt(two)+'</strong><span class="mac-compare-track" role="img" aria-label="'+
       esc(b)+': '+fmt(two)+' '+esc(unit)+'"><i style="width:'+100*two/max+'%" class="mac-compare-b"></i></span></div></div>';
   }).join('');
   return '<div class="mac-comparison-legend"><span>'+esc(a)+'</span><span>'+esc(b)+'</span></div>'+
     '<div class="mac-comparison-table">'+rows+'</div>';
 }
 const trending=(model)=>{
   // Explicitly historical event counts. No forecasts or inferred attendance rates.
   const rows=model.collections.attendance.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&
     ['Late','Absent'].includes(r.status));
   const keys=Array.from(new Set(rows.map(r=>r.date.slice(0,7)))).sort().slice(-chartLimit);
   if(!keys.length)return '<p class="mac-null-state">No dated sample entries are available for a historical trend.</p>';
   const counts=keys.map(k=>rows.filter(r=>r.date.startsWith(k)).length);
   const highest=Math.max(...counts,1);
   return '<div class="mac-trend" role="img" aria-label="'+
     esc(keys.map((k,i)=>k+': '+counts[i]+' fictional attendance exceptions').join('; '))+'">'+
     keys.map((key,i)=>{
       const value=counts[i];
       return '<div class="mac-trend-col"><div class="mac-trend-bar" style="height:'+Math.max(8,Math.round(value/highest*100))+
       '%" title="'+esc(key)+': '+value+' exceptions"></div><strong>'+value+'</strong><small>'+esc(key.slice(5))+'</small></div>';
     }).join('')+'</div><p class="mac-trend-caption">Historical fictional late/absent entries grouped by source month; no daily attendance rate is inferred.</p>';
 };
 function historyCard(model,catId){
   if(catId!=='workforce-pulse')return '';
   return '<section class="mac-history-card" aria-labelledby="mac-history-title"><div class="mac-section-caption"><div>'+
     '<span class="mac-eyebrow">DATED SAMPLE RECORDS</span><h3 id="mac-history-title">Exceptions over time</h3></div>'+
     '<span class="mac-white-chip">No forecast</span></div>'+trending(model)+'</section>';
 }
 function shellDialogs(){
   return '<dialog class="mac-dialog" id="mac-profile-dialog" aria-labelledby="mac-profile-title">'+
     '<div class="mac-dialog-top"><span>Fictional employee preview</span><button type="button" data-mac-close="profile" aria-label="Close employee preview">×</button></div>'+
     '<div id="mac-profile-content"></div></dialog>'+
     '<dialog class="mac-dialog mac-alert-dialog" id="mac-alerts-dialog" aria-labelledby="mac-alerts-title">'+
     '<div class="mac-dialog-top"><span>Executive overview</span><button type="button" data-mac-close="alerts" aria-label="Close attention view">×</button></div>'+
     '<div id="mac-alerts-content"></div></dialog>';
 }
 function numAnimation(container){
   if(reduced()||!container?.querySelectorAll)return;
   const selected=container.querySelectorAll('.wf-kpi strong,.mc-metric-count');
   let i=0;
   for(const el of Array.from(selected).slice(0,30)){
     const text=el.textContent.trim();if(!/^\d+(?:,\d+)?(?:\.\d+)?%?$/.test(text))continue;
     const key=(el.closest?.('.wf-kpi')?.querySelector('.wf-kpi-top')?.textContent||
       el.closest?.('.mc-metric-card')?.querySelector('h3')?.textContent||'')+':'+(i++);
     const previous=previousNumbers.get(key);
     previousNumbers.set(key,text);
     if(previous!==undefined&&previous!==text&&typeof el.animate==='function'){
       try{el.animate([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0px)'}],
         {duration:240,easing:'cubic-bezier(.22,1,.36,1)'})}catch(_){}
     }
   }
 }
 function appendQuickViewButtons(app,model){
   const results=app.querySelector?.('#record-results');
   if(!results)return;
   for(const row of results.querySelectorAll('tbody tr')){
     const cell=row.cells?.[1];
     const id=cell?.querySelector?.('small')?.textContent?.trim();
     if(!validId(id)||!model.byId.has(id)||cell.querySelector('.mac-profile-launch'))continue;
     const button=app.ownerDocument.createElement('button');
     button.type='button';
     button.className='mac-profile-launch';
     button.dataset.macProfile=id;
     button.setAttribute('aria-label','Preview fictional profile '+model.byId.get(id).name);
     button.textContent='Quick view';
     cell.appendChild(button);
   }
 }
 function mount(app,model,config,overrides={},route={}){
   if(!app||!app.querySelector||typeof app.insertAdjacentHTML!=='function'||!model||!config)return;
   app.classList?.add('mac-finalized');
   const bar=app.querySelector('.topbar');
   if(bar&&!bar.querySelector('[data-mac-alerts]')){
     const actions=bar.querySelector('.top-actions');
     const btn=app.ownerDocument.createElement('button');
     const count=(root.MC_WIREFRAME?.allAlerts?.(Object.fromEntries(Object.entries(model.collections).map(
       ([k,rows])=>[k,rows.map(r=>({...r,status:overrides[r.recordId]||r.status}))])))||[])
       .filter(item=>item.level==='high').reduce((n,x)=>n+x.count,0);
     btn.type='button';btn.className='mac-alert-button';btn.dataset.macAlerts='true';
     btn.title='Open fictional executive attention summary';
     btn.setAttribute('aria-label','Review '+count+' fictional high-priority checkpoints');
     btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'+
       '<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/></svg>'+
       '<span class="mac-alert-indicator" aria-hidden="true"></span>';
     if(actions)bar.insertBefore(btn,actions);else bar.appendChild(btn);
   }
   if(!app.querySelector('#mac-profile-dialog'))app.insertAdjacentHTML('beforeend',shellDialogs());
   const alertsBody=app.querySelector('#mac-alerts-content');
   if(alertsBody)alertsBody.innerHTML=alerts(model,overrides);
   const cat=route.cat;
   if(cat&&!route.sub){
     const grid=app.querySelector('#mc-metrics');
     if(grid&&!grid.querySelector('.mac-comparison')){
       const html=compareSection(model,cat.id,overrides)+historyCard(model,cat.id);
       if(html)grid.insertAdjacentHTML('beforeend',html);
     }
   }
   appendQuickViewButtons(app,model);
   numAnimation(app.querySelector('#main-content'));
 }
 function initialize(app,getModel,getConfig,getOverrides){
   if(!app||typeof app.addEventListener!=='function')return;
   const dialog=(key)=>app.querySelector?.('#mac-'+key+'-dialog');
   function open(key,trigger){
     const box=dialog(key);if(!box)return;
     lastOpener=trigger;
     const model=getModel(),overrides=getOverrides();
     if(key==='profile'){
       const id=trigger?.dataset?.macProfile;
       if(!validId(id))return;
       const person=model.byId.get(id);if(!person)return;
       box.querySelector('#mac-profile-content').innerHTML=profile(person,model);
     }else{
       const container=box.querySelector('#mac-alerts-content');container.innerHTML=alerts(model,overrides);
     }
     if(typeof box.showModal==='function'&&!box.open)box.showModal();
     else box.setAttribute('open','');
   }
   const close=key=>{
     const box=dialog(key);if(!box)return;
     if(typeof box.close==='function'&&box.open)box.close();
     else box.removeAttribute('open');
     if(lastOpener?.isConnected)lastOpener.focus();
     lastOpener=null;
   };
   app.addEventListener('click',event=>{
     const profileTrigger=event.target?.closest?.('[data-mac-profile]');
     if(profileTrigger){open('profile',profileTrigger);return}
     const alertsTrigger=event.target?.closest?.('[data-mac-alerts]');
     if(alertsTrigger){open('alerts',alertsTrigger);return}
     const closer=event.target?.closest?.('[data-mac-close]');
     if(closer){close(closer.dataset.macClose);return}
   });
   app.addEventListener('change',event=>{
     if(!event.target?.matches?.('[data-mac-compare]'))return;
     const a=app.querySelector('#mac-division-a')?.value;
     const b=app.querySelector('#mac-division-b')?.value;
     const panel=app.querySelector('#mac-comparison-results');
     const model=getModel();
     const names=new Set(model.people.map(p=>p.division));
     if(!panel||!names.has(a)||!names.has(b))return;
     panel.innerHTML=compareResults(model,a,b,getOverrides());
   });
   app.addEventListener('click',event=>{
     const target=event.target;
     if(target?.tagName==='DIALOG'&&target.classList?.contains('mac-dialog')){
       const box=target,rect=box.getBoundingClientRect?.();
       if(rect&&(event.clientX<rect.left||event.clientX>rect.right||
         event.clientY<rect.top||event.clientY>rect.bottom))close(box.id==='mac-profile-dialog'?'profile':'alerts');
     }
   });
 }
 root.MC_MACOS={profile,alerts,totals,compareSection,compareResults,historyCard,
   mount,initialize,shellDialogs};
 if(typeof module==='object'&&module.exports)module.exports=root.MC_MACOS;
})(typeof window!=='undefined'?window:globalThis);
