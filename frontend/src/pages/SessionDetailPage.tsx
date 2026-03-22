import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  FeedbackDto,
  getSession,
  Question,
  SessionDetail,
  submitAnswer,
} from '../api/client'

function DifficultyBadge({ level }: { level: number }) {
  const styles: Record<number, string> = {
    1: 'bg-green-500/10 text-green-400 border-green-500/20',
    2: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    4: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    5: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[level] ?? styles[3]}`}>
      ⚡ {level}
    </span>
  )
}

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
      {topic}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'unknown'
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    unknown: 'bg-slate-700/50 text-slate-400 border-slate-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[s] ?? styles.unknown}`}>
      {s}
    </span>
  )
}

function QuestionListItem({
  question,
  index,
  currentIndex,
}: {
  question: Question
  index: number
  currentIndex: number
}) {
  const isCurrent = index === currentIndex
  const isPast = index < currentIndex

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        isCurrent
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : isPast
          ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div
        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isCurrent
            ? 'bg-indigo-500 text-white'
            : isPast
            ? 'bg-slate-700 text-slate-300'
            : 'bg-slate-800 border border-slate-700 text-slate-500'
        }`}
      >
        {isPast ? '✓' : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TopicBadge topic={question.topic} />
          <DifficultyBadge level={question.difficulty} />
        </div>
        <p className={`text-sm leading-snug truncate ${isCurrent ? 'text-slate-200' : 'text-slate-400'}`}>
          {question.text}
        </p>
      </div>
    </div>
  )
}

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastFeedback, setLastFeedback] = useState<FeedbackDto | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchSession = useCallback(() => {
    if (!sessionId) return
    getSession(Number(sessionId))
      .then(setSession)
      .catch(() => setError('Session not found'))
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (session?.status === 'active') {
      setAnswer('')
      textareaRef.current?.focus()
    }
  }, [session?.current_question_index, session?.status])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.current_question || !answer.trim()) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const res = await submitAnswer(Number(sessionId), {
        question_id: session.current_question.id,
        text: answer.trim(),
      })
      setLastFeedback(res.feedback)
      fetchSession()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading session…
          </div>
        </div>
      </Layout>
    )
  }

  const isCompleted = session.status === 'completed'
  const progress = Math.round(
    (isCompleted ? session.total_questions : session.current_question_index) /
    session.total_questions * 100
  )

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/" className="hover:text-slate-200 transition-colors">Home</Link>
            <span>/</span>
            <span>Session #{session.id}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-semibold capitalize">
              {session.role.replace(/_/g, ' ')}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 capitalize">{session.level}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 capitalize">{session.interview_type}</span>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-400 font-medium">Progress</span>
          <span className="text-slate-300 tabular-nums font-semibold">
            {isCompleted ? session.total_questions : session.current_question_index} / {session.total_questions}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: session.total_questions }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i < session.current_question_index || isCompleted
                  ? 'bg-indigo-500'
                  : i === session.current_question_index
                  ? 'bg-violet-500'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Completed state */}
      {isCompleted ? (
        <div className="mb-8 space-y-6">
          {lastFeedback && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/25 text-left">
              <h3 className="text-xs font-semibold text-amber-400/90 uppercase tracking-widest mb-3">
                Last answer — feedback
              </h3>
              <p className="text-slate-200 leading-relaxed mb-3">{lastFeedback.feedback_text}</p>
              <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                <span>Score <strong className="text-amber-200">{lastFeedback.score}/10</strong></span>
              </div>
            </div>
          )}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Interview Complete!</h2>
            <p className="text-slate-400 mb-6">You've answered all {session.total_questions} questions.</p>
            <Link to="/" className="btn-primary">
              Start New Session
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* AI feedback for last submitted answer */}
          {lastFeedback && (
            <div className="mb-6 p-6 rounded-2xl bg-slate-900 border border-amber-500/25 shadow-lg shadow-amber-500/5">
              <h3 className="text-xs font-semibold text-amber-400/90 uppercase tracking-widest mb-3">
                Feedback on your last answer
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  ['Overall', lastFeedback.score],
                  ['Clarity', lastFeedback.clarity_score],
                  ['Correct', lastFeedback.correctness_score],
                  ['Confidence', lastFeedback.confidence_score],
                ].map(([label, v]) => (
                  <span
                    key={label as string}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-sm tabular-nums border border-slate-700"
                  >
                    <span className="text-slate-500 mr-1">{label}</span>
                    <span className="font-semibold text-amber-200">{v}/10</span>
                  </span>
                ))}
              </div>
              <p className="text-slate-200 leading-relaxed mb-4">{lastFeedback.feedback_text}</p>
              {lastFeedback.missing_points.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 uppercase mb-1">Missing</p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    {lastFeedback.missing_points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {lastFeedback.better_answer.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Stronger answer ideas</p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    {lastFeedback.better_answer.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Current question */}
          {session.current_question && (
            <div className="mb-5 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 shadow-xl shadow-indigo-500/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  Question {session.current_question_index + 1} of {session.total_questions}
                </span>
                <span className="text-slate-700">·</span>
                <TopicBadge topic={session.current_question.topic} />
                <DifficultyBadge level={session.current_question.difficulty} />
              </div>
              <p className="text-xl text-slate-100 leading-relaxed font-medium">
                {session.current_question.text}
              </p>
            </div>
          )}

          {/* Answer form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              className="input-base resize-none mb-3 leading-relaxed"
              disabled={submitting}
            />
            {submitError && (
              <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
                <span>⚠️</span> {submitError}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 tabular-nums">
                {answer.trim().length} / 5000
              </span>
              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Answer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}

      {/* All questions list */}
      {session.questions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            All Questions
          </h2>
          <div className="space-y-2">
            {session.questions.map((q, i) => (
              <QuestionListItem
                key={q.id}
                question={q}
                index={i}
                currentIndex={session.current_question_index}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
