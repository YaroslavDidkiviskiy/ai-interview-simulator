import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  formatRoleLabel, formatLevelLabel,
  formatInterviewTypeLabel, formatSessionStatus,
} from '../utils/formatDisplay'
import {
  PythonOriginal, JavaOriginal, KotlinOriginal,
  GoOriginal, RustOriginal, TypescriptOriginal,
  CplusplusOriginal, CsharpOriginal,
} from 'devicons-react'
import {
  Users, CheckCircle2, Clock, ChevronRight,
  BarChart2, Zap, Calendar, MessageSquare, Plus,
} from 'lucide-react'
import { Session, getMySessions } from '../api/client'

function RoleIcon({ role, size = 20 }: { role: string; size?: number }) {
  const map: Record<string, React.ReactNode> = {
    python_backend: <PythonOriginal size={size} />,
    java:           <JavaOriginal size={size} />,
    kotlin:         <KotlinOriginal size={size} />,
    go:             <GoOriginal size={size} />,
    rust:           <RustOriginal size={size} />,
    typescript:     <TypescriptOriginal size={size} />,
    cpp:            <CplusplusOriginal size={size} />,
    csharp:         <CsharpOriginal size={size} />,
    hr:             <Users size={size} className="text-indigo-400" />,
    any:            <Users size={size} className="text-indigo-400" />,
  }
  return <>{map[role] ?? <Zap size={size} className="text-slate-400" />}</>
}

function scoreColor(v: number) {
  if (v >= 8) return '#4ade80'
  if (v >= 5) return '#facc15'
  return '#f87171'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function MiniRing({ value }: { value: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const color = scoreColor(value)
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#1e293b" strokeWidth="3.5" />
      <circle
        cx="18" cy="18" r={r} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value / 10)}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={color}>
        {value}
      </text>
    </svg>
  )
}

function SessionCard({ session }: { session: Session }) {
  const isCompleted = session.status === 'completed'
  const answered = isCompleted ? session.total_questions : session.current_question_index
  const progress = Math.round((answered / session.total_questions) * 100)
  const level = formatLevelLabel(session.level)

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block"
      style={{
        textDecoration: 'none',
        background: 'linear-gradient(135deg,#0f172a 0%,#0c1120 100%)',
        border: '1px solid #1e293b', borderRadius: 18, padding: '20px 24px',
        transition: 'border-color .2s, transform .15s, box-shadow .2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = '#4f46e550'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 32px #4f46e515'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = '#1e293b'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RoleIcon role={session.role} size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 3 }}>
              {formatRoleLabel(session.role)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {level && (
                <>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{level}</span>
                  <span style={{ color: '#334155', fontSize: 10 }}>·</span>
                </>
              )}
              <span style={{ fontSize: 12, color: '#64748b' }}>{formatInterviewTypeLabel(session.interview_type)}</span>
              <span style={{ color: '#334155', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                <MessageSquare style={{ width: 10, height: 10 }} />
                {session.total_questions} questions
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isCompleted && session.final_score != null && <MiniRing value={session.final_score} />}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: isCompleted ? '#052e1640' : '#1e1b4b40',
            color: isCompleted ? '#4ade80' : '#a5b4fc',
            border: `1px solid ${isCompleted ? '#4ade8030' : '#6366f130'}`,
          }}>
            {isCompleted ? <CheckCircle2 style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
            {formatSessionStatus(session.status)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 5 }}>
          <span>Progress</span>
          <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
            {answered} / {session.total_questions}
          </span>
        </div>
        <div style={{ height: 4, background: '#0f172a', borderRadius: 999, overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{
            height: '100%',
            width: `${isCompleted ? 100 : progress}%`,
            background: isCompleted ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : 'linear-gradient(90deg,#4f46e5,#7c3aed)',
            borderRadius: 999, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
          <Calendar style={{ width: 11, height: 11 }} />
          <span>{formatDate(session.started_at)}</span>
          <span style={{ color: '#334155' }}>·</span>
          <span>{formatTime(session.started_at)}</span>
          {session.completed_at && (
            <>
              <span style={{ color: '#334155', margin: '0 2px' }}>→</span>
              <span>{formatTime(session.completed_at)}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
          {isCompleted ? 'Review' : 'Continue'}
          <ChevronRight style={{ width: 13, height: 13 }} />
        </div>
      </div>
    </Link>
  )
}

function StatsStrip({ sessions }: { sessions: Session[] }) {
  const completed = sessions.filter(s => s.status === 'completed').length
  const active    = sessions.filter(s => s.status !== 'completed').length
  const scores    = sessions.filter(s => s.final_score != null).map(s => s.final_score!)
  const avg       = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
      {[
        { label: 'Total',       value: sessions.length, color: '#a5b4fc' },
        { label: 'Completed',   value: completed,        color: '#4ade80' },
        { label: 'In progress', value: active,           color: '#facc15' },
        { label: 'Avg score',   value: avg,              color: '#f472b6' },
      ].map(item => (
        <div key={item.label} style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 14, padding: '14px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
            {item.value}
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: '#1e1b4b40', border: '1px solid #4f46e530',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <BarChart2 style={{ width: 24, height: 24, color: '#6366f1' }} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>No sessions yet</h3>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>Start your first mock interview to track your progress here.</p>
      <Link to="/sessions/create" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', textDecoration: 'none',
        padding: '10px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px #4f46e530',
      }}>
        Start Interview <ChevronRight style={{ width: 15, height: 15 }} />
      </Link>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 18, padding: '20px 24px' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      {[70, 50, 100].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 16 : 10, width: `${w}%`, background: '#1e293b', borderRadius: 6,
          marginBottom: i === 2 ? 0 : 10, animation: 'pulse 1.6s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  )
}

type FilterStatus = 'all' | 'active' | 'completed'

function FilterBar({ current, onChange }: { current: FilterStatus; onChange: (f: FilterStatus) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {([
        { value: 'all',       label: 'All' },
        { value: 'active',    label: 'In progress' },
        { value: 'completed', label: 'Completed' },
      ] as { value: FilterStatus; label: string }[]).map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: '1px solid',
            borderColor: current === opt.value ? '#4f46e5' : '#1e293b',
            background:  current === opt.value ? '#4f46e520' : 'transparent',
            color:       current === opt.value ? '#a5b4fc' : '#475569',
            cursor: 'pointer', transition: 'all .15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const LIMIT = 20

export default function DashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterStatus>('all')
  const [page, setPage]         = useState(1)

  useEffect(() => {
    setLoading(true)
    getMySessions(page, LIMIT)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [page])

  const filtered = sessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed'
    if (filter === 'active')    return s.status !== 'completed'
    return true
  })

  return (
    <Layout>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both }
      `}</style>

      <div className="fu" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            My Sessions
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{user?.email}</p>
        </div>
        <Link to="/sessions/create" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', textDecoration: 'none',
          padding: '9px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px #4f46e530',
        }}>
          <Plus style={{ width: 14, height: 14 }} /> New Interview
        </Link>
      </div>

      {!loading && sessions.length > 0 && (
        <div className="fu" style={{ animationDelay: '.05s' }}>
          <StatsStrip sessions={sessions} />
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <FilterBar current={filter} onChange={setFilter} />
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 14 }}>
          No sessions match this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="fu" style={{ animationDelay: `${i * 0.04}s` }}>
              <SessionCard session={s} />
            </div>
          ))}
        </div>
      )}

      {!loading && sessions.length === LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {page > 1 && (
            <button onClick={() => setPage(p => p - 1)} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            }}>← Prev</button>
          )}
          <button onClick={() => setPage(p => p + 1)} style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '1px solid #4f46e5', background: '#4f46e520', color: '#a5b4fc', cursor: 'pointer',
          }}>Next →</button>
        </div>
      )}
    </Layout>
  )
}