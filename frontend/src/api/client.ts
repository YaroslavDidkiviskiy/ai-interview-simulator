const BASE = '/api'

export interface Session {
  id: number
  role: string
  level: string
  interview_type: string
  status: string | null
  current_question_index: number
  total_questions: number
  final_score: number | null
  summary: string | null
  started_at: string
  completed_at: string | null
}

export interface Question {
  id: number
  topic: string
  difficulty: number
  text: string
  order_index: number
}

export interface SessionDetail extends Session {
  questions: Question[]
  current_question: Question | null
}

export interface CreateSessionPayload {
  role: string
  level: string
  interview_type: string
  total_questions: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
  }
  return res.json()
}

export interface SubmitAnswerPayload {
  question_id: number
  text: string
}

export interface SubmitAnswerResponse {
  answer_id: number
  session_status: string
  current_question_index: number
}

export function createSession(data: CreateSessionPayload): Promise<Session> {
  return request('/sessions/', { method: 'POST', body: JSON.stringify(data) })
}

export function getSession(id: number): Promise<SessionDetail> {
  return request(`/sessions/${id}`)
}

export function submitAnswer(sessionId: number, data: SubmitAnswerPayload): Promise<SubmitAnswerResponse> {
  return request(`/sessions/${sessionId}/answers/`, { method: 'POST', body: JSON.stringify(data) })
}
