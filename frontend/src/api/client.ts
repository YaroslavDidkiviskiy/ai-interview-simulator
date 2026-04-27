const BASE = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function refreshToken(): Promise<string | null> {
  const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json()
  localStorage.setItem('access_token', data.access_token)
  return data.access_token
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...asRecord(init?.headers) } })

  if (res.status === 401) {
    const newToken = await refreshToken()
    if (newToken) {
      const h: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...asRecord(init?.headers),
      }
      res = await fetch(`${BASE}${path}`, { ...init, headers: h })
    } else {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
  }
  return res.json()
}

function asRecord(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {}
  if (h instanceof Headers) {
    const o: Record<string, string> = {}
    h.forEach((v, k) => {
      o[k] = v
    })
    return o
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h)
  }
  return { ...h }
}

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

export interface SubmitAnswerPayload {
  question_id: number
  text: string
}

export interface FeedbackDto {
  id: number
  session_id: number
  question_id: number
  answer_id: number
  score: number
  clarity_score: number
  correctness_score: number
  confidence_score: number
  feedback_text: string
  missing_points: string[]
  better_answer: string[]
  created_at: string
}

export interface SubmitAnswerResponse {
  answer_id: number
  feedback_id: number
  feedback: FeedbackDto
  session_status: string | null
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
