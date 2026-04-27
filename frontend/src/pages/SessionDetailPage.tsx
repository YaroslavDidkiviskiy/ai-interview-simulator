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
import {
  formatInterviewTypeLabel,
  formatLevelLabel,
  formatRoleLabel,
  formatSessionStatus,
  formatTopicLabel,
} from '../utils/formatDisplay'

// ─── tiny helpers ────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 8) return '#4ade80'
  if (v >= 5) return '#facc15'
  return '#f87171'
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = value / 10
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={scoreColor(value)} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x="26" y="31" textAnchor="middle" fontSize="13" fontWeight="700" fill={scoreColor(value)}>
          {value}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function DifficultyBadge({ level }: { level: number }) {
  const map: Record<number, [string, string]> = {
    1: ['#4ade80', '#052e16'],
    2: ['#2dd4bf', '#042f2e'],
    3: ['#facc15', '#422006'],
    4: ['#fb923c', '#431407'],
    5: ['#f87171', '#450a0a'],
  }
  const [fg, bg] = map[level] ?? map[3]
  return (
    <span style={{
      background: bg, color: fg,
      border: `1px solid ${fg}30`,
      borderRadius: 999, padding: '2px 10px',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
    }}>
      ⚡ {level}
    </span>
  )
}

function TopicBadge({ topic }: { topic: string }) {
  const label = formatTopicLabel(topic)
  return (
    <span
      title={topic}
      style={{
        background: '#1e1b4b40',
        color: '#c7d2fe',
        border: '1px solid #4f46e545',
        borderRadius: 999,
        padding: '3px 11px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  )
}

// ─── feedback panel ───────────────────────────────────────────────────────────

function FeedbackPanel({ fb, onNext, isLast }: { fb: FeedbackDto; onNext: () => void; isLast: boolean }) {
  return (
    <div style={{
      marginTop: 24,
      background: 'linear-gradient(135deg,#0c1929 0%,#0f172a 100%)',
      border: '1px solid #1d4ed840',
      borderRadius: 20,
      padding: '28px 28px 24px',
      animation: 'slideUp 0.4s cubic-bezier(.4,0,.2,1)',
    }}>
      {/* score rings */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24 }}>
        <ScoreRing value={fb.score} label="Overall" />
        <ScoreRing value={fb.correctness_score} label="Correct" />
        <ScoreRing value={fb.clarity_score} label="Clarity" />
        <ScoreRing value={fb.confidence_score} label="Confidence" />
      </div>

      {/* feedback text */}
      <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20, fontSize: 14 }}>
        {fb.feedback_text}
      </p>

      {/* missing points */}
      {fb.missing_points.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Missing points
          </p>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {fb.missing_points.map((p, i) => (
              <li key={i} style={{ color: '#f87171', fontSize: 13, marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* better answer */}
      {fb.better_answer.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Stronger answer ideas
          </p>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {fb.better_answer.map((p, i) => (
              <li key={i} style={{ color: '#86efac', fontSize: 13, marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* next button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 28px', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', letterSpacing: '0.02em',
          boxShadow: '0 4px 24px #4f46e540',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px #4f46e560'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px #4f46e540'
          }}
        >
          {isLast ? '🏁 Finish Interview' : 'Next Question →'}
        </button>
      </div>
    </div>
  )
}

// ─── question list item ───────────────────────────────────────────────────────

function QuestionListItem({ question, index, currentIndex }: {
  question: Question; index: number; currentIndex: number
}) {
  const isCurrent = index === currentIndex
  const isPast = index < currentIndex
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px', borderRadius: 14,
      background: isCurrent ? '#1e1b4b30' : isPast ? '#0f172a60' : '#0f172a',
      border: `1px solid ${isCurrent ? '#6366f150' : isPast ? '#1e293b50' : '#1e293b'}`,
      opacity: isPast ? 0.55 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        background: isCurrent ? '#4f46e5' : isPast ? '#1e293b' : '#0f172a',
        border: isCurrent ? 'none' : '1px solid #334155',
        color: isCurrent ? '#fff' : isPast ? '#94a3b8' : '#475569',
      }}>
        {isPast ? '✓' : index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <TopicBadge topic={question.topic} />
          <DifficultyBadge level={question.difficulty} />
        </div>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.4,
          color: isCurrent ? '#e2e8f0' : '#64748b',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {question.text}
        </p>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

type Phase = 'answering' | 'submitting' | 'feedback'

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answering')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastFeedback, setLastFeedback] = useState<FeedbackDto | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchSession = useCallback(() => {
    if (!sessionId) return
    getSession(Number(sessionId))
      .then(setSession)
      .catch(() => setError('Session not found'))
  }, [sessionId])

  useEffect(() => { fetchSession() }, [fetchSession])

  // When moving to next question — reset to answering phase
  function handleNext() {
    setLastFeedback(null)
    setAnswer('')
    setPhase('answering')
    fetchSession()
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.current_question || !answer.trim()) return
    setSubmitError(null)
    setPhase('submitting')
    try {
      const res = await submitAnswer(Number(sessionId), {
        question_id: session.current_question.id,
        text: answer.trim(),
      })
      setLastFeedback(res.feedback)
      // Update session status locally (completed check)
      setSession(prev => prev ? {
        ...prev,
        status: res.session_status ?? prev.status,
        current_question_index: res.current_question_index,
      } : prev)
      setPhase('feedback')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('answering')
    }
  }

  if (error) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </Layout>
  )

  if (!session) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#475569' }}>
        <span style={{ marginRight: 10 }}>⏳</span> Loading session…
      </div>
    </Layout>
  )

  const isCompleted = session.status === 'completed' && phase !== 'feedback'
  const shownIndex = isCompleted ? session.total_questions : session.current_question_index
  const progress = Math.round((shownIndex / session.total_questions) * 100)
  const isLastQuestion = session.current_question_index === session.total_questions - 1

  return (
    <Layout>
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .answer-textarea {
          width: 100%; box-sizing: border-box;
          background: #0f172a; color: #e2e8f0;
          border: 1px solid #1e293b; border-radius: 14px;
          padding: 16px 18px; font-size: 14px; line-height: 1.7;
          resize: vertical; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .answer-textarea:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px #4f46e520;
        }
        .answer-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .answer-textarea::placeholder { color: #334155; }
        .submit-btn {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          color: #fff; border: none; border-radius: 12px;
          padding: 12px 24px; font-weight: 700; font-size: 14px;
          cursor: pointer; letter-spacing: 0.02em;
          box-shadow: 0 4px 20px #4f46e530;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
        }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
        .submit-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 28px #4f46e550; }
      `}</style>

      {/* ── breadcrumb & title ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span>Session #{session.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              {formatRoleLabel(session.role)}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              {formatLevelLabel(session.level)}
              <span style={{ margin: '0 0.5em', color: '#475569' }}>·</span>
              {formatInterviewTypeLabel(session.interview_type)}
            </p>
          </div>
          <span style={{
            padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: session.status === 'completed' ? '#172554' : '#1e1b4b',
            color: session.status === 'completed' ? '#60a5fa' : '#a5b4fc',
            border: `1px solid ${session.status === 'completed' ? '#1d4ed8' : '#4f46e5'}40`,
          }}>
            {formatSessionStatus(session.status)}
          </span>
        </div>
      </div>

      {/* ── progress ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
          <span>Progress</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {shownIndex} / {session.total_questions}
          </span>
        </div>
        <div style={{ height: 6, background: '#0f172a', borderRadius: 999, overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
            borderRadius: 999,
            width: `${progress}%`,
            transition: 'width 0.7s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {Array.from({ length: session.total_questions }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background:
                i < session.current_question_index || isCompleted ? '#4f46e5'
                : i === session.current_question_index ? '#7c3aed'
                : '#1e293b',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>
      </div>

      {/* ── COMPLETED ── */}
      {isCompleted ? (
        <div style={{
          padding: '48px 32px', borderRadius: 24, textAlign: 'center',
          background: 'linear-gradient(135deg,#052e16,#0f172a)',
          border: '1px solid #16a34a30',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#4ade80' }}>
            Interview Complete!
          </h2>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>
            You answered all {session.total_questions} questions.
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', textDecoration: 'none',
            padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 24px #4f46e540',
          }}>
            Start New Session →
          </Link>
        </div>
      ) : (
        <>
          {/* ── current question ── */}
          {session.current_question && (
            <div style={{
              padding: '24px 28px', borderRadius: 20, marginBottom: 20,
              background: 'linear-gradient(135deg,#1e1b4b30,#0f172a)',
              border: '1px solid #4f46e540',
              boxShadow: '0 8px 32px #4f46e510',
              animation: 'slideUp 0.35s cubic-bezier(.4,0,.2,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Question {session.current_question_index + 1} of {session.total_questions}
                </span>
                <span style={{ color: '#1e293b' }}>·</span>
                <TopicBadge topic={session.current_question.topic} />
                <DifficultyBadge level={session.current_question.difficulty} />
              </div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                {session.current_question.text}
              </p>
            </div>
          )}

          {/* ── answer form (hidden during feedback) ── */}
          {phase !== 'feedback' && (
            <form onSubmit={handleSubmit} style={{ marginBottom: 8, animation: 'fadeIn 0.3s' }}>
              <textarea
                ref={textareaRef}
                className="answer-textarea"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here…"
                rows={6}
                disabled={phase === 'submitting'}
                maxLength={5000}
              />
              {submitError && (
                <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚠️ {submitError}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                  {answer.trim().length} / 5000
                </span>
                <button type="submit" className="submit-btn" disabled={phase === 'submitting' || !answer.trim()}>
                  {phase === 'submitting' ? (
                    <>
                      <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Evaluating…
                    </>
                  ) : <>Submit Answer →</>}
                </button>
              </div>
            </form>
          )}

          {/* ── feedback panel + next button ── */}
          {phase === 'feedback' && lastFeedback && (
            <>
              {/* show the answer that was submitted (read-only) */}
              <div style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 14, padding: '14px 18px', marginBottom: 4,
                fontSize: 14, color: '#64748b', lineHeight: 1.6,
              }}>
                {answer}
              </div>
              <FeedbackPanel
                fb={lastFeedback}
                onNext={handleNext}
                isLast={isLastQuestion}
              />
            </>
          )}
        </>
      )}

      {/* ── questions list ── */}
      {session.questions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            All Questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.questions.map((q, i) => (
              <QuestionListItem
                key={q.id} question={q} index={i}
                currentIndex={session.current_question_index}
              />
            ))}
          </div>
        </div>
      )}

      {/* spin keyframe (tailwind doesn't inject it inline) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}