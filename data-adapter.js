/* Maddie Journey v3.8 — READ-ONLY DATA BOUNDARY.
 * This file intentionally has NO network, authentication or connector APIs.
 * GitHub Pages publishes PUBLIC files: never put private HR payloads, API keys,
 * OAuth secrets, private source URLs or connector tokens in this repository.
 *
 * Two modes, never mixed:
 *  - sample (public GitHub Pages): reads the fictional window.MJ_SEED fixture.
 *  - connected (private server only): reads window.MJ_CONNECTED_PAYLOAD, which the
 *    authenticated private service injects via a no-store script. The fictional
 *    fixture is not loaded in that deployment and is ignored if present.
 * Claude account connectors are not accessible through browser JS.
 *
 * Contract: { version, divisions, viewers, stages, kit, documents201, employees }
 * Each employee carries files201 keyed by document ID. Connected snapshots add
 * 'source-unavailable' and 'conflict' document statuses, null for unsourced
 * Journey/Kit/KPI values, per-employee provenance and module coverage.
 * Provider-to-contract transformations live in server/normalize.js, not here.
 */
(function (root) {
  'use strict';
  const sourceCatalog = Object.freeze([
    {id:'airtable',name:'Airtable',kind:'Roster & tracker records',scope:'People and operations'},
    {id:'sheets',name:'Google Sheets',kind:'KPI and reporting data',scope:'Evaluation and metrics'},
    {id:'drive',name:'Google Drive',kind:'Evidence and attachments',scope:'Files and folders'},
    {id:'docs',name:'Google Docs',kind:'Forms and written evaluations',scope:'Documents and reviews'},
    {id:'email',name:'Email',kind:'Correspondence and follow-ups',scope:'Communications'}
  ]);
  function clone(value){return JSON.parse(JSON.stringify(value));}
  const SAMPLE_DOC_STATUSES=['complete','missing','not-checked','not-applicable'];
  const CONNECTED_DOC_STATUSES=SAMPLE_DOC_STATUSES.concat(['source-unavailable','conflict']);
  const connected=root.MJ_CONNECTED_PAYLOAD&&typeof root.MJ_CONNECTED_PAYLOAD==='object'?root.MJ_CONNECTED_PAYLOAD:null;
  // Screen -> module(s) whose verified source is required before the screen may show figures.
  const SCREEN_MODULES=Object.freeze({
    overview:['journey','kpi','kit'],divisions:['journey','kpi','kit'],division:['journey','kpi','kit'],
    employees:['roster'],milestones:['milestones'],calendar:['calendar-events'],journey:['journey'],kit:['kit'],
    files201:['files201'],attendance:['attendance-verified'],kpi:['kpi'],approvals:['reviews'],
    sources:[],audit:[]
  });
  const DETAIL_MODULES=Object.freeze({preview:['journey','kpi'],milestones:['milestones'],kpi:['kpi'],
    journey:['journey'],kit:['kit'],files201:['files201'],attendance:['attendance-verified'],approvals:['reviews'],info:['roster']});
  function validateConnected(snapshot){
    if(!snapshot||snapshot.mode!=='connected'||!Array.isArray(snapshot.divisions)||!Array.isArray(snapshot.employees)||
       !Array.isArray(snapshot.stages)||!Array.isArray(snapshot.kit)||!Array.isArray(snapshot.documents201)||
       !snapshot.coverage||typeof snapshot.coverage!=='object')return false;
    const docIds=snapshot.documents201.map(function(d){return d&&d.id;});
    const divisions=new Set(snapshot.divisions.map(function(d){return d.id;}));
    const seen=new Set();
    return snapshot.employees.every(function(person){
      if(!person||typeof person.id!=='string'||seen.has(person.id)||!divisions.has(person.division))return false;
      seen.add(person.id);
      return typeof person.name==='string'&&!!person.provenance&&typeof person.provenance.recordId==='string'&&
        !!person.files201&&docIds.every(function(id){return CONNECTED_DOC_STATUSES.indexOf(person.files201[id])>=0;});
    });
  }
  function validate(snapshot){
    if(!snapshot || !Array.isArray(snapshot.divisions) || !Array.isArray(snapshot.employees) ||
       !Array.isArray(snapshot.stages) || !Array.isArray(snapshot.kit) ||
       !Array.isArray(snapshot.documents201) || !snapshot.documents201.length)return false;
    const docIds=snapshot.documents201.map(function(doc){return doc&&doc.id;});
    if(new Set(docIds).size!==docIds.length||docIds.some(function(id){return typeof id!=='string'||!id;}))return false;
    if(snapshot.mode==='connected')return validateConnected(snapshot);
    const docStatuses=new Set(SAMPLE_DOC_STATUSES);
    const validDivisions=new Set(snapshot.divisions.map(function(d){return d.id;}));
    const seen=new Set();
    return snapshot.employees.every(function(person){
      if(!person || typeof person.id!=='string' || seen.has(person.id) || !validDivisions.has(person.division))return false;
      seen.add(person.id);
      return typeof person.name==='string' && Array.isArray(person.journey) &&
        person.journey.length===snapshot.stages.length && Array.isArray(person.kit) &&
        person.kit.length===snapshot.kit.length &&
        !!person.files201 && typeof person.files201==='object' &&
        Object.keys(person.files201).length===docIds.length &&
        docIds.every(function(id){return docStatuses.has(person.files201[id]);});
    });
  }
  function connectedQuality(){
    const r=connected.reconciliation||{},roster=r.roster||{},snap=connected.snapshot||{employees:[],divisions:[],stages:[],kit:[],documents201:[]};
    return {mode:'connected',recordCount:snap.employees.length,divisionCount:snap.divisions.length,
      uniqueEmployeeIds:roster.withEmployeeId||0,stageCount:snap.stages.length,kitItemCount:snap.kit.length,
      document201Count:snap.documents201.length,structureValid:validateConnected(snap),
      issueCount:r.openIssueCount||0,issues:(r.issues||[]).map(function(i){return (i.employeeId||i.recordId)+': '+i.detail;})};
  }
  function getQualityReport(){
    if(connected)return connectedQuality();
    const snapshot=root.MJ_SEED;
    const divisions=new Set(snapshot.divisions.map(function(d){return d.id;}));
    const employeeIds=new Set();
    const docs=new Set((snapshot.documents201||[]).map(function(d){return d.id;}));
    const valid201=new Set(['complete','missing','not-checked','not-applicable']);
    const issues=[];
    if(!Array.isArray(snapshot.documents201)||docs.size!==(snapshot.documents201||[]).length)
      issues.push('201 Files requirement catalog missing or duplicated');
    snapshot.employees.forEach(function(person,index){
      const id=person&&person.id||'employee-'+(index+1);
      if(!person||typeof person.id!=='string'||employeeIds.has(person.id))issues.push(id+': missing or duplicate employee ID');
      if(person&&typeof person.id==='string')employeeIds.add(person.id);
      if(!person||!divisions.has(person.division))issues.push(id+': unknown division');
      if(!person||typeof person.name!=='string'||!person.name.trim())issues.push(id+': name missing');
      if(!person||!Array.isArray(person.journey)||person.journey.length!==snapshot.stages.length||
         !person.journey.every(function(row,i){return Array.isArray(row)&&row.length===snapshot.stages[i].items.length;})){
        issues.push(id+': incomplete Journey structure');
      }
      if(!person||!Array.isArray(person.kit)||person.kit.length!==snapshot.kit.length)issues.push(id+': incomplete Welcome Kit structure');
      if(!person||!person.files201||Object.keys(person.files201).length!==docs.size||
          !Array.from(docs).every(function(key){return valid201.has(person.files201[key]);}))
        issues.push(id+': incomplete fictional 201 Files statuses');
    });
    const ids=new Set(snapshot.employees.map(function(p){return p&&p.id;}));
    snapshot.employees.forEach(function(person){
      if(person&&person.reportsTo&&!ids.has(person.reportsTo))issues.push(person.id+': supervisor reference missing');
    });
    return {mode:'sample',recordCount:snapshot.employees.length,divisionCount:snapshot.divisions.length,
      uniqueEmployeeIds:employeeIds.size,stageCount:snapshot.stages.length,kitItemCount:snapshot.kit.length,
      document201Count:docs.size,
      structureValid:issues.length===0,issueCount:issues.length,issues:issues};
  }
  function getSnapshot(){
    if(connected){
      if(!connected.available||!validateConnected(connected.snapshot))throw new Error('Connected snapshot unavailable');
      return clone(connected.snapshot);
    }
    if(!validate(root.MJ_SEED))throw new Error('Maddie Journey sample fixture is invalid');
    return clone(root.MJ_SEED);
  }
  function getSources(){
    if(connected)return clone(connected.sources||[]);
    return sourceCatalog.map(function(source){
      return Object.assign({},source,{
        state:'not-connected',label:'Not connected',lastSynced:null
      });
    });
  }
  function getProvenance(){
    if(connected)return Object.assign(clone(connected.provenance||{mode:'connected',readOnly:true,live:false,recordCount:0,divisionCount:0,asOf:null,
      note:connected.reason||'No connected snapshot is available.'}),{freshness:clone(connected.freshness||null),viewer:clone(connected.viewer||null)});
    return {mode:'sample',readOnly:true,live:false,recordCount:root.MJ_SEED.employees.length,
      divisionCount:root.MJ_SEED.divisions.length,asOf:null,
      note:'Fictional fixture only. No live connector records are loaded in this browser.'};
  }
  function getReconciliation(){return connected?clone(connected.reconciliation||null):null;}
  // Module coverage drives honest screen guards: 'connected' and 'partial' modules may render;
  // 'attendance-verified' is required for attendance figures because the connected tracker
  // carries no approval/verification field.
  function moduleAvailable(module){
    if(!connected)return true;
    const coverage=(connected.snapshot&&connected.snapshot.coverage)||{};
    if(module==='attendance-verified')return false;
    return coverage[module]==='connected'||coverage[module]==='partial';
  }
  function screenAvailability(screen,kind){
    const modules=(kind==='detail'?DETAIL_MODULES:SCREEN_MODULES)[screen]||[];
    const missing=modules.filter(function(m){return !moduleAvailable(m);});
    return {available:missing.length===0,missing:missing};
  }
  function getCoverage(){return connected?clone((connected.snapshot&&connected.snapshot.coverage)||{}):null;}
  root.MJ_SOURCE_ADAPTER=Object.freeze({
    contractVersion:connected?3:2,mode:connected?'connected':'sample',readOnly:true,
    validateSnapshot:validate,getSnapshot:getSnapshot,
    getSources:getSources,getProvenance:getProvenance,getQualityReport:getQualityReport,
    getReconciliation:getReconciliation,getCoverage:getCoverage,screenAvailability:screenAvailability
  });
})(window);
