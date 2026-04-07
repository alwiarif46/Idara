import { useState, useMemo } from "react";

const CL=[{id:'oola',n:'اولیٰ',c:'#f4e0c1',a:'#c8860a'},{id:'sania',n:'ثانیة',c:'#c9e0f5',a:'#2563eb'},{id:'salisa',n:'ثالثة',c:'#e0d0f0',a:'#7c3aed'},{id:'rabia',n:'رابعة',c:'#c5ede2',a:'#059669'},{id:'khamisa',n:'خامسة',c:'#faf0c8',a:'#b45309'},{id:'fazilat',n:'فضیلة',c:'#f5d0d0',a:'#dc2626'}];
const SB=[{id:'S01',n:'منہاج العربیة',c:'oola',s:9,e:24},{id:'S02',n:'تمرین الصرف',c:'oola',s:5,e:20},{id:'S03',n:'آسان النحو',c:'oola',s:3,e:38},{id:'S04',n:'فارسی قواعد',c:'oola',s:11,e:87},{id:'S05',n:'احادیث',c:'oola',s:1,e:40},{id:'S06',n:'قرآت',c:'oola',s:584,e:611},{id:'S07',n:'میزان الصرف',c:'sania',s:3,e:53},{id:'S08',n:'نور الایضاح',c:'sania',s:1,e:73},{id:'S09',n:'معلم الانشاء',c:'sania',s:1,e:52},{id:'S10',n:'قصص النبیین',c:'sania',s:3,e:40},{id:'S11',n:'کنز الایمان',c:'sania',s:2,e:110},{id:'S12',n:'گلستان سعدی',c:'sania',s:120,e:258},{id:'S13',n:'نحو میر',c:'sania',s:9,e:93},{id:'S14',n:'فیض الادب',c:'sania',s:1,e:23},{id:'S15',n:'مجانی الادب',c:'salisa',s:1,e:36},{id:'S16',n:'معلم الانشاء ۳',c:'salisa',s:1,e:51},{id:'S17',n:'دروس البلاغة',c:'salisa',s:1,e:30},{id:'S18',n:'ہدایة النحو',c:'salisa',s:1,e:47},{id:'S19',n:'مختصر القدوری',c:'salisa',s:1,e:80},{id:'S20',n:'ریاض الصالحین',c:'salisa',s:1,e:80},{id:'S21',n:'علم الصیغة',c:'salisa',s:1,e:71},{id:'S22',n:'کافیة',c:'rabia',s:1,e:37},{id:'S23',n:'مشکوٰة',c:'rabia',s:291,e:430},{id:'S24',n:'تفسیر الجلالین',c:'rabia',s:1,e:30},{id:'S25',n:'اصول حدیث',c:'rabia',s:1,e:40},{id:'S26',n:'اصول الشاشی',c:'rabia',s:1,e:35},{id:'S27',n:'نفحة العرب',c:'rabia',s:1,e:30},{id:'S28',n:'معلم الانشاء ۴',c:'rabia',s:1,e:51},{id:'S29',n:'شرح الوقایة',c:'rabia',s:148,e:217},{id:'S30',n:'مدارک التنزیل',c:'khamisa',s:2,e:64},{id:'S31',n:'شمائل',c:'khamisa',s:2,e:24},{id:'S32',n:'ہدایة الاولین',c:'khamisa',s:3,e:76},{id:'S33',n:'السراجی',c:'khamisa',s:2,e:85},{id:'S34',n:'نور الانوار',c:'khamisa',s:1,e:38},{id:'S35',n:'قصیدة البردة',c:'khamisa',s:3,e:299},{id:'S36',n:'تفسیر بیضاوی',c:'fazilat',s:1,e:158},{id:'S37',n:'صحیح بخاری',c:'fazilat',s:3,e:73},{id:'S38',n:'صحیح مسلم',c:'fazilat',s:448,e:482},{id:'S39',n:'سنن نسائی',c:'fazilat',s:153,e:196},{id:'S40',n:'سنن ترمذی',c:'fazilat',s:21,e:52},{id:'S41',n:'ہدایة آخرین',c:'fazilat',s:1,e:39},{id:'S42',n:'المختارات',c:'fazilat',s:1,e:65}];
const TC0=[{id:'T1',n:'م۔ ارشاد حیدری',role:'principal',exam:false},{id:'T2',n:'م۔ اعجاز مخدومی',role:'teacher',exam:true},{id:'T3',n:'م۔ شاکر امجدی',role:'teacher',exam:true},{id:'T4',n:'م۔ طارق نعیمی',role:'teacher',exam:true},{id:'T5',n:'م۔ ضیاء علیمی',role:'teacher',exam:true},{id:'T6',n:'م۔ زاہد حیدری',role:'teacher',exam:true},{id:'T7',n:'م۔ منتظر نوری',role:'teacher',exam:false}];
const AG_INIT=[{t:'T2',sub:'S13',p:3},{t:'T2',sub:'S08',p:4},{t:'T2',sub:'S23',p:5},{t:'T2',sub:'S26',p:8},{t:'T2',sub:'S12',p:9},{t:'T2',sub:'S31',p:2},{t:'T3',sub:'S24',p:1},{t:'T3',sub:'S07',p:2},{t:'T3',sub:'S41',p:3},{t:'T3',sub:'S19',p:4},{t:'T3',sub:'S39',p:5},{t:'T3',sub:'S25',p:7},{t:'T3',sub:'S32',p:9},{t:'T4',sub:'S36',p:1},{t:'T4',sub:'S03',p:2},{t:'T4',sub:'S33',p:3},{t:'T4',sub:'S40',p:4},{t:'T4',sub:'S21',p:5},{t:'T4',sub:'S35',p:7},{t:'T4',sub:'S37',p:8},{t:'T4',sub:'S29',p:9},{t:'T5',sub:'S30',p:1},{t:'T5',sub:'S22',p:2},{t:'T5',sub:'S18',p:3},{t:'T5',sub:'S34',p:4},{t:'T5',sub:'S14',p:5},{t:'T5',sub:'S17',p:7},{t:'T5',sub:'S38',p:9},{t:'T6',sub:'S20',p:2},{t:'T6',sub:'S04',p:3},{t:'T6',sub:'S28',p:4},{t:'T6',sub:'S05',p:5},{t:'T6',sub:'S42',p:7},{t:'T6',sub:'S10',p:8},{t:'T6',sub:'S01',p:9}];
const PER=[{id:1,s:'10:00',e:'10:35'},{id:2,s:'10:35',e:'11:10'},{id:3,s:'11:10',e:'11:45'},{id:4,s:'11:45',e:'12:20'},{id:5,s:'12:20',e:'12:55'},{id:6,s:'12:55',e:'02:00',brk:true},{id:7,s:'02:00',e:'02:35'},{id:8,s:'02:35',e:'03:10'},{id:9,s:'03:10',e:'03:45'}];
const stC={green:'#10b981',yellow:'#f59e0b',red:'#ef4444',unknown:'#9ca3af'};
const catC={excellent:'#10b981',good:'#3b82f6',weak:'#f59e0b',fail:'#ef4444',absent:'#6b7280'};
const catL={excellent:'اعلیٰ',good:'اچھا',weak:'کمزور',fail:'ناکام',absent:'غائب'};
const S={f:"'Noto Sans Arabic',sans-serif",dk:'#0c2e2e',gd:'#d4af37',gn:'#1a4a35',sg:'#8fbc8f',mt:'#6b7c6b'};
const cT=(s,tot,d)=>s+Math.round((tot/42)*d);
const gC=id=>CL.find(c=>c.id===id)||CL[0];
const gS=id=>SB.find(s=>s.id===id);
const cSR=(sc,ab)=>{if(ab)return{t:null,p:null,c:'absent'};const f=sc.filter(s=>s!=null&&s!=='');if(!f.length)return{t:null,p:null,c:null};const n=f.map(Number);if(n.some(x=>isNaN(x)||x<0||x>10))return{t:null,p:null,c:'invalid'};const t=n.reduce((a,b)=>a+b,0),p=Math.round(t/(f.length*10)*100);return{t,p,c:p>=80?'excellent':p>=60?'good':p>=40?'weak':'fail'}};
const Card=({children,style})=><div style={{background:'#fff',borderRadius:13,padding:14,marginBottom:8,boxShadow:'0 1px 3px rgba(0,0,0,0.04)',...style}}>{children}</div>;
const Btn=({children,onClick,color='#10b981',full,small,style})=><button onClick={onClick} style={{padding:small?'6px 12px':'12px 16px',borderRadius:small?8:12,border:'none',background:`linear-gradient(135deg,${color},${color}dd)`,color:'#fff',fontSize:small?11:14,fontWeight:700,cursor:'pointer',fontFamily:S.f,width:full?'100%':undefined,...style}}>{children}</button>;

export default function App(){
  const[scr,setScr]=useState('login');const[user,setUser]=useState(null);const[pin,setPin]=useState('');const[selT,setSelT]=useState('');const[err,setErr]=useState('');const[tab,setTab]=useState('home');
  const[reps,setReps]=useState({});const[thB,setThB]=useState(0);const[admSub,setAdmSub]=useState(null);const[syncQ,setSyncQ]=useState([]);
  const[assignments,setAssignments]=useState([...AG_INIT]);const[teachers]=useState([...TC0]);
  const[showAdd,setShowAdd]=useState(false);const[newAsg,setNewAsg]=useState({t:'',sub:'',p:''});const[toast,setToast]=useState('');const[dashFilter,setDashFilter]=useState('all');
  const[thD,setThD]=useState(CL.map(()=>({sid:'',grid:Array.from({length:15},(_,i)=>({num:i+1,nm:'',sc:[null,null,null,null,null],ab:false})),nt:'',sg:''})));
  const tDay=7;
  const flash=m=>{setToast(m);setTimeout(()=>setToast(''),2000)};
  const login=()=>{if(!selT){setErr('استاد منتخب کریں');return}if(pin.length<4){setErr('۴ ہندسے');return}if(pin!==(selT==='ADMIN'?'9999':'1234')){setErr('غلط پن');return}setUser(selT==='ADMIN'?{id:'ADMIN',n:'ایڈمن',role:'admin',exam:false}:teachers.find(t=>t.id===selT));setScr('main')};
  const cPer=PER.filter(p=>!p.brk);
  const myA=user?assignments.filter(a=>a.t===user.id).map(a=>{const sub=gS(a.sub),cls=gC(sub.c),per=PER.find(p=>p.id===a.p),tot=sub.e-sub.s;return{...a,sub,cls,per,target:cT(sub.s,tot,tDay),total:tot}}).sort((a,b)=>a.p-b.p):[];
  const upd=(sid,f,v)=>setReps(p=>({...p,[sid]:{...(p[sid]||{}),[f]:v}}));const r=sid=>reps[sid]||{};
  const uTh=(bi,si,f,v)=>setThD(prev=>{const nx=[...prev];const bl={...nx[bi]};if(f==='sid')bl.sid=v;else if(f==='nt')bl.nt=v;else if(f==='sg')bl.sg=v;else{const gr=[...bl.grid];const st={...gr[si]};if(f==='nm')st.nm=v;else if(f==='ab')st.ab=v;else if(f[0]==='q'){const sc=[...st.sc];sc[parseInt(f[1])]=v===''?null:parseInt(v);st.sc=sc}gr[si]=st;bl.grid=gr}nx[bi]=bl;return nx});

  const unassigned=useMemo(()=>{const ids=new Set(assignments.map(a=>a.sub));return SB.filter(s=>!ids.has(s.id))},[assignments]);
  const dashData=useMemo(()=>SB.map(s=>{const tot=s.e-s.s,target=cT(s.s,tot,tDay),rep=reps[s.id],actual=rep?.actual?parseInt(rep.actual):null,variance=actual!==null?actual-target:null,status=variance===null?'unknown':variance>=0?'green':variance>=-5?'yellow':'red';return{id:s.id,n:s.n,c:s.c,target,actual,variance,status,progress:actual!==null?Math.min(100,Math.max(0,Math.round((actual-s.s)/tot*100))):0}}),[reps,tDay]);
  const dashStats=useMemo(()=>{const wd=dashData.filter(s=>s.status!=='unknown');return{green:wd.filter(s=>s.status==='green').length,yellow:wd.filter(s=>s.status==='yellow').length,red:wd.filter(s=>s.status==='red').length,unknown:dashData.length-wd.length}},[dashData]);

  const addAssignment=()=>{
    const{t:tid,sub:sid,p:pid}=newAsg;
    if(!tid||!sid||!pid){flash('سب فیلڈ منتخب کریں');return}
    if(assignments.find(a=>a.t===tid&&a.p===parseInt(pid))){flash('⚠️ پیریڈ میں تصادم');return}
    if(assignments.find(a=>a.sub===sid)){flash('⚠️ مضمون پہلے سے تفویض');return}
    setAssignments(p=>[...p,{t:tid,sub:sid,p:parseInt(pid)}]);setNewAsg({t:'',sub:'',p:''});setShowAdd(false);flash('✓ تفویض شامل');
  };
  const removeAssignment=(tid,sid)=>{setAssignments(p=>p.filter(a=>!(a.t===tid&&a.sub===sid)));flash('✓ حذف')};

  if(scr==='login')return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`linear-gradient(170deg,${S.dk},#0a1f1f 30%,#132b20 70%)`,fontFamily:S.f,direction:'rtl',padding:20}}>
      <div style={{width:64,height:64,borderRadius:16,marginBottom:14,background:`linear-gradient(135deg,${S.gd},#b8860b)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 8px 32px ${S.gd}50`,fontSize:30}}>📖</div>
      <h1 style={{fontSize:24,fontWeight:800,color:S.gd,margin:0}}>ادارہ تحقیقات اسلامی</h1>
      <p style={{color:S.sg,fontSize:11,margin:'4px 0 24px',direction:'ltr'}}>Imam Azam College — My Idara</p>
      <div style={{width:'100%',maxWidth:310,background:'rgba(255,255,255,0.04)',borderRadius:20,padding:22,border:`1px solid ${S.gd}25`}}>
        <select value={selT} onChange={e=>{setSelT(e.target.value);setErr('')}} style={{width:'100%',padding:10,borderRadius:12,border:`1px solid ${S.gd}30`,background:'rgba(0,0,0,0.3)',color:'#e0d9c8',fontSize:13,fontFamily:'inherit',direction:'rtl',marginBottom:12,outline:'none'}}>
          <option value="">— منتخب کریں —</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.n}</option>)}<option value="ADMIN">🔧 ایڈمن</option>
        </select>
        <div style={{display:'flex',gap:7,justifyContent:'center',marginBottom:12,direction:'ltr'}}>{[0,1,2,3].map(i=><div key={i} style={{width:44,height:48,borderRadius:11,border:pin.length>i?`2px solid ${S.gd}`:'1px solid rgba(255,255,255,0.1)',background:pin.length>i?`${S.gd}18`:'rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:S.gd,fontWeight:800}}>{pin[i]?'●':''}</div>)}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,marginBottom:12,direction:'ltr'}}>{[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i)=><button key={i} onClick={()=>{if(k==='⌫')setPin(p=>p.slice(0,-1));else if(k!==''&&pin.length<4)setPin(p=>p+k);setErr('')}} disabled={k===''} style={{padding:'12px 0',borderRadius:11,border:'none',fontSize:17,fontWeight:700,background:k===''?'transparent':k==='⌫'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.06)',color:k==='⌫'?'#f87171':'#c8b88a',cursor:k===''?'default':'pointer',fontFamily:'inherit'}}>{k}</button>)}</div>
        {err&&<div style={{background:'rgba(239,68,68,0.12)',borderRadius:9,padding:6,marginBottom:10,color:'#fca5a5',fontSize:11,textAlign:'center',fontWeight:600}}>{err}</div>}
        <button onClick={login} style={{width:'100%',padding:12,borderRadius:13,border:'none',background:`linear-gradient(135deg,${S.gd},#b8860b)`,color:'#1a0e00',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>داخل ہوں</button>
      </div>
    </div>
  );

  const isEx=user?.exam,isAd=user?.role==='admin';
  const tabs=[{id:'home',ic:'🏠',l:'ہوم'},{id:'report',ic:'📝',l:'رپورٹ'},...(isEx?[{id:'thu',ic:'📋',l:'امتحان'}]:[]),{id:'tt',ic:'🕐',l:'اوقات'},...(isAd?[{id:'adm',ic:'⚙️',l:'ایڈمن'}]:[])];

  return(<div style={{minHeight:'100vh',fontFamily:S.f,direction:'rtl',background:'#f5f0e8'}}>
    {toast&&<div style={{position:'fixed',top:56,left:'50%',transform:'translateX(-50%)',background:S.dk,color:S.gd,padding:'8px 20px',borderRadius:10,fontSize:12,fontWeight:700,zIndex:999}}>{toast}</div>}
    <div style={{background:`linear-gradient(135deg,${S.dk},${S.gn})`,padding:'11px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:9}}><div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${S.gd},#b8860b)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>📖</div><div><div style={{color:S.gd,fontSize:12,fontWeight:800}}>{user?.n}</div><div style={{color:S.sg,fontSize:9}}>دن {tDay}/42</div></div></div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        {syncQ.length>0&&<span style={{background:'#f59e0b',color:'#fff',padding:'2px 7px',borderRadius:10,fontSize:9,fontWeight:800}}>{syncQ.length}⏳</span>}
        <button onClick={()=>{setScr('login');setUser(null);setPin('');setSelT('');setAdmSub(null)}} style={{background:'rgba(255,255,255,0.08)',border:'none',color:S.sg,padding:'4px 9px',borderRadius:7,fontSize:9,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>خروج</button>
      </div>
    </div>
    <div style={{padding:12,paddingBottom:72,maxWidth:460,margin:'0 auto'}}>

      {tab==='home'&&<div>
        <div style={{background:`linear-gradient(135deg,${S.dk},${S.gn})`,borderRadius:16,padding:18,marginBottom:12}}>
          <div style={{fontSize:18,fontWeight:800,color:S.gd}}>السلام علیکم</div>
          <div style={{color:S.sg,fontSize:11,marginTop:2}}>{myA.length} مضامین • {myA.filter(a=>r(a.sub.id).actual).length} مکمل</div>
        </div>
        {myA.map((a,i)=><div key={i} onClick={()=>setTab('report')} style={{background:'#fff',borderRadius:11,padding:'11px 13px',marginBottom:5,borderRight:`4px solid ${a.cls.a}`,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
          <div><div style={{fontSize:12,fontWeight:700}}>{a.sub.n}</div><div style={{fontSize:9,color:'#8a9a8a'}}>{a.cls.n} • P{a.p}</div></div>
          <div style={{fontSize:14,fontWeight:800,color:a.cls.a}}>ص{a.target}</div>
          <div style={{width:22,height:22,borderRadius:6,background:r(a.sub.id).actual?'#10b981':'#e5e0d5',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11}}>{r(a.sub.id).actual?'✓':''}</div>
        </div>)}
      </div>}

      {tab==='report'&&<div>
        <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>📝 یومیہ رپورٹ</div>
        {myA.map((a,i)=>{const rp=r(a.sub.id);const part=rp.complete==='جزوی'||rp.complete==='نہیں';return(
          <Card key={i} style={{border:`1px solid ${rp.complete==='ہاں'?'#10b981':'#e5e0d5'}`}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><span style={{background:a.cls.c,color:a.cls.a,padding:'1px 7px',borderRadius:5,fontSize:8,fontWeight:700}}>{a.cls.n}</span><span style={{fontSize:13,fontWeight:800}}>{a.sub.n}</span></div>
            <div style={{display:'flex',gap:7,marginBottom:8}}>
              <div style={{flex:1}}><div style={{fontSize:8,color:'#999',marginBottom:2}}>ہدف</div><div style={{padding:7,borderRadius:7,background:'#f0ebe0',fontSize:14,fontWeight:800,color:a.cls.a,textAlign:'center'}}>ص{a.target}</div></div>
              <div style={{flex:1}}><div style={{fontSize:8,color:'#999',marginBottom:2}}>حقیقی</div><input type="number" value={rp.actual||''} onChange={e=>upd(a.sub.id,'actual',e.target.value)} placeholder="—" style={{width:'100%',padding:7,borderRadius:7,border:'1.5px solid #d5d0c5',fontSize:14,fontWeight:800,textAlign:'center',fontFamily:'inherit',outline:'none',background:'#faf8f3'}}/></div>
            </div>
            <div style={{display:'flex',gap:4}}>{['ہاں','جزوی','نہیں'].map(o=><button key={o} onClick={()=>upd(a.sub.id,'complete',o)} style={{flex:1,padding:6,borderRadius:7,border:'none',fontSize:10,fontWeight:700,fontFamily:'inherit',cursor:'pointer',background:rp.complete===o?(o==='ہاں'?'#10b981':o==='جزوی'?'#f59e0b':'#ef4444'):'#f0ebe0',color:rp.complete===o?'#fff':'#6b7c6b'}}>{o}</button>)}</div>
            {part&&<div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:5}}>{['غیر حاضری','وقت','مراجعہ','تاخیر','دیگر'].map(rv=><button key={rv} onClick={()=>upd(a.sub.id,'reason',rv)} style={{padding:'3px 7px',borderRadius:5,border:'none',fontSize:8,fontWeight:600,fontFamily:'inherit',cursor:'pointer',background:rp.reason===rv?S.dk:'#f0ebe0',color:rp.reason===rv?S.gd:'#6b7c6b'}}>{rv}</button>)}</div>}
          </Card>)})}
        <Btn full onClick={()=>{setSyncQ(p=>[...p,'d']);flash('✓ قطار میں')}}>ارسال ✓</Btn>
      </div>}

      {tab==='thu'&&isEx&&<div>
        <div style={{fontSize:14,fontWeight:800,marginBottom:8}}>📋 جمعرات امتحان</div>
        <div style={{display:'flex',gap:3,overflowX:'auto',marginBottom:10}}>{CL.map((cl,i)=><button key={cl.id} onClick={()=>setThB(i)} style={{padding:'5px 10px',borderRadius:9,border:'none',fontSize:9,fontWeight:700,fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap',background:thB===i?cl.a:cl.c,color:thB===i?'#fff':cl.a}}>{cl.n}</button>)}</div>
        <Card style={{border:`2px solid ${CL[thB].a}30`}}>
          <div style={{fontSize:13,fontWeight:800,color:CL[thB].a,marginBottom:8}}>امتحان {CL[thB].n}</div>
          <select value={thD[thB].sid} onChange={e=>uTh(thB,0,'sid',e.target.value)} style={{width:'100%',padding:8,borderRadius:9,border:'1px solid #d5d0c5',fontSize:12,fontFamily:'inherit',direction:'rtl',marginBottom:10,outline:'none',background:'#faf8f3'}}>
            <option value="">— مضمون —</option>{SB.filter(s=>s.c===CL[thB].id).map(s=><option key={s.id} value={s.id}>{s.n}</option>)}
          </select>
          <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:10,direction:'rtl',minWidth:380}}>
            <thead><tr style={{background:CL[thB].a,color:'#fff'}}>
              <th style={{padding:5,width:20}}>#</th><th style={{padding:5,textAlign:'right',minWidth:65}}>نام</th>
              {[1,2,3,4,5].map(q=><th key={q} style={{padding:5,width:30}}>س{q}</th>)}
              <th style={{width:30}}>کل</th><th style={{width:26}}>%</th><th style={{width:16}}>غ</th>
            </tr></thead>
            <tbody>{thD[thB].grid.map((st,si)=>{const rs=cSR(st.sc,st.ab);return(
              <tr key={si} style={{background:st.ab?'#f0f0f0':si%2?'#fff':'#faf8f3',opacity:st.ab?.5:1}}>
                <td style={{textAlign:'center',color:'#999',fontSize:9}}>{st.num}</td>
                <td><input value={st.nm} onChange={e=>uTh(thB,si,'nm',e.target.value)} style={{width:'100%',border:'none',background:'transparent',fontSize:10,fontFamily:'inherit',outline:'none',direction:'rtl',padding:2}}/></td>
                {[0,1,2,3,4].map(q=><td key={q}><input type="number" min="0" max="10" value={st.sc[q]??''} disabled={st.ab} onChange={e=>uTh(thB,si,`q${q}`,e.target.value)} style={{width:26,padding:2,borderRadius:4,border:'1px solid #e5e0d5',fontSize:10,textAlign:'center',fontFamily:'inherit',outline:'none',background:st.ab?'#eee':'#fff'}}/></td>)}
                <td style={{textAlign:'center',fontWeight:800,fontSize:11,color:rs.c?catC[rs.c]:'#ccc'}}>{rs.t??'—'}</td>
                <td style={{textAlign:'center',fontSize:9,color:rs.c?catC[rs.c]:'#ccc'}}>{rs.p!=null?rs.p+'%':'—'}</td>
                <td><input type="checkbox" checked={st.ab} onChange={e=>uTh(thB,si,'ab',e.target.checked)} style={{width:12,height:12}}/></td>
              </tr>)})}</tbody>
          </table></div>
        </Card>
        <Btn full color={CL[thB].a} onClick={()=>{setSyncQ(p=>[...p,'t']);flash('✓ قطار میں')}}>ارسال امتحان ✓</Btn>
      </div>}

      {tab==='tt'&&<div>
        <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>🕐 نظام الاوقات</div>
        {PER.map(p=>{if(p.brk)return <div key={p.id} style={{display:'flex',alignItems:'center',gap:9,margin:'5px 0',background:`linear-gradient(135deg,${S.dk},${S.gn})`,borderRadius:9,padding:'8px 11px'}}><div style={{fontSize:8,color:S.sg,width:65,textAlign:'center',direction:'ltr',fontFamily:'monospace'}}>{p.s}–{p.e}</div><div style={{color:S.gd,fontSize:11,fontWeight:700}}>🕌 نماز و کھانا</div></div>;
          const a=myA.find(a2=>a2.p===p.id);return <div key={p.id} style={{display:'flex',alignItems:'center',gap:9,marginBottom:4,background:a?'#fff':'#f5f0e8',borderRadius:9,padding:'8px 11px',border:a?`1px solid ${a.cls.a}25`:'none'}}>
          <div style={{fontSize:8,color:'#8a9a8a',width:65,textAlign:'center',direction:'ltr',fontFamily:'monospace'}}>{p.s}–{p.e}</div>
          {a?<div style={{flex:1}}><span style={{background:a.cls.c,color:a.cls.a,padding:'1px 6px',borderRadius:4,fontSize:7,fontWeight:700,marginLeft:4}}>{a.cls.n}</span><span style={{fontSize:11,fontWeight:700}}>{a.sub.n}</span></div>:<div style={{flex:1,color:'#c5c0b5',fontSize:10}}>—</div>}
        </div>})}
      </div>}

      {/* ADMIN */}
      {tab==='adm'&&isAd&&!admSub&&<div>
        <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>⚙️ ایڈمن سینٹر</div>
        {[{ic:'🚦',l:'ڈیش بورڈ',d:'نصاب',k:'dash'},{ic:'📋',l:'تفویض',d:`${assignments.length} تفویض • ${unassigned.length} باقی`,k:'assign'},{ic:'🔄',l:'ہم آہنگی',d:syncQ.length?`${syncQ.length} زیر التوا`:'✓',k:'sync'}].map((it,i)=><div key={i} onClick={()=>setAdmSub(it.k)} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:6,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
          <div style={{width:38,height:38,borderRadius:10,background:'#f0ebe0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{it.ic}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{it.l}</div><div style={{fontSize:9,color:'#8a9a8a'}}>{it.d}</div></div><span style={{color:'#ccc'}}>←</span>
        </div>)}
      </div>}

      {/* DASHBOARD */}
      {tab==='adm'&&admSub==='dash'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <button onClick={()=>setAdmSub(null)} style={{background:'none',border:'none',fontSize:12,color:S.mt,cursor:'pointer',fontFamily:'inherit'}}>← واپس</button>
          <div style={{fontSize:14,fontWeight:800}}>🚦 ڈیش بورڈ</div><div/>
        </div>
        <div style={{display:'flex',gap:5,marginBottom:10}}>
          {[{l:'سب',k:'all',v:42},{l:'✓',k:'green',v:dashStats.green,c:stC.green},{l:'⚠',k:'yellow',v:dashStats.yellow,c:stC.yellow},{l:'✗',k:'red',v:dashStats.red,c:stC.red}].map(f=>(
            <button key={f.k} onClick={()=>setDashFilter(f.k)} style={{flex:1,padding:'6px 0',borderRadius:8,border:dashFilter===f.k?`2px solid ${f.c||S.gd}`:'2px solid transparent',background:f.c?`${f.c}15`:'#f0ebe0',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',color:f.c||'#333'}}>{f.v} {f.l}</button>
          ))}
        </div>
        {CL.map(cl=>{const items=dashData.filter(d=>d.c===cl.id&&(dashFilter==='all'||d.status===dashFilter));if(!items.length)return null;return(
          <div key={cl.id} style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:cl.a,padding:'3px 8px',background:cl.c,borderRadius:6,display:'inline-block',marginBottom:5}}>{cl.n}</div>
            {items.map(d=><Card key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 11px',borderRight:`4px solid ${stC[d.status]}`}}>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700}}>{d.n}</div><div style={{fontSize:8,color:'#999'}}>ہدف ص{d.target}{d.actual!=null?` • حقیقی ص${d.actual}`:''}</div></div>
              <div style={{background:`${stC[d.status]}18`,color:stC[d.status],padding:'2px 7px',borderRadius:5,fontSize:11,fontWeight:800}}>{d.variance!=null?(d.variance>=0?`+${d.variance}`:d.variance):'—'}</div>
            </Card>)}
          </div>
        )})}
      </div>}

      {/* TIMETABLE BUILDER */}
      {tab==='adm'&&admSub==='assign'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <button onClick={()=>setAdmSub(null)} style={{background:'none',border:'none',fontSize:12,color:S.mt,cursor:'pointer',fontFamily:'inherit'}}>← واپس</button>
          <div style={{fontSize:14,fontWeight:800}}>📋 تفویض / نظام الاوقات</div>
          <Btn small color={S.gd} onClick={()=>setShowAdd(!showAdd)}>{showAdd?'✗':'+ نیا'}</Btn>
        </div>
        {showAdd&&<Card style={{border:`2px solid ${S.gd}40`,marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:S.gd,marginBottom:8}}>نئی تفویض</div>
          <select value={newAsg.t} onChange={e=>setNewAsg(p=>({...p,t:e.target.value}))} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #d5d0c5',fontSize:12,fontFamily:'inherit',direction:'rtl',marginBottom:6,outline:'none',background:'#faf8f3'}}>
            <option value="">— استاد —</option>{teachers.filter(t=>t.role!=='principal').map(t=><option key={t.id} value={t.id}>{t.n} ({assignments.filter(a=>a.t===t.id).length})</option>)}
          </select>
          <select value={newAsg.sub} onChange={e=>setNewAsg(p=>({...p,sub:e.target.value}))} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #d5d0c5',fontSize:12,fontFamily:'inherit',direction:'rtl',marginBottom:6,outline:'none',background:'#faf8f3'}}>
            <option value="">— مضمون ({unassigned.length} باقی) —</option>{unassigned.map(s=><option key={s.id} value={s.id}>{s.n} ({gC(s.c).n})</option>)}
          </select>
          <select value={newAsg.p} onChange={e=>setNewAsg(p=>({...p,p:e.target.value}))} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #d5d0c5',fontSize:12,fontFamily:'inherit',direction:'rtl',marginBottom:8,outline:'none',background:'#faf8f3'}}>
            <option value="">— پیریڈ —</option>{cPer.map(p=><option key={p.id} value={p.id}>P{p.id}: {p.s}–{p.e}</option>)}
          </select>
          <Btn full color="#10b981" onClick={addAssignment}>تفویض کریں ✓</Btn>
        </Card>}
        {/* Timetable grid */}
        <div style={{overflowX:'auto',marginBottom:10}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:9,minWidth:500}}>
            <thead><tr style={{background:S.dk}}>
              <th style={{padding:6,color:S.gd,textAlign:'right',position:'sticky',right:0,background:S.dk,zIndex:1,minWidth:70}}>استاد</th>
              {cPer.map(p=><th key={p.id} style={{padding:4,color:'#8fbc8f',textAlign:'center',minWidth:55,direction:'ltr',fontFamily:'monospace',fontSize:8}}>{p.s}<br/>{p.e}</th>)}
            </tr></thead>
            <tbody>{teachers.filter(t=>t.role!=='principal').map(t=>(
              <tr key={t.id} style={{borderBottom:'1px solid #e5e0d5'}}>
                <td style={{padding:'6px 4px',fontWeight:700,fontSize:10,textAlign:'right',position:'sticky',right:0,background:'#fff',zIndex:1}}>{t.n}</td>
                {cPer.map(p=>{const asg=assignments.find(a=>a.t===t.id&&a.p===p.id);if(!asg)return <td key={p.id} style={{padding:2,textAlign:'center'}}><div style={{height:36,borderRadius:6,background:'#f5f0e8',border:'1px dashed #d5d0c5'}}></div></td>;
                  const sub=gS(asg.sub);const cl=gC(sub.c);return(
                  <td key={p.id} style={{padding:2}}>
                    <div style={{background:cl.c,borderRadius:6,padding:'4px 3px',textAlign:'center',position:'relative',height:36,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                      <div style={{fontSize:8,fontWeight:700,color:cl.a,lineHeight:1.2}}>{sub.n}</div>
                      <div style={{fontSize:7,color:'#999'}}>{cl.n}</div>
                      <button onClick={()=>removeAssignment(t.id,asg.sub)} style={{position:'absolute',top:-4,left:-4,width:14,height:14,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',fontSize:8,cursor:'pointer',lineHeight:'14px',padding:0}}>✗</button>
                    </div>
                  </td>)})}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{fontSize:10,color:S.mt,textAlign:'center'}}>{assignments.length} تفویض • {unassigned.length} باقی مضامین</div>
      </div>}

      {tab==='adm'&&admSub==='sync'&&<div>
        <button onClick={()=>setAdmSub(null)} style={{background:'none',border:'none',fontSize:12,color:S.mt,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>← واپس</button>
        <Card style={{textAlign:'center',padding:20}}>
          <div style={{fontSize:32}}>{syncQ.length===0?'✅':'⏳'}</div>
          <div style={{fontSize:14,fontWeight:800,color:syncQ.length?'#f59e0b':'#10b981',marginTop:6}}>{syncQ.length===0?'سب ارسال':`${syncQ.length} زیر التوا`}</div>
          {syncQ.length>0&&<Btn color="#10b981" small style={{marginTop:12}} onClick={()=>{setSyncQ([]);flash('✓ ارسال')}}>ابھی ارسال</Btn>}
        </Card>
      </div>}
    </div>

    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #e5e0d5',display:'flex',justifyContent:'space-around',padding:'5px 0 9px',zIndex:100}}>
      {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setAdmSub(null);setShowAdd(false)}} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1,color:tab===t.id?S.dk:'#b5b0a5',fontFamily:'inherit',padding:'2px 10px'}}>
        <span style={{fontSize:18,transform:tab===t.id?'scale(1.1)':'scale(1)',transition:'transform 0.2s'}}>{t.ic}</span><span style={{fontSize:8,fontWeight:700}}>{t.l}</span>{tab===t.id&&<div style={{width:14,height:2.5,borderRadius:2,background:S.gd}}/>}
      </button>)}
    </div>
  </div>);
}
