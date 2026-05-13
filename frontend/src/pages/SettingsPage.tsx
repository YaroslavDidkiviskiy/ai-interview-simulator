import Layout from '../components/Layout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <Layout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 13, color: '#475569' }}>
          Manage your account preferences.
        </p>

        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 16, padding: '32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: '#1e1b4b40', border: '1px solid #4f46e530',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={22} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              Coming soon
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Password change, preferences and more.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}