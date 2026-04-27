import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { redirectAfterAuth } from '../utils/redirectAfterAuth'

export default function RegisterPage() {
  const { register, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && user) navigate('/', { replace: true })
  }, [isLoading, user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <p className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-white tracking-tight leading-tight mb-4">
            Start free.
            <br />
            <span className="text-indigo-400">Improve faster.</span>
          </p>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Create an account and mock interviews are one click away.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl shadow-black/20">
          <h1 className="text-2xl font-bold text-slate-100 mb-6 text-center">Create account</h1>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base w-full"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base w-full"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
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
