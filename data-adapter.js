/* Maddie Journey v2.2 — READ-ONLY DATA BOUNDARY.
 * This file intentionally has NO network, authentication or connector APIs.
 * GitHub Pages publishes PUBLIC files: never put private HR payloads, API keys,
 * OAuth secrets, private source URLs or connector tokens in this repository.
 *
 * The next development phase can replace getSnapshot() with an authorized,
 * server-provided, permission-filtered view model in a PRIVATE deployment.
 * Claude account connectors are not accessible through browser JS by default.
 *
 * Contract: { version, divisions, viewers, stages, kit, employees }
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
       !Array.isArray(snapshot.stages) || !Array.isArray(snapshot.kit))return false;
    const validDivisions=new Set(snapshot.divisions.map(function(d){return d.id;}));
    const seen=new Set();
    return snapshot.employees.every(function(person){
      if(!person || typeof person.id!=='string' || seen.has(person.id) || !validDivisions.has(person.division))return false;
      seen.add(person.id);
      return typeof person.name==='string' && Array.isArray(person.journey) &&
        person.journey.length===snapshot.stages.length && Array.isArray(person.kit) &&
        person.kit.length===snapshot.kit.length;
    });
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
    contractVersion:1,mode:'sample',readOnly:true,
    validateSnapshot:validate,getSnapshot:getSnapshot,
    getSources:getSources,getProvenance:getProvenance
  });
})(window);
