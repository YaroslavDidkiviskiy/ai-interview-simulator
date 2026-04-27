/** Display labels for API enum/slug values (backend stays lowercase). */

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
}

const INTERVIEW_LABEL: Record<string, string> = {
  technical: 'Technical',
  hr: 'HR',
  mixed: 'Mixed',
}

/** Known tech / topic tokens from DB (single segment, lowercased). */
const TOPIC_WORD: Record<string, string> = {
  sql: 'SQL',
  api: 'API',
  http: 'HTTP',
  https: 'HTTPS',
  websocket: 'WebSockets',
  websockets: 'WebSockets',
  json: 'JSON',
  jwt: 'JWT',
  oauth: 'OAuth',
  fastapi: 'FastAPI',
  django: 'Django',
  flask: 'Flask',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  vue: 'Vue',
  angular: 'Angular',
  redis: 'Redis',
  kafka: 'Kafka',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  kubernetes: 'Kubernetes',
  docker: 'Docker',
  nginx: 'Nginx',
  oop: 'OOP',
  solid: 'SOLID',
  cicd: 'CI/CD',
  ci: 'CI',
  cd: 'CD',
  grpc: 'gRPC',
  graphql: 'GraphQL',
  aws: 'AWS',
  gcp: 'GCP',
  nosql: 'NoSQL',
}

function capitalizeWord(word: string): string {
  const k = word.toLowerCase()
  if (TOPIC_WORD[k]) return TOPIC_WORD[k]
  if (word.length <= 1) return word.toUpperCase()
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Topic pill: "python" → "Python", "fastapi" → "FastAPI", "system_design" → "System Design" */
export function formatTopicLabel(raw: string): string {
  const s = raw.trim()
  if (!s) return raw
  const direct = TOPIC_WORD[s.toLowerCase()]
  if (direct) return direct
  return s
    .split(/[\s_]+/)
    .map((seg) => capitalizeWord(seg))
    .join(' ')
}

/** Role slug: "python_backend" → "Python Backend" */
export function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .filter(Boolean)
    .map((seg) => formatTopicLabel(seg))
    .join(' ')
}

export function formatLevelLabel(level: string): string {
  return LEVEL_LABEL[level.toLowerCase()] ?? capitalizeWord(level)
}

export function formatInterviewTypeLabel(type: string): string {
  const k = type.toLowerCase()
  if (INTERVIEW_LABEL[k]) return INTERVIEW_LABEL[k]
  return type
    .split('_')
    .map((seg) => capitalizeWord(seg))
    .join(' ')
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
}

export function formatSessionStatus(status: string | null): string {
  if (!status) return 'Active'
  return STATUS_LABEL[status.toLowerCase()] ?? capitalizeWord(status)
}
