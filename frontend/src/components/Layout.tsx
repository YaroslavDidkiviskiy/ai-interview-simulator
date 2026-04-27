import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  /** Centers content vertically for auth screens */
  variant?: 'default' | 'centered'
}

export default function Layout({ children, variant = 'default' }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const mainClass =
    variant === 'centered'
      ? 'flex-1 flex flex-col justify-center w-full mx-auto px-6 py-12 min-h-[calc(100vh-3.5rem)] max-w-lg'
      : 'flex-1 max-w-4xl w-full mx-auto px-6 py-10'

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80 shrink-0">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-100 hover:text-indigo-400 transition-colors shrink-0">
            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs">AI</span>
            <span className="hidden sm:inline">Interview Simulator</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-sm">
            {user ? (
              <>
                <span className="text-slate-500 truncate max-w-[140px] sm:max-w-[220px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="shrink-0 px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-medium transition-all text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className={mainClass}>{children}</main>
    </div>
  )
}
