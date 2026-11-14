/* Optional real-Chromium smoke test. No external packages or deployment. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
let chrome;
for(const candidate of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
 try{chrome=execFileSync('which',[candidate],{encoding:'utf8'}).trim();if(chrome)break}catch(_){}
}
if(!chrome){
 console.log('SKIP: Headless browser unavailable on this CI runner. Manual visual QA remains.');
 process.exit(0);
}
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const marker='</body>';
const probe=[
 '<script>',
 "document.addEventListener('DOMContentLoaded',()=>{",
 '  const report=()=>{',
 "    const root=document.getElementById('app');",
 "    document.body.dataset.qaWidth=String(window.innerWidth);",
 "    document.body.dataset.qaScroll=String(Math.max(document.documentElement.scrollWidth,document.body.scrollWidth));",
 "    document.body.dataset.qaNav=String(document.querySelectorAll('.sidebar .nav-link').length);",
 "    document.body.dataset.qaMain=String(Boolean(document.querySelector('#main-content')));",
 "    document.body.dataset.qaFinal=String(Boolean(root?.classList.contains('mac-finalized')));",
 '  };',
 "  report();window.addEventListener('load',report,{once:true});",
 '});',
 '</script>'
].join('\n');
assert(source.includes(marker));
const temporary=path.join(root,'index.__macos_browser_qa__.html');
fs.writeFileSync(temporary,source.replace(marker,probe+marker));
const cases=[
 {route:'#/home',name:'home',fragment:'wf-executive'},
 {route:'#/category/people-directory',name:'people',fragment:'mac-comparison'},
 {route:'#/category/workforce-pulse',name:'pulse',fragment:'mac-history-card'},
 {route:'#/category/executive-scoreboard',name:'executive',fragment:'mac-comparison'},
 {route:'#/category/people-directory/employee-masterlist',name:'masterlist',fragment:'mac-profile-launch'}
];
let passed=0;
try{
 for(const check of cases){
  for(const width of [375,1280]){
   const args=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-extensions','--no-first-run',
    '--allow-file-access-from-files','--hide-scrollbars',
    '--window-size='+width+',900','--virtual-time-budget=1900','--dump-dom',
    'file://'+temporary+check.route];
   const run=spawnSync(chrome,args,{encoding:'utf8',timeout:23000,maxBuffer:12*1024*1024});
   if(run.error)throw Error('Chrome process error: '+run.error.message);
   if(run.status!==0)throw Error('Chrome failed '+check.name+': '+(run.stderr||'').slice(-500));
   const html=run.stdout;
   const field=name=>html.match(new RegExp('data-'+name+'="([^"]+)"'))?.[1]??null;
   assert.equal(field('qa-main'),'true',check.name+' main');
   assert.equal(field('qa-final'),'true',check.name+' finalization');
   assert.equal(field('qa-nav'),'9',check.name+' unchanged navigation');
   assert(html.includes(check.fragment),check.name+' missing '+check.fragment);
   const viewport=Number(field('qa-width')),scroll=Number(field('qa-scroll'));
   assert(viewport>=315,check.name+' viewport');
   assert(scroll<=viewport+3,check.name+' '+width+'px scroll overflow '+scroll+' vs '+viewport);
   console.log('PASS Chrome '+check.name+' width '+viewport+' document '+scroll);
   passed++;
  }
 }
 console.log(passed+' headless Chrome route and viewport checks passed.');
}finally{fs.rmSync(temporary,{force:true});}
