import { Link } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-slate-100 hover:text-indigo-400 transition-colors"
          >
            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs">AI</span>
            Interview Simulator
          </Link>
          <Link
            to="/sessions/create"
            className="px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-all"
          >
            + New Session
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
