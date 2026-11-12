/* Maddie Journey v2.2 — READ-ONLY DATA BOUNDARY.
 * This file intentionally has NO network, authentication or connector APIs.
 * GitHub Pages publishes PUBLIC files: never put private HR payloads, API keys,
 * OAuth secrets, private source URLs or connector tokens in this repository.
 *
 * The next development phase can replace getSnapshot() with an authorized,
 * server-provided, permission-filtered view model in a PRIVATE deployment.
 * Claude account connectors are not accessible through browser JS by default.
 *
 * Contract: { version, divisions, viewers, stages, kit, documents201, employees }
 * Each employee also carries files201 keyed by document ID (four sample statuses).
 * The schema is version 2 to distinguish explicit document statuses from prior fixtures.
 * Each employee carries the IDs, journey, kit, KPI, review and milestone
 * properties consumed by app.js. Preserve employee IDs for cross-source joins.
 * Provider-to-contract transformations belong in the future backend, not here.
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
  function validate(snapshot){
    if(!snapshot || !Array.isArray(snapshot.divisions) || !Array.isArray(snapshot.employees) ||
       !Array.isArray(snapshot.stages) || !Array.isArray(snapshot.kit) ||
       !Array.isArray(snapshot.documents201) || !snapshot.documents201.length)return false;
    const docIds=snapshot.documents201.map(function(doc){return doc&&doc.id;});
    if(new Set(docIds).size!==docIds.length||docIds.some(function(id){return typeof id!=='string'||!id;}))return false;
    const docStatuses=new Set(['complete','missing','not-checked','not-applicable']);
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
  function getQualityReport(){
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
    if(!validate(root.MJ_SEED))throw new Error('Maddie Journey sample fixture is invalid');
    return clone(root.MJ_SEED);
  }
  function getSources(){
    return sourceCatalog.map(function(source){
      return Object.assign({},source,{
        state:'not-connected',label:'Not connected',lastSynced:null
      });
    });
  }
  function getProvenance(){
    return {mode:'sample',readOnly:true,live:false,recordCount:root.MJ_SEED.employees.length,
      divisionCount:root.MJ_SEED.divisions.length,asOf:null,
      note:'Fictional fixture only. No live connector records are loaded in this browser.'};
  }
  root.MJ_SOURCE_ADAPTER=Object.freeze({
    contractVersion:2,mode:'sample',readOnly:true,
    validateSnapshot:validate,getSnapshot:getSnapshot,
    getSources:getSources,getProvenance:getProvenance,getQualityReport:getQualityReport
  });
})(window);
