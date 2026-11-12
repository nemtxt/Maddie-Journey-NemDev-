/* Maddie Journey · demonstration fixtures only. No employee or payroll records are real. */
(function () {
  'use strict';
  const divisions = [
    { id:'rmd', name:'Revenue Management Division', short:'RMD', evaluators:['trizia'] },
    { id:'design', name:'Design Division', short:'Design', evaluators:['aj'] },
    { id:'corp', name:'Corporate Operations', short:'Corp Ops', evaluators:['renato','zsarina'] },
    { id:'media', name:'Media', short:'Media', evaluators:['michelle'] },
    { id:'it', name:'IT', short:'IT', evaluators:['inigo-evaluator'] },
    { id:'gencon', name:'GenCon', short:'GenCon', evaluators:['inigo-evaluator'] },
    { id:'bd', name:'Business Development', short:'Business Dev', evaluators:['cristine'] }
  ];
  const viewers = [
    {id:'giezelle',name:'GIEZELLE',title:'People & Culture · HR',role:'hr'},
    {id:'kurt',name:'KURT',title:'People & Culture · HR',role:'hr'},
    {id:'trizia',name:'TRIZIA BALDOVI',title:'Chief Experience Officer · RMD',role:'head',divisions:['rmd']},
    {id:'aj',name:'AR. AJ TRABADO',title:'Design Operations Manager · Design',role:'head',divisions:['design']},
    {id:'renato',name:'RENATO RENDON',title:'Corporate Operations Head',role:'corp',divisions:['corp']},
    {id:'zsarina',name:'ZSARINA MAE LACUMBA',title:'Corporate Operations Head',role:'corp',divisions:['corp']},
    {id:'michelle',name:'MICHELLE OROCIO',title:'Media Manager',role:'head',divisions:['media']},
    {id:'inigo',name:'INIGO ARELLANO',title:'COO · Observer (all divisions)',role:'coo'},
    {id:'inigo-evaluator',name:'INIGO ARELLANO',title:'Division Head · IT & GenCon evaluator',role:'head',divisions:['it','gencon']},
    {id:'cristine',name:'MA. CRISTINE ORTIZ',title:'Business Development Head',role:'head',divisions:['bd']},
    {id:'ceo',name:'CEO (DEMO ROLE)',title:'Executive · Monitoring',role:'ceo'},
    {id:'cso',name:'CSO (DEMO ROLE)',title:'Executive · Strategic Review',role:'cso'}
  ];
  const stages = [
    {name:'Onboarding & Setup', timing:'Week 1', items:['Employee onboarding and documentation','Probationary Employment Contract','Non-Disclosure Agreement (NDA)','Non-Compete Contract (NCC)','Culture Code Review','Biometrics registration']},
    {name:'Onboarding & Immersion', timing:'First month', items:['CSO Onboarding','Airtable Training by COO Team','Division Head Orientation','Employee KPI Assignment','New Maddie Immersion Activity — presentation to CEO']},
    {name:'Third Month Check-in', timing:'Month 3', items:['KPI review with Division Head','Performance review','Feedback and support','Development plan, if needed']},
    {name:'Fifth Month Check-in', timing:'Month 5', items:['KPI review with Division Head','Performance review','Feedback and support','Development plan, if needed']},
    {name:'Before Regularization', timing:'Pre-regularization', items:['CSO revalida','Assessment for regularization','Overall performance review','Readiness for regularization']},
    {name:'All Revalidas (with CEO)', timing:'Final review', items:['Final revalida with CEO','Evaluation of performance, behavior and cultural fit','Approval for regularization']},
    {name:'Gates & Development Shall Apply', timing:'Growth & follow-up', items:['Eligibility for promotion — next review after 6 months','Evaluation subject to business needs','Development plan and growth track']}
  ];
  const kit = [
    {id:'laptop',label:'Laptop / equipment issued',type:'equipment'},
    {id:'chatgpt',label:'ChatGPT account setup and access',type:'software'},
    {id:'claude',label:'Claude account setup and access',type:'software'},
    {id:'divisionapps',label:'Division-specific software and applications',type:'software'},
    {id:'email',label:'Official working email setup',type:'access'},
    {id:'whatsapp',label:'WhatsApp access',type:'access'},
    {id:'groupchats',label:'Relevant group chat invitations',type:'access'},
    {id:'welcomegc',label:'Welcome Maddie GC',type:'access'},
    {id:'community',label:'One Mad Fam Community',type:'access'},
    {id:'uniform',label:'Company uniform',type:'equipment'},
    {id:'id',label:'Company ID',type:'equipment'}
  ];
  const first = ['Avery','Blake','Casey','Drew','Emery','Finley','Gray','Harper','Indigo','Jordan','Kai','Logan','Morgan','Noel','Oakley','Parker','Quinn','Reese','Sage','Taylor','Uri','Vale','Wren','Zion','Amari','Briar','Cameron','Devon','Elliot','Frankie','Hayden','Jules','Keegan','Lane','Marley','Nico','Ollie','Peyton','Riley','Shay','Tatum','Alexis','Bailey','Charlie','Dallas','Ellis','Flynn','Jamie','Kendall','Lennon','Micah'];
  const last = ['Santos','Reyes','Cruz','Lopez','Tan','Garcia','Flores','Ramos','Torres','Castillo','Rivera','Lim','Mendoza','Navarro','Cortez','Villanueva','Dizon','Bautista','Salazar','Aquino','Serrano','Estrada','Aguilar','Marquez','Domingo'];
  const roles = ['Operations Associate','Account Specialist','Project Coordinator','Analyst','Associate','Team Coordinator','Program Specialist'];
  function dateFor(n,offset) { const d = new Date(Date.UTC(2026,0,9 + (n*6)%270 + offset)); return d.toISOString().slice(0,10); }
  function makeEmployee(index) {
    const i=index+1, div=divisions[index%divisions.length], completion=(index*17+23)%100;
    const stageChecks = stages.map((s,si) => s.items.map((_,j) => ((index+si*5+j*3)%100) < Math.max(8,completion-si*9)));
    const kitChecks = kit.map((_,j) => ((index*7+j*11)%100) < completion);
    const attendance=[];
    if (index%5!==0) attendance.push({id:'ar-'+i+'a',date:dateFor(index,-22),type:'Late',reason:'Traffic delay (demo)',approval:'Excused',verified:true,remarks:'Supervisor verified (demo)'});
    if (index%7===0) attendance.push({id:'ar-'+i+'b',date:dateFor(index,-5),type:'Absent',reason:'Personal matter (demo)',approval:'Unapproved',verified:true,remarks:'For discussion (demo)'});
    if (index%4===0) attendance.push({id:'ar-'+i+'c',date:dateFor(index,4),type:'Leave',reason:'Approved leave (demo)',approval:'Approved',verified:true,remarks:'Approved leave — not a violation'});
    if (index%9===0) attendance.push({id:'ar-'+i+'d',date:dateFor(index,9),type:'Late',reason:'Unverified sample entry',approval:'Pending',verified:false,remarks:'Excluded from dashboard until verified'});
    const scoring = {division:75+(index*3)%25,individual:72+(index*7)%29,values:79+(index*5)%22,behavior:77+(index*11)%24};
    const steps=['division','corp','cso','coo'];
    const review = {};
    steps.forEach(s => review[s]={status:'Pending',comment:'',at:''});
    return {
      id:'MJ-'+String(i).padStart(3,'0'),name:first[index]+' '+last[index%last.length],division:div.id,jobTitle:roles[(index*3)%roles.length],
      email:'employee'+String(i).padStart(2,'0')+'@example.com',startDate:dateFor(index,-90),journey:stageChecks,
      journeyNotes:{},kit:kitChecks,kitNotes:{},attendance:attendance, scores:scoring,
      kpiItems:[{title:'Division delivery quality',target:'Sample target · 90%',actual:String(70+(index*7)%31)+'%',verified:false},
                {title:'On-time task completion',target:'Sample target · 95%',actual:String(65+(index*3)%36)+'%',verified:false}],
      kpiSource:'Demo placeholders — official 2026 KPI sheet not linked',kpiValidated:false,
      currentBasic:25000+(index%8)*2750,currentAllowances:1500+(index%4)*500,
      proposedPct:2+(index%7),approvedPct:0,effectiveDate:'',
      comments:{division:'',hr:'',corp:'',cso:'',coo:'',employee:''},review:review,
      modifiedAt:'', audit:[]
    };
  }
  const employees=Array.from({length:51},(_,i)=>makeEmployee(i));
  // Fictional end-to-end review examples for executive dashboard demonstrations.
  // These are never official or verified employee reviews.
  employees.forEach(function(e,index){
    const stage=index%11===0?'coo':index%9===0?'cso':index%7===0?'corp':index%5===0?'division':null;
    if(!stage)return;
    const steps=['division','corp','cso','coo'],limit=steps.indexOf(stage);
    for(let n=0;n<=limit;n++){
      const k=steps[n],who=k==='division'?'Division evaluator':k==='corp'?'Corporate Operations':k==='cso'?'CSO':'COO';
      const status=k==='coo'?'Approved':'Endorsed',comment=who+' · completed demonstration review';
      e.review[k]={status:status,comment:comment,at:'2026-11-08T09:00:00.000Z'};
      e.comments[k]=comment;
    }
    if(stage==='coo'){e.approvedPct=e.proposedPct;e.effectiveDate='2026-12-01';}
  });
  window.MJ_SEED={version:3,divisions:divisions,viewers:viewers,stages:stages,kit:kit,employees:employees};
})();