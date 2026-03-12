import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const features = [
  {
    icon: '🎯',
    title: 'Targeted Questions',
    desc: 'Questions tailored to your role, level, and interview type.',
  },
  {
    icon: '🤖',
    title: 'AI Evaluation',
    desc: 'Get instant feedback powered by local LLMs via Ollama.',
  },
  {
    icon: '📈',
    title: 'Track Progress',
    desc: 'Review past sessions and see where you need to improve.',
  },
]

export default function HomePage() {
  return (
    <Layout>
      {/* Hero */}
      <div className="flex flex-col items-center text-center py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          AI-Powered Mock Interviews
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5 gradient-text leading-tight">
          Ace Your Next<br />Tech Interview
        </h1>

        <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed">
          Practice with role-specific questions, get real-time AI feedback,
          and build confidence before the actual interview.
        </p>

        <Link
          to="/sessions/create"
          className="btn-primary text-base px-8 py-4 text-lg"
        >
          Start Interview
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="card p-6 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
              {f.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
