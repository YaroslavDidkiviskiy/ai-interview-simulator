import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { changePassword, getMe, setPassword, Me } from '../api/client'
import { Loader2, AlertCircle, KeyRound, Bell, Shield, Trash2, ChevronRight, Eye, EyeOff } from 'lucide-react'

type Section = 'password' | null

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>(null)
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  // Після успішної зміни/встановлення пароля — рефетч me
  // щоб has_password оновився і UI перемкнувся
  async function handlePasswordSuccess() {
    setActiveSection(null)
    const updated = await getMe().catch(() => null)
    if (updated) setMe(updated)
  }

  const passwordTitle = !me
    ? 'Password'
    : me.has_password
      ? 'Change Password'
      : 'Set Password'

  const passwordDesc = !me
    ? 'Manage your password'
    : me.has_password
      ? 'Update your account password'
      : me.auth_provider === 'local'
        ? 'Set a password for your account'
        : `You signed in via ${me.auth_provider === 'google' ? 'Google' : 'GitHub'}. Set a password to also use email login.`

  return (
    <Layout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 13, color: '#475569' }}>
          Manage your account and preferences.
        </p>

        {/* OAuth без пароля — банер підказка */}
        {me && !me.has_password && me.auth_provider !== 'local' && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            background: '#1e1b4b40', border: '1px solid #4f46e540',
            borderRadius: 12, fontSize: 13, color: '#a5b4fc',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Shield size={14} color="#818cf8" style={{ flexShrink: 0 }} />
            Set a password to enable email login as a backup to {me.auth_provider === 'google' ? 'Google' : 'GitHub'}.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, marginTop: 8 }}>
            Account
          </div>

          <SettingsRow
            icon={<KeyRound size={15} color="#6366f1" />}
            title={passwordTitle}
            desc={passwordDesc}
            onAction={() => setActiveSection(activeSection === 'password' ? null : 'password')}
            actionLabel={activeSection === 'password' ? 'Cancel' : me?.has_password ? 'Change' : 'Set'}
            actionDestructive={activeSection === 'password'}
          />

          {activeSection === 'password' && me && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 12, padding: '20px 24px',
              animation: 'slideDown .2s cubic-bezier(.4,0,.2,1)',
            }}>
              <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

              {me.has_password ? (
                <ChangePasswordForm onSuccess={handlePasswordSuccess} />
              ) : (
                <SetPasswordForm onSuccess={handlePasswordSuccess} />
              )}
            </div>
          )}

          <SettingsRow
            icon={<Bell size={15} color="#f59e0b" />}
            title="Email Notifications"
            desc="Manage what emails you receive"
            onAction={() => {}}
            actionLabel="Manage"
            disabled
          />

          <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, marginTop: 16 }}>
            Privacy & Security
          </div>

          <SettingsRow
            icon={<Shield size={15} color="#34d399" />}
            title="Two-Factor Authentication"
            desc="Add an extra layer of security to your account"
            onAction={() => {}}
            actionLabel="Enable"
            disabled
          />

          <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, marginTop: 16 }}>
            Danger Zone
          </div>

          <SettingsRow
            icon={<Trash2 size={15} color="#f87171" />}
            title="Delete Account"
            desc="Permanently delete your account and all data"
            onAction={() => {}}
            actionLabel="Delete"
            actionDestructive
            disabled
          />

        </div>
      </div>
    </Layout>
  )
}

function SettingsRow({
  icon, title, desc, onAction, actionLabel, actionDestructive, disabled,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onAction: () => void
  actionLabel: string
  actionDestructive?: boolean
  disabled?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>{desc}</div>
        </div>
      </div>

      <button
        onClick={onAction}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: '1px solid',
          borderColor: disabled ? '#1e293b' : actionDestructive ? '#f8717130' : '#1e293b',
          background: 'transparent',
          color: disabled ? '#334155' : actionDestructive ? '#f87171' : '#94a3b8',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all .15s', flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          if (disabled) return
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = actionDestructive ? '#f87171' : '#4f46e5'
          el.style.color = actionDestructive ? '#f87171' : '#a5b4fc'
          el.style.background = actionDestructive ? '#f8717110' : '#4f46e510'
        }}
        onMouseLeave={e => {
          if (disabled) return
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = actionDestructive ? '#f8717130' : '#1e293b'
          el.style.color = actionDestructive ? '#f87171' : '#94a3b8'
          el.style.background = 'transparent'
        }}
      >
        {disabled && <span style={{ fontSize: 10, marginRight: 2 }}>🔒</span>}
        {actionLabel}
        {!disabled && <ChevronRight size={12} />}
      </button>
    </div>
  )
}

// Форма зміни пароля — для юзерів у яких вже є пароль
function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) { setError('New passwords do not match'); return }
    setLoading(true)
    try {
      await changePassword(current, next)
      toast('Password changed successfully!', 'success')
      setCurrent(''); setNext(''); setConfirm('')
      setTimeout(() => onSuccess(), 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FormError error={error} />
      {[
        { label: 'Current password',     value: current, onChange: setCurrent, autoComplete: 'current-password' },
        { label: 'New password',         value: next,    onChange: setNext,    autoComplete: 'new-password' },
        { label: 'Confirm new password', value: confirm, onChange: setConfirm, autoComplete: 'new-password' },
      ].map(field => (
        <PasswordField key={field.label} {...field} disabled={loading} />
      ))}
      <PasswordHint />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SubmitButton loading={loading} disabled={!current || !next || !confirm} label="Save Password" />
      </div>
    </form>
  )
}

// Форма встановлення пароля — для OAuth юзерів без пароля
function SetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await setPassword(next)
      toast('Password set successfully!', 'success')
      setNext(''); setConfirm('')
      setTimeout(() => onSuccess(), 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FormError error={error} />
      {[
        { label: 'New password',         value: next,    onChange: setNext,    autoComplete: 'new-password' },
        { label: 'Confirm new password', value: confirm, onChange: setConfirm, autoComplete: 'new-password' },
      ].map(field => (
        <PasswordField key={field.label} {...field} disabled={loading} />
      ))}
      <PasswordHint />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SubmitButton loading={loading} disabled={!next || !confirm} label="Set Password" />
      </div>
    </form>
  )
}

// Shared subcomponents

function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8,
      background: '#f8717115', border: '1px solid #f8717130',
      color: '#f87171', fontSize: 13,
    }}>
      <AlertCircle size={13} /> {error}
    </div>
  )
}

function PasswordField({ label, value, onChange, autoComplete, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  disabled: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="input-base w-full"
          placeholder="••••••••"
          disabled={disabled}
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#475569', padding: 0, display: 'flex', alignItems: 'center',
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function PasswordHint() {
  return (
    <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>
      Min 8 characters, uppercase letter, number, and symbol.
    </p>
  )
}

function SubmitButton({ loading, disabled, label }: { loading: boolean; disabled: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn-primary py-2.5"
      style={{ fontSize: 13 }}
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        : label
      }
    </button>
  )
}