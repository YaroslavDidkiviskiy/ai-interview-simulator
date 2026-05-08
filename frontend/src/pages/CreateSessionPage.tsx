import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { createSession } from '../api/client'
import {
  PythonOriginal,
  JavaOriginal,
  KotlinOriginal,
  GoOriginal,
  RustOriginal,
  TypescriptOriginal,
} from 'devicons-react'
import { Users, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

// ─── types ────────────────────────────────────────────────────────────────────

type Category = 'python_backend' | 'hr' | 'java' | 'kotlin' | 'go' | 'rust' | 'typescript'

interface CategoryCard {
  id: Category
  label: string
  icon: React.ReactNode
  available: boolean
  description: string
}

// ─── config ───────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryCard[] = [
  {
    id: 'python_backend',
    label: 'Python Backend',
    icon: <PythonOriginal size={36} />,
    available: true,
    description: 'FastAPI, Django, SQLAlchemy, async',
  },
  {
    id: 'hr',
    label: 'HR Interview',
    icon: <Users size={36} className="text-indigo-400" />,
    available: true,
    description: 'Behavioral, motivation, soft skills',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: <TypescriptOriginal size={36} />,
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'java',
    label: 'Java',
    icon: <JavaOriginal size={36} />,
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    icon: <KotlinOriginal size={36} />,
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'go',
    label: 'Go',
    icon: <GoOriginal size={36} />,
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'rust',
    label: 'Rust',
    icon: <RustOriginal size={36} />,
    available: false,
    description: 'Coming soon',
  },
]

const LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid',    label: 'Mid'    },
  { value: 'senior', label: 'Senior' },
]

const TYPES = [
  { value: 'technical', label: 'Technical' },
  { value: 'mixed',     label: 'Mixed'     },
]

// ─── component ────────────────────────────────────────────────────────────────

export default function CreateSessionPage() {
  const navigate = useNavigate()

  // step 1 — category
  const [category, setCategory] = useState<Category | null>(null)

  // step 2 — config
  const [level,          setLevel         ] = useState('junior')
  const [interviewType,  setInterviewType ] = useState('technical')
  const [totalQuestions, setTotalQuestions] = useState(5)

  const [error,   setError  ] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isHR      = category === 'hr'
  const step      = category === null ? 1 : 2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    setError(null)
    setLoading(true)
    try {
      const session = await createSession({
        role:            isHR ? 'any' : category,
        level:           isHR ? 'any' : level,
        interview_type:  isHR ? 'hr'  : interviewType,
        total_questions: totalQuestions,
      })
      navigate(`/sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* back */}
        {step === 1 ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => { setCategory(null); setError(null) }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* ── STEP 1: category grid ── */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold mb-1">New Interview</h1>
            <p className="text-slate-400 mb-8">Choose what you want to practice.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  disabled={!cat.available}
                  onClick={() => cat.available && setCategory(cat.id)}
                  className={`
                    relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center
                    transition-all duration-200
                    ${cat.available
                      ? 'border-slate-700 bg-slate-800/50 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer'
                      : 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {!cat.available && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                  <div className="mt-1">{cat.icon}</div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{cat.label}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{cat.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: config ── */}
        {step === 2 && category && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0">
                {CATEGORIES.find(c => c.id === category)?.icon}
              </div>
              <h1 className="text-3xl font-bold">
                {CATEGORIES.find(c => c.id === category)?.label}
              </h1>
            </div>
            <p className="text-slate-400 mb-8">Configure your session.</p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">

              {/* Level — only for non-HR */}
              {!isHR && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
                  <div className="flex gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLevel(l.value)}
                        className={`flex-1 pill-btn ${level === l.value ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type — only for non-HR */}
              {!isHR && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Interview Type</label>
                  <div className="flex gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setInterviewType(t.value)}
                        className={`flex-1 pill-btn ${interviewType === t.value ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions count */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Questions:{' '}
                  <span className="text-indigo-400 font-bold tabular-nums">{totalQuestions}</span>
                </label>
                <input
                  type="range" min={1} max={10} value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="relative mt-1.5 h-4 px-1">
                  <span className="absolute left-0 text-xs text-slate-500">1</span>
                  <span className="absolute left-[calc(44.4%)] text-xs text-slate-500">5</span>
                  <span className="absolute right-0 text-xs text-slate-500">10</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Start Interview
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  )
}