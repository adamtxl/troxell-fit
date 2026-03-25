'use client'
import { useState, useCallback, useTransition } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import type { DayLog, WorkoutLog, UserProfile } from '@/lib/types'

// ── User profiles ─────────────────────────────────────────────────────────────
const USERS: Record<string, UserProfile> = {
  adam: {
    id: 'adam', name: 'Adam', startWeight: 338, goalWeight: 275, startBF: 44,
    proteinMin: 180, proteinGoal: 190, calGoal: 880, waterGoal: 128,
    color: '#c4f135', accentColor: '#5a7a00',
    supplements: [
      { key: 'creatine', label: 'Creatine', dose: '5g daily',    color: '#c4f135' },
      { key: 'zepbound', label: 'Zepbound', dose: 'Weekly shot', color: '#fb923c' },
    ],
    workouts: true,
  },
  tammy: {
    id: 'tammy', name: 'Tammy', startWeight: 355.2, goalWeight: 310, startBF: null,
    proteinMin: 120, proteinGoal: 130, calGoal: 1400, waterGoal: 96,
    color: '#f472b6', accentColor: '#9d174d',
    supplements: [
      { key: 'zepbound', label: 'Zepbound', dose: 'Weekly shot', color: '#fb923c' },
    ],
    workouts: false,
  },
}

const PHASES = [
  { name: 'Phase 1', weeks: '1–3', reps: '5–8',   rest: '3–4 min' },
  { name: 'Phase 2', weeks: '4–6', reps: '8–10',  rest: '2–3 min' },
  { name: 'Phase 3', weeks: '7+',  reps: '10–15', rest: '60–90s'  },
]

const EXERCISES: Record<string, string[]> = {
  'Upper A': ['Bench Press', 'Barbell Row', 'Incline DB Press', 'Cable Row', 'Tricep Pushdown', 'Barbell Curl'],
  'Upper B': ['OHP', 'Lat Pulldown', 'DB Lateral Raise', 'Face Pull', 'Hammer Curl', 'Skull Crusher'],
  'Lower A': ['Back Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl', 'Calf Raise'],
  'Lower B': ['Deadlift', 'Hip Thrust', 'Hack Squat', 'Walking Lunge', 'Seated Leg Curl', 'Seated Calf Raise'],
}

const todayStr = () => new Date().toISOString().split('T')[0]
const C = {
  bg: '#080808', surface: '#111', card: '#181818', border: '#222',
  orange: '#fb923c', red: '#f87171', blue: '#60a5fa', pink: '#f472b6',
  text: '#f0f0f0', sub: '#777', muted: '#333',
}
const F = { mono: "'DM Mono',monospace", display: "'Bebas Neue',cursive", body: "'Barlow',sans-serif" }

function addRollingAvg(logs: DayLog[]) {
  const w = logs.filter(l => l.weight)
  return w.map((entry, i) => {
    const win = w.slice(Math.max(0, i - 6), i + 1)
    const avg = win.reduce((s, l) => s + Number(l.weight), 0) / win.length
    return { ...entry, avg7: +avg.toFixed(1) }
  })
}

function blankLog(userId: string): DayLog {
  return userId === 'adam'
    ? { date: todayStr(), weight: null, body_fat: null, calories: 0, protein: 0, water: 0, sodium: 0, potassium: 0, magnesium: 0, creatine: false, zepbound: false }
    : { date: todayStr(), weight: null, body_fat: null, calories: 0, protein: 0, water: 0, sodium: 0, potassium: 0, magnesium: 0, creatine: false, zepbound: false }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12, ...style }}>{children}</div>
}
function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: F.display, fontSize: 13, color: C.sub, letterSpacing: 2.5, marginBottom: 10 }}>{children}</div>
}
function Bar({ value, max, color, label, sublabel }: { value: number; max: number; color: string; label: string; sublabel: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 12, color: C.text, fontFamily: F.mono }}>{sublabel}</span>
      </div>
      <div style={{ background: C.muted, borderRadius: 3, height: 7 }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 3, transition: 'width 0.35s' }} />
      </div>
    </div>
  )
}
function Stat({ value, unit, label, color }: { value: string | number; unit: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: F.display, fontSize: 30, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 13, color: C.sub }}>{unit}</span></div>
      <div style={{ fontSize: 8, color: C.sub, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 }}>{label}</div>
    </div>
  )
}
function NIn({ label, value, onChange, step = 1, unit = '' }: { label: string; value: number | string; onChange: (v: number) => void; step?: number; unit?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: C.sub, textTransform: 'uppercase', letterSpacing: 1.2, display: 'block', marginBottom: 5 }}>
        {label}{unit && <span style={{ color: C.muted }}> ({unit})</span>}
      </label>
      <input type="number" value={value} step={step} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', color: C.text, fontFamily: F.mono, fontSize: 18, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
interface Props {
  initialAdamData:  { logs: DayLog[]; workouts: WorkoutLog[]; workoutStartDate: string }
  initialTammyData: { logs: DayLog[]; workouts: WorkoutLog[]; workoutStartDate: string }
}

export default function TroxellFit({ initialAdamData, initialTammyData }: Props) {
  const [uid, setUid] = useState<'adam' | 'tammy'>('adam')
  const [tab, setTab] = useState('today')
  const [adamLogs,   setAdamLogs]   = useState<DayLog[]>(initialAdamData.logs)
  const [tammyLogs,  setTammyLogs]  = useState<DayLog[]>(initialTammyData.logs)
  const [adamWLogs,  setAdamWLogs]  = useState<WorkoutLog[]>(initialAdamData.workouts)
  const [tammyWLogs, setTammyWLogs] = useState<WorkoutLog[]>(initialTammyData.workouts)
  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(null)
  const [wType, setWType] = useState('Upper A')
  const [, startTransition] = useTransition()

  const user     = USERS[uid]
  const allLogs  = uid === 'adam' ? adamLogs  : tammyLogs
  const wLogs    = uid === 'adam' ? adamWLogs : tammyWLogs
  const setLogs  = uid === 'adam' ? setAdamLogs  : setTammyLogs
  const setWLogs = uid === 'adam' ? setAdamWLogs : setTammyWLogs
  const wsd      = uid === 'adam' ? initialAdamData.workoutStartDate : initialTammyData.workoutStartDate

  const today    = todayStr()
  const todayLog = allLogs.find(l => l.date === today) || blankLog(uid)

  const week     = Math.max(1, Math.ceil((new Date().getTime() - new Date(wsd).getTime()) / 604800000))
  const phase    = week <= 3 ? PHASES[0] : week <= 6 ? PHASES[1] : PHASES[2]
  const daysLeft = Math.max(0, Math.ceil((new Date('2026-04-21').getTime() - new Date().getTime()) / 86400000))

  const saveLog = useCallback(async (updated: DayLog) => {
    const newLogs = [...allLogs.filter(l => l.date !== updated.date), updated].sort((a, b) => a.date.localeCompare(b.date))
    setLogs(newLogs)
    startTransition(async () => {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: uid, ...updated }),
      })
    })
  }, [uid, allLogs, setLogs])

  const saveWorkout = useCallback(async (w: WorkoutLog) => {
    const newWLogs = [...wLogs.filter(x => x.date !== w.date), w].sort((a, b) => a.date.localeCompare(b.date))
    setWLogs(newWLogs)
    setActiveWorkout(null)
    startTransition(async () => {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: uid, ...w }),
      })
    })
  }, [uid, wLogs, setWLogs])

  const tabs = [
    { id: 'today',     icon: '◉', label: 'TODAY'    },
    { id: 'nutrition', icon: '⬡', label: 'NUTRITION' },
    ...(user.workouts ? [{ id: 'workout', icon: '◈', label: 'WORKOUT' }] : []),
    { id: 'progress',  icon: '▲', label: 'PROGRESS'  },
  ]

  const styleBlock = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
    input[type=number]{-moz-appearance:textfield;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
    .tf-app{display:flex;min-height:100vh;background:#080808;font-family:'Barlow',sans-serif;}
    .tf-sidebar{display:none;}
    .tf-main{flex:1;max-width:480px;margin:0 auto;padding-bottom:72px;width:100%;}
    .tf-mobile-header{display:flex;align-items:center;justify-content:space-between;background:#111;border-bottom:1px solid #222;padding:10px 14px;position:sticky;top:0;z-index:20;}
    .tf-bottom-nav{display:flex;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;border-top:1px solid #222;z-index:20;}
    .tf-content{padding:16px;}
    @media(min-width:768px){
      .tf-sidebar{display:flex;flex-direction:column;width:220px;min-height:100vh;position:fixed;top:0;left:0;background:#111;border-right:1px solid #222;padding:28px 18px;z-index:30;gap:6px;}
      .tf-main{max-width:none;margin-left:220px;padding-bottom:32px;width:calc(100% - 220px);}
      .tf-mobile-header{display:none;}
      .tf-bottom-nav{display:none;}
      .tf-content{padding:28px 32px;max-width:960px;}
    }
  `

  return (
    <>
      <style>{styleBlock}</style>
      <div className="tf-app">

        {/* Sidebar — desktop only */}
        <aside className="tf-sidebar">
          <div style={{ fontFamily: F.display, fontSize: 24, letterSpacing: 3, color: user.color, marginBottom: 6 }}>TROXELL FIT</div>
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 2, gap: 2, marginBottom: 20 }}>
            {Object.values(USERS).map(u => (
              <button key={u.id} onClick={() => { setUid(u.id as 'adam' | 'tammy'); setTab('today'); setActiveWorkout(null) }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 16, border: 'none', background: uid === u.id ? u.color : 'transparent', color: uid === u.id ? '#000' : C.sub, cursor: 'pointer', fontFamily: F.display, fontSize: 13, letterSpacing: 1.5, transition: 'all 0.15s' }}>
                {u.name.toUpperCase()}
              </button>
            ))}
          </div>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${tab === t.id ? user.color + '40' : 'transparent'}`, background: tab === t.id ? user.color + '14' : 'none', cursor: 'pointer', fontFamily: F.display, fontSize: 16, letterSpacing: 2, color: tab === t.id ? user.color : C.sub, transition: 'all 0.15s', textAlign: 'left' }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: F.mono, fontSize: 28, color: daysLeft <= 14 ? C.orange : C.text, lineHeight: 1 }}>{daysLeft}<span style={{ fontSize: 14, color: C.sub }}>d</span></div>
            <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3 }}>to cruise · apr 21</div>
          </div>
        </aside>

        {/* Main content */}
        <div className="tf-main">
          <div className="tf-mobile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: F.display, fontSize: 20, color: user.color, letterSpacing: 3 }}>TROXELL FIT</span>
              <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 2, gap: 2 }}>
                {Object.values(USERS).map(u => (
                  <button key={u.id} onClick={() => { setUid(u.id as 'adam' | 'tammy'); setTab('today'); setActiveWorkout(null) }}
                    style={{ padding: '4px 12px', borderRadius: 16, border: 'none', background: uid === u.id ? u.color : 'transparent', color: uid === u.id ? '#000' : C.sub, cursor: 'pointer', fontFamily: F.display, fontSize: 13, letterSpacing: 1.5, transition: 'all 0.15s' }}>
                    {u.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, color: daysLeft <= 14 ? C.orange : C.text, lineHeight: 1 }}>{daysLeft}d</div>
              <div style={{ fontSize: 8, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>cruise · apr 21</div>
            </div>
          </div>

          <div className="tf-content">
            {tab === 'today'     && <TodayTab     log={todayLog} save={saveLog} user={user} phase={phase} week={week} daysLeft={daysLeft} allLogs={allLogs} />}
            {tab === 'nutrition' && <NutritionTab log={todayLog} save={saveLog} user={user} />}
            {tab === 'workout'   && <WorkoutTab   workoutLogs={wLogs} save={saveWorkout} active={activeWorkout} setActive={setActiveWorkout} wType={wType} setWType={setWType} phase={phase} week={week} />}
            {tab === 'progress'  && <ProgressTab  allLogs={allLogs} workoutLogs={wLogs} user={user} adamLogs={adamLogs} tammyLogs={tammyLogs} />}
          </div>
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="tf-bottom-nav">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 4px 7px', background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? user.color : C.muted, transition: 'color 0.15s' }}>
              <div style={{ fontSize: 17, lineHeight: 1 }}>{t.icon}</div>
              <div style={{ fontSize: 8, letterSpacing: 1.5, fontWeight: 600, marginTop: 2 }}>{t.label}</div>
            </button>
          ))}
        </nav>

      </div>
    </>
  )
}

// ── Today Tab ──────────────────────────────────────────────────────────────────
function TodayTab({ log, save, user, phase, week, daysLeft, allLogs }: { log: DayLog; save: (l: DayLog) => void; user: UserProfile; phase: typeof PHASES[0]; week: number; daysLeft: number; allLogs: DayLog[] }) {
  const last = [...allLogs].reverse().find(l => l.weight)
  const curW = last ? Number(last.weight) : user.startWeight
  const lost = +(user.startWeight - curW).toFixed(1)
  const toGo = +(curW - user.goalWeight).toFixed(1)
  const pct  = Math.min(100, Math.round(((user.startWeight - curW) / (user.startWeight - user.goalWeight)) * 100))

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#111)', border: `1px solid ${user.accentColor}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 12, color: user.accentColor, letterSpacing: 2.5 }}>CELEBRITY SOLSTICE</div>
          <div style={{ fontFamily: F.display, fontSize: 24, color: user.color, letterSpacing: 1.5, lineHeight: 1.15 }}>APRIL 21 · {daysLeft} DAYS</div>
          <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>Hawaii / Alaska Repositioning</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: F.display, fontSize: 40, color: user.color, lineHeight: 1 }}>{pct}<span style={{ fontSize: 16 }}>%</span></div>
          <div style={{ fontSize: 8, color: C.sub, letterSpacing: 1.5, textTransform: 'uppercase' }}>to goal</div>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 }}>
          <Stat value={user.startWeight}                   unit=" lbs" label="Start"   color={C.sub} />
          <Stat value={curW}                               unit=" lbs" label="Current" color={C.text} />
          <Stat value={lost >= 0 ? `-${lost}` : '0'}      unit=" lbs" label="Lost"    color={user.color} />
          <Stat value={toGo > 0 ? toGo : '✓'}             unit={toGo > 0 ? ' lbs' : ''} label="To Go" color={toGo > 0 ? C.orange : user.color} />
        </div>
        <Bar value={Math.max(0, user.startWeight - curW)} max={user.startWeight - user.goalWeight} label="Goal progress" sublabel={`${user.startWeight} → ${user.goalWeight} lbs`} color={user.color} />
      </Card>

      <Card>
        <SL>TODAY'S NUTRITION</SL>
        <Bar value={log.protein}  max={user.proteinGoal} label="Protein"  sublabel={`${log.protein}g / ${user.proteinMin}–${user.proteinGoal}g`} color={log.protein >= user.proteinMin ? user.color : C.orange} />
        <Bar value={log.calories} max={user.calGoal}     label="Calories" sublabel={`${log.calories} / ${user.calGoal} kcal`} color={log.calories > user.calGoal ? C.red : C.blue} />
        <Bar value={log.water}    max={user.waterGoal}   label="Water"    sublabel={`${log.water} / ${user.waterGoal} oz`} color={C.blue} />
      </Card>

      <Card>
        <SL>SUPPLEMENTS</SL>
        {user.supplements.map(s => (
          <div key={s.key} onClick={() => save({ ...log, [s.key]: !log[s.key as keyof DayLog] })}
            style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${log[s.key as keyof DayLog] ? s.color : C.muted}`, background: log[s.key as keyof DayLog] ? s.color : 'transparent', marginRight: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {log[s.key as keyof DayLog] && <span style={{ color: '#000', fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{s.dose}</div>
            </div>
            <div style={{ fontSize: 11, color: log[s.key as keyof DayLog] ? s.color : C.muted, letterSpacing: 1.5, fontWeight: 600 }}>
              {log[s.key as keyof DayLog] ? 'DONE ✓' : 'TODO'}
            </div>
          </div>
        ))}
      </Card>

      {user.workouts && (
        <Card style={{ background: 'linear-gradient(135deg,#0d0d0d,#131313)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 24, color: user.color, letterSpacing: 2 }}>{phase.name}</div>
              <div style={{ fontSize: 12, color: C.sub }}>Week {week} · Weeks {phase.weeks}</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Reps</div><div style={{ fontFamily: F.mono, color: C.text, fontSize: 14 }}>{phase.reps}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Rest</div><div style={{ fontFamily: F.mono, color: C.text, fontSize: 14 }}>{phase.rest}</div></div>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

// ── Nutrition Tab ──────────────────────────────────────────────────────────────
function NutritionTab({ log, save, user }: { log: DayLog; save: (l: DayLog) => void; user: UserProfile }) {
  const [local, setLocal] = useState<DayLog>({ ...log })
  const upd = (k: keyof DayLog, v: unknown) => setLocal(p => ({ ...p, [k]: v }))

  return (
    <>
      <div style={{ fontFamily: F.display, fontSize: 22, color: user.color, letterSpacing: 3, marginBottom: 12 }}>NUTRITION LOG</div>
      <Card>
        <SL>BODY METRICS</SL>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NIn label="Weight"   value={local.weight   ?? ''} onChange={v => upd('weight', v)}   step={0.1} unit="lbs" />
          <NIn label="Body Fat" value={local.body_fat ?? ''} onChange={v => upd('body_fat', v)} step={0.1} unit="%" />
        </div>
      </Card>
      <Card>
        <SL>MACROS</SL>
        <Bar value={local.protein} max={user.proteinGoal} label="Protein" sublabel={`${local.protein}g / ${user.proteinMin}–${user.proteinGoal}g`} color={local.protein >= user.proteinMin ? user.color : C.orange} />
        <NIn label="Protein"  value={local.protein}  onChange={v => upd('protein', v)}  unit="g" />
        <Bar value={local.calories} max={user.calGoal} label="Calories" sublabel={`${local.calories} / ${user.calGoal} kcal`} color={local.calories > user.calGoal ? C.red : C.blue} />
        <NIn label="Calories" value={local.calories} onChange={v => upd('calories', v)} unit="kcal" />
      </Card>
      <Card>
        <SL>HYDRATION</SL>
        <Bar value={local.water} max={user.waterGoal} label="Water" sublabel={`${local.water} / ${user.waterGoal} oz`} color={C.blue} />
        <NIn label="Water" value={local.water} onChange={v => upd('water', v)} unit="oz" />
      </Card>
      {user.id === 'adam' && (
        <Card>
          <SL>ELECTROLYTES</SL>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <NIn label="Sodium"    value={local.sodium    || 0} onChange={v => upd('sodium', v)}    unit="mg" />
            <NIn label="Potassium" value={local.potassium || 0} onChange={v => upd('potassium', v)} unit="mg" />
            <NIn label="Magnesium" value={local.magnesium || 0} onChange={v => upd('magnesium', v)} unit="mg" />
          </div>
        </Card>
      )}
      <Card>
        <SL>SUPPLEMENTS</SL>
        {user.supplements.map(s => (
          <div key={s.key} onClick={() => upd(s.key as keyof DayLog, !local[s.key as keyof DayLog])}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${local[s.key as keyof DayLog] ? s.color : C.muted}`, background: local[s.key as keyof DayLog] ? s.color : 'transparent', marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {local[s.key as keyof DayLog] && <span style={{ color: '#000', fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ color: local[s.key as keyof DayLog] ? C.text : C.sub, fontWeight: 500 }}>{s.label} <span style={{ color: C.muted, fontSize: 12 }}>· {s.dose}</span></span>
          </div>
        ))}
      </Card>
      <button onClick={() => save(local)} style={{ width: '100%', padding: 14, background: user.color, border: 'none', borderRadius: 8, fontFamily: F.display, fontSize: 18, letterSpacing: 3, cursor: 'pointer', color: '#000', marginBottom: 8 }}>
        SAVE TODAY'S LOG
      </button>
    </>
  )
}

// ── Workout Tab ────────────────────────────────────────────────────────────────
function WorkoutTab({ workoutLogs, save, active, setActive, wType, setWType, phase, week }: {
  workoutLogs: WorkoutLog[]; save: (w: WorkoutLog) => void; active: WorkoutLog | null;
  setActive: (w: WorkoutLog | null) => void; wType: string; setWType: (t: string) => void;
  phase: typeof PHASES[0]; week: number
}) {
  const today       = todayStr()
  const todayLogged = workoutLogs.find(w => w.date === today)
  const allEx       = [...new Set(Object.values(EXERCISES).flat())]

  function start() {
    setActive({ date: today, type: wType, phase: phase.name, exercises: EXERCISES[wType].map(name => ({ name, sets: [{ reps: '', weight: '' }] })) })
  }
  function addSet(ei: number) {
    if (!active) return
    setActive({ ...active, exercises: active.exercises.map((ex, i) => i !== ei ? ex : { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] }) })
  }
  function updSet(ei: number, si: number, f: 'reps' | 'weight', v: string) {
    if (!active) return
    setActive({ ...active, exercises: active.exercises.map((ex, i) => i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== si ? s : { ...s, [f]: v }) }) })
  }
  function addEx(name: string) {
    if (!active || active.exercises.find(e => e.name === name)) return
    setActive({ ...active, exercises: [...active.exercises, { name, sets: [{ reps: '', weight: '' }] }] })
  }

  if (active) {
    const done  = active.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.reps && s.weight).length, 0)
    const total = active.exercises.reduce((n, ex) => n + ex.sets.length, 0)
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 26, color: '#c4f135', letterSpacing: 2 }}>{active.type}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{phase.name} · {phase.reps} reps · {phase.rest} rest</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: C.sub }}>{done}/{total}</span>
            <button onClick={() => save(active)} style={{ background: '#c4f135', border: 'none', borderRadius: 7, padding: '9px 18px', fontFamily: F.display, fontSize: 15, letterSpacing: 2, cursor: 'pointer', color: '#000' }}>DONE</button>
          </div>
        </div>
        {active.exercises.map((ex, ei) => (
          <Card key={ei}>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 10, fontSize: 15 }}>{ex.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>LBS</div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>REPS</div>
              <div style={{ width: 22 }} />
            </div>
            {ex.sets.map((s, si) => (
              <div key={si} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input type="number" placeholder="0" value={s.weight} onChange={e => updSet(ei, si, 'weight', e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '9px', color: C.text, fontFamily: F.mono, fontSize: 17, textAlign: 'center', width: '100%', outline: 'none' }} />
                <input type="number" placeholder="0" value={s.reps}   onChange={e => updSet(ei, si, 'reps', e.target.value)}   style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '9px', color: C.text, fontFamily: F.mono, fontSize: 17, textAlign: 'center', width: '100%', outline: 'none' }} />
                <div style={{ width: 22, height: 22, borderRadius: 4, background: s.reps && s.weight ? '#c4f135' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: s.reps && s.weight ? '#000' : C.sub, transition: 'background 0.2s' }}>{s.reps && s.weight ? '✓' : si + 1}</div>
              </div>
            ))}
            <button onClick={() => addSet(ei)} style={{ background: 'none', border: `1px dashed ${C.muted}`, borderRadius: 5, padding: '6px', width: '100%', color: C.sub, cursor: 'pointer', fontSize: 11, letterSpacing: 1.5 }}>+ ADD SET</button>
          </Card>
        ))}
        <Card>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Add exercise</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allEx.filter(e => !active.exercises.find(ae => ae.name === e)).map(e => (
              <button key={e} onClick={() => addEx(e)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 10px', color: C.sub, cursor: 'pointer', fontSize: 12 }}>{e}</button>
            ))}
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <div style={{ fontFamily: F.display, fontSize: 22, color: '#c4f135', letterSpacing: 3, marginBottom: 12 }}>WORKOUT LOG</div>
      <Card style={{ background: 'linear-gradient(135deg,#0d0d0d,#131313)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 28, color: '#c4f135', letterSpacing: 2, lineHeight: 1 }}>{phase.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>Week {week} · Weeks {phase.weeks}</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Reps</div><div style={{ fontFamily: F.mono, color: C.text, fontSize: 15 }}>{phase.reps}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Rest</div><div style={{ fontFamily: F.mono, color: C.text, fontSize: 15 }}>{phase.rest}</div></div>
          </div>
        </div>
      </Card>
      {todayLogged && (
        <Card style={{ border: '1px solid #5a7a00' }}>
          <div style={{ color: '#c4f135', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>✓ Logged today: {todayLogged.type}</div>
          {todayLogged.exercises.map((ex, i) => (
            <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ color: C.text, fontSize: 13 }}>{ex.name}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                {ex.sets.filter(s => s.weight && s.reps).map((s, si) => (
                  <span key={si} style={{ fontSize: 11, color: C.sub, fontFamily: F.mono, background: C.surface, padding: '2px 7px', borderRadius: 3 }}>{s.weight}×{s.reps}</span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
      <Card>
        <div style={{ fontSize: 11, color: C.sub, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Select Split</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {Object.keys(EXERCISES).map(t => (
            <button key={t} onClick={() => setWType(t)} style={{ padding: '10px', borderRadius: 7, border: `2px solid ${wType === t ? '#c4f135' : C.border}`, background: wType === t ? '#c4f13518' : C.surface, color: wType === t ? '#c4f135' : C.sub, cursor: 'pointer', fontFamily: F.display, fontSize: 16, letterSpacing: 1.5, transition: 'all 0.15s' }}>{t}</button>
          ))}
        </div>
        <div style={{ marginBottom: 12, fontSize: 11, color: C.sub, lineHeight: 1.6 }}>{EXERCISES[wType].join(' · ')}</div>
        <button onClick={start} style={{ width: '100%', padding: 14, background: '#c4f135', border: 'none', borderRadius: 8, fontFamily: F.display, fontSize: 18, letterSpacing: 3, cursor: 'pointer', color: '#000' }}>START {wType}</button>
      </Card>
      {workoutLogs.length > 0 && (
        <Card>
          <SL>RECENT SESSIONS</SL>
          {[...workoutLogs].reverse().slice(0, 6).map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div><div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{w.type}</div><div style={{ fontSize: 11, color: C.sub }}>{w.phase} · {w.exercises.length} ex · {w.exercises.reduce((n, e) => n + e.sets.filter(s => s.reps && s.weight).length, 0)} sets</div></div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: C.muted }}>{w.date.slice(5)}</div>
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

// ── Progress Tab ───────────────────────────────────────────────────────────────
function ProgressTab({ allLogs, workoutLogs, user, adamLogs, tammyLogs }: {
  allLogs: DayLog[]; workoutLogs: WorkoutLog[]; user: UserProfile; adamLogs: DayLog[]; tammyLogs: DayLog[]
}) {
  const [showBoth, setShowBoth] = useState(false)
  const chartData = addRollingAvg(allLogs.filter(l => l.weight))

  const bothData = (() => {
    const al = addRollingAvg(adamLogs.filter(l => l.weight))
    const tl = addRollingAvg(tammyLogs.filter(l => l.weight))
    const dm: Record<string, { date: string; adam?: number; adamAvg?: number; tammy?: number; tammyAvg?: number }> = {}
    al.forEach(l => { dm[l.date] = { ...dm[l.date], date: l.date.slice(5), adam: l.weight ?? undefined, adamAvg: l.avg7 } })
    tl.forEach(l => { dm[l.date] = { ...dm[l.date], date: l.date.slice(5), tammy: l.weight ?? undefined, tammyAvg: l.avg7 } })
    return Object.values(dm).sort((a, b) => a.date.localeCompare(b.date))
  })()

  const last     = [...allLogs].reverse().find(l => l.weight)
  const curW     = last ? Number(last.weight) : user.startWeight
  const lost     = +(user.startWeight - curW).toFixed(1)
  const toGo     = +(curW - user.goalWeight).toFixed(1)
  const protDays = allLogs.filter(l => l.protein >= user.proteinMin).length
  const calDays  = allLogs.filter(l => l.calories > 0 && l.calories <= user.calGoal).length
  const avgProt  = allLogs.filter(l => l.protein > 0).length
    ? Math.round(allLogs.filter(l => l.protein > 0).reduce((s, l) => s + l.protein, 0) / allLogs.filter(l => l.protein > 0).length)
    : 0

  const stats = [
    { label: 'Lost',         value: lost,                     unit: 'lbs', color: user.color },
    { label: 'To Go',        value: toGo > 0 ? toGo : '✓',   unit: toGo > 0 ? 'lbs' : '', color: toGo > 0 ? C.orange : user.color },
    { label: 'Protein Days', value: protDays,                 unit: '',    color: C.blue },
    ...(user.workouts ? [{ label: 'Workouts', value: workoutLogs.length, unit: '', color: user.color }] : []),
    { label: 'Cal Days OK',  value: calDays,                  unit: '',    color: C.blue },
    { label: 'Avg Protein',  value: avgProt,                  unit: 'g',   color: C.text },
  ]

  const tt = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11 }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: F.display, fontSize: 22, color: user.color, letterSpacing: 3 }}>PROGRESS</div>
        <button onClick={() => setShowBoth(b => !b)} style={{ background: showBoth ? user.color : C.card, border: `1px solid ${showBoth ? user.color : C.border}`, borderRadius: 16, padding: '5px 14px', color: showBoth ? '#000' : C.sub, cursor: 'pointer', fontSize: 11, letterSpacing: 1.5, transition: 'all 0.15s' }}>
          {showBoth ? 'BOTH ✓' : 'COMPARE'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}<span style={{ fontSize: 11 }}>{s.unit}</span></div>
            <div style={{ fontSize: 8, color: C.sub, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <SL>{showBoth ? 'ADAM & TAMMY — WEIGHT + 7-DAY AVG' : `${user.name.toUpperCase()} — WEIGHT + 7-DAY AVG`}</SL>
        {(showBoth ? bothData.length > 1 : chartData.length > 1) ? (
          <ResponsiveContainer width="100%" height={210}>
            {showBoth ? (
              <LineChart data={bothData} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.sub, fontSize: 8 }} interval={6} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: C.sub, fontSize: 8 }} />
                <Tooltip contentStyle={tt} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: C.sub }} />
                <ReferenceLine y={USERS.adam.goalWeight}  stroke="#5a7a00" strokeDasharray="4 3" label={{ value: 'A', fill: '#5a7a00', fontSize: 8 }} />
                <ReferenceLine y={USERS.tammy.goalWeight} stroke="#9d174d" strokeDasharray="4 3" label={{ value: 'T', fill: C.pink,    fontSize: 8 }} />
                <Line type="monotone" dataKey="adam"     name="Adam"     stroke="#c4f135" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="adamAvg"  name="Adam 7d"  stroke="#c4f135" strokeWidth={2.5} dot={false} strokeDasharray="5 3" strokeOpacity={0.6} />
                <Line type="monotone" dataKey="tammy"    name="Tammy"    stroke={C.pink}  strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="tammyAvg" name="Tammy 7d" stroke={C.pink}  strokeWidth={2.5} dot={false} strokeDasharray="5 3" strokeOpacity={0.6} />
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.sub, fontSize: 8 }} interval={6} tickFormatter={(v: string) => v?.slice(5) ?? v} />
                <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fill: C.sub, fontSize: 8 }} />
                <Tooltip contentStyle={tt} formatter={(v: unknown, n: string) => [v, n === 'avg7' ? '7d avg' : 'weight']} />
                <ReferenceLine y={user.goalWeight} stroke={user.accentColor} strokeDasharray="5 3" label={{ value: 'GOAL', fill: user.accentColor, fontSize: 8 }} />
                <Line type="monotone" dataKey="weight" name="weight" stroke={user.color} strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="avg7"   name="7d avg" stroke={user.color} strokeWidth={2.5} dot={false} strokeDasharray="5 3" strokeOpacity={0.65} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>Log your weight to build the chart</div>
        )}
      </Card>

      {allLogs.filter(l => l.weight).length > 0 && (
        <Card>
          <SL>WEIGHT LOG</SL>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
            {['Date', 'Weight', '7d Avg', 'BF%', 'Δ'].map(h => (
              <div key={h} style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>{h}</div>
            ))}
          </div>
          {(() => {
            const wa = addRollingAvg(allLogs.filter(l => l.weight))
            return [...wa].reverse().slice(0, 20).map((l, i, arr) => {
              const prev  = arr[i + 1]
              const raw   = prev ? Number(l.weight) - Number(prev.weight) : null
              const delta = raw !== null ? raw.toFixed(1) : '—'
              const dc    = raw === null ? C.muted : raw < 0 ? '#c4f135' : C.red
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 4, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.sub,  textAlign: 'center', fontFamily: F.mono }}>{l.date.slice(5)}</div>
                  <div style={{ fontSize: 12, color: C.text, textAlign: 'center', fontFamily: F.mono }}>{l.weight}</div>
                  <div style={{ fontSize: 11, color: user.color, textAlign: 'center', fontFamily: F.mono }}>{l.avg7}</div>
                  <div style={{ fontSize: 12, color: C.sub,  textAlign: 'center', fontFamily: F.mono }}>{l.body_fat ?? '—'}</div>
                  <div style={{ fontSize: 12, color: dc,     textAlign: 'center', fontFamily: F.mono }}>{raw !== null && raw > 0 ? `+${delta}` : delta}</div>
                </div>
              )
            })
          })()}
        </Card>
      )}
    </>
  )
}
