'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { T, getGrade } from '@/lib/theme';
import { MODULES, TOTAL_LESSONS, PASS_THRESHOLD } from '@/data/courseData';

/* ── Deterministic avatar gradient ─────────────────────────────────── */
const AVATAR_GRADIENTS = [
  ['#818cf8','#6366f1'],['#60a5fa','#3b82f6'],['#c084fc','#a855f7'],
  ['#34d399','#10b981'],['#f87171','#ef4444'],['#fbbf24','#f59e0b'],
  ['#22d3ee','#06b6d4'],['#fb923c','#f97316'],
];
function gradientForName(name=''){
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h)%AVATAR_GRADIENTS.length];
}
function initials(name=''){
  const p=name.trim().split(/\s+/);
  return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase();
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name, avatarUrl, size=88, fontSize=24 }){
  const [imgOk, setImgOk] = useState(true);
  const [colors]          = useState(()=>gradientForName(name));
  useEffect(()=>setImgOk(true),[avatarUrl]);
  if(avatarUrl && imgOk)
    return <img src={avatarUrl} alt={name} onError={()=>setImgOk(false)}
      style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover',
               border:`2px solid rgba(255,255,255,0.10)`, display:'block' }} />;
  return (
    <div style={{
      width:size,height:size,borderRadius:'50%',flexShrink:0,
      background:`linear-gradient(135deg,${colors[0]},${colors[1]})`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:T.display,fontWeight:800,fontSize,color:'#fff',
      letterSpacing:'-0.02em',
    }}>{initials(name)}</div>
  );
}

/* ── Eye icons ──────────────────────────────────────────────────────── */
const EyeIcon = ()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = ()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── Field ──────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, type='text', multiline=false, readOnly=false,
                 placeholder='', maxLength, hint, autoFocus=false }){
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);
  useEffect(()=>{ if(autoFocus && inputRef.current) inputRef.current.focus(); },[autoFocus]);
  const isPassword = type==='password';
  const inputType  = isPassword && visible ? 'text' : type;
  const base = {
    width:'100%', boxSizing:'border-box',
    background: readOnly ? T.bg2 : T.bg,
    border:`1.5px solid ${T.border}`, borderRadius:10,
    padding: isPassword ? '12px 42px 12px 14px' : '12px 14px',
    fontFamily:T.font, fontSize:14, color: readOnly ? T.muted : T.text,
    outline:'none', resize:'none', transition:'border-color 0.15s, box-shadow 0.15s',
  };
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:T.mono, fontSize:10, color:T.dim,
                    letterSpacing:'0.09em', marginBottom:7, textTransform:'uppercase' }}>
        {label}
      </div>
      {multiline
        ? <textarea value={value} onChange={e=>onChange&&onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength} rows={3}
            readOnly={readOnly} style={{...base, padding:'12px 14px'}}
            onFocus={e=>{ if(!readOnly){e.target.style.borderColor=T.accent; e.target.style.boxShadow=`0 0 0 3px ${T.accentLight}`;} }}
            onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow='none'; }}
          />
        : <div style={{ position:'relative' }}>
            <input ref={inputRef} type={inputType} value={value}
              onChange={e=>onChange&&onChange(e.target.value)}
              placeholder={placeholder} maxLength={maxLength} readOnly={readOnly}
              style={base}
              onFocus={e=>{ if(!readOnly){e.target.style.borderColor=T.accent; e.target.style.boxShadow=`0 0 0 3px ${T.accentLight}`;} }}
              onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow='none'; }}
            />
            {isPassword && (
              <button type="button" tabIndex={-1} onClick={()=>setVisible(v=>!v)}
                aria-label={visible?'Hide':'Show'}
                style={{
                  position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color: visible?T.accent:T.dim, padding:3, display:'flex', alignItems:'center',
                  transition:'color 0.15s',
                }}>
                {visible?<EyeOffIcon/>:<EyeIcon/>}
              </button>
            )}
          </div>
      }
      {hint && <p style={{ fontFamily:T.font, fontSize:11, color:T.faint, margin:'4px 0 0' }}>{hint}</p>}
      {maxLength && !readOnly && (
        <p style={{ fontFamily:T.mono, fontSize:9, color:T.faint, textAlign:'right', margin:'3px 0 0' }}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
export default function ProfilePage({
  user, userId, progress, canSeeCert,
  onBack, onLogout, onCert,
  updateProfile, updatePassword,
}){
  const { completed, quizScores } = progress;
  const completedCount = Object.keys(completed).length;
  const progressPct    = Math.round(completedCount / TOTAL_LESSONS * 100);

  /* quiz stats */
  const qVals         = Object.values(quizScores);
  const totalCorrect  = qVals.reduce((a,v)=>a+v.score, 0);
  const totalPossible = qVals.reduce((a,v)=>a+v.total, 0);
  const avgPct        = totalPossible>0 ? Math.round(totalCorrect/totalPossible*100) : null;
  const avgGrade      = avgPct!==null ? getGrade(avgPct) : null;
  const quizzesPassed = qVals.filter(s=>s.total>0 && Math.round(s.score/s.total*100)>=PASS_THRESHOLD).length;
  const quizzesTaken  = qVals.length;

  const [colors] = useState(()=>gradientForName(user.name));

  /* edit state */
  const [name,       setName]      = useState(user.name||'');
  const [bio,        setBio]       = useState(user.bio||'');
  const [avatarUrl,  setAvatarUrl] = useState(user.avatarUrl||'');
  const [dirty,      setDirty]     = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [saveMsg,    setSaveMsg]   = useState('');
  const [nameAutoFocus, setNameAutoFocus] = useState(false);
  function markDirty(){ setDirty(true); setSaveMsg(''); }

  /* password */
  const [showPw,    setShowPw]    = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confPw,    setConfPw]    = useState('');
  const [pwMsg,     setPwMsg]     = useState({ ok:null, text:'' });
  const [pwLoading, setPwLoading] = useState(false);

  /* avatar upload */
  const fileInputRef                        = useRef(null);
  const profileSectionRef                   = useRef(null);
  const [uploadError,   setUploadError]     = useState('');
  const [uploadLoading, setUploadLoading]   = useState(false);

  /* logout */
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const resizeToDataURL = useCallback((file, maxPx=200, quality=0.85)=>
    new Promise((resolve,reject)=>{
      const img=new Image(), url=URL.createObjectURL(file);
      img.onload=()=>{
        URL.revokeObjectURL(url);
        const {naturalWidth:w,naturalHeight:h}=img;
        const scale=Math.min(1,maxPx/Math.max(w,h));
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(w*scale); canvas.height=Math.round(h*scale);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('Cannot load image')); };
      img.src=url;
    })
  ,[]);

  async function handleFileSelect(e){
    const file=e.target.files?.[0]; e.target.value='';
    if(!file) return;
    if(!file.type.startsWith('image/')){ setUploadError('Please select an image file.'); return; }
    if(file.size>10*1024*1024){ setUploadError('Image must be smaller than 10 MB.'); return; }
    setUploadError(''); setUploadLoading(true);
    try{ const d=await resizeToDataURL(file); setAvatarUrl(d); markDirty(); }
    catch{ setUploadError('Failed to process image.'); }
    finally{ setUploadLoading(false); }
  }

  async function handleSave(){
    if(!name.trim()){ setSaveMsg('Name cannot be empty.'); return; }
    if(avatarUrl && !avatarUrl.startsWith('https://') && !avatarUrl.startsWith('data:image/'))
      { setSaveMsg('Avatar URL must start with https://'); return; }
    setSaving(true);
    const result=await updateProfile({ name, bio, avatarUrl });
    setSaving(false);
    if(result.ok){ setDirty(false); setSaveMsg('✓ Saved'); setTimeout(()=>setSaveMsg(''),3000); }
    else setSaveMsg(result.error||'Save failed.');
  }

  function handleCancel(){
    setName(user.name||''); setBio(user.bio||''); setAvatarUrl(user.avatarUrl||'');
    setDirty(false); setSaveMsg(''); setNameAutoFocus(false);
  }

  async function handlePasswordChange(){
    if(!curPw){ setPwMsg({ok:false,text:'Enter your current password.'}); return; }
    if(newPw.length<6){ setPwMsg({ok:false,text:'New password must be at least 6 characters.'}); return; }
    if(newPw!==confPw){ setPwMsg({ok:false,text:'Passwords do not match.'}); return; }
    setPwLoading(true);
    const result=await updatePassword(curPw,newPw);
    setPwLoading(false);
    if(result.ok){
      setPwMsg({ok:true,text:'✓ Password updated.'});
      setCurPw(''); setNewPw(''); setConfPw('');
      setTimeout(()=>{ setPwMsg({ok:null,text:''}); setShowPw(false); },3000);
    } else setPwMsg({ok:false,text:result.error||'Failed.'});
  }

  function scrollToProfile(){
    profileSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setTimeout(()=>setNameAutoFocus(true), 400);
    markDirty();
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes barFill { from { width:0; } to { width:var(--w); } }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:`linear-gradient(160deg, ${colors[0]}22 0%, ${colors[1]}10 40%, transparent 70%), ${T.bg1}`,
        borderBottom:`1px solid ${T.border}`,
      }}>
        {/* Decorative orb */}
        <div style={{
          position:'absolute', top:-80, right:-60, width:320, height:320,
          borderRadius:'50%',
          background:`radial-gradient(circle, ${colors[0]}18 0%, transparent 70%)`,
          pointerEvents:'none',
        }}/>

        <div style={{ maxWidth:700, margin:'0 auto', padding:'clamp(20px,4vw,36px) clamp(16px,5vw,40px)' }}>

          {/* Back */}
          <button onClick={onBack} style={{
            display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none',
            color:T.muted, cursor:'pointer', fontFamily:T.font, fontSize:13,
            padding:0, marginBottom:32, transition:'color 0.15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.color=T.text}
            onMouseLeave={e=>e.currentTarget.style.color=T.muted}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Course
          </button>

          {/* Name-missing banner */}
          {user.nameIsDefault && (
            <div style={{
              marginBottom:24, padding:'14px 18px',
              background:'rgba(251,191,36,0.08)', border:'1.5px solid rgba(251,191,36,0.30)',
              borderRadius:12, display:'flex', alignItems:'center', gap:14,
              animation:'fadeUp 0.3s ease both',
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.font, fontWeight:700, fontSize:13, color:T.warning, marginBottom:2 }}>
                  Your name isn't set yet
                </div>
                <div style={{ fontFamily:T.font, fontSize:12, color:T.muted, lineHeight:1.5 }}>
                  Your name appears on your certificate. Set it before completing the course.
                </div>
              </div>
              <button onClick={scrollToProfile} style={{
                flexShrink:0, background:'rgba(251,191,36,0.14)',
                border:'1px solid rgba(251,191,36,0.35)',
                color:T.warning, borderRadius:8, padding:'7px 14px',
                fontFamily:T.font, fontWeight:700, fontSize:12, cursor:'pointer',
                transition:'all 0.15s', whiteSpace:'nowrap',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(251,191,36,0.22)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(251,191,36,0.14)'}
              >Set name →</button>
            </div>
          )}

          {/* Avatar + identity row */}
          <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:28, flexWrap:'wrap' }}>
            {/* Avatar with completion ring */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:100, height:100, borderRadius:'50%',
                background:`conic-gradient(${colors[0]} ${progressPct*3.6}deg, ${T.bg3} 0deg)`,
                padding:3, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{
                  width:'100%', height:'100%', borderRadius:'50%',
                  background:T.bg1, display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden',
                }}>
                  <Avatar name={name||user.name} avatarUrl={avatarUrl} size={88} fontSize={24}/>
                </div>
              </div>
              {progressPct===100 && (
                <div style={{
                  position:'absolute', bottom:2, right:2,
                  width:22, height:22, borderRadius:'50%',
                  background:`linear-gradient(135deg,${T.success},#059669)`,
                  border:`2px solid ${T.bg}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, color:'#fff', fontWeight:800,
                }}>✓</div>
              )}
            </div>

            {/* Name / email / progress pill */}
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{
                fontFamily:T.display, fontWeight:800,
                fontSize:'clamp(24px,4vw,34px)', color:T.text,
                letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:5,
              }}>
                {name||user.name}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.dim, marginBottom:14 }}>
                {user.email}
              </div>
              {/* Progress bar pill */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  flex:1, maxWidth:200, height:5, borderRadius:3,
                  background:T.bg3, overflow:'hidden',
                }}>
                  <div style={{
                    height:'100%', borderRadius:3,
                    width:`${progressPct}%`,
                    background:`linear-gradient(90deg,${colors[0]},${colors[1]})`,
                    transition:'width 0.6s ease',
                  }}/>
                </div>
                <span style={{ fontFamily:T.mono, fontSize:11, color:colors[0], fontWeight:700 }}>
                  {progressPct}%
                </span>
                {progressPct===100 && (
                  <span style={{
                    fontFamily:T.mono, fontSize:9, color:T.success,
                    background:`${T.success}12`, border:`1px solid ${T.success}25`,
                    borderRadius:20, padding:'2px 10px',
                  }}>COMPLETE</span>
                )}
              </div>
            </div>

            {/* Grade badge */}
            {avgGrade && (
              <div style={{
                flexShrink:0, textAlign:'center',
                width:76, height:76, borderRadius:18,
                background:`${avgGrade.color}12`,
                border:`2px solid ${avgGrade.color}30`,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
              }}>
                <div style={{
                  fontFamily:T.display, fontWeight:800, fontSize:32,
                  color:avgGrade.color, lineHeight:1, letterSpacing:'-0.04em',
                }}>{avgGrade.letter}</div>
                <div style={{ fontFamily:T.mono, fontSize:8, color:T.dim, marginTop:2 }}>
                  AVG GRADE
                </div>
              </div>
            )}
          </div>

          {/* ── Stats row ── */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))',
            gap:8,
          }}>
            {[
              { n: completedCount,  u:`/ ${TOTAL_LESSONS}`, label:'Lessons Done',    color:colors[0] },
              { n: avgPct!==null?`${avgPct}%`:'—', u: avgGrade?.label||'', label:'Quiz Average', color: avgGrade?.color||T.dim },
              { n: quizzesPassed,   u:`/ ${quizzesTaken||'0'} taken`,  label:'Quizzes Passed', color:T.success },
              { n:`${progressPct}%`,u:'',            label:'Completion',      color: progressPct===100?T.success:T.accent },
            ].map(({ n, u, label, color })=>(
              <div key={label} style={{
                background:T.bg, border:`1px solid ${T.border}`,
                borderRadius:12, padding:'14px 16px',
                borderLeft:`3px solid ${color}`,
              }}>
                <div style={{
                  fontFamily:T.display, fontWeight:800,
                  fontSize:22, color, lineHeight:1, letterSpacing:'-0.02em',
                }}>{n}</div>
                {u && <div style={{ fontFamily:T.mono, fontSize:9, color:T.faint, marginTop:2 }}>{u}</div>}
                <div style={{ fontFamily:T.font, fontSize:11, color:T.muted, marginTop:6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 clamp(16px,5vw,40px) 56px' }}>

        {/* ── Certificate banner ── */}
        {canSeeCert && (
          <div style={{ marginTop:28 }}>
            <button onClick={onCert} style={{
              width:'100%', cursor:'pointer', textAlign:'left',
              background:'linear-gradient(135deg,rgba(99,102,241,0.10),rgba(129,140,248,0.05))',
              border:`1.5px solid ${T.accentBorder}`,
              borderRadius:14, padding:'18px 22px',
              display:'flex', alignItems:'center', gap:18,
              transition:'all 0.2s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background='linear-gradient(135deg,rgba(99,102,241,0.16),rgba(129,140,248,0.10))'; e.currentTarget.style.boxShadow=`0 4px 24px rgba(99,102,241,0.18)`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='linear-gradient(135deg,rgba(99,102,241,0.10),rgba(129,140,248,0.05))'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{
                width:48, height:48, borderRadius:12, flexShrink:0,
                background:T.accentLight, border:`1.5px solid ${T.accentBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
              }}>🎓</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.font, fontWeight:700, fontSize:14, color:T.text, marginBottom:3 }}>
                  Certificate of Completion
                </div>
                <div style={{ fontFamily:T.font, fontSize:12, color:T.muted }}>
                  {completedCount===TOTAL_LESSONS
                    ? 'Course complete — view and download your verified certificate.'
                    : 'You have a certificate — view it any time.'}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Course progress ── */}
        <div style={{ marginTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontFamily:T.mono, fontSize:10, color:T.dim, letterSpacing:'0.12em' }}>COURSE PROGRESS</span>
            <div style={{ flex:1, height:1, background:T.border }}/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {MODULES.map((mod, mi)=>{
              const total      = mod.lessons.length;
              const done       = mod.lessons.filter((_,li)=>completed[`${mi}-${li}`]).length;
              const pct        = Math.round(done/total*100);
              const isComplete = done===total;
              const isStarted  = done>0;

              const qEntries = mod.lessons.map((_,li)=>quizScores[`${mi}-${li}`]).filter(Boolean);
              const qC = qEntries.reduce((a,q)=>a+q.score,0);
              const qT = qEntries.reduce((a,q)=>a+q.total,0);
              const qPct   = qT>0 ? Math.round(qC/qT*100) : null;
              const qGrade = qPct!==null ? getGrade(qPct) : null;

              return (
                <div key={mi} style={{
                  background:T.bg1,
                  border:`1px solid ${isComplete ? mod.color+'30' : T.border}`,
                  borderRadius:12, padding:'12px 16px',
                  display:'flex', alignItems:'center', gap:14,
                  transition:'border-color 0.2s',
                }}>
                  {/* Icon */}
                  <div style={{
                    width:36, height:36, borderRadius:9, flexShrink:0,
                    background:`${mod.color}14`, border:`1.5px solid ${mod.color}28`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
                  }}>{mod.icon}</div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <span style={{ fontFamily:T.mono, fontSize:8.5, color:mod.color, letterSpacing:'0.1em' }}>{mod.tag}</span>
                      <span style={{
                        fontFamily:T.font, fontWeight:600, fontSize:12, color:T.text,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{mod.title}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background:T.bg3, borderRadius:100, height:3, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:100,
                        width:`${pct}%`,
                        background: isComplete
                          ? `linear-gradient(90deg,${mod.color},${T.success})`
                          : mod.color,
                        transition:'width 0.5s ease',
                      }}/>
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    {isComplete ? (
                      <div style={{
                        background:`${T.success}12`, border:`1px solid ${T.success}28`,
                        borderRadius:6, padding:'3px 8px',
                        fontFamily:T.mono, fontSize:8.5, color:T.success,
                      }}>✓ DONE</div>
                    ) : (
                      <div style={{ fontFamily:T.mono, fontSize:10, color:isStarted?T.muted:T.faint }}>
                        {done}/{total}
                      </div>
                    )}
                    {qGrade && (
                      <div style={{
                        fontFamily:T.mono, fontSize:10, color:qGrade.color, fontWeight:700,
                        marginTop:3,
                      }}>
                        {qPct}% · {qGrade.letter}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Profile edit ── */}
        <div ref={profileSectionRef} style={{ marginTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <span style={{ fontFamily:T.mono, fontSize:10, color:T.dim, letterSpacing:'0.12em' }}>PROFILE INFO</span>
            <div style={{ flex:1, height:1, background:T.border }}/>
          </div>

          {/* Avatar row */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20,
                        background:T.bg1, border:`1px solid ${T.border}`,
                        borderRadius:12, padding:'16px 18px' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Avatar name={name||user.name} avatarUrl={avatarUrl} size={52} fontSize={15}/>
              {avatarUrl && (
                <button type="button" tabIndex={-1}
                  onClick={()=>{ setAvatarUrl(''); markDirty(); setUploadError(''); }}
                  title="Remove photo"
                  style={{
                    position:'absolute', top:-5, right:-5,
                    width:17, height:17, borderRadius:'50%',
                    background:T.error, border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:10, fontWeight:700,
                  }}>×</button>
              )}
            </div>
            <div style={{ flex:1 }}>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileSelect} style={{ display:'none' }} aria-hidden="true"/>
              <button type="button"
                onClick={()=>fileInputRef.current?.click()}
                disabled={uploadLoading}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  background:T.bg2, border:`1px solid ${T.border2}`,
                  borderRadius:8, padding:'8px 14px',
                  fontFamily:T.font, fontSize:13, color:T.text,
                  cursor:uploadLoading?'default':'pointer',
                  opacity:uploadLoading?0.6:1, transition:'all 0.15s',
                }}
                onMouseEnter={e=>{ if(!uploadLoading) e.currentTarget.style.borderColor=T.accent; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border2; }}
              >
                {uploadLoading
                  ? <><span style={{ display:'inline-block', width:12, height:12, border:`2px solid ${T.dim}`, borderTopColor:T.accent, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Processing…</>
                  : <>{avatarUrl?'Change Photo':'Upload Photo'}</>
                }
              </button>
              <p style={{ fontFamily:T.font, fontSize:11, color:T.dim, margin:'5px 0 0', lineHeight:1.5 }}>
                JPG, PNG or WebP · max 10 MB
              </p>
            </div>
          </div>

          {uploadError && (
            <div style={{ fontFamily:T.font, fontSize:12, color:T.error, marginBottom:12,
                          padding:'8px 12px', borderRadius:8,
                          background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)' }}>
              {uploadError}
            </div>
          )}

          <Field label="Display Name" value={name}
            onChange={v=>{setName(v);markDirty();}} placeholder="Your full name"
            maxLength={60} hint="This name appears on your certificate"
            autoFocus={nameAutoFocus}/>
          <Field label="Email — cannot be changed" value={user.email} readOnly/>
          <Field label="Bio (optional)" value={bio}
            onChange={v=>{setBio(v);markDirty();}}
            placeholder="Tell us a little about yourself…" multiline maxLength={280}/>

          {dirty && (
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex:2, background:T.accent, border:'none', color:'#fff',
                borderRadius:10, padding:'12px 0', cursor:saving?'default':'pointer',
                fontFamily:T.font, fontWeight:700, fontSize:14,
                opacity:saving?0.7:1, transition:'all 0.15s',
                boxShadow:saving?'none':'0 4px 14px rgba(99,102,241,0.35)',
              }}>{saving?'Saving…':'Save Changes'}</button>
              <button onClick={handleCancel} style={{
                flex:1, background:'none', border:`1px solid ${T.border}`, color:T.muted,
                borderRadius:10, padding:'12px 0', cursor:'pointer',
                fontFamily:T.font, fontWeight:600, fontSize:14, transition:'all 0.15s',
              }}>Cancel</button>
            </div>
          )}
          {saveMsg && (
            <div style={{
              fontFamily:T.font, fontSize:13, marginTop:10, padding:'9px 14px', borderRadius:9,
              color:      saveMsg.startsWith('✓')?T.success:T.error,
              background: saveMsg.startsWith('✓')?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)',
              border:     `1px solid ${saveMsg.startsWith('✓')?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`,
            }}>{saveMsg}</div>
          )}
        </div>

        {/* ── Security ── */}
        <div style={{ marginTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontFamily:T.mono, fontSize:10, color:T.dim, letterSpacing:'0.12em' }}>SECURITY</span>
            <div style={{ flex:1, height:1, background:T.border }}/>
          </div>

          <button onClick={()=>{ setShowPw(p=>!p); setPwMsg({ok:null,text:''}); }} style={{
            width:'100%', background:T.bg1, border:`1px solid ${T.border}`,
            borderRadius:10, padding:'13px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', color:T.muted, fontFamily:T.font, fontSize:14,
            transition:'all 0.15s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.border2; e.currentTarget.style.color=T.text; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change Password
            </div>
            <span style={{ fontFamily:T.mono, fontSize:10, transition:'transform 0.2s',
                           display:'inline-block', transform:showPw?'rotate(180deg)':'none' }}>▾</span>
          </button>

          {showPw && (
            <div style={{
              background:T.bg1, border:`1px solid ${T.border}`,
              borderTop:'none', borderRadius:'0 0 10px 10px', padding:'18px 16px',
            }}>
              <Field label="Current Password"    value={curPw}  onChange={setCurPw}  type="password" placeholder="••••••••"/>
              <Field label="New Password"         value={newPw}  onChange={setNewPw}  type="password" placeholder="Min 6 characters"/>
              <Field label="Confirm New Password" value={confPw} onChange={setConfPw} type="password" placeholder="Repeat new password"/>
              {pwMsg.text && (
                <div style={{
                  fontFamily:T.font, fontSize:13, marginBottom:12, padding:'9px 13px', borderRadius:8,
                  color:      pwMsg.ok?T.success:T.error,
                  background: pwMsg.ok?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)',
                  border:     `1px solid ${pwMsg.ok?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`,
                }}>{pwMsg.text}</div>
              )}
              <button onClick={handlePasswordChange} disabled={pwLoading} style={{
                width:'100%', background:T.bg2, border:`1px solid ${T.border2}`, color:T.text,
                borderRadius:8, padding:'12px', cursor:pwLoading?'default':'pointer',
                fontFamily:T.font, fontWeight:700, fontSize:14,
                opacity:pwLoading?0.7:1, transition:'all 0.15s',
              }}>{pwLoading?'Updating…':'Update Password'}</button>
            </div>
          )}
        </div>

        {/* ── Account ── */}
        <div style={{ marginTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontFamily:T.mono, fontSize:10, color:T.dim, letterSpacing:'0.12em' }}>ACCOUNT</span>
            <div style={{ flex:1, height:1, background:T.border }}/>
          </div>

          {!logoutConfirm
            ? <button onClick={()=>setLogoutConfirm(true)} style={{
                width:'100%', background:'rgba(248,113,113,0.06)',
                border:'1px solid rgba(248,113,113,0.20)', color:T.error,
                borderRadius:10, padding:'13px', cursor:'pointer',
                fontFamily:T.font, fontWeight:700, fontSize:14, transition:'all 0.15s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,0.06)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            : <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.22)', borderRadius:10, padding:'18px' }}>
                <p style={{ fontFamily:T.font, fontSize:14, color:T.text, textAlign:'center', marginBottom:16, lineHeight:1.5 }}>
                  Sign out of your account?<br/>
                  <span style={{ fontSize:12, color:T.muted }}>You'll need your password to log back in.</span>
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={onLogout} style={{
                    flex:1, background:T.error, border:'none', color:'#fff',
                    borderRadius:8, padding:'11px', cursor:'pointer',
                    fontFamily:T.font, fontWeight:700, fontSize:14,
                  }}>Yes, Sign Out</button>
                  <button onClick={()=>setLogoutConfirm(false)} style={{
                    flex:1, background:'none', border:`1px solid ${T.border}`, color:T.muted,
                    borderRadius:8, padding:'11px', cursor:'pointer',
                    fontFamily:T.font, fontWeight:600, fontSize:14,
                  }}>Cancel</button>
                </div>
              </div>
          }
        </div>

        <div style={{ height:56 }}/>
      </div>
    </div>
  );
}
