import { useState, useRef, useEffect } from 'react'
import { Mail, Loader2, X, ShieldCheck } from 'lucide-react'
import { sendVerificationCode, verifyEmail } from '../api/client'

const COOLDOWN_SECS = 60
const COOLDOWN_KEY = 'prepario_verify_sent_at'

export function getSavedCooldown(): { cooldown: number; codeSent: boolean } {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return { cooldown: 0, codeSent: false }
    const sentAt = parseInt(raw, 10)
    const elapsed = Math.floor((Date.now() - sentAt) / 1000)
    const remaining = COOLDOWN_SECS - elapsed
    return remaining > 0
      ? { cooldown: remaining, codeSent: true }
      : { cooldown: 0, codeSent: true }
  } catch {
    return { cooldown: 0, codeSent: false }
  }
}

export { COOLDOWN_SECS, COOLDOWN_KEY }

interface EmailVerificationModalProps {
  onVerified: () => void
  onClose: () => void
  initialCooldown: number
  initialCodeSent: boolean
  onCodeSent: (ts: number) => void
}

export default function EmailVerificationModal({
  onVerified,
  onClose,
  initialCooldown,
  initialCodeSent,
  onCodeSent,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(initialCodeSent)
  const [cooldown, setCooldown] = useState(initialCooldown)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (codeSent) inputRef.current?.focus()
  }, [codeSent])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSendCode() {
    setSending(true)
    setError(null)
    try {
      await sendVerificationCode()
      setCodeSent(true)
      setCooldown(60)
      onCodeSent(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  async function handleVerify() {
    if (!code.trim()) return
    setVerifying(true)
    setError(null)
    try {
      await verifyEmail(code.trim())
      onVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .verify-overlay { animation: fadeIn .2s ease both; }
        .verify-modal { animation: slideUp .25s cubic-bezier(.4,0,.2,1) both; }
        .code-input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px #4f46e520; }
      `}</style>

      {/* Overlay — also acts as flex centering container */}
      <div
        className="verify-overlay"
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
        className="verify-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
        }}
      >
        <div style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
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
              padding: 4, borderRadius: 8,
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #4f46e520, #7c3aed20)',
            border: '1px solid #4f46e540',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 22,
          }}>
            <ShieldCheck size={24} style={{ color: '#818cf8' }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
            Verify your email
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
            {!codeSent
              ? "We'll send a 6-digit code to your email address to confirm your account."
              : "Enter the 6-digit code we sent to your email. Check your spam folder if you don't see it."}
          </p>

          {!codeSent ? (
            <button
              onClick={handleSendCode}
              disabled={sending}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: sending ? '#3730a3' : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                border: 'none', color: '#fff',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.8 : 1,
                transition: 'all .15s',
                boxShadow: sending ? 'none' : '0 4px 16px #4f46e540',
              }}
            >
              {sending
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Mail size={16} />}
              {sending ? 'Sending…' : 'Send verification code'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                ref={inputRef}
                className="code-input"
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
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />

              <button
                onClick={handleVerify}
                disabled={verifying || code.length < 6}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  background: verifying || code.length < 6
                    ? '#1e293b'
                    : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                  border: 'none',
                  color: verifying || code.length < 6 ? '#475569' : '#fff',
                  cursor: verifying || code.length < 6 ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                  boxShadow: verifying || code.length < 6 ? 'none' : '0 4px 16px #4f46e540',
                }}
              >
                {verifying
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : <ShieldCheck size={16} />}
                {verifying ? 'Verifying…' : 'Confirm code'}
              </button>

              <button
                onClick={handleSendCode}
                disabled={sending || cooldown > 0}
                style={{
                  background: 'none', border: 'none',
                  color: cooldown > 0 ? '#334155' : '#4f46e5',
                  fontSize: 13, cursor: cooldown > 0 || sending ? 'not-allowed' : 'pointer',
                  padding: '4px 0', textAlign: 'center',
                  transition: 'color .15s',
                }}
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : sending ? 'Sending…' : "Didn't get it? Resend"}
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