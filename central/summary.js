/* MADDIE CENTRAL | 2027 — nine read-only category summaries.
   All values are derived exclusively from the fictional MC_DATA model.
   Never fall back to live services or claim that missing fixture data is verified. */
(function(root){
 'use strict';
 const missing='Not tracked';
 const metric=(label,value,detail,icon='chart',tone='pink')=>({
   label,value:value===undefined||value===null?missing:value,detail,icon,tone
 });
 const group=(label,value)=>({label,value});
 const note=(title,detail,tone='neutral',to)=>({title,detail,tone,to});
 const record=(title,detail,status,to)=>({title,detail,status,to});
 const color=['coral','butter','lilac','mint'];
 const link=(cat,sub)=>({category:cat,subcategory:sub});
 const counts=(items,status)=>items.filter(x=>x.status===status).length;
 const sum=(items,fn)=>items.reduce((a,b)=>a+fn(b),0);
 const unique=(items,fn)=>new Set(items.map(fn)).size;
 const pct=(v,n)=>n?Math.round(v*100/n):0;
 const fmt=n=>Number(n).toLocaleString('en-PH');
 function create(model,catId){
   if(!model||!model.collections||!model.metrics||!model.config)throw Error('Fictional summary model unavailable');
   const cat=model.config.categories.find(x=>x.id===catId);
   if(!cat)throw Error('Unknown trial category '+catId);
   const data=model.collections;
   const entries=(id)=>model.recordsFor(catId,id);
   let metrics=[],distribution=[],highlights=[],activity=[],risks=[],focus='',description='',state='Sample data';
   const dated=model.updatedAt;
   const recent=(items,catLabel='Sample record')=>items.slice(0,3).map((r,i)=>record(
     r.employeeId?catLabel+' · '+r.division:r.name,
     (r.status||'For Review')+' · '+(r.dueDate?'due '+r.dueDate:'fictional record'),
     r.status||'For Review',null));
   switch(catId){
   case 'people-directory':{
     const docs=data.docs,needs=docs.filter(x=>x.status==='Requested'),unknown=docs.filter(x=>x.status==='Not Started');
     const divisionCounts=new Map();
     needs.forEach(x=>divisionCounts.set(x.division,(divisionCounts.get(x.division)||0)+1));
     metrics=[
       metric('Fictional employees',model.people.length,'Unique linked Employee IDs','users','pink'),
       metric('201 file checkpoints',docs.length,'Nine requirement types per employee','briefcase','butter'),
       metric('Verified checkpoints',counts(docs,'Approved/Verified'),'Status verified in demo fixture only','check','mint'),
       metric('Files requested',needs.length,'Sample document gaps','info','coral'),
       metric('Not yet checked',unknown.length,'No review completed in fixture','calendar','lilac'),
       metric('KPI scorecards',data.performance.length,'Unverified fictional scores','chart','pink'),
       metric('Employment movements',data.movements.length,'Fictional promotion entries','route','butter')
     ];
     distribution=['Approved/Verified','Requested','Not Started','Not Applicable'].map(s=>group(s,counts(docs,s)));
     highlights=[
       note('Missing 201 file checkpoints',fmt(needs.length)+' sample document requests across '+divisionCounts.size+' divisions','attention',link(catId,'employment-documents')),
       note('Masterlist reconciliation',fmt(model.people.length)+' unique fictional IDs, linked to the records in this trial','positive',link(catId,'employee-masterlist')),
       note('Movement review queue',fmt(data.movements.length)+' fictional promotion entries are available','neutral',link(catId,'employment-movements'))
     ];
     activity=Array.from(divisionCounts,([div,n])=>record(div,fmt(n)+' requested document checkpoints','Requested',link(catId,'employment-documents'))).sort((a,b)=>parseInt(b.detail)-parseInt(a.detail)).slice(0,3);
     risks=[note('Unreviewed 201 files',fmt(unknown.length)+' checkpoints have no confirmed review in the sample.','attention')];
     focus='Employee records and document completeness';description='Counts reflect the fictional masterlist and 201 file statuses; no actual employee documents are loaded.';break;
   }
   case 'pay-benefits':{
     const benefits=data.benefits,changing=data.movements;
     metrics=[
       metric('Sample pay records',model.people.length,'Count only; individual amounts hidden','wallet','pink'),
       metric('Compensation movements',changing.length,'Fictional movement requests','route','coral'),
       metric('Benefit checkpoints',benefits.length,'Synthetic benefit status records','heart','butter'),
       metric('Benefit reviews needed',counts(benefits,'For Review'),'No real enrollment or claims','info','lilac'),
       metric('Completed checkpoints',counts(benefits,'Completed'),'Fictional benefit workflow','check','mint'),
       metric('HMO enrollments',missing,'Enrollment-level source not provided','shield','pink'),
       metric('Government contributions',missing,'No source-backed contributions','briefcase','butter')
     ];
     distribution=['For Review','In Progress','Completed'].map(s=>group(s,counts(benefits,s)));
     highlights=[
       note('Benefits review queue',fmt(counts(benefits,'For Review'))+' fictional checkpoints awaiting review','attention',link(catId,'benefits-review')),
       note('Compensation records protected','Individual salary figures never appear on this category summary.','positive',link(catId,'salary-masterlist')),
       note('Insurance and HMO data','Not tracked in the demo fixture; no enrollment status is inferred.','neutral',link(catId,'hmo'))
     ];
     activity=[
       record('Benefits readiness',fmt(counts(benefits,'Completed'))+' sample checkpoints completed','Completed',link(catId,'maddie-benefits')),
       record('Compensation movement review',fmt(changing.length)+' fictional employee movement entries','For Review',link(catId,'compensation-movement'))
     ];
     risks=[note('Source limitations','Payouts, payroll, contributions and provider coverage are not verified or synced.','neutral')];
     focus='Compensation and benefits readiness';description='Aggregate fictional records only. Individual pay, medical and benefit details are excluded from this summary.';break;
   }
   case 'workforce-pulse':{
     const logs=data.attendance,exceptions=logs.filter(x=>['Late','Absent'].includes(x.status));
     const byDivision=new Map();
     exceptions.forEach(x=>byDivision.set(x.division,(byDivision.get(x.division)||0)+1));
     metrics=[
       metric('Verified demo logs',logs.length,'Unverified fixture rows excluded','check','mint'),
       metric('Late entries',counts(logs,'Late'),'Fictional historical entries','activity','coral'),
       metric('Absent entries',counts(logs,'Absent'),'Fictional historical entries','calendar','pink'),
       metric('On-leave entries',counts(logs,'On Leave'),'Not counted as violations','heart','butter'),
       metric('Exceptions to review',exceptions.length,'Late + absent sample entries','info','lilac'),
       metric('Divisions with logs',unique(logs,x=>x.division),'Divisions represented in fixture','users','mint'),
       metric('Present today',missing,'No complete daily timesheet in fixture','activity','pink'),
       metric('Overtime hours',missing,'No overtime submissions in fixture','calendar','butter')
     ];
     distribution=['Late','Absent','On Leave'].map(s=>group(s,counts(logs,s)));
     highlights=Array.from(byDivision,([division,n])=>note(division,fmt(n)+' historical fictional exceptions','attention',link(catId,'division-attendance'))).sort((a,b)=>parseInt(b.detail)-parseInt(a.detail)).slice(0,3);
     activity=recent(logs.slice(-3).reverse(),'Attendance entry').map(x=>({...x,to:link(catId,'daily-attendance')}));
     risks=[note('Daily presence unavailable','The demo records are exception samples; they cannot establish a present-today rate.','neutral')];
     focus='Attendance exceptions and workforce coverage';description='Verified entries mean validated within the fictional fixture, not official timekeeping verification.';break;
   }
   case 'maddie-journey':{
     const journey=data.journey,complete=counts(journey,'Completed'),assessment=counts(journey,'For Assessment');
     const avg=pct(sum(journey,x=>x.percent||0),journey.length*100);
     metrics=[
       metric('Journey profiles',journey.length,'One fictional journey per employee','users','pink'),
       metric('In progress',counts(journey,'In Progress'),'Demo milestones underway','route','butter'),
       metric('For assessment',assessment,'Sample reviews pending','info','coral'),
       metric('For revalida',counts(journey,'For Revalida'),'No entries with this status in fixture','shield','lilac'),
       metric('Completed',complete,'Fictional checklist completion','check','mint'),
       metric('Average progress',avg+'%','From stage checkmarks','chart','pink'),
       metric('KPI report cards',data.performance.length,'Fictional, unverified scores','briefcase','butter'),
       metric('Employee movements',data.movements.length,'Fictional promotion entries','route','coral')
     ];
     distribution=['Pending Requirements','In Progress','For Assessment','For Revalida','Completed'].map(s=>group(s,counts(journey,s)));
     highlights=[
       note('Next assessment cycle',fmt(assessment)+' journey profiles are at the sample assessment stage','attention',link(catId,'career-direction-level-gates')),
       note('Milestone completion',avg+'% average of fictional checklist items','positive',link(catId,'employee-journey-profile')),
       note('Performance reviews',fmt(data.performance.length)+' unverified report cards available for review','neutral',link(catId,'performance-report-cards'))
     ];
     activity=journey.slice(0,3).map(x=>record(x.division,x.detail+' · '+x.percent+'%','In Progress',link(catId,'employee-journey-profile')));
     risks=[note('No verified regularization decisions','Journey milestones and career gates are demonstration records only.','neutral')];
     focus='Career progress, assessments and readiness';description='Checklist-based estimates are not final HR or leadership approvals.';break;
   }
   case 'maddie-learning-hub':{
     const programs=data.training,attendance=data.trainingAttendance;
     metrics=[
       metric('Training programs',programs.length,'Fictional course catalog','briefcase','pink'),
       metric('Scheduled sessions',counts(programs,'Scheduled'),'Training status in fixture','calendar','butter'),
       metric('Completed sessions',counts(programs,'Completed'),'Training status in fixture','check','mint'),
       metric('Participant records',attendance.length,'Employee-linked synthetic entries','users','coral'),
       metric('Attended',counts(attendance,'Attended'),'Fictional attendance markers','check','mint'),
       metric('Make-up required',counts(attendance,'Make-up Required'),'Follow-up training status','info','lilac'),
       metric('Active trainers',missing,'No verified trainer roster supplied','graduation','butter'),
       metric('Assessment results',missing,'No formal pre/post test data','chart','pink')
     ];
     distribution=['Planned','Open for Registration','Scheduled','In Progress','Completed','Cancelled','Rescheduled'].map(s=>group(s,counts(programs,s)));
     highlights=programs.slice(0,3).map(x=>note(x.name,x.status+' · '+(x.dueDate||'No date'),'neutral',link(catId,'training-programs')));
     activity=recent(attendance.slice(0,3),'Learning participation').map(x=>({...x,to:link(catId,'training-attendance')}));
     risks=[note('Missing evaluation evidence','Training assessments and trainer allocations have no validated source in the trial.','neutral')];
     focus='Learning calendar and capability development';description='Learning schedules and attendance are synthetic; certificates and assessed outcomes are not inferred.';break;
   }
   case 'culture-community':{
     const events=data.events,milestones=data.milestones;
     metrics=[
       metric('Culture activities',events.length,'Fictional company calendar items','heart','pink'),
       metric('Scheduled events',counts(events,'Scheduled'),'Planned demo events','calendar','butter'),
       metric('Completed events',counts(events,'Completed'),'Fixture statuses only','check','mint'),
       metric('Milestone records',milestones.length,'Fictional recognition entries','users','lilac'),
       metric('For approval',counts(events,'For Approval'),'Sample event requests','info','coral'),
       metric('Recognition activities',events.filter(x=>/Recognition/i.test(x.name)).length,'Fictional program types','heart','pink'),
       metric('Feedback programs',events.filter(x=>/Feedback/i.test(x.name)).length,'Not employee responses','activity','butter')
     ];
     distribution=['Proposed','For Approval','Approved','Scheduled','In Preparation','Completed','Post-Event Review','Cancelled'].map(s=>group(s,counts(events,s)));
     highlights=events.filter(x=>x.status!=='Completed').slice(0,3).map(x=>note(x.name,x.status+' · due '+(x.dueDate||'TBD'),'neutral',link(catId,'company-events')));
     activity=recent(milestones.slice(0,3),'Recognition entry').map(x=>({...x,to:link(catId,'maddie-milestones')}));
     risks=[note('Participation not verified','Events do not imply attendance, feedback scores or published employee stories.','neutral')];
     focus='Culture calendar, recognition and engagement';description='Illustrative internal events and recognition records; no actual event invitations or personal stories.';break;
   }
   case 'talent-acquisition':{
     const hires=data.hiring;
     metrics=[
       metric('Sample requisitions',hires.length,'One fictitious role per division','briefcase','pink'),
       metric('Active requisitions',hires.filter(x=>!['Hired','Cancelled','Rejected'].includes(x.status)).length,'Demo staffing pipeline','activity','butter'),
       metric('Sourcing',counts(hires,'Sourcing'),'Recruitment stage','search','mint'),
       metric('Screening',counts(hires,'Screening'),'Recruitment stage','users','lilac'),
       metric('Offers pending',counts(hires,'For Offer'),'Recruitment stage','info','coral'),
       metric('Hired',counts(hires,'Hired'),'Fictional recruitment outcomes','check','mint'),
       metric('Candidate profiles',missing,'No applicant-level source in fixture','users','pink'),
       metric('Verified vacancy age',missing,'No approved opening timestamp','calendar','butter')
     ];
     distribution=['For Approval','Approved','Sourcing','Screening','Initial Interview','Assessment','Final Interview','Reference Check','For Offer','Offer Accepted','Hired','On Hold','Cancelled','Rejected'].map(s=>group(s,counts(hires,s)));
     highlights=hires.slice(0,3).map(x=>note(x.division,x.name+' · '+x.status,'neutral',link(catId,'recruitment-pipeline')));
     activity=recent(hires.slice(-3).reverse(),'Requisition').map(x=>({...x,to:link(catId,'manpower-requisition')}));
     risks=[note('Vacancy aging unavailable','The fixture lacks an opening/approval timestamp; days-open figures are intentionally omitted.','neutral')];
     focus='Recruitment stage visibility and manpower';description='Requisition examples are fictional; no applicant identities or verified candidate counts are available.';break;
   }
   case 'people-governance':{
     const cases=data.governance;
     metrics=[
       metric('Demo case shells',cases.length,'De-identified fictional items','shield','pink'),
       metric('Open',counts(cases,'Open'),'Status summary only','info','butter'),
       metric('Initial review',counts(cases,'Initial Review'),'Status summary only','activity','coral'),
       metric('Under investigation',counts(cases,'Under Investigation'),'Status summary only','shield','lilac'),
       metric('Awaiting response',counts(cases,'Awaiting Response'),'Status summary only','calendar','butter'),
       metric('Closed',counts(cases,'Closed'),'Status summary only','check','mint'),
       metric('Corrective action records',missing,'No approved outcomes in fixture','briefcase','pink')
     ];
     distribution=['Open','Initial Review','Under Investigation','Awaiting Response','Governance Review','For Authorized Decision','Action in Progress','Closed'].map(s=>group(s,counts(cases,s)));
     highlights=[
       note('Restricted demo case register',fmt(cases.length)+' de-identified case shells · no identifiable allegations','neutral',link(catId,'case-status')),
       note('Active review volume',fmt(cases.filter(x=>x.status!=='Closed').length)+' sample case shells not in closed status','attention',link(catId,'governance-review')),
       note('Case owner required','Authorized staff must verify source, evidence and access before real implementation.','neutral')
     ];
     activity=[record('Governance status snapshot','De-identified aggregate only','For Review',link(catId,'case-status'))];
     risks=[note('Highly restricted information','No detailed employee-relations case files, notes, evidence or names are available.','neutral')];
     focus='Governance workload · aggregated only';description='No case details, names, medical information or restricted evidence is displayed here.';break;
   }
   case 'executive-scoreboard':{
     const decisions=data.decisions,open=decisions.filter(x=>x.status==='Decision Required');
     metrics=[
       metric('Headcount',model.people.length,'Linked demo Employee Masterlist','users','pink'),
       metric('Document requests',model.metrics.missing201,'201 file review queue','briefcase','butter'),
       metric('Attendance exceptions',model.metrics.attendanceExceptions,'Verified fictional entries only','activity','coral'),
       metric('Open requisitions',model.metrics.openRequisitions,'Fictional vacancies','briefcase','mint'),
       metric('Training programs',model.metrics.trainingPrograms,'Sample programs','graduation','lilac'),
       metric('Journey reviews pending',model.metrics.pendingJourney,'Incomplete sample journeys','route','butter'),
       metric('Decisions required',open.length,'Synthetic executive actions','info','pink'),
       metric('Blocked actions',counts(decisions,'Blocked'),'Fictional blockers','shield','coral')
     ];
     distribution=['For Review','Decision Required','Approved','Declined','In Progress','Blocked','Completed','Deferred'].map(s=>group(s,counts(decisions,s)));
     highlights=[
       note('Executive decisions',fmt(open.length)+' fictional requests awaiting a decision','attention',link(catId,'executive-decisions')),
       note('Workforce snapshot',fmt(model.people.length)+' fictional employees across '+fmt(model.metrics.divisions)+' divisions','positive',link(catId,'headcount-report')),
       note('WIG #4 scoring','Targets and verified actuals are not available in this fixture.','neutral',link(catId,'wig4-scorecard'))
     ];
     activity=decisions.slice(0,3).map(x=>record(x.name,x.status+' · '+x.owner,x.status,link(catId,'executive-decisions')));
     risks=[
       note('Demonstration blockers',fmt(counts(decisions,'Blocked'))+' blocked action states in sample records','attention',link(catId,'risks-blockers')),
       note('WIG #4 targets not confirmed','The scorecard must not present synthetic progress as an approved performance target.','neutral')
     ];
     focus='Organization-wide health and executive decisions';description='De-identified demo rollups, not verified corporate reports, payroll totals or approved WIG targets.';break;
   }
   }
   if(metrics.length<4||metrics.length>8)throw Error('Summary must have 4 to 8 metrics: '+catId);
   // Every highlight link must resolve within the category.
   for(const item of [...highlights,...activity,...risks]){
     if(item.to&&!cat.subcategories.some(s=>s.id===item.to.subcategory))throw Error('Invalid summary link '+catId+': '+item.to.subcategory);
   }
   return {id:catId,title:cat.label,subtitle:cat.subtitle,
     focus,description,metrics,distribution,highlights,activity,risks,
     category:cat,asOf:dated,period:model.period,owner:'People & Culture (fictional trial)',
     total:metrics.length,fictional:true};
 }
 const api={create,missing};
 root.MC_SUMMARY=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
