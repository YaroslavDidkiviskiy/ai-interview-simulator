import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { redirectAfterAuth } from '../utils/redirectAfterAuth'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

export default function RegisterPage() {
  const { register, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && user) navigate('/', { replace: true })
  }, [isLoading, user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(email, password)
      navigate(redirectAfterAuth(location.state), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout variant="centered">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .oauth-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          flex: 1; padding: 12px 16px; border-radius: 12px;
          border: 1px solid #334155; background: #0f172a;
          color: #cbd5e1; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: border-color 0.2s, background 0.2s;
          text-decoration: none;
        }
        .oauth-btn:hover { border-color: #4f46e5; background: #1e1b4b20; }
      `}</style>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10 fade-up fade-up-1">
          <p className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-white tracking-tight leading-tight mb-4">
            Start free.
            <br />
            <span className="text-indigo-400">Improve faster.</span>
          </p>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Create an account and mock interviews are one click away.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl shadow-black/20 fade-up fade-up-2">
          <h1 className="text-2xl font-bold text-slate-100 mb-6 text-center">Create account</h1>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base w-full" placeholder="you@example.com"
                required autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base w-full"
                  placeholder="••••••••"
                  required minLength={8} autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Use at least 8 characters with an uppercase letter, a number, and a symbol.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base w-full"
                  placeholder="••••••••"
                  required autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create account'
              }
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <a href={`${API_BASE}/auth/github`} className="oauth-btn">
              <GithubIcon /> GitHub
            </a>
            <a href={`${API_BASE}/auth/google`} className="oauth-btn">
              <GoogleIcon /> Google
            </a>
          </div>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}