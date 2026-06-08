import { useState, useRef, useEffect } from 'react'
import { Loader2, X, Trash2, AlertTriangle } from 'lucide-react'
import { sendDeleteAccountCode, deleteAccount } from '../api/client'

interface DeleteAccountModalProps {
  onClose: () => void
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [step, setStep] = useState<'confirm' | 'code'>('confirm')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'code') inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSendCode() {
    setSending(true)
    setError(null)
    try {
      await sendDeleteAccountCode()
      setStep('code')
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount(code)
      localStorage.removeItem('access_token')
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      setDeleting(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .delete-overlay { animation: fadeIn .2s ease both; }
        .delete-modal { animation: slideUp .25s cubic-bezier(.4,0,.2,1) both; }
        .delete-code-input:focus { border-color: #f87171 !important; box-shadow: 0 0 0 3px #f8717120; }
      `}</style>

      {/* Overlay */}
      <div
        className="delete-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal */}
        <div
          className="delete-modal"
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480 }}
        >
          <div style={{
            background: '#0f172a',
            border: '1px solid #f8717130',
            borderRadius: 20,
            padding: '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            position: 'relative',
          }}>
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none',
                color: '#475569', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 4, borderRadius: 8, transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: '#f8717115',
              border: '1px solid #f8717140',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
            }}>
              {step === 'confirm'
                ? <AlertTriangle size={24} style={{ color: '#f87171' }} />
                : <Trash2 size={24} style={{ color: '#f87171' }} />
              }
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              {step === 'confirm' ? 'Delete account?' : 'Confirm deletion'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
              {step === 'confirm'
                ? <>This will permanently delete your account and all data — sessions, answers, and feedback. <strong style={{ color: '#f87171' }}>This cannot be undone.</strong></>
                : "Enter the 6-digit code we sent to your email to confirm deletion."
              }
            </p>

            {step === 'confirm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleSendCode}
                  disabled={sending}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: '#f8717115',
                    border: '1px solid #f8717140',
                    color: '#f87171',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#f8717125' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8717115' }}
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Trash2 size={16} />
                  }
                  {sending ? 'Sending code…' : 'Send verification code'}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: 12,
                    fontSize: 14, fontWeight: 600,
                    background: 'transparent', border: '1px solid #1e293b',
                    color: '#64748b', cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#64748b' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  ref={inputRef}
                  className="delete-code-input"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%', background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12, padding: '14px 16px',
                    color: '#f1f5f9', fontSize: 26, fontWeight: 700,
                    letterSpacing: '0.4em', textAlign: 'center',
                    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleDelete()}
                />

                <button
                  onClick={handleDelete}
                  disabled={deleting || code.length !== 6}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: deleting || code.length !== 6 ? '#1e293b' : '#f8717115',
                    border: `1px solid ${deleting || code.length !== 6 ? '#1e293b' : '#f8717140'}`,
                    color: deleting || code.length !== 6 ? '#475569' : '#f87171',
                    cursor: deleting || code.length !== 6 ? 'not-allowed' : 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {deleting && <Loader2 size={16} className="animate-spin" />}
                  {deleting ? 'Deleting…' : 'Delete my account'}
                </button>

                <button
                  onClick={handleSendCode}
                  disabled={sending || cooldown > 0}
                  style={{
                    background: 'none', border: 'none',
                    color: cooldown > 0 ? '#334155' : '#f87171',
                    fontSize: 13, cursor: cooldown > 0 || sending ? 'not-allowed' : 'pointer',
                    padding: '4px 0', textAlign: 'center', transition: 'color .15s',
                    opacity: cooldown > 0 ? 0.5 : 1,
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? 'Sending…' : "Didn't get it? Resend"}
                </button>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: 16, padding: '10px 14px',
                borderRadius: 10, background: '#f8717115',
                border: '1px solid #f8717130',
                fontSize: 13, color: '#f87171',
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}