import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

interface Props {
  children: React.ReactNode
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
      {/* ── HEADER ── */}
      <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/90 shrink-0">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-3">

          <Link to="/" className="flex items-center shrink-0 group">
            <span className="font-black text-xl tracking-tight">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                prep
              </span>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                ario
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <span className="hidden sm:block text-slate-500 truncate max-w-[180px] text-xs">
                  {user.email}
                </span>
                <div className="w-px h-4 bg-slate-800 hidden sm:block" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm"
              >
                Sign in
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ── MAIN ── */}
      <main className={mainClass}>{children}</main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 max-w-4xl mx-auto w-full px-6">
        <span>© 2026 Prepario. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  )
}