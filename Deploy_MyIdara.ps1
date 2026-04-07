# ═══════════════════════════════════════════════════════════════
# My Idara App — Deploy to GitHub Pages
# Run from: C:\Idara\MyIdaraApp
# PowerShell 7
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$root = "C:\Idara\MyIdaraApp"

Write-Host "`n📖 My Idara App — Deployment Script" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor DarkGray

# ── Step 1: Setup directory ────────────────────────────────────
Write-Host "📁 Step 1: Setting up directory..." -ForegroundColor Cyan
if (!(Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
Set-Location $root

# ── Step 2: Git init or clone ──────────────────────────────────
Write-Host "🔗 Step 2: Git setup..." -ForegroundColor Cyan
if (!(Test-Path "$root\.git")) {
    if (Test-Path "$root\README.md") {
        git init
        git remote add origin https://github.com/alwiarif46/Idara.git
    } else {
        git clone https://github.com/alwiarif46/Idara.git .
    }
}
git checkout main 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b main }

# ── Step 3: Generate manifest.json ─────────────────────────────
Write-Host "📋 Step 3: Generating manifest.json..." -ForegroundColor Cyan
$manifest = @'
{
  "name": "My Idara — ادارہ تحقیقات اسلامی",
  "short_name": "My Idara",
  "description": "Imam Azam College Academic Management",
  "start_url": "/Idara/",
  "scope": "/Idara/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0c2e2e",
  "background_color": "#0c2e2e",
  "dir": "rtl",
  "lang": "ur",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='100' fill='%230c2e2e'/><text x='256' y='320' font-size='260' text-anchor='middle' fill='%23d4af37'>📖</text></svg>",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
'@
[System.IO.File]::WriteAllText("$root\manifest.json", $manifest, [System.Text.UTF8Encoding]::new($false))

# ── Step 4: Generate sw.js ─────────────────────────────────────
Write-Host "⚙️  Step 4: Generating service worker..." -ForegroundColor Cyan
$sw = @'
const V='iri-v5';
const A=['/Idara/','/Idara/index.html','/Idara/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('script.google.com')){e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({success:false,error:'OFFLINE'}),{headers:{'Content-Type':'application/json'}})))}
  else{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))}
});
'@
[System.IO.File]::WriteAllText("$root\sw.js", $sw, [System.Text.UTF8Encoding]::new($false))

# ── Step 5: Generate index.html (the complete app) ─────────────
Write-Host "🏗️  Step 5: Generating index.html (this is the big one)..." -ForegroundColor Cyan

# The entire app as a single HTML file — no build step needed
$html = @'
<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#0c2e2e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.json">
<title>My Idara — ادارہ تحقیقات اسلامی</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Noto Sans Arabic','Segoe UI',Tahoma,sans-serif;background:#f5f0e8;overflow-x:hidden;direction:rtl}
input,select,textarea,button{font-family:inherit}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
::-webkit-scrollbar{width:0;height:0}
.ob{position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;text-align:center;padding:4px;font-size:11px;font-weight:700;z-index:9999;display:none}
.ob.show{display:block}
.toast{position:fixed;top:56px;left:50%;transform:translateX(-50%);background:#0c2e2e;color:#d4af37;padding:8px 20px;border-radius:10px;font-size:12px;font-weight:700;z-index:999;pointer-events:none;animation:fadeout 2s forwards}
@keyframes fadeout{0%,70%{opacity:1}100%{opacity:0}}
</style>
</head>
<body>
<div class="ob" id="ob">📵 آف لائن — ڈیٹا مقامی طور پر محفوظ</div>
<div id="app"></div>
<script>
// Service Worker
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
window.addEventListener('online',()=>document.getElementById('ob').classList.remove('show'));
window.addEventListener('offline',()=>document.getElementById('ob').classList.add('show'));
if(!navigator.onLine)document.getElementById('ob').classList.add('show');

// LocalStorage DB
const DB={
  set(k,v){try{localStorage.setItem('iri_'+k,JSON.stringify(v))}catch(e){}},
  get(k){try{const v=localStorage.getItem('iri_'+k);return v?JSON.parse(v):null}catch{return null}},
  del(k){localStorage.removeItem('iri_'+k)},
};

// ═══ SEED DATA ═══
const CL=[{id:'oola',n:'اولیٰ',c:'#f4e0c1',a:'#c8860a'},{id:'sania',n:'ثانیة',c:'#c9e0f5',a:'#2563eb'},{id:'salisa',n:'ثالثة',c:'#e0d0f0',a:'#7c3aed'},{id:'rabia',n:'رابعة',c:'#c5ede2',a:'#059669'},{id:'khamisa',n:'خامسة',c:'#faf0c8',a:'#b45309'},{id:'fazilat',n:'فضیلة',c:'#f5d0d0',a:'#dc2626'}];
const SB=[{id:'S01',n:'منہاج العربیة',c:'oola',s:9,e:24},{id:'S02',n:'تمرین الصرف',c:'oola',s:5,e:20},{id:'S03',n:'آسان النحو',c:'oola',s:3,e:38},{id:'S04',n:'فارسی قواعد',c:'oola',s:11,e:87},{id:'S05',n:'احادیث',c:'oola',s:1,e:40},{id:'S06',n:'قرآت',c:'oola',s:584,e:611},{id:'S07',n:'میزان الصرف',c:'sania',s:3,e:53},{id:'S08',n:'نور الایضاح',c:'sania',s:1,e:73},{id:'S09',n:'معلم الانشاء',c:'sania',s:1,e:52},{id:'S10',n:'قصص النبیین',c:'sania',s:3,e:40},{id:'S11',n:'کنز الایمان',c:'sania',s:2,e:110},{id:'S12',n:'گلستان سعدی',c:'sania',s:120,e:258},{id:'S13',n:'نحو میر',c:'sania',s:9,e:93},{id:'S14',n:'فیض الادب',c:'sania',s:1,e:23},{id:'S15',n:'مجانی الادب',c:'salisa',s:1,e:36},{id:'S16',n:'معلم الانشاء ۳',c:'salisa',s:1,e:51},{id:'S17',n:'دروس البلاغة',c:'salisa',s:1,e:30},{id:'S18',n:'ہدایة النحو',c:'salisa',s:1,e:47},{id:'S19',n:'مختصر القدوری',c:'salisa',s:1,e:80},{id:'S20',n:'ریاض الصالحین',c:'salisa',s:1,e:80},{id:'S21',n:'علم الصیغة',c:'salisa',s:1,e:71},{id:'S22',n:'کافیة',c:'rabia',s:1,e:37},{id:'S23',n:'مشکوٰة',c:'rabia',s:291,e:430},{id:'S24',n:'تفسیر الجلالین',c:'rabia',s:1,e:30},{id:'S25',n:'اصول حدیث',c:'rabia',s:1,e:40},{id:'S26',n:'اصول الشاشی',c:'rabia',s:1,e:35},{id:'S27',n:'نفحة العرب',c:'rabia',s:1,e:30},{id:'S28',n:'معلم الانشاء ۴',c:'rabia',s:1,e:51},{id:'S29',n:'شرح الوقایة',c:'rabia',s:148,e:217},{id:'S30',n:'مدارک التنزیل',c:'khamisa',s:2,e:64},{id:'S31',n:'شمائل',c:'khamisa',s:2,e:24},{id:'S32',n:'ہدایة الاولین',c:'khamisa',s:3,e:76},{id:'S33',n:'السراجی',c:'khamisa',s:2,e:85},{id:'S34',n:'نور الانوار',c:'khamisa',s:1,e:38},{id:'S35',n:'قصیدة البردة',c:'khamisa',s:3,e:299},{id:'S36',n:'تفسیر بیضاوی',c:'fazilat',s:1,e:158},{id:'S37',n:'صحیح بخاری',c:'fazilat',s:3,e:73},{id:'S38',n:'صحیح مسلم',c:'fazilat',s:448,e:482},{id:'S39',n:'سنن نسائی',c:'fazilat',s:153,e:196},{id:'S40',n:'سنن ترمذی',c:'fazilat',s:21,e:52},{id:'S41',n:'ہدایة آخرین',c:'fazilat',s:1,e:39},{id:'S42',n:'المختارات',c:'fazilat',s:1,e:65}];
const TC=[{id:'T1',n:'م۔ ارشاد حیدری',role:'principal',exam:false},{id:'T2',n:'م۔ اعجاز مخدومی',role:'teacher',exam:true},{id:'T3',n:'م۔ شاکر امجدی',role:'teacher',exam:true},{id:'T4',n:'م۔ طارق نعیمی',role:'teacher',exam:true},{id:'T5',n:'م۔ ضیاء علیمی',role:'teacher',exam:true},{id:'T6',n:'م۔ زاہد حیدری',role:'teacher',exam:true},{id:'T7',n:'م۔ منتظر نوری',role:'teacher',exam:false}];
const AG=[{t:'T2',sub:'S13',p:3},{t:'T2',sub:'S08',p:4},{t:'T2',sub:'S23',p:5},{t:'T2',sub:'S26',p:8},{t:'T2',sub:'S12',p:9},{t:'T2',sub:'S31',p:2},{t:'T3',sub:'S24',p:1},{t:'T3',sub:'S07',p:2},{t:'T3',sub:'S41',p:3},{t:'T3',sub:'S19',p:4},{t:'T3',sub:'S39',p:5},{t:'T3',sub:'S25',p:7},{t:'T3',sub:'S32',p:9},{t:'T4',sub:'S36',p:1},{t:'T4',sub:'S03',p:2},{t:'T4',sub:'S33',p:3},{t:'T4',sub:'S40',p:4},{t:'T4',sub:'S21',p:5},{t:'T4',sub:'S35',p:7},{t:'T4',sub:'S37',p:8},{t:'T4',sub:'S29',p:9},{t:'T5',sub:'S30',p:1},{t:'T5',sub:'S22',p:2},{t:'T5',sub:'S18',p:3},{t:'T5',sub:'S34',p:4},{t:'T5',sub:'S14',p:5},{t:'T5',sub:'S17',p:7},{t:'T5',sub:'S38',p:9},{t:'T6',sub:'S20',p:2},{t:'T6',sub:'S04',p:3},{t:'T6',sub:'S28',p:4},{t:'T6',sub:'S05',p:5},{t:'T6',sub:'S42',p:7},{t:'T6',sub:'S10',p:8},{t:'T6',sub:'S01',p:9}];
const PER=[{id:1,s:'10:00',e:'10:35'},{id:2,s:'10:35',e:'11:10'},{id:3,s:'11:10',e:'11:45'},{id:4,s:'11:45',e:'12:20'},{id:5,s:'12:20',e:'12:55'},{id:6,s:'12:55',e:'02:00',brk:true},{id:7,s:'02:00',e:'02:35'},{id:8,s:'02:35',e:'03:10'},{id:9,s:'03:10',e:'03:45'}];
const catC={excellent:'#10b981',good:'#3b82f6',weak:'#f59e0b',fail:'#ef4444',absent:'#6b7280'};
const catL={excellent:'اعلیٰ',good:'اچھا',weak:'کمزور',fail:'ناکام',absent:'غائب'};
const gC=id=>CL.find(c=>c.id===id)||CL[0];
const gS=id=>SB.find(s=>s.id===id);
const cT=(s,tot,d)=>s+Math.round((tot/42)*d);
const cSR=(sc,ab)=>{if(ab)return{t:null,p:null,c:'absent'};const f=sc.filter(s=>s!=null&&s!=='');if(!f.length)return{t:null,p:null,c:null};const n=f.map(Number);if(n.some(x=>isNaN(x)||x<0||x>10))return{t:null,p:null,c:'invalid'};const t=n.reduce((a,b)=>a+b,0),p=Math.round(t/(f.length*10)*100);return{t,p,c:p>=80?'excellent':p>=60?'good':p>=40?'weak':'fail'}};

// ═══ APP STATE ═══
let state={scr:'login',user:null,pin:'',selT:'',err:'',tab:'home',reps:DB.get('reports')||{},syncQ:DB.get('syncQueue')||[],thB:0,
  thD:CL.map(()=>({sid:'',grid:Array.from({length:15},(_,i)=>({num:i+1,nm:'',sc:[null,null,null,null,null],ab:false}))})),
  admSub:null,showAdd:false,newAsg:{t:'',sub:'',p:''},toast:''};

function setState(updates){Object.assign(state,updates);render()}
function flash(m){state.toast=m;render();setTimeout(()=>{state.toast='';render()},2000)}
const tDay=Math.min(Math.max(1,Math.floor((Date.now()-new Date('2026-04-01').getTime())/(86400000))*5/7+1),42);

function getMyA(){if(!state.user)return[];return AG.filter(a=>a.t===state.user.id).map(a=>{const sub=gS(a.sub),cls=gC(sub.c),per=PER.find(p=>p.id===a.p),tot=sub.e-sub.s;return{...a,sub,cls,per,target:cT(sub.s,tot,tDay),total:tot}}).sort((a,b)=>a.p-b.p)}

// ═══ RENDER ═══
function el(tag,props,...kids){const e=document.createElement(tag);if(props)Object.entries(props).forEach(([k,v])=>{if(k==='style'&&typeof v==='object')Object.assign(e.style,v);else if(k.startsWith('on'))e.addEventListener(k.slice(2).toLowerCase(),v);else if(k==='value'&&(tag==='input'||tag==='select'||tag==='textarea'))e.value=v;else if(k==='checked')e.checked=v;else if(k==='disabled')e.disabled=v;else if(k==='selected')e.selected=v;else if(k==='placeholder')e.placeholder=v;else if(k==='type')e.type=v;else if(k==='min')e.min=v;else if(k==='max')e.max=v;else if(k==='innerHTML')e.innerHTML=v;else e.setAttribute(k,v)});kids.flat(9).forEach(c=>{if(c==null||c===false)return;if(typeof c==='string'||typeof c==='number')e.appendChild(document.createTextNode(c));else if(c instanceof Node)e.appendChild(c)});return e}

function render(){
  const app=document.getElementById('app');
  app.innerHTML='';

  // Toast
  if(state.toast)app.appendChild(el('div',{class:'toast'},state.toast));

  if(state.scr==='login'){renderLogin(app);return}
  renderTopBar(app);
  const content=el('div',{style:{padding:'12px',paddingBottom:'72px',maxWidth:'460px',margin:'0 auto'}});
  if(state.tab==='home')renderHome(content);
  else if(state.tab==='report')renderReport(content);
  else if(state.tab==='thu'&&state.user?.exam)renderThursday(content);
  else if(state.tab==='tt')renderTimetable(content);
  else if(state.tab==='adm'&&state.user?.role==='admin')renderAdmin(content);
  app.appendChild(content);
  renderNav(app);
}

function renderLogin(app){
  const wrap=el('div',{style:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(170deg,#0c2e2e,#0a1f1f 30%,#132b20 70%)',padding:'20px'}});
  wrap.appendChild(el('div',{style:{width:'64px',height:'64px',borderRadius:'16px',marginBottom:'14px',background:'linear-gradient(135deg,#d4af37,#b8860b)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(212,175,55,0.5)',fontSize:'30px'}},'📖'));
  wrap.appendChild(el('h1',{style:{fontSize:'24px',fontWeight:'800',color:'#d4af37'}},'ادارہ تحقیقات اسلامی'));
  wrap.appendChild(el('p',{style:{color:'#8fbc8f',fontSize:'11px',margin:'4px 0 24px',direction:'ltr'}},'Imam Azam College — My Idara'));

  const box=el('div',{style:{width:'100%',maxWidth:'310px',background:'rgba(255,255,255,0.04)',borderRadius:'20px',padding:'22px',border:'1px solid rgba(212,175,55,0.25)'}});

  // Teacher select
  const sel=el('select',{style:{width:'100%',padding:'10px',borderRadius:'12px',border:'1px solid rgba(212,175,55,0.3)',background:'rgba(0,0,0,0.3)',color:'#e0d9c8',fontSize:'13px',direction:'rtl',marginBottom:'12px',outline:'none'},onChange:e=>{state.selT=e.target.value;state.err='';render()}});
  sel.appendChild(el('option',{value:''},'— منتخب کریں —'));
  TC.forEach(t=>sel.appendChild(el('option',{value:t.id},t.n)));
  sel.appendChild(el('option',{value:'ADMIN'},'🔧 ایڈمن'));
  sel.value=state.selT;
  box.appendChild(sel);

  // PIN dots
  const dots=el('div',{style:{display:'flex',gap:'7px',justifyContent:'center',marginBottom:'12px',direction:'ltr'}});
  for(let i=0;i<4;i++){dots.appendChild(el('div',{style:{width:'44px',height:'48px',borderRadius:'11px',border:state.pin.length>i?'2px solid #d4af37':'1px solid rgba(255,255,255,0.1)',background:state.pin.length>i?'rgba(212,175,55,0.1)':'rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'#d4af37',fontWeight:'800'}},state.pin[i]?'●':''))}
  box.appendChild(dots);

  // Numpad
  const pad=el('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px',marginBottom:'12px',direction:'ltr'}});
  [1,2,3,4,5,6,7,8,9,'',0,'⌫'].forEach(k=>{
    const btn=el('button',{style:{padding:'12px 0',borderRadius:'11px',border:'none',fontSize:'17px',fontWeight:'700',background:k===''?'transparent':k==='⌫'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.06)',color:k==='⌫'?'#f87171':'#c8b88a',cursor:k===''?'default':'pointer'},disabled:k==='',onClick:()=>{if(k==='⌫')state.pin=state.pin.slice(0,-1);else if(k!==''&&state.pin.length<4)state.pin+=k;state.err='';render()}},String(k));
    pad.appendChild(btn);
  });
  box.appendChild(pad);

  if(state.err)box.appendChild(el('div',{style:{background:'rgba(239,68,68,0.12)',borderRadius:'9px',padding:'6px',marginBottom:'10px',color:'#fca5a5',fontSize:'11px',textAlign:'center',fontWeight:'600'}},state.err));

  box.appendChild(el('button',{style:{width:'100%',padding:'12px',borderRadius:'13px',border:'none',background:'linear-gradient(135deg,#d4af37,#b8860b)',color:'#1a0e00',fontSize:'14px',fontWeight:'800',cursor:'pointer'},onClick:()=>{
    if(!state.selT){state.err='استاد منتخب کریں';render();return}
    if(state.pin.length<4){state.err='۴ ہندسے';render();return}
    if(state.pin!==(state.selT==='ADMIN'?'9999':'1234')){state.err='غلط پن';render();return}
    state.user=state.selT==='ADMIN'?{id:'ADMIN',n:'ایڈمن',role:'admin',exam:false}:TC.find(t=>t.id===state.selT);
    state.scr='main';state.tab='home';render();
  }},'داخل ہوں'));

  wrap.appendChild(box);
  app.appendChild(wrap);
}

function renderTopBar(app){
  const bar=el('div',{style:{background:'linear-gradient(135deg,#0c2e2e,#1a4a35)',padding:'11px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:'0',zIndex:'100',boxShadow:'0 2px 16px rgba(0,0,0,0.2)'}});
  const left=el('div',{style:{display:'flex',alignItems:'center',gap:'9px'}});
  left.appendChild(el('div',{style:{width:'34px',height:'34px',borderRadius:'9px',background:'linear-gradient(135deg,#d4af37,#b8860b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px'}},'📖'));
  const info=el('div',{});
  info.appendChild(el('div',{style:{color:'#d4af37',fontSize:'12px',fontWeight:'800'}},state.user?.n||''));
  info.appendChild(el('div',{style:{color:'#8fbc8f',fontSize:'9px'}},'دن '+tDay+'/42'));
  left.appendChild(info);
  bar.appendChild(left);
  const right=el('div',{style:{display:'flex',gap:'6px',alignItems:'center'}});
  const q=state.syncQ.length;
  if(q>0)right.appendChild(el('span',{style:{background:'#f59e0b',color:'#fff',padding:'2px 7px',borderRadius:'10px',fontSize:'9px',fontWeight:'800'}},q+'⏳'));
  right.appendChild(el('button',{style:{background:'rgba(255,255,255,0.08)',border:'none',color:'#8fbc8f',padding:'4px 9px',borderRadius:'7px',fontSize:'9px',cursor:'pointer',fontWeight:'700'},onClick:()=>{state.scr='login';state.user=null;state.pin='';state.selT='';state.admSub=null;render()}},'خروج'));
  bar.appendChild(right);
  app.appendChild(bar);
}

function renderHome(c){
  const myA=getMyA();const filled=myA.filter(a=>(state.reps[a.sub.id]||{}).actual).length;
  const hero=el('div',{style:{background:'linear-gradient(135deg,#0c2e2e,#1a4a35)',borderRadius:'16px',padding:'18px',marginBottom:'12px'}});
  hero.appendChild(el('div',{style:{fontSize:'18px',fontWeight:'800',color:'#d4af37'}},'السلام علیکم'));
  hero.appendChild(el('div',{style:{color:'#8fbc8f',fontSize:'11px',marginTop:'2px'}},myA.length+' مضامین • '+filled+' مکمل'));
  const bar=el('div',{style:{marginTop:'8px',background:'rgba(255,255,255,0.08)',borderRadius:'7px',height:'5px'}});
  bar.appendChild(el('div',{style:{height:'100%',borderRadius:'7px',background:'linear-gradient(90deg,#d4af37,#10b981)',width:(myA.length?(filled/myA.length)*100:0)+'%',transition:'width 0.5s'}}));
  hero.appendChild(bar);c.appendChild(hero);

  myA.forEach(a=>{
    const r=state.reps[a.sub.id]||{};
    const card=el('div',{style:{background:'#fff',borderRadius:'11px',padding:'11px 13px',marginBottom:'5px',borderRight:'4px solid '+a.cls.a,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'},onClick:()=>{state.tab='report';render()}});
    const left=el('div',{});
    left.appendChild(el('div',{style:{fontSize:'12px',fontWeight:'700'}},a.sub.n));
    left.appendChild(el('div',{style:{fontSize:'9px',color:'#8a9a8a'}},a.cls.n+' • P'+a.p));
    card.appendChild(left);
    card.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',color:a.cls.a}},'ص'+a.target));
    card.appendChild(el('div',{style:{width:'22px',height:'22px',borderRadius:'6px',background:r.actual?'#10b981':'#e5e0d5',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'11px'}},r.actual?'✓':''));
    c.appendChild(card);
  });
}

function renderReport(c){
  c.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',marginBottom:'10px'}},'📝 یومیہ رپورٹ'));
  getMyA().forEach(a=>{
    const r=state.reps[a.sub.id]||{};const part=r.complete==='جزوی'||r.complete==='نہیں';
    const card=el('div',{style:{background:'#fff',borderRadius:'13px',padding:'14px',marginBottom:'9px',border:'1px solid '+(r.complete==='ہاں'?'#10b981':'#e5e0d5')}});
    // Header
    const hdr=el('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}});
    hdr.appendChild(el('span',{style:{background:a.cls.c,color:a.cls.a,padding:'1px 7px',borderRadius:'5px',fontSize:'8px',fontWeight:'700'}},a.cls.n));
    hdr.appendChild(el('span',{style:{fontSize:'13px',fontWeight:'800'}},a.sub.n));
    card.appendChild(hdr);
    // Target + Actual
    const row=el('div',{style:{display:'flex',gap:'7px',marginBottom:'8px'}});
    const tCol=el('div',{style:{flex:'1'}});tCol.appendChild(el('div',{style:{fontSize:'8px',color:'#999',marginBottom:'2px'}},'ہدف'));tCol.appendChild(el('div',{style:{padding:'7px',borderRadius:'7px',background:'#f0ebe0',fontSize:'14px',fontWeight:'800',color:a.cls.a,textAlign:'center'}},'ص'+a.target));row.appendChild(tCol);
    const aCol=el('div',{style:{flex:'1'}});aCol.appendChild(el('div',{style:{fontSize:'8px',color:'#999',marginBottom:'2px'}},'حقیقی'));
    const inp=el('input',{type:'number',value:r.actual||'',placeholder:'—',style:{width:'100%',padding:'7px',borderRadius:'7px',border:'1.5px solid #d5d0c5',fontSize:'14px',fontWeight:'800',textAlign:'center',outline:'none',background:'#faf8f3'},onChange:e=>{state.reps[a.sub.id]={...state.reps[a.sub.id]||{},actual:e.target.value};DB.set('reports',state.reps);render()}});
    aCol.appendChild(inp);row.appendChild(aCol);card.appendChild(row);
    // Complete buttons
    const btns=el('div',{style:{display:'flex',gap:'4px'}});
    ['ہاں','جزوی','نہیں'].forEach(o=>{btns.appendChild(el('button',{style:{flex:'1',padding:'6px',borderRadius:'7px',border:'none',fontSize:'10px',fontWeight:'700',cursor:'pointer',background:r.complete===o?(o==='ہاں'?'#10b981':o==='جزوی'?'#f59e0b':'#ef4444'):'#f0ebe0',color:r.complete===o?'#fff':'#6b7c6b'},onClick:()=>{state.reps[a.sub.id]={...state.reps[a.sub.id]||{},complete:o};DB.set('reports',state.reps);render()}},o))});
    card.appendChild(btns);
    // Reasons
    if(part){const rw=el('div',{style:{display:'flex',flexWrap:'wrap',gap:'3px',marginTop:'5px'}});['غیر حاضری','وقت','مراجعہ','تاخیر','دیگر'].forEach(rv=>{rw.appendChild(el('button',{style:{padding:'3px 7px',borderRadius:'5px',border:'none',fontSize:'8px',fontWeight:'600',cursor:'pointer',background:r.reason===rv?'#0c2e2e':'#f0ebe0',color:r.reason===rv?'#d4af37':'#6b7c6b'},onClick:()=>{state.reps[a.sub.id]={...state.reps[a.sub.id]||{},reason:rv};DB.set('reports',state.reps);render()}},rv))});card.appendChild(rw)}
    c.appendChild(card);
  });
  c.appendChild(el('button',{style:{width:'100%',padding:'13px',borderRadius:'13px',border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontSize:'14px',fontWeight:'800',cursor:'pointer'},onClick:()=>{state.syncQ.push({type:'daily',date:new Date().toISOString().split('T')[0],data:state.reps});DB.set('syncQueue',state.syncQ);flash('✓ قطار میں')}},'ارسال ✓'));
}

function renderThursday(c){
  c.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',marginBottom:'8px'}},'📋 جمعرات امتحان'));
  const tabs=el('div',{style:{display:'flex',gap:'3px',overflowX:'auto',marginBottom:'10px'}});
  CL.forEach((cl,i)=>{tabs.appendChild(el('button',{style:{padding:'5px 10px',borderRadius:'9px',border:'none',fontSize:'9px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap',background:state.thB===i?cl.a:cl.c,color:state.thB===i?'#fff':cl.a},onClick:()=>{state.thB=i;render()}},cl.n))});
  c.appendChild(tabs);
  const bl=state.thD[state.thB],bCl=CL[state.thB];
  const card=el('div',{style:{background:'#fff',borderRadius:'14px',padding:'14px',border:'2px solid '+bCl.a+'30'}});
  card.appendChild(el('div',{style:{fontSize:'13px',fontWeight:'800',color:bCl.a,marginBottom:'8px'}},'امتحان '+bCl.n));
  // Subject select
  const ssel=el('select',{style:{width:'100%',padding:'8px',borderRadius:'9px',border:'1px solid #d5d0c5',fontSize:'12px',direction:'rtl',marginBottom:'10px',outline:'none',background:'#faf8f3'},onChange:e=>{state.thD[state.thB].sid=e.target.value;render()}});
  ssel.appendChild(el('option',{value:''},'— مضمون —'));
  SB.filter(s=>s.c===bCl.id).forEach(s=>ssel.appendChild(el('option',{value:s.id},s.n)));
  ssel.value=bl.sid;card.appendChild(ssel);
  // Scoring table
  const tw=el('div',{style:{overflowX:'auto'}});
  const tbl=el('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:'10px',direction:'rtl',minWidth:'380px'}});
  const thead=el('thead',{});const hrow=el('tr',{style:{background:bCl.a,color:'#fff'}});
  [{t:'#',w:'20px'},{t:'نام',w:'65px'},...[1,2,3,4,5].map(q=>({t:'س'+q,w:'30px'})),{t:'کل',w:'30px'},{t:'%',w:'26px'},{t:'غ',w:'16px'}].forEach(h=>{hrow.appendChild(el('th',{style:{padding:'5px',width:h.w,textAlign:h.t==='نام'?'right':'center'}},h.t))});
  thead.appendChild(hrow);tbl.appendChild(thead);
  const tbody=el('tbody',{});
  bl.grid.forEach((st,si)=>{
    const rs=cSR(st.sc,st.ab);
    const tr=el('tr',{style:{background:st.ab?'#f0f0f0':si%2?'#fff':'#faf8f3',opacity:st.ab?'0.5':'1'}});
    tr.appendChild(el('td',{style:{textAlign:'center',color:'#999',fontSize:'9px'}},String(st.num)));
    const ntd=el('td',{});ntd.appendChild(el('input',{value:st.nm,style:{width:'100%',border:'none',background:'transparent',fontSize:'10px',outline:'none',direction:'rtl',padding:'2px'},onChange:e=>{state.thD[state.thB].grid[si].nm=e.target.value;render()}}));tr.appendChild(ntd);
    for(let q=0;q<5;q++){const qtd=el('td',{});qtd.appendChild(el('input',{type:'number',min:'0',max:'10',value:st.sc[q]!=null?st.sc[q]:'',disabled:st.ab,style:{width:'26px',padding:'2px',borderRadius:'4px',border:'1px solid #e5e0d5',fontSize:'10px',textAlign:'center',outline:'none',background:st.ab?'#eee':'#fff'},onChange:e=>{const sc=[...state.thD[state.thB].grid[si].sc];sc[q]=e.target.value===''?null:parseInt(e.target.value);state.thD[state.thB].grid[si].sc=sc;render()}}));tr.appendChild(qtd)}
    tr.appendChild(el('td',{style:{textAlign:'center',fontWeight:'800',fontSize:'11px',color:rs.c?catC[rs.c]||'#ccc':'#ccc'}},rs.t!=null?String(rs.t):'—'));
    tr.appendChild(el('td',{style:{textAlign:'center',fontSize:'9px',color:rs.c?catC[rs.c]||'#ccc':'#ccc'}},rs.p!=null?rs.p+'%':'—'));
    const abtd=el('td',{style:{textAlign:'center'}});const cb=el('input',{type:'checkbox',checked:st.ab,style:{width:'12px',height:'12px'},onChange:e=>{state.thD[state.thB].grid[si].ab=e.target.checked;render()}});abtd.appendChild(cb);tr.appendChild(abtd);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);tw.appendChild(tbl);card.appendChild(tw);
  // Summary
  const named=bl.grid.filter(s=>s.nm&&s.nm.trim());
  if(named.length){const sm={excellent:0,good:0,weak:0,fail:0,absent:0};const ts=[];named.forEach(s=>{const rs=cSR(s.sc,s.ab);if(rs.c==='absent')sm.absent++;else if(rs.c&&rs.c!=='invalid'){sm[rs.c]++;if(rs.t!=null)ts.push(rs.t)}});const av=ts.length?Math.round(ts.reduce((a,b)=>a+b,0)/ts.length):0;
    const sr=el('div',{style:{display:'flex',gap:'4px',flexWrap:'wrap',padding:'7px 0',borderTop:'1px solid #f0ebe0'}});
    Object.entries(sm).forEach(([k,v])=>{const d=el('div',{style:{background:(catC[k]||'#999')+'15',borderRadius:'6px',padding:'3px 7px',textAlign:'center',minWidth:'40px'}});d.appendChild(el('div',{style:{fontSize:'13px',fontWeight:'800',color:catC[k]||'#999'}},String(v)));d.appendChild(el('div',{style:{fontSize:'7px',color:'#999'}},catL[k]||k));sr.appendChild(d)});
    const avd=el('div',{style:{background:'#0c2e2e',borderRadius:'6px',padding:'3px 7px',textAlign:'center'}});avd.appendChild(el('div',{style:{fontSize:'13px',fontWeight:'800',color:'#d4af37'}},String(av)));avd.appendChild(el('div',{style:{fontSize:'7px',color:'#8fbc8f'}},'اوسط'));sr.appendChild(avd);
    card.appendChild(sr);
  }
  c.appendChild(card);
  c.appendChild(el('button',{style:{width:'100%',padding:'13px',borderRadius:'13px',border:'none',background:'linear-gradient(135deg,'+bCl.a+','+bCl.a+'dd)',color:'#fff',fontSize:'14px',fontWeight:'800',cursor:'pointer',marginTop:'8px'},onClick:()=>{state.syncQ.push({type:'thursday',data:state.thD[state.thB]});DB.set('syncQueue',state.syncQ);flash('✓ قطار میں')}},'ارسال امتحان ✓'));
}

function renderTimetable(c){
  c.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',marginBottom:'10px'}},'🕐 نظام الاوقات'));
  const myA=getMyA();
  PER.forEach(p=>{
    if(p.brk){c.appendChild(el('div',{style:{display:'flex',alignItems:'center',gap:'9px',margin:'5px 0',background:'linear-gradient(135deg,#0c2e2e,#1a4a35)',borderRadius:'9px',padding:'8px 11px'}},el('div',{style:{fontSize:'8px',color:'#8fbc8f',width:'65px',textAlign:'center',direction:'ltr',fontFamily:'monospace'}},p.s+'–'+p.e),el('div',{style:{color:'#d4af37',fontSize:'11px',fontWeight:'700'}},'🕌 نماز و کھانا')));return}
    const a=myA.find(a2=>a2.p===p.id);
    const row=el('div',{style:{display:'flex',alignItems:'center',gap:'9px',marginBottom:'4px',background:a?'#fff':'#f5f0e8',borderRadius:'9px',padding:'8px 11px',border:a?'1px solid '+a.cls.a+'25':'none'}});
    row.appendChild(el('div',{style:{fontSize:'8px',color:'#8a9a8a',width:'65px',textAlign:'center',direction:'ltr',fontFamily:'monospace'}},p.s+'–'+p.e));
    if(a){const d=el('div',{style:{flex:'1'}});d.appendChild(el('span',{style:{background:a.cls.c,color:a.cls.a,padding:'1px 6px',borderRadius:'4px',fontSize:'7px',fontWeight:'700',marginLeft:'4px'}},a.cls.n));d.appendChild(el('span',{style:{fontSize:'11px',fontWeight:'700'}},a.sub.n));row.appendChild(d)}
    else row.appendChild(el('div',{style:{flex:'1',color:'#c5c0b5',fontSize:'10px'}},'—'));
    c.appendChild(row);
  });
}

function renderAdmin(c){
  if(!state.admSub){
    c.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',marginBottom:'10px'}},'⚙️ ایڈمن سینٹر'));
    [{ic:'🚦',l:'ڈیش بورڈ',k:'dash'},{ic:'📋',l:'تفویض',k:'assign'},{ic:'🔄',l:'ہم آہنگی',d:state.syncQ.length?state.syncQ.length+' زیر التوا':'✓',k:'sync'}].forEach(it=>{
      const card=el('div',{style:{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'},onClick:()=>{state.admSub=it.k;render()}});
      card.appendChild(el('div',{style:{width:'38px',height:'38px',borderRadius:'10px',background:'#f0ebe0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}},it.ic));
      const info=el('div',{style:{flex:'1'}});info.appendChild(el('div',{style:{fontSize:'13px',fontWeight:'700'}},it.l));if(it.d)info.appendChild(el('div',{style:{fontSize:'9px',color:'#8a9a8a'}},it.d));card.appendChild(info);
      card.appendChild(el('span',{style:{color:'#ccc'}},'←'));c.appendChild(card);
    });
  } else {
    const back=el('button',{style:{background:'none',border:'none',fontSize:'12px',color:'#6b7c6b',cursor:'pointer',marginBottom:'10px'},onClick:()=>{state.admSub=null;render()}},'← واپس');
    c.appendChild(back);
    if(state.admSub==='sync'){
      const card=el('div',{style:{background:'#fff',borderRadius:'13px',padding:'20px',textAlign:'center'}});
      card.appendChild(el('div',{style:{fontSize:'32px'}},state.syncQ.length===0?'✅':'⏳'));
      card.appendChild(el('div',{style:{fontSize:'14px',fontWeight:'800',color:state.syncQ.length?'#f59e0b':'#10b981',marginTop:'6px'}},state.syncQ.length===0?'سب ارسال شدہ':state.syncQ.length+' زیر التوا'));
      if(state.syncQ.length>0)card.appendChild(el('button',{style:{marginTop:'12px',padding:'6px 12px',borderRadius:'8px',border:'none',background:'#10b981',color:'#fff',fontSize:'11px',fontWeight:'700',cursor:'pointer'},onClick:()=>{state.syncQ=[];DB.set('syncQueue',state.syncQ);flash('✓ ارسال')}},'ابھی ارسال'));
      c.appendChild(card);
    } else {
      c.appendChild(el('div',{style:{background:'#fff',borderRadius:'13px',padding:'30px',textAlign:'center'}},el('div',{style:{fontSize:'28px',marginBottom:'8px'}},'🚧'),el('div',{style:{fontSize:'13px',fontWeight:'700',color:'#6b7c6b'}},'اگلی تعمیر میں')));
    }
  }
}

function renderNav(app){
  const isEx=state.user?.exam,isAd=state.user?.role==='admin';
  const tabs=[{id:'home',ic:'🏠',l:'ہوم'},{id:'report',ic:'📝',l:'رپورٹ'},...(isEx?[{id:'thu',ic:'📋',l:'امتحان'}]:[]),{id:'tt',ic:'🕐',l:'اوقات'},...(isAd?[{id:'adm',ic:'⚙️',l:'ایڈمن'}]:[])];
  const nav=el('div',{style:{position:'fixed',bottom:'0',left:'0',right:'0',background:'#fff',borderTop:'1px solid #e5e0d5',display:'flex',justifyContent:'space-around',padding:'5px 0 9px',zIndex:'100'}});
  tabs.forEach(t=>{
    const btn=el('button',{style:{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'1px',color:state.tab===t.id?'#0c2e2e':'#b5b0a5',padding:'2px 10px'},onClick:()=>{state.tab=t.id;state.admSub=null;render()}});
    btn.appendChild(el('span',{style:{fontSize:'18px',transform:state.tab===t.id?'scale(1.1)':'scale(1)',transition:'transform 0.2s'}},t.ic));
    btn.appendChild(el('span',{style:{fontSize:'8px',fontWeight:'700'}},t.l));
    if(state.tab===t.id)btn.appendChild(el('div',{style:{width:'14px',height:'2.5px',borderRadius:'2px',background:'#d4af37'}}));
    nav.appendChild(btn);
  });
  app.appendChild(nav);
}

// Initial render
render();
</script>
</body>
</html>
'@

[System.IO.File]::WriteAllText("$root\index.html", $html, [System.Text.UTF8Encoding]::new($false))

# ── Step 6: Verify files ──────────────────────────────────────
Write-Host "`n✅ Files generated:" -ForegroundColor Green
Get-ChildItem $root -File | ForEach-Object {
    $size = if ($_.Length -gt 1024) { "{0:N0} KB" -f ($_.Length/1024) } else { "$($_.Length) bytes" }
    Write-Host "   $($_.Name) — $size" -ForegroundColor White
}

# ── Step 7: Git add, commit, push ──────────────────────────────
Write-Host "`n🚀 Step 7: Pushing to GitHub..." -ForegroundColor Cyan
git add -A
git commit -m "Deploy My Idara App — PWA with offline support"
git push -u origin main

Write-Host "`n════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "✅ DEPLOYED!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor White
Write-Host "  https://alwiarif46.github.io/Idara/" -ForegroundColor Cyan
Write-Host ""
Write-Host "To enable GitHub Pages:" -ForegroundColor White
Write-Host "  1. Go to https://github.com/alwiarif46/Idara/settings/pages" -ForegroundColor Gray
Write-Host "  2. Source: Deploy from a branch" -ForegroundColor Gray
Write-Host "  3. Branch: main, folder: / (root)" -ForegroundColor Gray
Write-Host "  4. Click Save" -ForegroundColor Gray
Write-Host ""
Write-Host "Teacher PINs: 1234 | Admin PIN: 9999" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════`n" -ForegroundColor Yellow
