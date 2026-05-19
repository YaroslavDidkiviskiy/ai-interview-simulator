import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Flag, ChevronRight, AlertTriangle, Loader2, CheckCircle2, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import {
  FeedbackDto, getSession, getQuestionFeedback,
  Question, SessionDetail, submitAnswer,
} from '../api/client'
import {
  formatInterviewTypeLabel, formatLevelLabel,
  formatRoleLabel, formatSessionStatus, formatTopicLabel,
} from '../utils/formatDisplay'

function scoreColor(v: number) {
  if (v >= 8) return '#4ade80'
  if (v >= 5) return '#facc15'
  return '#f87171'
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={scoreColor(value)} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 10)}
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
      background: bg, color: fg, border: `1px solid ${fg}30`,
      borderRadius: 999, padding: '2px 10px',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <Zap style={{ width: 10, height: 10 }} />{level}
    </span>
  )
}

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span title={topic} style={{
      background: '#1e1b4b40', color: '#c7d2fe',
      border: '1px solid #4f46e545', borderRadius: 999,
      padding: '3px 11px', fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
    }}>
      {formatTopicLabel(topic)}
    </span>
  )
}

// Знаходить перше невідповіджене питання після поточного по order_index.
// Якщо після поточного немає — бере перше невідповіджене з початку.
// Якщо всі відповіджені — повертає null.
function findNextUnanswered(
  questions: Question[],
  answeredIds: number[],
  currentId: number,
): Question | null {
  const unanswered = questions.filter(q => !answeredIds.includes(q.id))
  if (unanswered.length === 0) return null

  const current = questions.find(q => q.id === currentId)
  if (current) {
    const after = unanswered
      .filter(q => q.order_index > current.order_index)
      .sort((a, b) => a.order_index - b.order_index)
    if (after.length > 0) return after[0]
  }

  // fallback: перше невідповіджене по order_index (wrap around)
  return [...unanswered].sort((a, b) => a.order_index - b.order_index)[0]
}

function FeedbackPanel({
  fb,
  answerText,
  nextQuestion,
  onNextQuestion,
  onFinish,
}: {
  fb: FeedbackDto
  answerText: string
  nextQuestion: Question | null
  onNextQuestion: (q: Question) => void
  onFinish?: () => void
}) {
  return (
    <div style={{
      marginTop: 16,
      background: 'linear-gradient(135deg,#0c1929 0%,#0f172a 100%)',
      border: '1px solid #1d4ed840', borderRadius: 20,
      padding: '28px 28px 24px',
      animation: 'slideUp 0.4s cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Answer recap */}
      <div style={{
        marginBottom: 20, padding: '12px 16px',
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 12, fontSize: 14, color: '#64748b', lineHeight: 1.6,
      }}>
        {answerText}
      </div>

      {/* Score rings */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24 }}>
        <ScoreRing value={fb.score} label="Overall" />
        <ScoreRing value={fb.correctness_score} label="Correct" />
        <ScoreRing value={fb.clarity_score} label="Clarity" />
        <ScoreRing value={fb.confidence_score} label="Confidence" />
      </div>

      {/* Feedback text */}
      <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20, fontSize: 14 }}>
        {fb.feedback_text}
      </p>

      {/* Missing points */}
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

      {/* Better answer */}
      {fb.better_answer.length > 0 && (
        <div style={{ marginBottom: nextQuestion ? 24 : 0 }}>
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

      {/* Next Question button — показується тільки якщо є невідповіджене питання */}
      {nextQuestion ? (
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Next up
            </p>
            <p style={{
              margin: 0, fontSize: 13, color: '#94a3b8',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 300,
            }}>
              {nextQuestion.text}
            </p>
          </div>
          <button
            onClick={() => onNextQuestion(nextQuestion)}
            className="next-question-btn"
          >
            Next Question <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      ) : onFinish ? (
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onFinish}
            className="next-question-btn"
          >
            Finish Interview <CheckCircle2 style={{ width: 16, height: 16 }} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function QuestionListItem({
  question, index, isAnswered, isActive, onClick,
}: {
  question: Question
  index: number
  isAnswered: boolean
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
        background: isActive ? '#1e1b4b30' : '#0f172a',
        border: `1px solid ${isActive ? '#6366f150' : isAnswered ? '#4ade8020' : '#1e293b'}`,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isActive ? '#6366f170' : '#4f46e540' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isActive ? '#6366f150' : isAnswered ? '#4ade8020' : '#1e293b' }}
    >
      {isAnswered ? (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: '#052e16', border: '1px solid #4ade8040',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={16} strokeWidth={2} color='#4ade80' />
        </div>
      ) : (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'grid', placeItems: 'center',
          background: isActive ? '#4f46e5' : '#0f172a',
          border: isActive ? 'none' : '1px solid #334155',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isActive ? '#fff' : '#475569',
            lineHeight: 1, display: 'block',
          }}>{index + 1}</span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
          <TopicBadge topic={question.topic} />
          <DifficultyBadge level={question.difficulty} />
        </div>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.4,
          color: isActive ? '#e2e8f0' : isAnswered ? '#94a3b8' : '#64748b',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {question.text}
        </p>
      </div>

      {isAnswered && (
        <span style={{
          fontSize: 10, color: '#4ade80', fontWeight: 700,
          flexShrink: 0, letterSpacing: '0.05em',
          background: '#052e1660', border: '1px solid #4ade8030',
          padding: '2px 8px', borderRadius: 999,
        }}>
          Done
        </span>
      )}
    </div>
  )
}

type Phase = 'answering' | 'submitting' | 'feedback' | 'loading_feedback'

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answering')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastFeedback, setLastFeedback] = useState<FeedbackDto | null>(null)
  const [lastAnswerText, setLastAnswerText] = useState('')
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [isLastQuestion, setIsLastQuestion] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchSession = useCallback(() => {
    if (!sessionId) return
    getSession(Number(sessionId)).then(data => {
      setSession(data)
      setActiveQuestion(prev => {
        if (prev) return prev
        return data.questions.find(q => !data.answered_question_ids.includes(q.id)) ?? data.questions[0] ?? null
      })
    }).catch(() => setError('Session not found'))
  }, [sessionId])

  useEffect(() => { fetchSession() }, [fetchSession])

  async function handleQuestionClick(question: Question) {
    if (!session) return
    const isAnswered = session.answered_question_ids.includes(question.id)
    setActiveQuestion(question)
    setAnswer('')
    setLastFeedback(null)
    setSubmitError(null)
    if (isAnswered) {
      setPhase('loading_feedback')
      try {
        const data = await getQuestionFeedback(Number(sessionId), question.id)
        setLastFeedback(data.feedback)
        setLastAnswerText(data.answer_text)
        setPhase('feedback')
      } catch {
        setPhase('answering')
      }
    } else {
      setPhase('answering')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeQuestion || !answer.trim()) return
    setSubmitError(null)
    setPhase('submitting')
    try {
      const res = await submitAnswer(Number(sessionId), {
        question_id: activeQuestion.id,
        text: answer.trim(),
      })
      setLastFeedback(res.feedback)
      setLastAnswerText(answer.trim())
      setSession(prev => prev ? {
        ...prev,
        status: res.session_status ?? prev.status,
        current_question_index: res.current_question_index,
        answered_question_ids: [...prev.answered_question_ids, activeQuestion.id],
      } : prev)
      setIsLastQuestion(res.session_status === 'completed')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#475569', gap: 10 }}>
        <Loader2 className="w-5 h-5 animate-spin" /> Loading session…
      </div>
    </Layout>
  )

  const isCompleted = session.status === 'completed' && phase !== 'feedback'
  const shownIndex = session.answered_question_ids.length
  const progress = Math.round((shownIndex / session.total_questions) * 100)
  const level = formatLevelLabel(session.level)

  // Рахуємо nextQuestion для поточного активного питання.
  // answered_question_ids вже включає activeQuestion якщо щойно відповіли
  // (бо handleSubmit оновлює session state перед setPhase('feedback')).
  const nextQuestion = activeQuestion
    ? findNextUnanswered(session.questions, session.answered_question_ids, activeQuestion.id)
    : null
  const showFinishButton = isLastQuestion && session.status !== 'completed'

  return (
    <Layout>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .answer-textarea {
          width: 100%; box-sizing: border-box;
          background: #0f172a; color: #e2e8f0;
          border: 1px solid #1e293b; border-radius: 14px;
          padding: 16px 18px; font-size: 14px; line-height: 1.7;
          resize: vertical; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .answer-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px #4f46e520; }
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
        .next-question-btn {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          color: #fff; border: none; border-radius: 12px;
          padding: 11px 22px; font-weight: 700; font-size: 14px;
          cursor: pointer; letter-spacing: 0.02em;
          box-shadow: 0 4px 20px #4f46e530;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .next-question-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px #4f46e550; }
      `}</style>

      {/* Header */}
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
              {level && <>{level}<span style={{ margin: '0 0.5em', color: '#475569' }}>·</span></>}
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

      {/* Progress */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
          <span>Progress</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {shownIndex} / {session.total_questions}
          </span>
        </div>
        <div style={{ height: 6, background: '#0f172a', borderRadius: 999, overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
            borderRadius: 999, width: `${isCompleted ? 100 : progress}%`,
            transition: 'width 0.7s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {session.questions.map(q => {
            const isAnswered = session.answered_question_ids.includes(q.id)
            const isActive = activeQuestion?.id === q.id
            return (
              <div key={q.id} style={{
                flex: 1, height: 3, borderRadius: 999,
                background: isAnswered ? '#4ade80' : isActive ? '#7c3aed' : '#1e293b',
                transition: 'background 0.4s',
              }} />
            )
          })}
        </div>
      </div>

      {/* Main content */}
      {isCompleted ? (
        <div style={{
          padding: '48px 32px', borderRadius: 24, textAlign: 'center',
          background: 'linear-gradient(135deg,#052e16,#0f172a)',
          border: '1px solid #16a34a30', animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle2 style={{ width: 56, height: 56, color: '#4ade80' }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#4ade80' }}>
            Interview Complete!
          </h2>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>
            You answered all {session.total_questions} questions.
          </p>
          <Link to="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', textDecoration: 'none',
            padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 24px #4f46e540',
          }}>
            View My Sessions <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Active question card */}
          {activeQuestion && (
            <div style={{
              padding: '24px 28px', borderRadius: 20, marginBottom: 20,
              background: 'linear-gradient(135deg,#1e1b4b30,#0f172a)',
              border: '1px solid #4f46e540', boxShadow: '0 8px 32px #4f46e510',
              animation: 'slideUp 0.35s cubic-bezier(.4,0,.2,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Question {session.questions.findIndex(q => q.id === activeQuestion.id) + 1} of {session.total_questions}
                </span>
                <span style={{ color: '#1e293b' }}>·</span>
                <TopicBadge topic={activeQuestion.topic} />
                <DifficultyBadge level={activeQuestion.difficulty} />
              </div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                {activeQuestion.text}
              </p>
            </div>
          )}

          {/* Loading feedback spinner */}
          {phase === 'loading_feedback' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#475569', gap: 10 }}>
              <Loader2 className="w-5 h-5 animate-spin" /> Loading feedback…
            </div>
          )}

          {/* Answer form — тільки для невідповіджених питань */}
          {(phase === 'answering' || phase === 'submitting') && activeQuestion && !session.answered_question_ids.includes(activeQuestion.id) && (
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
                  <AlertTriangle className="w-4 h-4" /> {submitError}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                  {answer.trim().length} / 5000
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isLastQuestion && (
                    <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Flag style={{ width: 13, height: 13 }} /> Last question!
                    </span>
                  )}
                  <button type="submit" className="submit-btn" disabled={phase === 'submitting' || !answer.trim()}>
                    {phase === 'submitting'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
                      : <>Submit Answer <ChevronRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Feedback panel з Next Question кнопкою всередині */}
          {phase === 'feedback' && lastFeedback && (
            <FeedbackPanel
              fb={lastFeedback}
              answerText={lastAnswerText}
              nextQuestion={nextQuestion}
              onNextQuestion={handleQuestionClick}
              onFinish={showFinishButton ? () => setPhase('answering') : undefined}
            />
          )}
        </>
      )}
      {/* Questions list */}
      {session.questions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            All Questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.questions.map((q, i) => (
              <QuestionListItem
                key={q.id}
                question={q}
                index={i}
                isAnswered={session.answered_question_ids.includes(q.id)}
                isActive={activeQuestion?.id === q.id}
                onClick={() => handleQuestionClick(q)}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}