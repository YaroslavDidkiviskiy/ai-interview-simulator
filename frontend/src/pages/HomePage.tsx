import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import {
  Target, Bot, TrendingUp, ChevronRight,
  Code2, Users, Zap, BookOpen, ArrowRight
} from 'lucide-react'
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

interface Stats {
  total_questions: number
  total_sessions: number
  total_answers: number
}

const features = [
  {
    icon: <Target className="w-6 h-6 text-indigo-400" />,
    title: 'Targeted Questions',
    desc: 'Questions tailored to your role, level, and interview type — Junior to Senior.',
  },
  {
    icon: <Bot className="w-6 h-6 text-violet-400" />,
    title: 'AI Evaluation',
    desc: 'Get instant detailed feedback on correctness, clarity, and confidence.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
    title: 'Track Progress',
    desc: 'Review past sessions, see your weak spots, and improve over time.',
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    title: 'Multiple Formats',
    desc: 'Technical, HR, and Mixed interviews — practice every aspect.',
  },
  {
    icon: <Code2 className="w-6 h-6 text-sky-400" />,
    title: 'Real Questions',
    desc: 'Questions based on actual interview patterns from top tech companies.',
  },
  {
    icon: <BookOpen className="w-6 h-6 text-pink-400" />,
    title: 'Learn & Improve',
    desc: 'Get better answers suggestions after each question to level up faster.',
  },
]

const languages = [
  { icon: <PythonOriginal size={32} />, label: 'Python', available: true },
  { icon: <Users size={32} className="text-indigo-400" />, label: 'HR', available: true },
  { icon: <TypescriptOriginal size={32} />, label: 'TypeScript', available: true },
  { icon: <JavaOriginal size={32} />, label: 'Java', available: true },
  { icon: <KotlinOriginal size={32} />, label: 'Kotlin', available: true },
  { icon: <GoOriginal size={32} />, label: 'Go', available: true },
  { icon: <RustOriginal size={32} />, label: 'Rust', available: true },
  { icon: <CplusplusOriginal size={32} />, label: 'C++', available: true },
  { icon: <CsharpOriginal size={32} />, label: 'C#', available: true },
]

const testimonials = [
  {
    name: 'Alex M.',
    role: 'Python Backend Engineer',
    company: 'Hired at Fintech startup',
    text: 'Prepario helped me prepare for my technical interview in just 2 weeks. The AI feedback was incredibly detailed and actionable.',
    score: 9,
  },
  {
    name: 'Sofia K.',
    role: 'Junior Developer',
    company: 'Landed first dev job',
    text: 'I practiced HR questions every day before my interview. The confidence score feature showed me exactly where I needed to improve.',
    score: 8,
  },
  {
    name: 'Ivan P.',
    role: 'Mid Backend Developer',
    company: 'Promoted internally',
    text: 'The mixed interview mode is perfect — it covers both technical depth and soft skills. Exactly what real interviews look like.',
    score: 10,
  },
]

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-1">
        {value}
      </div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
  }, [])

  return (
    <Layout>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        .fade-up-4 { animation-delay: 0.35s; }
        .glow-bg {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, #4f46e520 0%, transparent 70%);
          border-radius: 50%;
          top: -200px; left: 50%; transform: translateX(-50%);
          pointer-events: none;
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center text-center pt-16 pb-20">
        <div className="glow-bg" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8 fade-up fade-up-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          AI-Powered Mock Interviews
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight fade-up fade-up-2">
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Ace Your Next
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Tech Interview
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed fade-up fade-up-3">
          Practice with role-specific questions, get real-time AI feedback,
          and build confidence before the actual interview.
        </p>

        <div className="flex items-center gap-4 fade-up fade-up-4">
          <Link to="/sessions/create" className="btn-primary text-base px-8 py-3.5">
            Start Interview
            <ArrowRight className="w-5 h-5" />
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors flex items-center gap-1"
            >
              My sessions <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-8 mb-20">
        <div className="grid grid-cols-3 gap-8">
          <StatCard
            value={stats ? `${stats.total_questions}+` : '36+'}
            label="Interview Questions"
          />
          <StatCard
            value={stats ? `${stats.total_sessions}+` : '0'}
            label="Sessions Completed"
          />
          <StatCard
            value={stats ? `${stats.total_answers}+` : '0'}
            label="Answers Evaluated"
          />
        </div>
      </div>

      {/* ── Features ── */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need to prepare</h2>
          <p className="text-slate-400 max-w-sm mx-auto">All the tools to land your next developer role in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:border-slate-700 hover:bg-slate-800/50 transition-all group">
              <div className="mb-4 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Languages ── */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Supported roles</h2>
          <p className="text-slate-400 max-w-sm mx-auto">More languages and roles coming soon.</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {languages.map((lang) => (
            <div
              key={lang.label}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                lang.available
                  ? 'border-slate-700 bg-slate-800/50 hover:border-indigo-500/50'
                  : 'border-slate-800 bg-slate-900/30 opacity-40'
              }`}
            >
              {!lang.available && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-700">
                  Soon
                </span>
              )}
              {lang.icon}
              <span className="text-xs text-slate-400 font-medium">{lang.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">What developers say</h2>
          <p className="text-slate-400 max-w-sm mx-auto">Real feedback from developers who used Prepario.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{ background: i < t.score ? '#4f46e5' : '#1e293b' }}
                  />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
              <div>
                <div className="font-semibold text-slate-100 text-sm">{t.name}</div>
                <div className="text-xs text-slate-500">{t.role}</div>
                <div className="text-xs text-indigo-400 mt-0.5">{t.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="relative rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-12 text-center mb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5" />
        <h2 className="text-3xl font-bold text-white mb-4 relative">Ready to get hired?</h2>
        <p className="text-slate-400 mb-8 relative max-w-sm mx-auto">
          Start practicing today and walk into your next interview with confidence.
        </p>
        <Link to="/sessions/create" className="btn-primary px-10 py-4 text-base relative">
          Start for free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <span>© 2026 Prepario. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
        </div>
      </footer>
    </Layout>
  )
}