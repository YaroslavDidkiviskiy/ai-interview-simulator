import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, LayoutDashboard, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  variant?: 'default' | 'centered'
}

export default function Layout({ children, variant = 'default' }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // закриваємо дропдаун при кліку поза ним
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const mainClass =
    variant === 'centered'
      ? 'flex-1 flex flex-col justify-center w-full mx-auto px-6 py-12 min-h-[calc(100vh-3.5rem)] max-w-lg'
      : 'flex-1 max-w-4xl w-full mx-auto px-6 py-10'

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/90 shrink-0">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-3">

          <Link to="/" className="flex items-center shrink-0">
            <span className="font-black text-xl tracking-tight">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">prep</span>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">ario</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* тригер */}
                <button
                  onClick={() => setOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 10,
                    border: '1px solid',
                    borderColor: open ? '#4f46e5' : '#1e293b',
                    background: open ? '#4f46e520' : 'transparent',
                    color: '#94a3b8', cursor: 'pointer',
                    transition: 'all .15s', fontSize: 13,
                  }}
                >
                  <span
                    className="hidden sm:block truncate max-w-[180px] text-xs"
                    style={{ color: '#94a3b8' }}
                  >
                    {user.email}
                  </span>
                  <ChevronDown
                    style={{
                      width: 13, height: 13,
                      transition: 'transform .2s',
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {/* дропдаун */}
                {open && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 200,
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 14,
                    padding: '6px',
                    boxShadow: '0 16px 48px #00000060',
                    animation: 'dropIn .15s cubic-bezier(.4,0,.2,1)',
                    zIndex: 50,
                  }}>
                    <style>{`
                      @keyframes dropIn {
                        from { opacity: 0; transform: translateY(-6px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>

                    {/* email зверху */}
                    <div style={{
                      padding: '8px 10px 10px',
                      borderBottom: '1px solid #1e293b',
                      marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 1 }}>Signed in as</div>
                      <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-all' }}>
                        {user.email}
                      </div>
                    </div>

                    {/* пункти меню */}
                    {[
                      { to: '/profile',   icon: <User size={14} />,          label: 'Profile' },
                      { to: '/dashboard', icon: <LayoutDashboard size={14} />, label: 'My Sessions' },
                      { to: '/settings',  icon: <Settings size={14} />,       label: 'Settings' },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 8,
                          color: '#94a3b8', textDecoration: 'none',
                          fontSize: 13, fontWeight: 500,
                          transition: 'background .1s, color .1s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = '#1e293b'
                          ;(e.currentTarget as HTMLAnchorElement).style.color = '#e2e8f0'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}

                    {/* sign out */}
                    <div style={{ borderTop: '1px solid #1e293b', marginTop: 4, paddingTop: 4 }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '8px 10px', borderRadius: 8,
                          color: '#f87171', background: 'transparent', border: 'none',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#f8717115'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                        }}
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all text-sm shadow-lg shadow-indigo-500/20"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className={mainClass}>{children}</main>

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