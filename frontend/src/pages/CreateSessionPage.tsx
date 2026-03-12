import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { createSession } from '../api/client'

const ROLES = [
  { value: 'python_backend', label: 'Python Backend' },
]

const LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const TYPES = [
  { value: 'technical', label: '⚙️ Technical' },
  { value: 'hr', label: '🤝 HR' },
  { value: 'mixed', label: '🔀 Mixed' },
]

export default function CreateSessionPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('python_backend')
  const [level, setLevel] = useState('junior')
  const [interviewType, setInterviewType] = useState('technical')
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await createSession({
        role,
        level,
        interview_type: interviewType,
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
      <div className="max-w-lg mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="text-3xl font-bold mb-1">New Session</h1>
        <p className="text-slate-400 mb-8">Configure your practice interview.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-base"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Level */}
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

          {/* Interview type */}
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

          {/* Questions count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Questions:{' '}
              <span className="text-indigo-400 font-bold tabular-nums">{totalQuestions}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1.5">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                Start Interview
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  )
}
