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
  CplusplusOriginal,
  CsharpOriginal,
} from 'devicons-react'
import { Users, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

// ─── types ────────────────────────────────────────────────────────────────────
 type Category =
  | 'python_backend'
  | 'hr'
  | 'java'
  | 'kotlin'
  | 'go'
  | 'rust'
  | 'typescript'
  | 'cpp'
  | 'csharp'

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
    available: true,
    description: 'Types, generics, async patterns',
  },
  {
    id: 'java',
    label: 'Java',
    icon: <JavaOriginal size={36} />,
    available: true,
    description: 'OOP, Spring, multithreading',
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    icon: <KotlinOriginal size={36} />,
    available: true,
    description: 'Coroutines, Android, OOP',
  },
  {
    id: 'go',
    label: 'Go',
    icon: <GoOriginal size={36} />,
    available: true,
    description: 'Concurrency, REST, Docker',
  },
  {
    id: 'rust',
    label: 'Rust',
    icon: <RustOriginal size={36} />,
    available: true,
    description: 'Ownership, memory, systems',
  },
  {
    id: 'cpp',
    label: 'C++',
    icon: <CplusplusOriginal size={36} />,
    available: true,
    description: 'Memory, OOP, STL',
  },
  {
    id: 'csharp',
    label: 'C#',
    icon: <CsharpOriginal size={36} />,
    available: true,
    description: '.NET, async, OOP',
  },
]

 const LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

 const TYPES = [
  { value: 'technical', label: 'Technical' },
  { value: 'mixed', label: 'Mixed' },
]

// ─── component ────────────────────────────────────────────────────────────────
 export default function CreateSessionPage() {
  const navigate = useNavigate()

  const [category, setCategory] = useState<Category | null>(null)
  const [level, setLevel] = useState('junior')
  const [interviewType, setInterviewType] = useState('technical')
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isHR = category === 'hr'
  const step = category === null ? 1 : 2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const session = await createSession({
        role: isHR ? 'any' : category!,
        level: isHR ? 'any' : level,
        interview_type: isHR ? 'hr' : interviewType,
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

        {/* back – як посилання "My sessions" на головній */}
        {step === 1 ? (
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCategory(null)
              setError(null)
            }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* STEP 1 – вибір категорії */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold text-white mb-1">New Interview</h1>
            <p className="text-slate-400 mb-8">Choose what you want to practice.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-200 border-slate-700 bg-slate-800/50 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
                >
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

        {/* STEP 2 – налаштування */}
        {step === 2 && category && (
          <>
            <h1 className="text-3xl font-bold text-white mb-8">
              {CATEGORIES.find(c => c.id === category)?.label}
            </h1>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">

              {/* Level – стиль як у мов на HomePage */}
              {!isHR && (
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLevel(l.value)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition-all ${
                        level === l.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Interview Type – такий самий стиль */}
              {!isHR && (
                <div className="flex gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInterviewType(t.value)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition-all ${
                        interviewType === t.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Questions slider – акуратні підписи */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Questions: <span className="text-indigo-400 font-bold normal-case text-sm">{totalQuestions}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Start Interview'}
              </button>

            </form>
          </>
        )}

      </div>
    </Layout>
  )
}