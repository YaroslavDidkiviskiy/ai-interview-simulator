import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  function remove(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 12, minWidth: 280, maxWidth: 380,
            background: t.type === 'success' ? '#052e16' : '#1a0a0a',
            border: `1px solid ${t.type === 'success' ? '#4ade8040' : '#f8717140'}`,
            boxShadow: '0 8px 32px #00000060',
            animation: 'toastIn .25s cubic-bezier(.4,0,.2,1)',
          }}
        >
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateX(16px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>

          {t.type === 'success'
            ? <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} />
            : <AlertCircle  size={16} color="#f87171" style={{ flexShrink: 0 }} />
          }

          <span style={{ fontSize: 13, color: t.type === 'success' ? '#4ade80' : '#f87171', flex: 1, fontWeight: 500 }}>
            {t.message}
          </span>

          <button
            onClick={() => remove(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: t.type === 'success' ? '#4ade8080' : '#f8717180',
              padding: 2, display: 'flex', flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}