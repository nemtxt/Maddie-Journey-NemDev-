/* Chromium DevTools Protocol checks without dependencies.
   Tests true CSS viewport widths, mobile drawer, collapse, dialogs, and no
   horizontal document overflow. Skips explicitly if Chrome/WebSocket absent. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const {setTimeout:delay}=require('node:timers/promises');
const root=path.resolve(__dirname,'..');
let chrome;
for(const executable of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
 try{chrome=execFileSync('which',[executable],{encoding:'utf8'}).trim();if(chrome)break}catch(_){}
}
if(!chrome||typeof WebSocket!=='function'){
 console.log('SKIP: Chrome or native WebSocket unavailable; CDP device QA not executed.');
 process.exit(0);
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maddie-macos-cdp-'));
const browser=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--no-first-run',
 '--allow-file-access-from-files','--user-data-dir='+tmp,
 '--remote-debugging-port=0','about:blank'
],{stdio:'ignore'});
let websocket=null,id=0;
const inflight=new Map();
let mark=0;
async function rpc(method,params={}){
 if(!websocket||websocket.readyState!==WebSocket.OPEN)throw Error('CDP socket not connected');
 const current=++id;
 const response=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{inflight.delete(current);reject(Error('CDP timeout '+method));},15000);
   inflight.set(current,{resolve(value){clearTimeout(timeout);resolve(value)},reject(err){clearTimeout(timeout);reject(err)}});
 });
 websocket.send(JSON.stringify({id:current,method,params}));
 return response;
}
async function evaluate(code){
 const r=await rpc('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('Browser JavaScript: '+(r.exceptionDetails.text||'runtime error'));
 return r.result?.value;
}
async function waitFor(predicate,label){
 for(let i=0;i<45;i++){
   try{const value=await evaluate(predicate);if(value)return value}catch(_){}
   await delay(110);
 }
 throw Error('No settled UI for '+label);
}
const url=route=>'file://'+path.join(root,'index.html')+route;
async function visit(route,width,height=820){
 await rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
 await rpc('Page.navigate',{url:url(route)});
 await waitFor("Boolean(document.querySelector('#app.mac-finalized #main-content')&&window.MC_APP)","route "+route);
 await delay(160);
 const data=await evaluate("({width:innerWidth,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),nav:document.querySelectorAll('.sidebar .nav-link').length,route:location.hash,home:!!document.querySelector('.wf-executive'),dialog:!!document.querySelector('#mac-alerts-dialog'),search:!!document.querySelector('#mc-command')})");
 assert.equal(data.width,width,'True viewport width '+route);
 assert.equal(data.nav,9,'Unchanged nine categories');
 assert.equal(data.route,route);
 assert(data.scroll<=width+2,'Horizontal overflow '+route+' '+width+': '+data.scroll);
 assert(data.dialog&&data.search,'Dialogs/search still present');
 console.log('PASS CDP '+route+' / '+width+'px / body '+data.scroll+'px');
 mark++;
 return data;
}
async function run(){
 const portFile=path.join(tmp,'DevToolsActivePort');
 for(let i=0;i<65&&!fs.existsSync(portFile);i++)await delay(90);
 assert(fs.existsSync(portFile),'Chrome DevToolsActivePort missing');
 const port=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/)[0];
 const list=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 const target=list.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 assert(target,'Chrome page target missing');
 websocket=new WebSocket(target.webSocketDebuggerUrl);
 websocket.addEventListener('message',event=>{
   try{
     const msg=JSON.parse(event.data);
     const entry=inflight.get(msg.id);
     if(!entry)return;
     inflight.delete(msg.id);
     if(msg.error)entry.reject(Error(msg.error.message));
     else entry.resolve(msg.result);
   }catch(_){}
 });
 await new Promise((resolve,reject)=>{
   websocket.addEventListener('open',resolve,{once:true});
   websocket.addEventListener('error',()=>reject(Error('CDP websocket error')),{once:true});
 });
 await rpc('Page.enable');await rpc('Runtime.enable');
 for(const width of [320,375,768,1280]){
   await visit('#/home',width);
   await visit('#/category/people-directory',width);
   await visit('#/category/workforce-pulse',width);
 }
 await visit('#/category/people-directory/employee-masterlist',375);
 const preview=await evaluate("(()=>{const button=document.querySelector('.mac-profile-launch');if(!button)return {found:false};button.click();const dialog=document.querySelector('#mac-profile-dialog');return {found:true,opened:dialog?.open,text:dialog?.textContent?.slice(0,700)}})()");
 assert(preview.found&&preview.opened,'fictional employee quick view opens');
 assert(preview.text.includes('FICTIONAL EMPLOYEE SNAPSHOT'));
 assert(!preview.text.includes('PHP '),'Preview must not expose salary');
 const closed=await evaluate("(()=>{document.querySelector('[data-mac-close=profile]')?.click();return document.querySelector('#mac-profile-dialog')?.open})()");
 assert.equal(closed,false,'Quick view closes');
 await visit('#/home',375);
 const mobile=await evaluate("(()=>{document.querySelector('.mobile-menu')?.click();const root=document.getElementById('app');return {opened:root.classList.contains('navigation-open'),expanded:document.querySelector('.mobile-menu')?.getAttribute('aria-expanded')}})()");
 assert(mobile.opened&&mobile.expanded==='true','Mobile navigation opens without changing its links');
 const closeMobile=await evaluate("(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return document.getElementById('app').classList.contains('navigation-open')})()");
 assert.equal(closeMobile,false,'Escape closes drawer');
 await visit('#/home',1280);
 const desktop=await evaluate("(()=>{document.querySelector('.desktop-collapse')?.click();return {collapsed:document.querySelector('#app')?.classList.contains('sidebar-collapsed'),nav:document.querySelectorAll('.sidebar .nav-link').length}})()");
 assert(desktop.collapsed&&desktop.nav===9,'Desktop sidebar collapses without losing navigation');
 const attention=await evaluate("(()=>{const button=document.querySelector('[data-mac-alerts]');button?.click();return {found:!!button,opened:document.querySelector('#mac-alerts-dialog')?.open}})()");
 assert(attention.found&&attention.opened,'Executive attention dialog opens');
 console.log(mark+' real-device-metric Chromium route checks plus drawer, collapse and dialog interactions passed.');
}
(async()=>{
 try{await run();}
 catch(error){console.error('FAIL CDP browser QA: '+error.stack);process.exitCode=1;}
 finally{
   for(const entry of inflight.values())entry.reject(Error('Closing CDP connection'));
   inflight.clear();
   try{websocket?.close()}catch(_){}
   try{browser.kill('SIGTERM')}catch(_){}
   await delay(120);
   fs.rmSync(tmp,{recursive:true,force:true});
 }
})();
