/* MADDIE CENTRAL | 2027 — pure fictional model. Source is the v3.7 51-person demo fixture only. */
(function(root){
 'use strict';
 function build(seed,config){
   if(!seed||!Array.isArray(seed.employees)||!config)throw Error('Fictional seed/schema unavailable. Live data must never be used as fallback.');
   const divs=new Map(seed.divisions.map(d=>[d.id,d]));
   const people=seed.employees.map((p,i)=>({
     employeeId:p.id,name:p.name,division:divs.get(p.division)?.name||'Unassigned',
     divisionId:p.division,position:p.jobTitle||'Associate',hireDate:p.startDate,
     managerId:p.reportsTo||'',email:p.email||'',salary:Number(p.currentBasic)||0,
     employmentStatus:i%13===0?'Probationary':i%17===0?'On Leave':'Regular',
     journeyStage:(seed.stages.findIndex((s,si)=>(p.journey[si]||[]).some(x=>!x))<0?seed.stages.length-1:Math.max(0,seed.stages.findIndex((s,si)=>(p.journey[si]||[]).some(x=>!x)))),
     source:p
   }));
   if(new Set(people.map(p=>p.employeeId)).size!==51||people.length!==51)throw Error('Expected 51 unique fictional Employee IDs.');
   const byId=new Map(people.map(p=>[p.employeeId,p]));
   const today='2026-11-13', period='2026 demonstration fixture';
   const common=(id,person,name,status,detail,extra={})=>({
     recordId:id,employeeId:person?.employeeId||'',name:name||'',division:person?.division||'Organization-wide',
     detail:detail||'',status:status||'For Review',owner:'P&C (demo)',updatedAt:today,dueDate:'',
     confidentiality:'Internal',...extra
   });
   const docStatus={complete:'Approved/Verified',missing:'Requested','not-checked':'Not Started','not-applicable':'Not Applicable'};
   const docs=[];
   for(const p of people)for(const def of seed.documents201||[]){
     const raw=p.source.files201?.[def.id]||'not-checked';
     docs.push(common('201-'+p.employeeId+'-'+def.id,p,def.label,docStatus[raw]||'Not Started',
       def.group+' · linked to '+p.name,{documentGroup:def.group,documentKey:def.id,
       confidentiality:def.group==='Government'?'Highly Restricted':'Confidential'}));
   }
   const attendance=people.flatMap(p=>(p.source.attendance||[]).filter(a=>a.verified).map(a=>{
     const status=a.type==='Leave'?'On Leave':a.type==='Absent'?'Absent':a.type==='Late'?'Late':'Present';
     return common(a.id,p,p.name,status,a.date+' · '+a.type,{date:a.date,owner:'Attendance review (demo)'});
   }));
   const journey=people.map((p,i)=>{
     const checks=(p.source.journey||[]).flat();
     const done=checks.filter(Boolean).length, percent=checks.length?Math.round(done/checks.length*100):0;
     const status=percent===100?'Completed':percent>60?'For Assessment':percent>25?'In Progress':'Pending Requirements';
     return common('JRN-'+p.employeeId,p,p.name,status,(seed.stages[p.journeyStage]||{}).name||'Journey stage',
       {percent,detailExtra:'Completion: '+percent+'%',owner:'Division review (demo)',dueDate:'2026-12-'+String(1+i%25).padStart(2,'0')});
   });
   const performance=people.map((p,i)=>{
     const scores=p.source.scores||{};
     const values=[scores.division,scores.individual,scores.values,scores.behavior].map(Number).filter(Number.isFinite);
     const mean=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
     return common('KPI-'+p.employeeId,p,p.name,'For Review',mean+'% · unverified fictional KPI composition',
       {percent:mean,owner:'Division evaluator (demo)',dueDate:'2026-12-15',confidentiality:'Confidential'});
   });
   const movements=people.flatMap(p=>(p.source.promotions||[]).map(x=>common('MOV-'+x.id,p,p.name,
     x.status==='Approved'?'Approved':'For Review',x.from+' → '+x.to,{date:x.date,owner:'P&C (demo)',confidentiality:'Confidential'})));
   const benefits=people.map((p,i)=>common('BEN-'+p.employeeId,p,p.name,
       i%4===0?'For Review':i%3===0?'In Progress':'Completed',
       'Eligibility snapshot · no medical or insurance details',{owner:'Benefits desk (demo)',confidentiality:'Confidential'}));
   const trainingNames=['Professional Mastery','AI / Tool Mastery','Customer Journey','Design Craft Studio','Division Technical Training','Leadership Essentials','Coaching for Managers','Skills Assessment'];
   const training=trainingNames.map((name,i)=>common('TRN-'+String(i+1).padStart(3,'0'),null,name,
     config.options.trainingStatus[i%config.options.trainingStatus.length],
     (i%2?'Specialized':'Universal')+' · fictional learning schedule',
     {division:seed.divisions[i%seed.divisions.length]?.name||'Organization-wide',
      owner:'Learning coordinator (demo)',dueDate:'2026-12-'+String(2+i*3).padStart(2,'0')}));
   const trainingAttendance=people.map((p,i)=>common('TRA-'+p.employeeId,p,p.name,
     config.options.trainingAttendance[i%config.options.trainingAttendance.length],
     training[i%training.length].name+' · employee-linked fictional participation',
     {trainingId:training[i%training.length].recordId,owner:'Learning coordinator (demo)'}));
   const eventNames=['Maddie Hour','General Assembly','Humans of Madhouse','Company Day','Monthly Engagement','Culture Campaign','Employee Recognition','CEO Vision Alignment','Work Anniversary Review','Well-being Program','Quarterly Feedback','Annual Milestones'];
   const events=eventNames.map((name,i)=>common('EVT-'+String(i+1).padStart(3,'0'),null,name,
     config.options.eventStatus[i%config.options.eventStatus.length],
     'Fictional calendar item · no real invitations',{owner:'Culture team (demo)',dueDate:'2026-12-'+String(2+i*2).padStart(2,'0')}));
   const milestones=people.filter((_,i)=>i%4===0).map((p,i)=>common('MILE-'+p.employeeId,p,p.name,
     'Scheduled','Fictional recognition / work anniversary',{owner:'Culture team (demo)'}));
   const hiring=seed.divisions.map((div,i)=>common('REQ-'+String(i+1).padStart(3,'0'),null,
     ['Operations Associate','Designer','Technical Lead','Project Coordinator','Media Specialist','IT Analyst','Site Supervisor','Account Specialist'][i]||'Associate',
     config.options.recruitmentStatus[(i+1)%config.options.recruitmentStatus.length],
     '1 approved example position · '+div.name,
     {division:div.name,owner:'Talent team (demo)',dueDate:'2026-12-'+String(3+i*3).padStart(2,'0')}));
   const cases=['Policy acknowledgement review','Documentation workflow review','Procedure clarification','Governance check'];
   const governance=cases.map((name,i)=>common('GOV-'+String(i+1).padStart(3,'0'),null,
     name,config.options.caseStatus[i%config.options.caseStatus.length],
     'Fictional case shell · no employee details or allegation',
     {owner:'Governance reviewer (demo)',confidentiality:'Highly Restricted'}));
   const actions=['Review 201 file exceptions','Approve WIG #4 sample targets','Confirm learning calendar','Resolve vacancy aging sample','Review attendance trends','Check probation milestones'];
   const decisions=actions.map((name,i)=>common('ACT-'+String(i+1).padStart(3,'0'),null,name,
     config.options.executiveStatus[i%config.options.executiveStatus.length],
     'Fictional executive action · demonstration only',
     {owner:i%2?'COO (demo)':'CEO (demo)',dueDate:'2026-12-'+String(10+i*2).padStart(2,'0')}));
   const missing=docs.filter(d=>d.status==='Requested').length;
   const verified=docs.filter(d=>d.status==='Approved/Verified').length;
   const pending=docs.filter(d=>d.status==='Not Started').length;
   const metrics={
     headcount:people.length,divisions:seed.divisions.length,
     missing201:missing,verified201:verified,notChecked201:pending,
     attendanceExceptions:attendance.filter(a=>['Late','Absent'].includes(a.status)).length,
     pendingJourney:journey.filter(j=>j.status!=='Completed').length,
     trainingPrograms:training.length,openRequisitions:hiring.filter(r=>r.status!=='Hired').length,
     governanceCases:governance.length,decisionsRequired:decisions.filter(a=>a.status==='Decision Required').length
   };
   const summaryMetrics=[
     ['Workforce headcount',metrics.headcount,'employees · derived from one Employee Masterlist'],
     ['201 files requiring request',metrics.missing201,'document checkpoints · synthetic'],
     ['201 files not checked',metrics.notChecked201,'document checkpoints · synthetic'],
     ['Verified 201 file checkpoints',metrics.verified201,'document checkpoints · synthetic'],
     ['Attendance exceptions',metrics.attendanceExceptions,'verified fictional late / absent entries'],
     ['Journey pending',metrics.pendingJourney,'employee journey records'],
     ['Training programs',metrics.trainingPrograms,'fictional schedules'],
     ['Recruitment requisitions',metrics.openRequisitions,'fictional vacancies'],
     ['Governance case shells',metrics.governanceCases,'de-identified fiction · count only'],
     ['Executive decisions required',metrics.decisionsRequired,'fictional action items']
   ].map(([name,value,detail],i)=>common('MET-'+(i+1),null,name,'For Review',String(value)+' · '+detail,
     {value,owner:'P&C reporting (demo)'}));
   const collections={docs,attendance,journey,performance,movements,benefits,training,trainingAttendance,events,milestones,hiring,governance,decisions,summaryMetrics};
   function recordsFor(categoryId,subcategoryId){
     const category=config.categories.find(c=>c.id===categoryId);
     const sub=category?.subcategories.find(s=>s.id===subcategoryId);
     if(!sub)return [];
     let items=[];
     switch(sub.kind){
       case 'employees': items=people.map(p=>common('EMP-'+p.employeeId,p,p.name,p.employmentStatus,
         p.position+' · '+p.employeeId,{employeeId:p.employeeId,hireDate:p.hireDate,managerId:p.managerId,
         owner:'P&C (demo)',email:p.email,confidentiality:sub.classification}));break;
       case 'salary': items=people.map(p=>common('PAY-'+p.employeeId,p,p.name,'For Review',
         'PHP '+p.salary.toLocaleString('en-PH')+' monthly · invented sample',
         {owner:'Finance (demo)',confidentiality:'Highly Restricted'}));break;
       case 'documents': items=docs.filter(d=>{
         if(sub.id==='employment-documents')return ['Employment','Contracts'].includes(d.documentGroup);
         if(sub.id==='government-requirements')return d.documentGroup==='Government';
         if(sub.id==='acknowledgements')return d.documentKey==='nda'||d.documentKey==='ncc';
         if(sub.id==='exit-records')return false;
         return true;
       });break;
       case 'movements':items=movements;break;
       case 'performance':items=performance;break;
       case 'journey':items=journey;break;
       case 'attendance':items=attendance.filter(a=>sub.id!=='lates-and-absence-monitoring'||['Late','Absent'].includes(a.status));break;
       case 'attendance-summary':items=summaryMetrics.filter(r=>['Workforce headcount','Attendance exceptions'].includes(r.name));break;
       case 'benefits':items=benefits;break;
       case 'training':items=training;break;
       case 'training-attendance':items=trainingAttendance;break;
       case 'events':items=events;break;
       case 'milestones':items=milestones;break;
       case 'recruitment':items=hiring;break;
       case 'cases':items=governance;break;
       case 'actions':items=decisions;break;
       case 'summary':items=summaryMetrics;break;
       default:items=[];
     }
     return items.map(r=>({...r,category:categoryId,subcategory:subcategoryId,confidentiality:
       sub.classification==='Highly Restricted'?'Highly Restricted':r.confidentiality||sub.classification}));
   }
   return {people,byId,collections,metrics,period,updatedAt:today,recordsFor,config};
 }
 root.MC_BUILD_MODEL=build;
 if(root.MJ_SEED&&root.MC_CONFIG)root.MC_DATA=build(root.MJ_SEED,root.MC_CONFIG);
 if(typeof module==='object'&&module.exports)module.exports=build;
})(typeof window!=='undefined'?window:globalThis);
