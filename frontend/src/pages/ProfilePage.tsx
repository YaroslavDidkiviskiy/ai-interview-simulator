import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { formatRoleLabel, formatTopicLabel } from '../utils/formatDisplay'
import {
  Target, Flame, Star, Globe, Rocket, Calendar,
  AlertTriangle, ChevronRight,
} from 'lucide-react'
import {
  PythonOriginal, JavaOriginal, KotlinOriginal,
  GoOriginal, RustOriginal, TypescriptOriginal,
  CplusplusOriginal, CsharpOriginal,
} from 'devicons-react'
import { Users } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  desc: string
  unlocked: boolean
  icon: string
}

interface RoleStat {
  role: string
  count: number
  avg_score: number
}

interface WeakTopic {
  topic: string
  avg_score: number
  count: number
}

interface ProfileStats {
  total_sessions: number
  completed_sessions: number
  avg_score: number
  role_stats: RoleStat[]
  weak_topics: WeakTopic[]
  activity: Record<string, number>
  achievements: Achievement[]
}

function scoreColor(v: number) {
  if (v >= 8) return '#4ade80'
  if (v >= 5) return '#facc15'
  return '#f87171'
}

function RoleIcon({ role, size = 18 }: { role: string; size?: number }) {
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
  return <>{map[role] ?? <Target size={size} className="text-slate-400" />}</>
}

function AchievementIcon({ id, unlocked }: { id: string; unlocked: boolean }) {
  const color = unlocked ? undefined : '#334155'
  const icons: Record<string, React.ReactNode> = {
    first_blood:   <Target   size={22} color={color ?? '#f87171'} />,
    on_a_roll:     <Flame    size={22} color={color ?? '#fb923c'} />,
    perfectionist: <Star     size={22} color={color ?? '#facc15'} />,
    polyglot:      <Globe    size={22} color={color ?? '#34d399'} />,
    senior_ready:  <Rocket   size={22} color={color ?? '#818cf8'} />,
    consistent:    <Calendar size={22} color={color ?? '#38bdf8'} />,
  }
  return <>{icons[id] ?? <Star size={22} color={color ?? '#94a3b8'} />}</>
}

function ActivityGrid({ activity }: { activity: Record<string, number> }) {
  const days: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({ date: key, count: activity[key] ?? 0 })
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        Activity · last 30 days
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 4 }}>
        {days.map(d => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} session${d.count !== 1 ? 's' : ''}`}
            style={{
              aspectRatio: '1',
              borderRadius: 4,
              background: d.count === 0
                ? '#1e293b'
                : d.count === 1
                  ? '#4f46e570'
                  : d.count === 2
                    ? '#4f46e5'
                    : '#7c3aed',
              cursor: 'default',
              transition: 'transform .1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
          />
        ))}
      </div>
    </div>
  )
}

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w,
      background: '#1e293b', borderRadius: 6,
      animation: 'pulse 1.6s ease-in-out infinite',
    }} />
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    fetch('/api/users/me/stats', {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both }
      `}</style>

      <div className="fu" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          Profile
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{user?.email}</p>
      </div>

      <div className="fu" style={{ animationDelay: '.05s', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total sessions', value: stats?.total_sessions,    color: '#a5b4fc' },
          { label: 'Completed',      value: stats?.completed_sessions, color: '#4ade80' },
          { label: 'Avg score',      value: stats?.avg_score,          color: '#f472b6' },
        ].map(item => (
          <div key={item.label} style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 14, padding: '14px 16px', textAlign: 'center',
          }}>
            {loading ? (
              <Skeleton h={24} w="60%" />
            ) : (
              <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                {item.value ?? 0}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#475569', marginTop: loading ? 8 : 0 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="fu" style={{
        animationDelay: '.1s',
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 16, padding: '20px 24px', marginBottom: 20,
      }}>
        {loading
          ? <Skeleton h={18} w="40%" />
          : <ActivityGrid activity={stats?.activity ?? {}} />
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        <div className="fu" style={{
          animationDelay: '.15s',
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            By role
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={12} />)}
            </div>
          ) : stats?.role_stats.length === 0 ? (
            <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>No completed sessions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats?.role_stats.map(r => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RoleIcon role={r.role} size={16} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                        {formatRoleLabel(r.role)}
                      </span>
                      <span style={{ fontSize: 12, color: scoreColor(r.avg_score), fontWeight: 700 }}>
                        {r.avg_score}
                      </span>
                    </div>
                    <div style={{ height: 3, background: '#1e293b', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${(r.avg_score / 10) * 100}%`,
                        background: scoreColor(r.avg_score),
                        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>×{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fu" style={{
          animationDelay: '.2s',
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <AlertTriangle size={12} color="#f87171" />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Weak zones
            </span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={12} />)}
            </div>
          ) : stats?.weak_topics.length === 0 ? (
            <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>Not enough data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats?.weak_topics.map(t => (
                <div key={t.topic} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                        {formatTopicLabel(t.topic)}
                      </span>
                      <span style={{ fontSize: 12, color: scoreColor(t.avg_score), fontWeight: 700 }}>
                        {t.avg_score}
                      </span>
                    </div>
                    <div style={{ height: 3, background: '#1e293b', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${(t.avg_score / 10) * 100}%`,
                        background: scoreColor(t.avg_score),
                        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>×{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fu" style={{
        animationDelay: '.25s',
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Achievements
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} h={80} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {stats?.achievements.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '14px', borderRadius: 12,
                  border: `1px solid ${a.unlocked ? '#4f46e530' : '#1e293b'}`,
                  background: a.unlocked ? '#1e1b4b20' : '#0f172a',
                  opacity: a.unlocked ? 1 : 0.5,
                  transition: 'all .2s',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <AchievementIcon id={a.id} unlocked={a.unlocked} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.unlocked ? '#e2e8f0' : '#475569', marginBottom: 3 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                  {a.desc}
                </div>
                {a.unlocked && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#6366f1', fontWeight: 600 }}>
                    ✓ Unlocked
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fu" style={{ animationDelay: '.3s', textAlign: 'center' }}>
        <Link
          to="/sessions/create"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', textDecoration: 'none',
            padding: '11px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 20px #4f46e530',
          }}
        >
          New Interview <ChevronRight size={15} />
        </Link>
      </div>
    </Layout>
  )
}